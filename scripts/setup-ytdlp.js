const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const BIN_DIR = path.join(process.cwd(), 'bin');
const YTDLP_PATH = path.join(BIN_DIR, 'yt-dlp');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    const request = (url) => {
      https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          request(response.headers.location);
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    
    request(url);
  });
}

async function setup() {
  console.log('Setting up yt-dlp...');
  
  // Create bin directory
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }
  
  // Check if yt-dlp already exists
  if (fs.existsSync(YTDLP_PATH)) {
    console.log('yt-dlp already exists, skipping download');
    return;
  }
  
  try {
    // Try system yt-dlp first
    execSync('yt-dlp --version', { stdio: 'ignore' });
    console.log('System yt-dlp found');
    return;
  } catch {
    console.log('System yt-dlp not found, downloading...');
  }
  
  try {
    await downloadFile(YTDLP_URL, YTDLP_PATH);
    fs.chmodSync(YTDLP_PATH, '755');
    console.log('yt-dlp downloaded successfully');
  } catch (error) {
    console.error('Failed to download yt-dlp:', error.message);
    console.log('You may need to install yt-dlp manually');
  }
}

setup().catch(console.error);
