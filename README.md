# YouTube Downloader

Internal tool to download YouTube videos (including Shorts) for testing purposes.

## Features

- Download public and unlisted YouTube videos
- Support for standard URLs and Shorts
- Automatic video accessibility validation
- Clean, minimal UI
- JSON API response with metadata
- Deployable to Vercel or GCP Cloud Run

## Quick Start

### Prerequisites

- Node.js 18+
- yt-dlp installed on your system

#### Install yt-dlp

**macOS:**
```bash
brew install yt-dlp
```

**Windows:**
```bash
winget install yt-dlp
# or download from https://github.com/yt-dlp/yt-dlp/releases
```

**Linux:**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Deployment

### ⚠️ Important: Vercel Limitations

Vercel serverless functions **cannot run yt-dlp/ffmpeg binaries**. Use one of these alternatives:

### Deploy to Railway (Recommended - Easiest)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects the Dockerfile and deploys

**Free tier:** 500 hours/month, $5 credit

### Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your GitHub repo
5. Select "Docker" as environment
6. Deploy

**Free tier available**

### Deploy to GCP Cloud Run

```bash
# Build the Docker image
docker build -t youtube-downloader .

# Tag for GCP
docker tag youtube-downloader gcr.io/YOUR_PROJECT_ID/youtube-downloader

# Push to GCP Container Registry
docker push gcr.io/YOUR_PROJECT_ID/youtube-downloader

# Deploy to Cloud Run
gcloud run deploy youtube-downloader \
  --image gcr.io/YOUR_PROJECT_ID/youtube-downloader \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --timeout 300
```

## API Reference

### POST /api/download

Download a YouTube video.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Success Response:**
```json
{
  "success": true,
  "filename": "Video_Title_VIDEO_ID.mp4",
  "filepath": "/tmp/Video_Title_VIDEO_ID.mp4",
  "size": 15728640,
  "title": "Video Title",
  "duration": 180,
  "videoId": "VIDEO_ID",
  "thumbnail": "https://..."
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "PRIVATE_VIDEO",
    "message": "This video is private and cannot be downloaded"
  }
}
```

### GET /api/serve/[filename]

Download the video file to your device.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOWNLOAD_DIR` | Directory for downloaded files | `/tmp` |
| `MAX_DURATION` | Max video duration (seconds) | `3600` |

## Troubleshooting

### "yt-dlp is not installed"
- Ensure yt-dlp is in your PATH
- On Vercel, the postinstall script should download it automatically

### "Video is private"
- Only public and unlisted videos can be downloaded
- Private videos require authentication (not supported)

### "Download timeout"
- Vercel has a 60-second limit
- Use GCP Cloud Run for longer videos
- Reduce video quality if needed

### "Age-restricted video"
- Age-restricted videos require authentication
- Not supported in this tool

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`

## License

Internal use only.
