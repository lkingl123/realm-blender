// rebuild-playlists.js — delete all existing playlists, create 2 fresh ones
// (long-form + shorts), and sort every channel video into the right one.
const { authenticate } = require('./auth');
const { google } = require('googleapis');

const OLD_PLAYLIST_IDS = [
  'PLOhyfIBXlTD-AayUhbIMBox-uPDJR9NFJ',
  'PLOhyfIBXlTD_4KMUsHdzEbYwF4HPBBYKI',
  'PLOhyfIBXlTD9w3YUvz_b-JGT3F40TN1QH',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getAllUploads(yt) {
  // resolve the channel's "uploads" playlist, then list every video in it
  const ch = await yt.channels.list({ part: 'contentDetails', mine: true });
  const uploadsId = ch.data.items[0].contentDetails.relatedPlaylists.uploads;
  const vids = [];
  let pageToken;
  do {
    const res = await yt.playlistItems.list({
      part: 'snippet,contentDetails', playlistId: uploadsId, maxResults: 50, pageToken,
    });
    for (const it of res.data.items) {
      vids.push({ id: it.contentDetails.videoId, title: it.snippet.title });
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return vids;
}

async function classify(yt, vids) {
  // a video is a Short if its duration is <= 60s (PT...S, no minutes over 1)
  const longform = [], shorts = [];
  for (let i = 0; i < vids.length; i += 50) {
    const batch = vids.slice(i, i + 50);
    const res = await yt.videos.list({ part: 'contentDetails', id: batch.map(v => v.id).join(',') });
    const durById = {};
    for (const v of res.data.items) durById[v.id] = v.contentDetails.duration;
    for (const v of batch) {
      const dur = durById[v.id] || '';
      const m = dur.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
      const mins = m && m[1] ? parseInt(m[1]) : 0;
      const secs = m && m[2] ? parseInt(m[2]) : 0;
      const totalSec = mins * 60 + secs;
      (totalSec > 0 && totalSec <= 60 ? shorts : longform).push(v);
    }
  }
  return { longform, shorts };
}

async function createPlaylist(yt, title, description) {
  const res = await yt.playlists.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: { title, description },
      status: { privacyStatus: 'public' },
    },
  });
  console.log(`Created playlist: "${title}" (${res.data.id})`);
  return res.data.id;
}

async function addToPlaylist(yt, playlistId, videos) {
  for (const v of videos) {
    try {
      await yt.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId: v.id } },
        },
      });
      console.log(`  + ${v.title}`);
      await sleep(800); // gentle pacing
    } catch (err) {
      console.error(`  ! failed: ${v.title} — ${err.message}`);
    }
  }
}

(async () => {
  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });

  // 1) delete old playlists
  console.log('=== Deleting old playlists ===');
  for (const id of OLD_PLAYLIST_IDS) {
    try { await yt.playlists.delete({ id }); console.log(`  deleted ${id}`); }
    catch (err) { console.error(`  ! could not delete ${id}: ${err.message}`); }
  }

  // 2) gather + classify every video
  console.log('\n=== Scanning channel videos ===');
  const vids = await getAllUploads(yt);
  const { longform, shorts } = await classify(yt, vids);
  console.log(`  ${longform.length} long-form, ${shorts.length} shorts`);

  // 3) create the 2 new playlists
  console.log('\n=== Creating new playlists ===');
  const lfId = await createPlaylist(
    yt,
    'Realm Blender — 1 Hour Ambient (Study & Sleep)',
    'One-hour ambient worlds to study, focus, and sleep to. New ambient realm regularly.'
  );
  const shId = await createPlaylist(
    yt,
    'Realm Blender — Shorts',
    'Quick ambient POV worlds. Watch the full 1-hour versions on the channel.'
  );

  // 4) populate
  console.log('\n=== Adding long-form videos ===');
  await addToPlaylist(yt, lfId, longform);
  console.log('\n=== Adding shorts ===');
  await addToPlaylist(yt, shId, shorts);

  console.log('\n=== Done ===');
  console.log(`Long-form playlist: https://youtube.com/playlist?list=${lfId}`);
  console.log(`Shorts playlist:    https://youtube.com/playlist?list=${shId}`);
})().catch(err => { console.error('Failed:', err.message); process.exit(1); });
