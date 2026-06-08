const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('./auth');

async function uploadVideo(options) {
  const {
    filePath,
    title,
    description,
    tags = [],
    categoryId = '10', // Music category
    privacyStatus = 'public',
    thumbnailPath = null,
    isShort = false,
  } = options;

  console.log(`\nUploading: ${title}`);
  console.log(`File: ${filePath}`);
  console.log(`Privacy: ${privacyStatus}`);

  const auth = await authenticate();
  const youtube = google.youtube({ version: 'v3', auth });

  const fileSize = fs.statSync(filePath).size;
  console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(1)} MB`);

  // Upload the video
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        tags,
        categoryId,
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en',
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  }, {
    onUploadProgress: (evt) => {
      const progress = (evt.bytesRead / fileSize * 100).toFixed(1);
      process.stdout.write(`\rUploading... ${progress}%`);
    },
  });

  console.log(`\nVideo uploaded! ID: ${res.data.id}`);
  console.log(`URL: https://youtube.com/watch?v=${res.data.id}`);

  // Upload thumbnail if provided
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    console.log(`Uploading thumbnail: ${thumbnailPath}`);
    try {
      await youtube.thumbnails.set({
        videoId: res.data.id,
        media: {
          mimeType: 'image/png',
          body: fs.createReadStream(thumbnailPath),
        },
      });
      console.log('Thumbnail uploaded!');
    } catch (err) {
      console.log('Thumbnail upload failed (may need verification):', err.message);
    }
  }

  return res.data;
}

// Batch upload multiple videos
async function batchUpload(videoList) {
  console.log(`\n=== Batch uploading ${videoList.length} videos ===\n`);

  for (let i = 0; i < videoList.length; i++) {
    console.log(`\n--- Video ${i + 1} of ${videoList.length} ---`);
    try {
      await uploadVideo(videoList[i]);
      // Wait 30 seconds between uploads to avoid rate limiting
      if (i < videoList.length - 1) {
        console.log('Waiting 30 seconds before next upload...');
        await new Promise(r => setTimeout(r, 30000));
      }
    } catch (err) {
      console.error(`Failed to upload "${videoList[i].title}":`, err.message);
    }
  }

  console.log('\n=== Batch upload complete! ===');
}

module.exports = { uploadVideo, batchUpload };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node upload.js <video-file> <title> [description] [tags]');
    console.log('Example: node upload.js ../renders/mordor-cafe.mp4 "A Coffee Shop in Mordor | 1 Hour Ambient" "Description here" "ambient,mordor,study"');
    process.exit(1);
  }

  const [filePath, title, description = '', tagsStr = ''] = args;
  const tags = tagsStr ? tagsStr.split(',') : [];

  uploadVideo({
    filePath: path.resolve(filePath),
    title,
    description,
    tags,
  }).then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch(err => {
    console.error('Upload failed:', err.message);
    process.exit(1);
  });
}
