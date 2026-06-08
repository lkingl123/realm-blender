// Breaks down where the channel's subscribers came from.
// Read-only. Run: node subs-report.js
const { google } = require('googleapis');
const { authenticate } = require('./auth');

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);

async function main() {
  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });
  const ytA = google.youtubeAnalytics({ version: 'v2', auth });

  const ch = await yt.channels.list({ part: 'snippet,statistics', mine: true });
  const start = ch.data.items[0].snippet.publishedAt.slice(0, 10);
  const end = new Date().toISOString().slice(0, 10);
  console.log('CHANNEL: ' + ch.data.items[0].statistics.subscriberCount + ' subscribers');
  console.log('Window: ' + start + ' -> ' + end + '\n');

  // 1. Subs gained/lost per DAY
  console.log('========== SUBS BY DAY ==========');
  const byDay = await ytA.reports.query({
    ids: 'channel==MINE', startDate: start, endDate: end,
    metrics: 'subscribersGained,subscribersLost', dimensions: 'day', sort: 'day',
  });
  let net = 0;
  for (const r of (byDay.data.rows || [])) {
    const g = +r[1], l = +r[2];
    if (g === 0 && l === 0) continue;
    net += g - l;
    console.log('  ' + r[0] + '  +' + g + ' / -' + l + '   (running net: ' + net + ')');
  }

  // 2. Subs gained per VIDEO
  console.log('\n========== SUBS BY VIDEO ==========');
  const byVid = await ytA.reports.query({
    ids: 'channel==MINE', startDate: start, endDate: end,
    metrics: 'subscribersGained,subscribersLost,views', dimensions: 'video',
    sort: '-subscribersGained', maxResults: 50,
  });
  const vidRows = (byVid.data.rows || []).filter(r => +r[1] > 0 || +r[2] > 0);
  const vidIds = vidRows.map(r => r[0]);
  const titles = {};
  if (vidIds.length) {
    for (let i = 0; i < vidIds.length; i += 50) {
      const meta = await yt.videos.list({ part: 'snippet', id: vidIds.slice(i, i + 50).join(',') });
      for (const v of meta.data.items) titles[v.id] = v.snippet.title;
    }
  }
  if (!vidRows.length) console.log('  (no per-video sub attribution)');
  for (const r of vidRows) {
    console.log('  +' + padL(r[1], 2) + ' / -' + r[2] + '   ' + pad(titles[r[0]] || r[0], 52) + ' (' + r[3] + ' views)');
  }

  // 3. Subscribed status — views from subbed vs not
  console.log('\n========== SUBS GAINED BY TRAFFIC SOURCE ==========');
  try {
    const bySrc = await ytA.reports.query({
      ids: 'channel==MINE', startDate: start, endDate: end,
      metrics: 'subscribersGained', dimensions: 'insightTrafficSourceType',
      sort: '-subscribersGained',
    });
    for (const r of (bySrc.data.rows || [])) {
      if (+r[1] > 0) console.log('  +' + padL(r[1], 2) + '   ' + r[0]);
    }
  } catch (e) { console.log('  (traffic-source sub breakdown unavailable: ' + e.message + ')'); }

  // 4. Subs by country
  console.log('\n========== SUBS GAINED BY COUNTRY ==========');
  try {
    const byGeo = await ytA.reports.query({
      ids: 'channel==MINE', startDate: start, endDate: end,
      metrics: 'subscribersGained', dimensions: 'country', sort: '-subscribersGained',
    });
    for (const r of (byGeo.data.rows || [])) {
      if (+r[1] > 0) console.log('  +' + padL(r[1], 2) + '   ' + r[0]);
    }
  } catch (e) { console.log('  (country breakdown unavailable)'); }

  console.log('\nDone.');
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
