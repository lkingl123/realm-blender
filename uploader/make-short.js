// make-short.js — THE permanent Realm Blender Shorts generator.
// One job: turn a theme (image + music) into a finished 20s vertical Short.
//
//   node make-short.js <theme-id>     one theme
//   node make-short.js all            every theme in themes.js
//
// Everything we learned is baked in — do NOT re-specify these:
//   - Funnel format: location -> vibe -> question -> CTA  (NO "POV:" prefix)
//   - CTA signals AUDIO ("1 HOUR TO STUDY OR SLEEP / ON OUR CHANNEL")
//   - Hook lands before YouTube's 3s gate; CTA owns the looping last ~5s
//   - Long lines auto-wrap to 2 balanced lines; ':' is escaped for drawtext
//   - Music auto-starts at the track's loudest section (skips slow intro)
//   - Audio: loudnorm to -14 LUFS, fade in 0.5s, fade out 1.5s
//   - Video: seamless retention loop (pan out-and-back, NO fade to black)

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { THEMES } = require('./themes');

ffmpeg.setFfmpegPath(ffmpegPath);

const fontPath = path.resolve(__dirname, 'Montserrat-ExtraBold.ttf')
  .replace(/\\/g, '/').replace(/:/g, '\\\\:');
const IMAGES_DIR = path.resolve(__dirname, '..', 'images');
const MUSIC_DIR = path.resolve(__dirname, '..', 'music');
const OUT_DIR = path.resolve(__dirname, '..', 'shorts');
// Weather overlays REMOVED May 28, 2026 — Jake judged them visually weak.
// The breathing pan + grade/vignette carries the motion now. Keeping the file
// `overlays/` on disk but never referencing it from any generator.

const DURATION = 10; // 10s (changed May 28 from 20s — data showed avg view dur was ~10s; 10s hits high completion = algorithm pushes harder)
const FPS = 30;
const TOTAL_FRAMES = DURATION * FPS;
const LUFS_TARGET = -18; // ambient/sleep channels run quieter than YouTube's -14 reference

// --- text fitting -----------------------------------------------------------
const FONT_SIZE = 62;
const AVG_CHAR_W = FONT_SIZE * 0.62;   // empirical avg glyph width, Montserrat-ExtraBold
const MAX_LINE_W = 1080 * 0.80;        // ~864px usable (10% safe margin each side)

function lineWidth(t) { return t.length * AVG_CHAR_W; }

