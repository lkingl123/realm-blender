// stream-247-auto.js — the "real 24/7" wrapper.
//
//   node stream-247-auto.js
//
// Why this exists: YouTube ends a free-tier broadcast every ~12 hours (or sooner
// on network blips). The bare `stream-247.js` keeps ffmpeg running but YouTube
// just stops accepting it. This wrapper notices the broadcast ending and
// programmatically creates a new one — keys + stream resource are persistent on
// the channel, so the SAME running ffmpeg seamlessly feeds the new broadcast.
//
// Architecture:
//   - spawn ffmpeg ONCE, push to the persistent stream key forever, auto-restart
//     ffmpeg only if IT crashes (the YouTube side handles broadcast cycling).
//   - in parallel: every POLL_SEC, ask YouTube what the current broadcast's
//     lifeCycleStatus is. If it goes !=`live` (complete/ended/etc.) → create a
//     new broadcast, bind it to the stream resource, transition through
//     testing → live. ffmpeg has been pushing the whole time.

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const { authenticate } = require('./auth');
const { google } = require('googleapis');

const STREAM_KEY = 'j082-ph4e-fbds-6hgm-1m68';            // channel-bound, persistent
const STREAM_ID  = 'cEeW-W_HSW4_eHrW0d7XDA1779816643873056'; // liveStreams resource id (persistent ingest)
const RTMP = `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`;
const MIX = path.resolve(__dirname, '..', 'renders', 'realm-megamix.mp4');
const POLL_SEC = 60;
const TITLE = "i'm not supposed to be in these places · 24/7 lofi sleep & study";
const CATEGORY_ID = '10'; // Music

if (!fs.existsSync(MIX)) { console.error('Missing megamix:', MIX); process.exit(1); }

// ---- ffmpeg push (forever) ----
const ffmpegArgs = [
  '-re', '-fflags', '+genpts', '-stream_loop', '-1', '-i', MIX,
  '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30',
  '-vsync', 'cfr',
  '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '5000k',
  '-pix_fmt', 'yuv420p', '-g', '60', '-keyint_min', '60',
  '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
  '-af', 'aresample=async=1', '-max_interleave_delta', '0',
  '-f', 'flv', RTMP,
];
function startFfmpeg() {
  const proc = spawn(ffmpegPath, ffmpegArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  proc.stderr.on('data', () => {}); // suppress ffmpeg's chatty stderr unless we hit a problem
  proc.on('exit', (code) => {
    console.error(`[ffmpeg] exited code ${code}, restarting in 8s...`);
    setTimeout(() => { ffmpegProc = startFfmpeg(); }, 8000);
  });
  console.log(`[ffmpeg] pushing to ${RTMP.replace(STREAM_KEY, '***')}`);
  return proc;
}
let ffmpegProc = startFfmpeg();

// ---- broadcast watcher / auto-restarter ----
async function findActiveBroadcast(yt) {
  // Get any broadcast that's currently `ready`, `testing`, `live` (i.e. usable).
  const r = await yt.liveBroadcasts.list({ part: 'snippet,status,contentDetails', broadcastStatus: 'all', maxResults: 10 });
  return (r.data.items || []).find(x => ['ready','testing','live'].includes(x.status.lifeCycleStatus));
}

async function createAndBindNewBroadcast(yt) {
  const startISO = new Date(Date.now() + 5000).toISOString();
  console.log('[wrap] creating new broadcast...');
  const created = await yt.liveBroadcasts.insert({
    part: 'snippet,status,contentDetails',
    requestBody: {
      snippet: { title: TITLE, scheduledStartTime: startISO },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
      contentDetails: { enableAutoStart: true, enableAutoStop: false, enableDvr: true, enableContentEncryption: false, monitorStream: { enableMonitorStream: false } },
    },
  });
  const newId = created.data.id;
  console.log('[wrap]   id:', newId);

  console.log('[wrap] binding to stream resource...');
  await yt.liveBroadcasts.bind({ id: newId, part: 'id,contentDetails', streamId: STREAM_ID });

  // give YouTube a beat to detect the active ingest before transitioning
  await new Promise(r => setTimeout(r, 3000));
  // try transition to live — with enableAutoStart:true, YouTube usually flips on its own,
  // but a manual nudge speeds it up. Failures are non-fatal.
  try {
    await yt.liveBroadcasts.transition({ broadcastStatus: 'live', id: newId, part: 'status' });
    console.log('[wrap]   transitioned to live');
  } catch (e) {
    console.log('[wrap]   transition skipped:', e.message.split('\n')[0], '(YouTube will auto-flip)');
  }
  // set category on the underlying video so it's a Music livestream
  try {
    await yt.videos.update({ part: 'snippet', requestBody: { id: newId, snippet: { title: TITLE, categoryId: CATEGORY_ID, defaultLanguage: 'en' } } });
  } catch (e) {}
  return newId;
}

(async () => {
  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });

  // On startup: if there's already a usable broadcast, adopt it. Otherwise create one.
  let active = await findActiveBroadcast(yt);
  if (active) {
    console.log(`[wrap] adopting existing broadcast: ${active.id} (${active.status.lifeCycleStatus})`);
  } else {
    const id = await createAndBindNewBroadcast(yt);
    active = { id, status: { lifeCycleStatus: 'ready' } };
  }

  // Poll loop
  while (true) {
    await new Promise(r => setTimeout(r, POLL_SEC * 1000));
    try {
      const r = await yt.liveBroadcasts.list({ part: 'status', id: active.id });
      const x = r.data.items && r.data.items[0];
      const lcs = x && x.status.lifeCycleStatus;
      const ts = new Date().toISOString().slice(11, 19);
      console.log(`[wrap ${ts}] broadcast ${active.id} status=${lcs}`);
      if (!lcs || lcs === 'complete' || lcs === 'revoked' || lcs === 'reclaimed') {
        console.log('[wrap] broadcast ended — creating successor...');
        const id = await createAndBindNewBroadcast(yt);
        active = { id, status: { lifeCycleStatus: 'ready' } };
      }
    } catch (e) {
      console.error('[wrap] poll error:', e.message.split('\n')[0]);
    }
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

process.on('SIGINT', () => { try { ffmpegProc.kill('SIGTERM'); } catch (e) {} process.exit(0); });
