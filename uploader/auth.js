const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TOKEN_PATH = path.join(__dirname, 'token.json');
const CLIENT_SECRET_PATH = path.join(__dirname, 'client_secret.json');

async function authenticate() {
  const content = fs.readFileSync(CLIENT_SECRET_PATH, 'utf8');
  const credentials = JSON.parse(content);

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3456/callback'
  );

  // Check if we already have a token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(token);

    // Check if token is expired and refresh if needed
    if (token.expiry_date && token.expiry_date < Date.now()) {
      try {
        const { credentials: newToken } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(newToken);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken, null, 2));
        console.log('Token refreshed.');
      } catch (err) {
        console.log('Token expired and refresh failed. Re-authenticating...');
        return await getNewToken(oauth2Client);
      }
    }

    console.log('Using existing token.');
    return oauth2Client;
  }

  return await getNewToken(oauth2Client);
}

function getNewToken(oauth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
        'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
      ],
    });

    // Create a local server to handle the callback
    const server = http.createServer(async (req, res) => {
      const queryParams = url.parse(req.url, true).query;

      if (queryParams.code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication successful!</h1><p>You can close this window.</p>');

        try {
          const { tokens } = await oauth2Client.getToken(queryParams.code);
          oauth2Client.setCredentials(tokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
          console.log('Token saved to', TOKEN_PATH);
          server.close();
          resolve(oauth2Client);
        } catch (err) {
          reject(err);
        }
      }
    });

    server.listen(3456, () => {
      console.log('Opening browser for authentication...');
      console.log('If browser does not open, visit:', authUrl);
      exec(`start "" "${authUrl}"`);
    });
  });
}

module.exports = { authenticate };

// Run directly to test auth
if (require.main === module) {
  authenticate().then(() => {
    console.log('Authentication complete!');
    process.exit(0);
  }).catch(err => {
    console.error('Auth failed:', err.message);
    process.exit(1);
  });
}
