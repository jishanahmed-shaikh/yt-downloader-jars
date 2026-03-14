# JARS YouTube Downloader

A powerful, feature-rich YouTube downloader with batch processing, playlist support, and automatic download management. Built with Next.js 14 and yt-dlp.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![Version](https://img.shields.io/badge/Version-2.1-green?style=flat-square)
![License](https://img.shields.io/badge/License-Internal-red?style=flat-square)

## Features

### Core
- Single video downloads (MP4)
- Audio extraction (MP3) from any video
- Batch downloads — up to 10 URLs at once
- Playlist support — extracts and queues individual videos
- URL validation with public/unlisted detection

### Queue & History
- Real-time per-item progress bars
- Download queue with status tracking (Pending / Downloading / Completed / Error)
- Persistent download history (last 50 entries, stored in localStorage)
- Retry button for failed downloads
- Clear completed items

### UX
- Auto-download toggle — browser save dialog fires automatically on completion
- Dark / light mode with system preference detection
- Keyboard shortcuts: `Ctrl+V` paste, `Ctrl+Enter` download, `Ctrl+R` reset
- Responsive layout for desktop and mobile
- Browser notifications on completion
- Clipboard monitor — detects YouTube URLs copied to clipboard
- Download presets — save and reuse format/quality settings
- Touch gesture support for mobile

### Technical
- Docker-ready for production deployment
- Clean REST API (`/api/download`, `/api/batch-download`, `/api/serve/[filename]`)
- yt-dlp auto-update on startup (always uses latest binary)
- Non-ASCII filename sanitization (Arabic, emoji, CJK titles work correctly)
- Configurable duration limit via environment variable

## Quick Start

### Prerequisites

- Node.js 18+
- yt-dlp and ffmpeg (the setup script downloads them automatically)

### Local Development

```bash
git clone https://github.com/jishanahmed-shaikh/yt-downloader-jars.git
cd yt-downloader-jars

npm install

# Download yt-dlp + ffmpeg into bin/
node scripts/setup-ytdlp.js

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to Use

### Single Download
1. Paste a YouTube URL in the quick download field
2. Choose Video (MP4) or Audio (MP3)
3. Click Download or press `Ctrl+Enter`

### Batch Download
1. Expand the Batch Download panel
2. Paste multiple URLs (one per line, max 10)
3. Click "Download X Items"
4. Each item shows its own progress bar

### Playlist Download
1. Paste a playlist URL
2. The system extracts individual videos into the queue as Pending
3. Click "Process X Pending" to start downloading

## Deployment

### Railway (recommended)

1. Push to GitHub
2. New Project → Deploy from GitHub repo
3. Railway detects the Dockerfile automatically

### Render

1. Push to GitHub
2. New Web Service → Docker environment → Deploy

### Docker (self-hosted)

```bash
docker build -t yt-downloader-jars .
docker run -p 3000:3000 yt-downloader-jars
```

### Vercel

Import the repo — Vercel deploys with zero config. Note: serverless functions have a 10s timeout which may be too short for longer videos.

## API Reference

### POST `/api/download`

```json
// Request
{ "url": "https://www.youtube.com/watch?v=VIDEO_ID", "format": "video", "quality": "best" }

// Success response
{ "success": true, "title": "...", "duration": 180, "size": 15728640, "filename": "...", "videoId": "...", "thumbnail": "..." }
```

### POST `/api/batch-download`

```json
// Request
{ "urls": ["https://..."], "format": "audio", "quality": "best" }

// Success response
{ "success": true, "processed": 2, "successful": 2, "failed": 0, "results": [...] }
```

### GET `/api/serve/[filename]`

Streams the processed file to the browser with `Content-Disposition: attachment`.

## Supported URL Formats

| Format | Example |
|--------|---------|
| Standard video | `youtube.com/watch?v=ID` |
| Short URL | `youtu.be/ID` |
| YouTube Shorts | `youtube.com/shorts/ID` |
| Mobile | `m.youtube.com/watch?v=ID` |
| Playlist | `youtube.com/playlist?list=ID` |
| Video in playlist | `youtube.com/watch?v=ID&list=ID` |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOWNLOAD_DIR` | Output directory for downloaded files | `/tmp` |
| `MAX_DURATION` | Max video duration in seconds | `7200` (2 hours) |
| `PORT` | Server port | `3000` |

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── download/route.ts           # Single download endpoint
│   │   ├── batch-download/route.ts     # Batch processing endpoint
│   │   ├── progress/[id]/route.ts      # Progress tracking
│   │   └── serve/[filename]/route.ts   # File serving
│   ├── page.tsx                        # Main UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── batch-input.tsx
│   ├── download-queue.tsx
│   ├── download-history.tsx
│   ├── download-stats.tsx
│   ├── download-presets.tsx
│   ├── quick-actions.tsx
│   ├── theme-toggle.tsx
│   ├── clipboard-notification.tsx
│   ├── loading-skeleton.tsx
│   └── error-boundary.tsx
├── lib/
│   ├── hooks/
│   │   ├── use-download-manager.ts     # Download orchestration hook
│   │   ├── use-clipboard-monitor.ts    # Clipboard URL detection
│   │   └── use-touch-gestures.ts       # Mobile gesture support
│   ├── downloader.ts                   # yt-dlp wrapper
│   ├── download-store.ts               # State management
│   ├── types.ts                        # TypeScript interfaces
│   ├── validator.ts                    # URL validation
│   ├── errors.ts                       # Error types and parsing
│   └── theme-context.tsx               # Theme provider
├── scripts/
│   └── setup-ytdlp.js                  # Binary setup + auto-update
├── Dockerfile
├── railway.json
├── render.yaml
└── vercel.json
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "yt-dlp not found" | Run `node scripts/setup-ytdlp.js` |
| "Video is private" | Only public/unlisted videos are supported |
| "Video is too long" | Increase `MAX_DURATION` in `.env.local` |
| Corrupt video file | Ensure ffmpeg is present in `bin/` |
| Auto-download not working | Check browser popup blocker settings |
| Non-ASCII title fails | Already handled — titles are ASCII-sanitized automatically |

## Changelog

### v2.1.0
- Non-ASCII filename sanitization (Arabic, emoji, CJK titles no longer cause failures)
- yt-dlp auto-update on startup via `scripts/setup-ytdlp.js`
- Increased default `MAX_DURATION` to 7200 seconds (2 hours)
- Clean, professional UI redesign — removed emoji clutter, consistent card styling
- Full JSDoc documentation across all core modules
- Download presets, clipboard monitor, touch gesture support
- Download statistics, quick actions menu, export history (CSV/JSON)

### v2.0.0
- Batch downloads with per-item progress bars
- Playlist support with individual video extraction
- Download queue and persistent history
- Auto-download browser save dialogs
- Dark mode, keyboard shortcuts, error boundaries

### v1.0.0
- Single video and audio downloads
- yt-dlp + ffmpeg integration
- Docker deployment support

---

Built by JISHANAHMED AR SHAIKH | [LinkedIn](https://www.linkedin.com/in/jishanahmedshaikh/)
