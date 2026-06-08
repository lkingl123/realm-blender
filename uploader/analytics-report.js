// Deep analytics report via YouTube Analytics API v2 + Data API.
// Read-only. Run: node analytics-report.js
const { google } = require('googleapis');
const { authenticate } = require('./auth');

const fmt = n => Number(n).toLocaleString();
const pad = (s, n) => String(s).padEnd(n).slice(0, n);

function dateRange(daysBack) {
  const end = new Date();
  const start = new Date(Date.now() - daysBack * 86400000);
  const iso = d => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

async function main() {
  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });
  const ytA = google.youtubeAnalytics({ version: 'v2', auth });
  const { startDate, endDate } = dateRange(30);
  console.log(`\nReport window: ${startDate} -> ${endDate}\n`);

  // ---- Channel-wide totals ----
  const overview = await ytA.reports.query({
    ids: 'channel==MINE', startDate, endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares',
  });
  const o = overview.data.rows ? overview.data.rows[0] : [];
  const cols = overview.data.columnHeaders.map(h => h.name);
  console.log('========== CHANNEL TOTALS (30d) ==========');
  cols.forEach((c, i) => console.log('  ' + pad(c, 26) + ': ' + fmt(o[i] || 0)));

  // ---- Traffic sources ----
  console.log('\n========== TRAFFIC SOURCES (30d) ==========');
  const traffic = await ytA.reports.query({
    ids: 'channel==MINE', startDate, endDate,
    metrics: 'views,estimatedMinutesWatched', dimensions: 'insightTrafficSourceType',
    sort: '-views',
  });
  for (const r of (traffic.data.rows || [])) {
    console.log('  ' + pad(r[0], 26) + ': ' + pad(fmt(r[1]) + ' views', 16) + fmt(r[2]) + ' min');
  }

  // ---- Device / playback ----
  console.log('\n========== DEVICE TYPE (30d) ==========');
  const dev = await ytA.reports.query({
    ids: 'channel==MINE', startDate, endDate,
    metrics: 'views', dimensions: 'deviceType', sort: '-views',
  });
  for (const r of (dev.data.rows || [])) console.log('  ' + pad(r[0], 18) + ': ' + fmt(r[1]) + ' views');

  // ---- Per-video performance ----
  console.log('\n========== TOP VIDEOS (30d) ==========');
  const byVid = await ytA.reports.query({
    ids: 'channel==MINE', startDate, endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained',
    dimensions: 'video', sort: '-views', maxResults: 25,
  });
  const vidRows = byVid.data.rows || [];
  const vidIds = vidRows.map(r => r[0]);
  const titles = {};
  if (vidIds.length) {
    const meta = await yt.videos.list({ part: 'snippet,contentDetails', id: vidIds.join(',') });
    for (const v of meta.data.items) titles[v.id] = { t: v.snippet.title, dur: v.contentDetails.duration };
  }
  console.log('  ' + pad('TITLE', 46) + pad('VIEWS', 8) + pad('AVD', 9) + pad('AVP%', 7) + 'SUBS+');
  for (const r of vidRows) {
    const m = titles[r[0]] || { t: r[0] };
    const avd = Math.round(r[3]) + 's';
    console.log('  ' + pad(m.t, 46) + pad(fmt(r[1]), 8) + pad(avd, 9) + pad((r[4] || 0).toFixed(1), 7) + fmt(r[5] || 0));
  }

  // ---- Geography ----
  console.log('\n========== TOP COUNTRIES (30d) ==========');
  const geo = await ytA.reports.query({
    ids: 'channel==MINE', startDate, endDate,
    metrics: 'views', dimensions: 'country', sort: '-views', maxResults: 8,
  });
  for (const r of (geo.data.rows || [])) console.log('  ' + pad(r[0], 6) + ': ' + fmt(r[1]) + ' views');

  // ---- Subs gained per video ----
  console.log('\n========== SHARES + ENGAGEMENT BY DAY (last 14d) ==========');
  const r14 = dateRange(14);
  const daily = await ytA.reports.query({
    ids: 'channel==MINE', startDate: r14.startDate, endDate: r14.endDate,
    metrics: 'views,subscribersGained,likes', dimensions: 'day', sort: 'day',
  });
  for (const r of (daily.data.rows || [])) {
    console.log('  ' + r[0] + ' : ' + pad(fmt(r[1]) + ' views', 14) + pad('+' + r[2] + ' subs', 12) + r[3] + ' likes');
  }

  console.log('\nDone.');
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.errors) console.error(JSON.stringify(e.errors, null, 2));
  process.exit(1);
});
