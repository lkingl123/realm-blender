// build-upload-index.js — definitive slug → uploaded video-id map.
//
//   node build-upload-index.js
//
// Output: ./upload-index.json
//
// === Source-of-truth fix (Jun 7, 2026) ===
// The old version pulled videos from `playlistItems.list` on the channel's
// "uploads" playlist. That playlist is INCOMPLETE — Shorts and some videos
// silently drop out (confirmed: the original Batcave Short CPQ70KiwXx8 was
// missing from playlistItems but present via `videos.list` direct).
//
// New approach: use `search.list({ forMine: true, type: 'video' })` which
// hits the actual indexed-video listing. Cross-checked against
// `playlistItems` (union) so we catch anything either source has.
//
// === Matcher fix (history) ===
// Titles don't contain the slug, so we match by keyword from theme.location
// (or theme.openText). Single-word keywords use WORD-BOUNDARY regex
// (otherwise "mines" inside "biolumiNESCent" would false-match moria-cinema).
// Multi-word hints use substring (uniqueness already guaranteed).
//
// SLUG_HINTS is for slugs whose published title doesn't share keywords with
// the theme.location (e.g. hogwarts-* were rebranded to "Wizarding Library").

const fs = require('fs');
const path = require('path');
const { authenticate } = require('./auth');
const { google } = require('googleapis');
const { THEMES } = require('./themes');

