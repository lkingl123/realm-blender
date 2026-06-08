// apply-thumbnails.js — bulk-upload the new high-CTR thumbnails to YouTube.
// Pulls the live video list, matches by title/theme, and replaces the thumbnail
// for each. Respects YouTube's daily limit (best practice: max ~6 changes/day).
//
//   node apply-thumbnails.js              dry run — shows what WOULD change
//   node apply-thumbnails.js --go         actually apply (will prompt before each)
//   node apply-thumbnails.js --go <id>    apply only one theme
//
// Mapping: live video title is matched against themes.js entries by inspecting
// which theme's `place`/title-phrase appears in the live title.

const { authenticate } = require('./auth');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { THEMES } = require('./themes');

const ROOT = path.resolve(__dirname, '..');
const THUMBS = path.join(ROOT, 'thumbnails');

// Heuristic match: each theme's `place` (or thumb words) should appear in the
// live LONG-FORM title (which is e.g. "Snowy Kyoto Wizarding Library | 1 Hour ...").
// Returns the matched themeId for a given live title, or null.
function matchTheme(title) {
  // signature words per theme (manually-curated for accuracy)
  const sigs = {
    'mordor-cafe': ['Mordor Coffee Shop', 'Cafe in Mordor'],
    'shire-ramen': ['Shire Ramen'],
    'iron-throne-fiesta': ['Iron Throne Fiesta'],
    'rivendell-gym': ['Rivendell Gym'],
    'batcave-pizza': ['Batcave Pizza'],
    'castle-black-spa': ['Castle Black Spa'],
    'dragonstone-karaoke': ['Dragonstone Karaoke'],
    'jabba-nail-salon': ["Jabba's Palace Nail", 'Jabba Nail'],
    'hogwarts-tokyo': ['Hogwarts Tokyo'],
    'hogwarts-kyoto': ['Snowy Kyoto'],
    'hogwarts-venice': ['Venice Canals Wizarding'],
    'hogwarts-london': ['Rainy London Wizarding'],
    'hogwarts-newyork': ['Rainy New York Wizarding'],
    'hogwarts-shanghai': ['Old Shanghai Wizarding'],
    'hogwarts-vegas': ['Las Vegas Wizarding'],
    'hogwarts-egypt': ['Wizarding Library by the Pyramids', 'Pyramids'],
    'hogwarts-aurora': ['Wizarding Library Under the Northern Lights', 'Northern Lights'],
    'diagon-alley-birdshop': ['Diagon Alley Bird Shop'],
    'gotham-diner': ['Gotham Diner', 'Late-Night Gotham'],
    'kings-landing-jazz': ["King's Landing Jazz"],
    'moonlit-lake': ['Moonlit Lake'],
    'enchanted-forest': ['Enchanted Forest'],
    'bioluminescent-ocean': ['Bioluminescent Ocean'],
  };
  for (const [id, list] of Object.entries(sigs)) {
    if (list.some(s => title.includes(s))) return id;
  }
  return null;
}

async function listLiveVideos(yt) {
  // get every video on the channel
  const ch = await yt.channels.list({ part: 'contentDetails', mine: true });
  const up = ch.data.items[0].contentDetails.relatedPlaylists.uploads;
  const all = [];
  let next;
  do {
    const r = await yt.playlistItems.list({ part: 'snippet,contentDetails', playlistId: up, maxResults: 50, pageToken: next });
    for (const it of r.data.items) all.push({ id: it.contentDetails.videoId, title: it.snippet.title });
    next = r.data.nextPageToken;
  } while (next);
  return all;
}

async function main() {
  const args = process.argv.slice(2);
  const go = args.includes('--go');
  const only = args.find(a => !a.startsWith('--'));

  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });

  const videos = await listLiveVideos(yt);
  console.log(`Found ${videos.length} live videos on the channel.\n`);

  // build the action list: match each live LONG-FORM (skip Shorts/stream) to a theme
  const actions = [];
  for (const v of videos) {
    if (/#Shorts/i.test(v.title) || /Realm Blender 24\/7/i.test(v.title)) continue; // skip shorts + the stream
    const themeId = matchTheme(v.title);
    if (!themeId) { console.log(`  ? no theme match: ${v.title.slice(0, 60)}`); continue; }
    const thumb = path.join(THUMBS, `${themeId}.jpg`);
    if (!fs.existsSync(thumb)) { console.log(`  ? missing thumbnail file for ${themeId}: ${thumb}`); continue; }
    if (only && themeId !== only) continue;
    actions.push({ videoId: v.id, title: v.title, themeId, thumb });
  }
  // Order by impressions (highest first) so the top-leverage ones get the daily
  // budget — Studio export May 27 2026. If we get rate-limited, the rest tomorrow.
  const IMPR_ORDER = [
    'hogwarts-kyoto',       // 5814 impr (highest)
    'hogwarts-shanghai',    // 5629
    'gotham-diner',         // 4167
    'moonlit-lake',         // 3819 (worst CTR — biggest fix potential)
    'hogwarts-egypt',       // 3439
    'mordor-cafe',          // 3394
    'bioluminescent-ocean', // 3036
    'hogwarts-vegas',       // 2686
    'hogwarts-london',      // 2430
    'hogwarts-venice',      // 2283
    'hogwarts-aurora',      // 1893
    'dragonstone-karaoke',  // 1886
  ];
  actions.sort((a, b) => {
    const ai = IMPR_ORDER.indexOf(a.themeId);
    const bi = IMPR_ORDER.indexOf(b.themeId);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  console.log(`\nWill update ${actions.length} long-form thumbnails (highest-impression first).`);
  for (const a of actions) console.log(`  ${a.themeId.padEnd(28)} -> ${a.title.slice(0, 50)}`);

  if (!go) {
    console.log('\n(dry run — pass --go to actually apply)');
    return;
  }

  // YouTube allows ~6 thumbnail changes per day to be safe; warn if over.
  if (actions.length > 6) {
    console.log(`\n⚠ ${actions.length} > YouTube's safe daily limit (~6). Doing them anyway — if you get rate-limited, run again tomorrow for the rest.`);
  }
  console.log('\nApplying...');
  let ok = 0, failed = 0;
  for (const a of actions) {
    try {
      await yt.thumbnails.set({ videoId: a.videoId, media: { body: fs.createReadStream(a.thumb) } });
      console.log(`  ✓ ${a.themeId}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${a.themeId}: ${e.message.split('\n')[0]}`);
      failed++;
      if (/rate|quota|limit/i.test(e.message)) {
        console.error('  (rate-limited — stopping. Try the rest tomorrow.)');
        break;
      }
    }
  }
  console.log(`\nDone. ${ok} updated, ${failed} failed.`);
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
