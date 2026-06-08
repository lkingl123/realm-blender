// make-rb-thumbnails.js — high-CTR Realm Blender thumbnail generator.
// REASON FOR THIS: Studio export (May 27, 2026) revealed our long-forms get
// 3-6k impressions each but only 0.8-2.8% CTR (benchmark 3-10%). Thumbnails are
// the bottleneck. This applies the proven formula:
//   - Big bold sans-serif text (Montserrat ExtraBold) — 1-3 high-impact words
//   - White text with thick black stroke (max contrast, mobile-legible)
//   - Slightly darkened bottom band for text contrast against the scene
//   - Yellow accent on a second line (the "Hogwarts × X" branding)
//   - 1280x720 JPG (under 2MB)
//
//   node make-rb-thumbnails.js <theme-id|all>

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { THEMES } = require('./themes');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'images');
const OUT = path.join(ROOT, 'thumbnails');
// Project fonts (proven on the channel already)
const FONT_BOLD = path.resolve(__dirname, 'Montserrat-ExtraBold.ttf').replace(/\\/g, '/').replace(/:/g, '\\:');

function sh(cmd) { execSync(cmd, { stdio: 'pipe' }); }
function esc(t) { return String(t).replace(/'/g, '’').replace(/:/g, '\\:').replace(/&/g, '\\&').replace(/×/g, 'x'); }

// Pull a punchy 1-3 word HOOK from the theme's vibe (the data-backed format).
// Strip 'thumb' (it's "Place x Thing") into "PLACE" for the big top line, and use
// the second word for the yellow accent ("× THING").
function hookFromTheme(t) {
  const thumb = t.thumb || '';
  // thumb format: "Hogwarts × Kyoto" or "Mordor × Café" or "Moonlit Lake"
  if (thumb.includes('×')) {
    const [left, right] = thumb.split('×').map(s => s.trim());
    return { top: left.toUpperCase(), accent: right.toUpperCase() };
  }
  // nature themes: single phrase, use as top
  return { top: thumb.toUpperCase(), accent: '' };
}

function makeThumb(id) {
  const t = THEMES[id];
  if (!t) { console.error(`  SKIP ${id}: not in themes.js`); return; }
  const img = path.join(IMAGES, `${id}.png`);
  if (!fs.existsSync(img)) { console.error(`  SKIP ${id}: missing image ${img}`); return; }
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const { top, accent } = hookFromTheme(t);
  const topT = esc(top);
  const accT = esc(accent);
  const out = path.join(OUT, `${id}.jpg`);

  // AUTO-FIT: shrink the top word's font size so it always fits within the canvas.
  // Montserrat-ExtraBold avg glyph width ≈ 0.62 × fontsize. Max usable width
  // 1280 - ~80px safe margin each side = 1120px.
  const MAX_W = 1120;
  const TOP_AVG = 0.62;          // empirical
  const TOP_MAX = 130;
  const idealW = top.length * TOP_AVG * TOP_MAX;
  const topSize = idealW > MAX_W ? Math.max(60, Math.floor(MAX_W / (top.length * TOP_AVG))) : TOP_MAX;
  // accent: shrink less aggressively (it includes "× " prefix already)
  const ACC_MAX = 72;
  const accLen = accent.length + 3; // "× " + accent
  const accIdealW = accLen * TOP_AVG * ACC_MAX;
  const accSize = accIdealW > MAX_W ? Math.max(42, Math.floor(MAX_W / (accLen * TOP_AVG))) : ACC_MAX;

  // FORMULA:
  //  1. Scale + crop scene to 1280x720
  //  2. Darken the BOTTOM HALF so text pops (gradient overlay)
  //  3. Big top word in WHITE w/ thick black stroke (Montserrat-ExtraBold ~120px)
  //  4. "× ACCENT" line below in YELLOW w/ stroke (~70px)
  //  5. (Text sits in bottom third — the visually weighted spot, also where
  //     YouTube's timestamp covers a corner so we keep it center)
  // Build the drawtext chain — always end with [final]. Auto-fit sizes computed above.
  // Y positions track top font size so the layout stays tight (taller text sits higher).
  const topY = `h-${Math.round(topSize * 2)}`;
  let drawText = `drawtext=text='${topT}':fontfile='${FONT_BOLD}':fontsize=${topSize}:fontcolor=white:` +
    `borderw=8:bordercolor=black:shadowcolor=black@0.7:shadowx=4:shadowy=4:` +
    `x=(w-text_w)/2:y=${topY}`;
  if (accent) {
    drawText += `,drawtext=text='×  ${accT}':fontfile='${FONT_BOLD}':fontsize=${accSize}:fontcolor=0xFFDE59:` +
      `borderw=6:bordercolor=black:shadowcolor=black@0.7:shadowx=3:shadowy=3:` +
      `x=(w-text_w)/2:y=h-110`;
  }
  const cmd = `"${ffmpegPath}" -y -i "${img}" -filter_complex "` +
    `[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[s];` +
    `color=c=black:s=1280x360[shade];` +
    `[shade]format=yuva420p,geq=r=0:g=0:b=0:a='lerp(0,180,Y/H)'[grad];` +
    `[s][grad]overlay=0:360[bg];` +
    `[bg]${drawText}[final]` +
    `" -map "[final]" -frames:v 1 -q:v 2 "${out}"`;
  try {
    sh(cmd);
    console.log(`  ${id}: -> ${path.basename(out)}`);
  } catch (e) {
    console.error(`  ${id}: ERROR`);
    console.error((e.stderr || '').toString().split('\n').slice(-5).join('\n'));
  }
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node make-rb-thumbnails.js <theme-id|all>');
    console.error('Themes:', Object.keys(THEMES).join(', '));
    process.exit(1);
  }
  const ids = target === 'all' ? Object.keys(THEMES) : [target];
  for (const id of ids) makeThumb(id);
  console.log('\nDone.');
}
main();