const SLUG_HINTS = {
  'hogwarts-aurora':      ['aurora', 'northern lights'],
  'hogwarts-egypt':       ['pyramid'],
  'hogwarts-kyoto':       ['kyoto'],
  'hogwarts-london':      ['london'],
  'hogwarts-newyork':     ['new york'],
  'hogwarts-shanghai':    ['shanghai'],
  'hogwarts-tokyo':       ['tokyo'],
  'hogwarts-vegas':       ['vegas'],
  'hogwarts-venice':      ['venice'],
  'hogwarts-paris':       ['paris'],
  'hogwarts-rome':        ['rome'],
  'hogwarts-edinburgh':   ['edinburgh'],
  'hogwarts-prague':      ['prague'],
  'moonlit-lake':         ['moonlit', 'quiet night by the lake'],
  'enchanted-forest':     ['enchanted forest'],
  'bioluminescent-ocean': ['bioluminescent', 'glowing ocean'],
  'mordor-cafe':          ['mordor'],
  'jabba-nail-salon':     ['jabba'],
  'shire-ramen':          ['shire'],
  'kings-landing-jazz':   ['jazz bar', 'king'],
  'gotham-diner':         ['gotham', 'diner'],
  'cozy-cabin-snow':      ['cozy', 'snowed-in cabin', 'mountain cabin'],
  'azkaban-flower-shop':  ['azkaban'],
  'diagon-alley-birdshop':['bird shop','diagon alley'],
  'diagon-alley-thrift':  ['thrift','diagon'],
  'falcon-sushi':         ['sushi','falcon','millennium'],
  'winterfell-piano-bar': ['winterfell','piano bar'],
  'castle-black-spa':     ['castle black','spa'],
  'rivendell-gym':        ['rivendell','gym'],
  'iron-throne-fiesta':   ['iron throne','fiesta'],
  'dragonstone-karaoke':  ['dragonstone','karaoke'],
  'batcave-pizza':        ['batcave'],
  'wakanda-barbershop':   ['wakanda','barbershop'],
  'jedi-temple-gaming':   ['jedi temple','gaming'],
  'deathstar-laundromat': ['death star','laundromat'],
  'dagobah-bookstore':    ['dagobah'],
  'chamber-nightclub':    ['chamber of secrets','nightclub'],
  'moria-cinema':         ['moria','mines of moria'],
  'hogwarts-express-tattoo':['hogwarts express','tattoo'],
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(haystack, needle) {
  const re = new RegExp('(^|[^a-z0-9])' + escapeRegex(needle) + '([^a-z0-9]|$)', 'i');
  return re.test(haystack);
}

function locKw(loc) {
  const STOP = new Set(['in','at','on','the','of','a','an','and','by','to','under','with']);
  return loc.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
}

// === SOURCE OF TRUTH: union of playlistItems AND search.list ===
// search.list is more complete but rate-limited and capped at 500 results;
// playlistItems can miss Shorts but is unlimited. Union catches more.
async function fetchAllChannelVideos(yt) {
  const byId = new Map();

  // 1) playlistItems on the uploads playlist (cheap, complete for older long-forms)
  try {
    const ch = await yt.channels.list({ part: 'contentDetails', mine: true });
    const upList = ch.data.items[0].contentDetails.relatedPlaylists.uploads;
    let pageToken;
    while (true) {
      const r = await yt.playlistItems.list({ part: 'snippet,contentDetails', playlistId: upList, maxResults: 50, pageToken });
      for (const it of r.data.items) {
        byId.set(it.contentDetails.videoId, {
          id: it.contentDetails.videoId,
          title: it.snippet.title,
          published: it.snippet.publishedAt,
          src: 'playlist',
        });
      }
      pageToken = r.data.nextPageToken;
      if (!pageToken) break;
    }
    console.log(`[api] playlistItems returned ${byId.size} videos`);
  } catch (e) {
    console.log('[api] playlistItems failed:', e.message);
  }

  // 2) search.list forMine=true (catches Shorts that drop out of playlistItems)
  let foundFromSearch = 0, alreadyKnown = 0;
  try {
    let pageToken;
    while (true) {
      const r = await yt.search.list({
        part: 'snippet',
        forMine: true,
        type: 'video',
        maxResults: 50,
        order: 'date',
        pageToken,
      });
      for (const it of r.data.items) {
        if (byId.has(it.id.videoId)) {
          alreadyKnown++;
        } else {
          foundFromSearch++;
          byId.set(it.id.videoId, {
            id: it.id.videoId,
            title: it.snippet.title,
            published: it.snippet.publishedAt,
            src: 'search',
          });
        }
      }
      pageToken = r.data.nextPageToken;
      if (!pageToken) break;
    }
    console.log(`[api] search.list confirmed ${alreadyKnown} + found ${foundFromSearch} new`);
  } catch (e) {
    console.log('[api] search.list failed:', e.message, '(playlistItems coverage only)');
  }

  return Array.from(byId.values());
}

(async () => {
  const auth = await authenticate();
  const yt = google.youtube({ version: 'v3', auth });

  const uploads = await fetchAllChannelVideos(yt);
  console.log(`[api] UNION total = ${uploads.length} videos\n`);

  function findMatch(slug, type) {
    const t = THEMES[slug];
    const isHinted = !!SLUG_HINTS[slug];
    const kws = SLUG_HINTS[slug] || (t ? locKw(t.location || t.openText || '') : []);
    if (!kws.length) return null;
    return uploads.find(u => {
      const ut = (u.title || '').toLowerCase();
      const isShortTitle = ut.includes('#shorts');
      if (type === 'long' && isShortTitle) return false;
      if (type === 'short' && !isShortTitle) return false;
      return kws.some(k => isHinted ? ut.includes(k) : hasWord(ut, k));
    });
  }

  // Detect ALL matches (not just first) — flag duplicates explicitly
  function findAllMatches(slug, type) {
    const t = THEMES[slug];
    const isHinted = !!SLUG_HINTS[slug];
    const kws = SLUG_HINTS[slug] || (t ? locKw(t.location || t.openText || '') : []);
    if (!kws.length) return [];
    return uploads.filter(u => {
      const ut = (u.title || '').toLowerCase();
      const isShortTitle = ut.includes('#shorts');
      if (type === 'long' && isShortTitle) return false;
      if (type === 'short' && !isShortTitle) return false;
      return kws.some(k => isHinted ? ut.includes(k) : hasWord(ut, k));
    });
  }

  const renderDir = path.resolve(__dirname, '..', 'renders');
  const shortDir  = path.resolve(__dirname, '..', 'shorts');
  const thumbDir  = path.resolve(__dirname, '..', 'thumbnails');
  const longSlugs  = fs.readdirSync(renderDir).filter(f => f.endsWith('.mp4') && !f.includes('megamix')).map(f => f.replace('.mp4',''));
  const shortSlugs = fs.readdirSync(shortDir).filter(f => f.endsWith('.mp4')).map(f => f.replace('-short.mp4',''));
  const allSlugs   = [...new Set([...longSlugs, ...shortSlugs])].sort();

  const result = [];
  const duplicates = [];
  for (const slug of allSlugs) {
    const longHits  = findAllMatches(slug, 'long');
    const shortHits = findAllMatches(slug, 'short');
    if (longHits.length > 1)  duplicates.push({ slug, type: 'long',  ids: longHits.map(h => h.id) });
    if (shortHits.length > 1) duplicates.push({ slug, type: 'short', ids: shortHits.map(h => h.id) });

    const lm = longHits[0]  || null;
    const sm = shortHits[0] || null;
    result.push({
      slug,
      longId:       lm ? lm.id    : null,
      longTitle:    lm ? lm.title : null,
      shortId:      sm ? sm.id    : null,
      shortTitle:   sm ? sm.title : null,
      hasLongFile:  longSlugs.includes(slug),
      hasShortFile: shortSlugs.includes(slug),
      hasThumb:     fs.existsSync(path.join(thumbDir, slug + '.jpg')),
    });
  }
  const outPath = path.resolve(__dirname, 'upload-index.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('[wrote]', outPath);

  console.log('\n=== UNPOSTED LONG-FORMS (file on disk, not on channel) ===');
  const unpL = result.filter(r => r.hasLongFile && !r.longId);
  unpL.forEach(r => console.log('  ' + r.slug + '  → ' + ((THEMES[r.slug] && (THEMES[r.slug].location || THEMES[r.slug].openText)) || '(no theme)')));
  if (!unpL.length) console.log('  (none)');

  console.log('\n=== UNPOSTED SHORTS (file on disk, not on channel) ===');
  const unpS = result.filter(r => r.hasShortFile && !r.shortId);
  unpS.forEach(r => console.log('  ' + r.slug + '  → ' + ((THEMES[r.slug] && (THEMES[r.slug].location || THEMES[r.slug].openText)) || '(no theme)')));
  if (!unpS.length) console.log('  (none)');

  if (duplicates.length) {
    console.log('\n⚠️  DUPLICATE MATCHES — same slug matches multiple channel videos:');
    for (const d of duplicates) console.log('  ' + d.slug + ' (' + d.type + '): ' + d.ids.join(', '));
  }
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
