# 🎬 JARS YouTube Video Downloader

A fast, minimal internal tool for downloading YouTube videos (including Shorts) for testing purposes.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-Internal-red?style=flat-square)

## ✨ Features

- 📥 Download public & unlisted YouTube videos
- 🎯 Support for standard URLs and Shorts
- ✅ Automatic video accessibility validation
- 🎨 Clean, minimal UI with Tailwind CSS
- 📊 JSON API response with full metadata
- 🐳 Docker-ready for easy deployment

## 🖼️ Preview

```
┌─────────────────────────────────────────────────┐
│           YouTube Downloader                     │
│     Paste a YouTube URL to download             │
│                                                  │
│  ┌─────────────────────────────┐ ┌──────────┐  │
│  │ https://youtube.com/...     │ │ Download │  │
│  └─────────────────────────────┘ └──────────┘  │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ ✓ Success                                │   │
│  │ Title: Video Title                       │   │
│  │ Duration: 3:45                           │   │
│  │ Size: 15.2 MB                            │   │
│  │ [Download to Device]                     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- yt-dlp (`winget install yt-dlp` or `brew install yt-dlp`)
- ffmpeg (`winget install ffmpeg` or `brew install ffmpeg`)

### Local Development

```bash
# Clone the repository
git clone https://github.com/jishanahmed-shaikh/jars-ytvideo-downloader.git
cd jars-ytvideo-downloader

# Install dependencies
npm install

# Download yt-dlp binary (Windows)
mkdir bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o bin/yt-dlp.exe

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **New Project** → **Deploy from GitHub repo**
4. Select this repository
5. Railway auto-detects Dockerfile and deploys ✨

### Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create **New Web Service**
4. Connect your GitHub repo
5. Select **Docker** environment
6. Deploy

### Docker (Self-hosted)

```bash
# Build image
docker build -t jars-yt-downloader .

# Run container
docker run -p 3000:3000 jars-yt-downloader
```

## 📡 API Reference

### POST `/api/download`

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
  "title": "Video Title",
  "duration": 180,
  "size": 15728640,
  "filename": "Video_Title_VIDEO_ID.mp4",
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

### GET `/api/serve/[filename]`

Download the processed video file to your device.

## 🔗 Supported URL Formats

| Format | Example |
|--------|---------|
| Standard | `https://www.youtube.com/watch?v=VIDEO_ID` |
| Short URL | `https://youtu.be/VIDEO_ID` |
| Shorts | `https://www.youtube.com/shorts/VIDEO_ID` |
| Mobile | `https://m.youtube.com/watch?v=VIDEO_ID` |

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOWNLOAD_DIR` | Directory for downloaded files | `/tmp` |
| `MAX_DURATION` | Max video duration (seconds) | `3600` |

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Video Processing:** yt-dlp + ffmpeg
- **Deployment:** Docker

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── download/route.ts    # POST API endpoint
│   │   └── serve/[filename]/    # File serving endpoint
│   ├── page.tsx                 # Main UI
│   └── layout.tsx
├── lib/
│   ├── validator.ts             # URL validation
│   ├── downloader.ts            # yt-dlp wrapper
│   └── errors.ts                # Error handling
├── Dockerfile                   # Production container
└── railway.json                 # Railway config
```

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "yt-dlp not found" | Install yt-dlp and ensure it's in PATH |
| "Video is private" | Only public/unlisted videos supported |
| "Download timeout" | Video may be too long, check MAX_DURATION |
| Corrupt video file | Ensure ffmpeg is installed for proper encoding |

## 📄 License

Internal use only. Not for public distribution.

---

Built with ❤️ by JARS Team
