// stream-247.js — pushes a looping video to YouTube Live 24/7 via ffmpeg.
//
//   node stream-247.js <YOUR_YOUTUBE_STREAM_KEY>
//
// Setup (manual, one-time, in YouTube Studio):
//   1. Studio -> Create -> Go Live -> "Stream" tab
//   2. Title it (e.g. "Realm Blender 24/7 — Study & Sleep Ambient")
//   3. Copy the STREAM KEY, pass it to this script
//   4. The stream goes live once ffmpeg connects.
//
// Loops renders/realm-megamix.mp4 forever. Build that file first with
// build-megamix.js. Because the mix is many hours long, loop seams are rare.
//
// Content is a still image + audio, so we stream at a low video bitrate
// (cheap on CPU + upload bandwidth).

const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const STREAM_KEY = process.argv[2];
if (!STREAM_KEY) {
  console.error('Usage: node stream-247.js <YOUTUBE_STREAM_KEY>');
  console.error('Get the key in YouTube Studio -> Go Live -> Stream tab.');
  process.exit(1);
}

const MIX = path.resolve(__dirname, '..', 'renders', 'realm-megamix.mp4');
if (!fs.existsSync(MIX)) {
  console.error('Missing ' + MIX + ' — build it first: node build-megamix.js');
  process.exit(1);
}

const RTMP = `rtmp://a.rtmp.youtube.com/live2/${STREAM_KEY}`;

// The mix is a still image at 1fps. YouTube Live wants a steady framerate and
// a keyframe every ~2s. We output 30fps (each still frame duplicated), scale to
// a clean 1920x1080, and keyframe every 60 frames (2s @ 30fps). No -tune
// stillimage here — it broke the stream encode in testing.
// The mix is a 1fps still-image video. Re-timing 1fps -> 30fps for live makes
// audio/video packet timestamps drift, and FLV's strict interleaving rejects
// it ("Packets poorly interleaved / negative timestamp"). Fixes:
//   -fflags +genpts        regenerate clean presentation timestamps on input
//   -af aresample=async=1  keep audio glued to the video timeline (no drift)
//   -max_interleave_delta 0  let the muxer interleave freely (no strict window)
//   -vsync cfr             force constant 30fps output frames
const args = [
  '-re',                         // read input at real-time speed (required for live)
  '-fflags', '+genpts',          // regenerate presentation timestamps
  '-stream_loop', '-1',          // loop the mix forever
  '-i', MIX,
  '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30',
  '-vsync', 'cfr',               // constant frame rate out
  '-c:v', 'libx264', '-preset', 'veryfast',
  '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '5000k',
  '-pix_fmt', 'yuv420p', '-g', '60', '-keyint_min', '60',
  '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
  '-af', 'aresample=async=1',    // keep audio synced to the stretched video clock
  '-max_interleave_delta', '0',  // relax FLV interleaving so 1fps source works
  '-f', 'flv', RTMP,
];

console.log('=== Realm Blender 24/7 stream ===');
console.log('Looping: ' + path.basename(MIX));
console.log('Streaming to YouTube Live... (Ctrl+C to stop)\n');

function start() {
  const ff = spawn(ffmpegPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  ff.on('exit', (code) => {
    console.error(`\nffmpeg exited (code ${code}). Restarting in 10s to keep the stream alive...`);
    setTimeout(start, 10000); // auto-restart if the stream drops
  });
}
start();
