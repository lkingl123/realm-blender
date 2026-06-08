// make-longform.js — THE permanent Realm Blender long-form generator.
// One job: turn a theme (image + ALL its music tracks) into a 1-hour ambient
// video.
//
//   node make-longform.js <theme-id>   one theme
//   node make-longform.js all          every theme in themes.js
//
// Everything we learned is baked in — do NOT re-specify these:
//   - Uses ALL .mp3 tracks in music/<id>/  (concatenated, then looped to 1h)
//   - Audio: loudnorm to -14 LUFS  (YouTube reference) + 5s fade-out at the end
//   - Video: still image at 1 fps (keeps file size small for a static image)

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { THEMES } = require('./themes');

ffmpeg.setFfmpegPath(ffmpegPath);

const IMAGES_DIR = path.resolve(__dirname, '..', 'images');
const MUSIC_DIR = path.resolve(__dirname, '..', 'music');
const RENDERS_DIR = path.resolve(__dirname, '..', 'renders');

const TARGET_DURATION = 3600; // 1 hour
const FADE_OUT = 5;           // 5s fade-out at the end
const LUFS_TARGET = -18;      // ambient/sleep channels run quieter than YouTube's -14 reference

function getAudioDuration(filePath) {
  try { execSync(`"${ffmpegPath}" -i "${filePath}"`, { stdio: 'pipe' }); }
  catch (e) {
    const out = (e.stdout || '') + (e.stderr || '') + (e.message || '');
    const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
    if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
  return 0;
}

function renderLongForm(themeId) {
  return new Promise((resolve, reject) => {
    const imagePath = path.join(IMAGES_DIR, `${themeId}.png`);
    const musicDir = path.join(MUSIC_DIR, themeId);
    const outputPath = path.join(RENDERS_DIR, `${themeId}.mp4`);

    if (!fs.existsSync(imagePath)) { console.error(`  SKIP ${themeId}: no image`); return resolve(null); }
    if (!fs.existsSync(musicDir)) { console.error(`  SKIP ${themeId}: no music folder`); return resolve(null); }

    // ALL mp3 tracks in the theme folder, sorted for consistent order
    const musicFiles = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3')).sort();
    if (!musicFiles.length) { console.error(`  SKIP ${themeId}: no mp3s`); return resolve(null); }

    let totalMusic = 0;
    const tracks = musicFiles.map(f => {
      const p = path.join(musicDir, f);
      const d = getAudioDuration(p);
      totalMusic += d;
      return p;
    });
    console.log(`  ${themeId}: ${musicFiles.length} track(s), ${Math.floor(totalMusic / 60)}m ${Math.floor(totalMusic % 60)}s total`);

    const loops = Math.ceil(TARGET_DURATION / Math.max(totalMusic, 1));

    // concat list: all tracks, repeated enough times to exceed 1 hour
    const concatFile = path.join(__dirname, `concat-${themeId}.txt`);
    let concat = '';
    for (let i = 0; i < loops; i++) {
      for (const t of tracks) concat += `file '${t.replace(/\\/g, '/')}'\n`;
    }
    fs.writeFileSync(concatFile, concat);

    // Step 1: concat + loudnorm (-14 LUFS) + 5s fade-out -> temp audio
    const tempAudio = path.join(__dirname, `temp-audio-${themeId}.mp3`);
    const audioCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${concatFile}" -t ${TARGET_DURATION} `
      + `-af "loudnorm=I=${LUFS_TARGET}:TP=-1.5:LRA=11,afade=t=out:st=${TARGET_DURATION - FADE_OUT}:d=${FADE_OUT}" `
      + `-c:a libmp3lame -b:a 192k "${tempAudio}"`;
    console.log('  building audio...');
    try { execSync(audioCmd, { stdio: 'pipe', timeout: 180000 }); }
    catch (e) {
      if (!fs.existsSync(tempAudio)) {
        fs.unlinkSync(concatFile);
        return reject(new Error('audio build failed'));
      }
    }

    // Step 2: still image + audio -> 1-hour video at 1 fps
    console.log('  rendering video...');
    ffmpeg()
      .input(imagePath).loop(TARGET_DURATION)
      .input(tempAudio)
      .outputOptions([
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-tune', 'stillimage',
        '-c:a', 'aac', '-b:a', '192k',
        '-t', String(TARGET_DURATION), '-pix_fmt', 'yuv420p', '-shortest',
        '-r', '1', // 1 fps — still image, keeps file size small
      ])
      .output(outputPath)
      .on('progress', (p) => { if (p.timemark) process.stdout.write(`\r  ${p.timemark}`); })
      .on('end', () => {
        console.log(`\n  ${themeId}: DONE`);
        fs.unlinkSync(concatFile);
        fs.unlinkSync(tempAudio);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`\n  ${themeId}: ERROR ${err.message}`);
        if (fs.existsSync(concatFile)) fs.unlinkSync(concatFile);
        if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
        reject(err);
      })
      .run();
  });
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node make-longform.js <theme-id|all>');
    console.error('Themes:', Object.keys(THEMES).join(', '));
    process.exit(1);
  }
  if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

  const ids = target === 'all' ? Object.keys(THEMES) : [target];
  if (target !== 'all' && !THEMES[target]) {
    console.error(`Unknown theme "${target}". Available: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }

  console.log(`=== make-longform: ${ids.length} theme(s) ===`);
  let ok = 0;
  for (const id of ids) {
    console.log(`\n--- ${id} ---`);
    try { if (await renderLongForm(id)) ok++; }
    catch { /* already logged */ }
  }
  console.log(`\n=== Done: ${ok}/${ids.length} long-forms in renders/ ===`);
}

main();
