const { authenticate } = require('./auth');
const { google } = require('googleapis');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'sub-count.json');
const SOUND_FILE = path.join(__dirname, 'bonus-earned.wav');
const CHECK_INTERVAL = 2 * 60 * 1000;       // Check every 2 minutes
const GAP_THRESHOLD = 15 * 60 * 1000;       // >15 min since last check = PC was off/asleep
const CHANNEL_ID = 'UCcEeW-W_HSW4_eHrW0d7XDA';

// Gmail creds live in notify-config.json (gitignored) — not committed.
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'notify-config.json'), 'utf8'));

const emailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: cfg.gmailUser,
    pass: cfg.gmailPass,
  },
});

// playSound: true = play bonus sound (good news), false = silent popup
function notify(title, message, playSound = true) {
  const safeMsg = message.replace(/'/g, "''");
  const safeTitle = title.replace(/'/g, "''");
  let ps;
  if (playSound) {
    const soundPath = SOUND_FILE.replace(/\\/g, '\\\\');
    ps = `Add-Type -AssemblyName PresentationCore; Add-Type -AssemblyName System.Windows.Forms; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([Uri]::new('${soundPath}')); $p.Volume = 0.4; $p.Play(); Start-Sleep -Milliseconds 500; [System.Windows.Forms.MessageBox]::Show('${safeMsg}', '${safeTitle}'); $p.Stop()`;
  } else {
    ps = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${safeMsg}', '${safeTitle}')`;
  }
  exec(`powershell -Command "${ps}"`);

  // Phone: email notification
  emailTransport.sendMail({
    from: cfg.gmailUser,
    to: cfg.gmailUser,
    subject: title,
    text: message,
  }).catch(err => console.error('Email failed:', err.message));
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { subCount: 0, totalViews: 0, lastCheck: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Human-readable gap, e.g. "8h 12m"
function formatGap(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

async function check() {
  try {
    const auth = await authenticate();
    const youtube = google.youtube({ version: 'v3', auth });

    const res = await youtube.channels.list({ part: 'statistics', id: CHANNEL_ID });
    const stats = res.data.items[0].statistics;
    const currentSubs = parseInt(stats.subscriberCount);
    const currentViews = parseInt(stats.viewCount);

    const state = loadState();
    const now = Date.now();
    const hadPrior = state.subCount > 0 || state.lastCheck > 0;
    const gap = state.lastCheck ? now - state.lastCheck : 0;
    const isGapCheck = hadPrior && gap > GAP_THRESHOLD;

    if (hadPrior && currentSubs !== state.subCount) {
      const delta = currentSubs - state.subCount;
      const sign = delta > 0 ? '+' : '';
      const word = Math.abs(delta) > 1 ? 'subscribers' : 'subscriber';

      if (isGapCheck) {
        // First check after PC was off/asleep — summarize the whole gap
        const dir = delta > 0 ? 'gained' : 'lost';
        const msg = `While away (${formatGap(gap)}): ${dir} ${Math.abs(delta)} ${word}.\n`
          + `Subs: ${currentSubs} (was ${state.subCount}, ${sign}${delta})\n`
          + `Views: ${currentViews} (was ${state.totalViews})`;
        console.log(`\n*** OVERNIGHT: ${sign}${delta} subs over ${formatGap(gap)} ***\n`);
        notify('Realm Blender - Since you were away', msg, delta > 0);
      } else if (delta > 0) {
        // Live gain
        const msg = `${delta} new ${word}! Total: ${currentSubs}`;
        console.log(`\n*** ${msg} ***\n`);
        notify('Realm Blender - New Sub!', msg, true);
      } else {
        // Live drop
        const msg = `Lost ${Math.abs(delta)} ${word}. Total: ${currentSubs}`;
        console.log(`\n*** ${msg} ***\n`);
        notify('Realm Blender - Sub Drop', msg, false);
      }
    } else if (isGapCheck) {
      // Came back after a gap but count unchanged — still worth a quiet heads-up
      console.log(`\n[gap ${formatGap(gap)}] No net sub change. Subs: ${currentSubs}\n`);
    }

    if (state.totalViews > 0 && currentViews > state.totalViews) {
      const newViews = currentViews - state.totalViews;
      if (newViews >= 50) console.log(`+${newViews} views (total: ${currentViews})`);
    }

    const time = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Denver', hour: '2-digit', minute: '2-digit' });
    console.log(`[${time} MT] Subs: ${currentSubs} | Views: ${currentViews}`);

    saveState({ subCount: currentSubs, totalViews: currentViews, lastCheck: now });
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

async function main() {
  console.log('=== Realm Blender Sub Watcher ===');
  console.log(`Checking every ${CHECK_INTERVAL / 1000}s`);
  console.log(`Sound: ${path.basename(SOUND_FILE)}`);
  console.log('Press Ctrl+C to stop\n');

  await check();
  setInterval(check, CHECK_INTERVAL);
}

main();
