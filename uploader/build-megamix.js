// build-megamix.js — concatenate ALL rendered realms into one seamless file
// for the 24/7 loop stream.
//
// The renders come in TWO formats:
//   - Group A (most): 2720x1536, 1fps  (make-longform.js output) -> use AS-IS
//   - Group B (a few): 1912x1080, 30/60fps (old CapCut) -> RE-ENCODE to match A
// We only re-encode the mismatched ones, then concat everything with -c copy.
//
//   node build-megamix.js
//
// Output: renders/realm-megamix.mp4

const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const RENDERS = path.resolve(__dirname, '..', 'renders');
const TMP = path.join(RENDERS, '_mixparts');
const OUT = path.join(RENDERS, 'realm-megamix.mp4');

// the dominant/target format (Group A)
const TARGET_RES = '2720x1536';
const TARGET_FPS = '1';

function sh(cmd) { execSync(cmd, { stdio: 'inherit' }); }
function probe(file) {
  let out = '';
  try { execSync(`"${ffmpegPath}" -i "${file}"`, { stdio: 'pipe' }); }
  catch (e) { out = (e.stderr || e.stdout || '').toString(); }
  const res = (out.match(/, (\d+x\d+)/) || [])[1] || '';
  const fps = (out.match(/([\d.]+) fps/) || [])[1] || '';
  return { res, fps };
}

(async () => {
  if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

  const files = fs.readdirSync(RENDERS)
    .filter(f => f.endsWith('.mp4') && f !== 'realm-megamix.mp4')
    .sort();

  console.log(`Checking ${files.length} realms...\n`);
  const concatPaths = [];
  let reencoded = 0, asis = 0;

  for (const f of files) {
    const src = path.join(RENDERS, f);
    const { res, fps } = probe(src);
    const matches = res === TARGET_RES && Math.round(parseFloat(fps)) === parseInt(TARGET_FPS);

    if (matches) {
      console.log(`  AS-IS    ${f}  (${res} ${fps}fps)`);
      concatPaths.push(src);
      asis++;
    } else {
      const fixed = path.join(TMP, f);
      if (fs.existsSync(fixed)) { console.log(`  (cached) ${f}`); concatPaths.push(fixed); reencoded++; continue; }
      console.log(`  RE-ENCODE ${f}  (${res} ${fps}fps -> ${TARGET_RES} ${TARGET_FPS}fps)`);
      sh(`"${ffmpegPath}" -y -i "${src}" -vf "scale=${TARGET_RES.replace('x',':')}:force_original_aspect_ratio=increase,crop=${TARGET_RES.replace('x',':')}" -r ${TARGET_FPS} -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 44100 "${fixed}"`);
      concatPaths.push(fixed);
      reencoded++;
    }
  }

  console.log(`\n${asis} used as-is, ${reencoded} re-encoded.`);

  const listFile = path.join(TMP, 'concat.txt');
  fs.writeFileSync(listFile, concatPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));

  console.log('Concatenating into the mega-mix (no re-encode, fast)...');
  sh(`"${ffmpegPath}" -y -f concat -safe 0 -i "${listFile}" -c copy "${OUT}"`);

  console.log(`\nDone -> ${OUT}`);
  console.log('Stream it: node stream-247.js <YOUR_STREAM_KEY>');
})();