// split an over-wide line into 2 balanced lines
function autoWrap(text) {
  if (lineWidth(text) <= MAX_LINE_W) return [text];
  const words = text.split(' ');
  if (words.length === 1) return [text];
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(lineWidth(a) - lineWidth(b));
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

// escape text for ffmpeg drawtext (':' and '\' and "'" are special)
function escapeText(s) {
  return s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

// --- music ------------------------------------------------------------------
function getFirstMusicFile(themeId) {
  const dir = path.join(MUSIC_DIR, themeId);
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).sort();
  return files.length ? path.join(dir, files[0]) : null;
}

// run ffmpeg and return stderr regardless of exit code (info goes to stderr)
function ffmpegStderr(args) {
  try {
    return execSync(`"${ffmpegPath}" ${args} 2>&1`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return (e.stdout || e.stderr || '').toString();
  }
}

// find the start time (s) of the track's loudest 10s block, so the Short
// opens on the full/punchy section instead of a slow ambient intro
function detectLoudStart(musicPath) {
  try {
    const info = ffmpegStderr(`-i "${musicPath}"`);
    const dm = info.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    const total = dm ? (+dm[1]) * 3600 + (+dm[2]) * 60 + parseFloat(dm[3]) : 0;
    if (total < 30) return 0;
    const latest = Math.max(0, total - DURATION - 2);
    let bestStart = 0, bestDb = -Infinity;
    for (let s = 0; s <= latest; s += 10) {
      const blk = ffmpegStderr(`-ss ${s} -t 10 -i "${musicPath}" -af volumedetect -f null -`);
      const m = blk.match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
      if (m && parseFloat(m[1]) > bestDb) { bestDb = parseFloat(m[1]); bestStart = s; }
    }
    return bestStart;
  } catch {
    return 0;
  }
}

// --- text timeline (10s format, May 28) -------------------------------
// Compressed from 4 beats to 2 because data showed avg view duration ~10s.
// On a 10s Short:
//   - HOOK (0-4s): location/openText, instant, beats the 3s scroll gate
//   - CTA (5.5-9.5s): the HONEST small-channel ask. At ~20 subs, parasocial
//     "support a small creator" beats corporate "subscribe for X" — the
//     vulnerability/belonging lever genuinely converts on tiny channels.
//   - 9.5-10s left clean so the loop seam has no text (rewatches = views)
//
// CTA VARIATION (Jun 2, 2026): every Short used to end on the literal same words
// ("SUB TO SUPPORT / A SMALL CHANNEL"). Posting 5 Shorts in a row with identical
// CTAs read as spammy. Now the CTA rotates from a pool of small-channel sub-asks
// — same intent, different wording — picked deterministically from the theme
// slug so re-renders stay stable.
const CTA_POOL = [
  ['SUB TO SUPPORT', 'A SMALL CHANNEL'],
  ['SUPPORT A', 'SMALL CREATOR'],
  ['HELP US GROW', 'HIT SUBSCRIBE'],
  ['SUB IF YOU', 'WANT MORE OF THIS'],
  ['SMALL CHANNEL', 'BIG DREAMS — SUB'],
  ['ENJOYING THIS?', 'SUB TO HELP'],
  ['LITTLE CHANNEL', 'NEEDS YOUR SUB'],
  ['NEW HERE?', 'SUBSCRIBE TO STAY'],
];

// stable hash → CTA index. Same slug always picks the same CTA across re-renders.
function pickCta(themeId) {
  let h = 0;
  for (let i = 0; i < themeId.length; i++) h = ((h << 5) - h + themeId.charCodeAt(i)) | 0;
  return CTA_POOL[Math.abs(h) % CTA_POOL.length];
}

function textTimeline(theme, themeId) {
  const openLine = theme.openText || theme.location; // no "POV:" prefix
  const cta = theme.shortCta || pickCta(themeId);    // per-theme override allowed
  return [
    { text: openLine, start: 0, end: 4, instant: true }, // hook beats the 3s gate
    { lines: cta, start: 5.5, end: 9.5 },                 // varied small-channel ask
  ];
}

function makeAlpha(start, end, instant) {
  const fadeOut = 0.4;
  const eo = end - fadeOut;
  if (instant) {
    return `if(lt(t,${start}),0,if(lt(t,${eo}),1,if(lt(t,${end}),(${end}-t)/${fadeOut},0)))`;
  }
  const fadeIn = 0.5;
  const si = start + fadeIn;
  return `if(lt(t,${start}),0,if(lt(t,${si}),(t-${start})/${fadeIn},if(lt(t,${eo}),1,if(lt(t,${end}),(${end}-t)/${fadeOut},0))))`;
}

function buildVideoFilters(timeline) {
  // MOTION (the engagement lever): the image must feel ALIVE, not dead-still.
  // The gentle "breathing" pan (sin-driven, loop-seamless) + grade + vignette
  // carries the motion. Weather overlays REMOVED May 28 — they read as cheap
  // and gimmicky in context. Subtle pan is enough.

  const filters = [
    `[0:v]scale=-2:1920[scaled]`,
    `[scaled]zoompan=z='1':x='0':y='0':d=${TOTAL_FRAMES}:s=3400x1920:fps=${FPS}[full]`,
    `[full]crop=1080:1920:'(in_w-1080)*sin(${Math.PI}*t/${DURATION})':0[panned]`,
    `[panned]eq=contrast=1.08:brightness=0.01:saturation=1.15[graded]`,
    `[graded]vignette=PI/4[vig]`,
    `[vig]drawbox=x=0:y=0:w=iw:h=ih*0.06:color=black@0.8:t=fill,drawbox=x=0:y=ih-ih*0.06:w=iw:h=ih*0.06:color=black@0.8:t=fill[bars]`,
  ];
  filters.push(
    `[bars]drawtext=text='REALM BLENDER':fontsize=24:fontcolor=white@0.4:x=w-text_w-30:y=h-50:fontfile=${fontPath}[wm]`
  );

  // flatten timeline into individual auto-wrapped, escaped, positioned lines
  const LINE_GAP = 84;
  const drawLines = [];
  timeline.forEach((t) => {
    const lineArr = t.lines ? t.lines : autoWrap(t.text);
    const n = lineArr.length;
    lineArr.forEach((lineText, li) => {
      const offset = (li - (n - 1) / 2) * LINE_GAP;
      const yExpr = offset === 0
        ? `(h-text_h)/2`
        : `(h-text_h)/2${offset > 0 ? '+' : '-'}${Math.abs(offset)}`;
      drawLines.push({
        text: escapeText(lineText),
        alpha: makeAlpha(t.start, t.end, t.instant || false),
        yExpr,
      });
    });
  });

  let last = 'wm';
  if (drawLines.length === 0) {
    filters.push(`[wm]null[texted]`);
  } else {
    drawLines.forEach((dl, i) => {
      const label = i === drawLines.length - 1 ? 'texted' : `txt${i}`;
      filters.push(
        `[${last}]drawtext=text='${dl.text}':fontsize=62:fontcolor=white@0.4:shadowcolor=white@0.15:shadowx=0:shadowy=0:borderw=8:bordercolor=black@0.5:x=(w-text_w)/2:y=${dl.yExpr}:alpha='${dl.alpha}':fontfile=${fontPath}[g${i}]`
      );
      filters.push(
        `[g${i}]drawtext=text='${dl.text}':fontsize=62:fontcolor=white:shadowcolor=black@0.9:shadowx=4:shadowy=4:borderw=2:bordercolor=black@0.4:x=(w-text_w)/2:y=${dl.yExpr}:alpha='${dl.alpha}':fontfile=${fontPath}[${label}]`
      );
      last = label;
    });
  }
  // quick fade IN only — NO fade to black, so the image loops seamlessly
  filters.push(`[texted]fade=t=in:st=0:d=0.6[final]`);
  return filters;
}

function renderShort(themeId) {
  return new Promise((resolve, reject) => {
    const theme = THEMES[themeId];
    if (!theme) { console.error(`  SKIP ${themeId}: not in themes.js`); return resolve(null); }

    const imagePath = path.join(IMAGES_DIR, `${themeId}.png`);
    const musicPath = getFirstMusicFile(themeId);
    if (!fs.existsSync(imagePath)) { console.error(`  SKIP ${themeId}: no image`); return resolve(null); }
    if (!musicPath) { console.error(`  SKIP ${themeId}: no music`); return resolve(null); }

    const musicStart = theme.musicStart != null ? theme.musicStart : detectLoudStart(musicPath);
    const outputPath = path.join(OUT_DIR, `${themeId}-short.mp4`);
    console.log(`  ${themeId}: ${path.basename(musicPath)} @ ${musicStart}s -> ${path.basename(outputPath)}`);

    // inputs: [0]=image, [1]=music. (Overlays removed May 28, 2026.)
    const cmd = ffmpeg().input(imagePath).loop(DURATION);
    const music = cmd.input(musicPath);
    if (musicStart > 0) music.seekInput(musicStart);
    const audioIdx = '1:a';
    cmd.complexFilter(buildVideoFilters(textTimeline(theme, themeId)))
      .outputOptions([
        '-map', '[final]', '-map', audioIdx,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
        '-c:a', 'aac', '-b:a', '192k',
        '-t', String(DURATION), '-shortest', '-pix_fmt', 'yuv420p',
        // loudnorm to -14 LUFS, then fade in 0.5s + fade out last 1.5s
        '-af', `loudnorm=I=${LUFS_TARGET}:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.5,afade=t=out:st=${DURATION - 1.5}:d=1.5`,
      ])
      .output(outputPath)
      .on('end', () => { console.log(`  ${themeId}: DONE`); resolve(outputPath); })
      .on('error', (err) => { console.error(`  ${themeId}: ERROR ${err.message}`); reject(err); })
      .run();
  });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node make-short.js <theme-id|all>');
    console.error('Themes:', Object.keys(THEMES).join(', '));
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const ids = target === 'all' ? Object.keys(THEMES) : [target];
  if (target !== 'all' && !THEMES[target]) {
    console.error(`Unknown theme "${target}". Available: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }

  console.log(`=== make-short: ${ids.length} theme(s) ===`);
  let ok = 0;
  for (const id of ids) {
    try { if (await renderShort(id)) ok++; }
    catch { /* already logged */ }
  }
  console.log(`=== Done: ${ok}/${ids.length} shorts in shorts/ ===`);
}

main();
