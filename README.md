# 🎬 JARS YouTube Downloader

A powerful, feature-rich YouTube downloader with advanced batch processing, playlist support, and automatic download management. Built for testing and internal use.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-Internal-red?style=flat-square)

## ✨ Features

### 🎯 Core Functionality
- 📥 **Single Downloads** - Download individual YouTube videos and Shorts
- 🎵 **Audio Extraction** - Extract MP3 audio from any video
- 📋 **Batch Downloads** - Process up to 10 URLs simultaneously
- 🎼 **Playlist Support** - Download entire YouTube playlists
- ✅ **Auto-validation** - Automatic public/unlisted video detection

### 🚀 Advanced Features
- 📊 **Real-time Progress Bars** - Individual progress tracking for each download
- 📥 **Automatic Downloads** - Browser save dialogs appear automatically
- 🎛️ **Auto-Download Toggle** - Enable/disable automatic downloads
- 📋 **Download Queue** - Visual queue management with status tracking
- 📚 **Download History** - Persistent history of all downloads
- 🌙 **Dark Mode** - System-aware dark/light theme toggle

### 🎮 User Experience
- ⌨️ **Keyboard Shortcuts** - Ctrl+V (paste), Ctrl+Enter (download), Ctrl+R (reset)
- 🎯 **Auto-focus** - Input field automatically focused on page load
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔄 **Smart Reset** - One-click reset for new downloads
- ⏳ **Loading States** - Beautiful loading animations and skeletons

### 🔧 Technical Features
- 🐳 **Docker Ready** - Production-ready containerization
- 📡 **RESTful API** - Clean JSON API for programmatic access
- 🛡️ **Error Handling** - Comprehensive error management
- 💾 **Local Storage** - Persistent settings and history
- 🎨 **Modern UI** - Clean, minimal design with Tailwind CSS

## 🖼️ Preview

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎬 YouTube Downloader                        │
│        Download videos, audio, playlists, and manage           │
│                                                                 │
│  Auto-download files: [●────○] ON                              │
│                                                                 │
│  📋 Batch Download                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://youtube.com/watch?v=...                         │   │
│  │ https://youtube.com/playlist?list=...                   │   │
│  │ https://youtu.be/...                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                        [Download 3 Items]      │
│                                                                 │
│  📊 Download Queue (5)                    [Process 2 Pending]  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⬇️ Video Title 1                    [████████░░] 80%    │   │
│  │ ✅ Video Title 2                    📥 Download         │   │
│  │ ⏳ Playlist: 10 videos              Pending             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  🎯 Quick Download                                              │
│  ┌─────────────────────────────┐ ┌──────────┐                 │
│  │ https://youtube.com/...     │ │ Download │                 │
│  └─────────────────────────────┘ └──────────┘                 │
│                                                                 │
│  📚 Download History (25)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✅ Amazing Video - 2 hours ago      📥 Download         │   │
│  │ ✅ Cool Song.mp3 - 5 hours ago      📥 Download         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- yt-dlp (`winget install yt-dlp` or `brew install yt-dlp`)
- ffmpeg (`winget install ffmpeg` or `brew install ffmpeg`)

### Local Development

```bash
# Clone the repository
git clone https://github.com/jishanahmed-shaikh/yt-downloader-jars.git
cd yt-downloader-jars

# Install dependencies
npm install

# Download yt-dlp binary (Windows)
mkdir bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o bin/yt-dlp.exe

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Use

### Single Downloads
1. Paste a YouTube URL in the quick download section
2. Choose **Video (MP4)** or **Audio (MP3)** format
3. Click **Download** or press **Ctrl+Enter**
4. File automatically downloads to your device (if auto-download is ON)

### Batch Downloads
1. Click **📋 Batch Download** to expand
2. Paste multiple URLs (one per line, max 10)
3. Choose format and click **Download X Items**
4. Watch progress bars for each item
5. Files download automatically as they complete

### Playlist Downloads
1. Paste a YouTube playlist URL
2. System detects playlist and extracts individual videos
3. Videos appear as "Pending" in the queue
4. Click **Process X Pending** to download all videos

### Keyboard Shortcuts
- **Ctrl+V** - Auto-paste YouTube URL from clipboard
- **Ctrl+Enter** - Start download
- **Ctrl+R** - Reset form

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

### Vercel (Serverless)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel auto-deploys with zero configuration

### Docker (Self-hosted)

```bash
# Build image
docker build -t yt-downloader-jars .

# Run container
docker run -p 3000:3000 yt-downloader-jars
```

## 📡 API Reference

### POST `/api/download`

Download a single YouTube video or audio.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "format": "video" // or "audio"
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

### POST `/api/batch-download`

Process multiple URLs including playlists.

**Request:**
```json
{
  "urls": [
    "https://www.youtube.com/watch?v=VIDEO_ID1",
    "https://www.youtube.com/playlist?list=PLAYLIST_ID"
  ],
  "format": "video"
}
```

**Success Response:**
```json
{
  "success": true,
  "processed": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "url": "https://www.youtube.com/watch?v=VIDEO_ID1",
      "success": true,
      "type": "video",
      "data": { /* video metadata */ }
    },
    {
      "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID",
      "success": true,
      "type": "playlist",
      "data": {
        "title": "Playlist Name",
        "videoCount": 25,
        "videos": [ /* array of video objects */ ]
      }
    }
  ]
}
```

### GET `/api/serve/[filename]`

Download the processed file to your device.

**Response Headers:**
```
Content-Type: video/mp4 | audio/mpeg
Content-Disposition: attachment; filename="..."
Content-Length: [file_size]
```

## 🔗 Supported URL Formats

| Format | Example | Supported |
|--------|---------|-----------|
| Standard Video | `https://www.youtube.com/watch?v=VIDEO_ID` | ✅ |
| Short URL | `https://youtu.be/VIDEO_ID` | ✅ |
| YouTube Shorts | `https://www.youtube.com/shorts/VIDEO_ID` | ✅ |
| Mobile URL | `https://m.youtube.com/watch?v=VIDEO_ID` | ✅ |
| Playlist | `https://www.youtube.com/playlist?list=PLAYLIST_ID` | ✅ |
| Video in Playlist | `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID` | ✅ |

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOWNLOAD_DIR` | Directory for downloaded files | `/tmp` |
| `MAX_DURATION` | Max video duration (seconds) | `3600` |
| `PORT` | Server port | `3000` |

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Custom React hooks + Context
- **Video Processing:** yt-dlp + ffmpeg
- **Storage:** localStorage (client-side)
- **Deployment:** Docker, Vercel, Railway, Render

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── download/route.ts           # Single download endpoint
│   │   ├── batch-download/route.ts     # Batch processing endpoint
│   │   ├── progress/[id]/route.ts      # Progress tracking
│   │   └── serve/[filename]/route.ts   # File serving
│   ├── page.tsx                        # Main UI
│   ├── layout.tsx                      # App layout
│   └── globals.css                     # Global styles
├── components/
│   ├── batch-input.tsx                 # Batch download UI
│   ├── download-queue.tsx              # Queue management
│   ├── download-history.tsx            # History display
│   ├── theme-toggle.tsx                # Dark mode toggle
│   ├── loading-skeleton.tsx            # Loading states
│   └── error-boundary.tsx              # Error handling
├── lib/
│   ├── hooks/
│   │   └── use-download-manager.ts     # Download logic
│   ├── validator.ts                    # URL validation
│   ├── downloader.ts                   # yt-dlp wrapper
│   ├── download-store.ts               # State management
│   ├── types.ts                        # TypeScript types
│   └── errors.ts                       # Error handling
├── Dockerfile                          # Production container
├── railway.json                        # Railway config
├── render.yaml                         # Render config
└── vercel.json                         # Vercel config
```

## 🎯 Features in Detail

### Batch Downloads
- Process up to 10 URLs simultaneously
- Individual progress bars for each item
- Smart error handling - failed items don't stop others
- Automatic playlist detection and expansion

### Download Queue
- Real-time status updates (Pending → Downloading → Completed)
- Progress bars with percentage indicators
- Manual download buttons for completed items
- Remove items from queue
- Clear completed items

### Auto-Download System
- Automatic browser save dialogs when downloads complete
- Configurable ON/OFF toggle with persistence
- Staggered downloads for batch processing (prevents popup blocking)
- Manual download fallback buttons

### Download History
- Persistent storage of all completed downloads
- Collapsible UI to save space
- Re-download capability for historical items
- Automatic cleanup (keeps last 50 items)

### Dark Mode
- System preference detection
- Floating toggle button
- Smooth transitions between themes
- Persistent user preference

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "yt-dlp not found" | Install yt-dlp and ensure it's in PATH or use setup script |
| "Video is private" | Only public/unlisted videos supported |
| "Download timeout" | Video may be too long, check MAX_DURATION |
| Corrupt video file | Ensure ffmpeg is installed for proper encoding |
| Batch downloads stop | Check network connection, individual items may fail |
| Auto-download not working | Check browser popup blocker settings |
| Progress bars stuck | Refresh page, downloads continue in background |

## 🔄 Recent Updates

### v2.0.0 - Advanced Features
- ✨ Added batch download functionality
- ✨ Added playlist support with individual video extraction
- ✨ Added real-time progress bars for all downloads
- ✨ Added automatic download triggers with browser save dialogs
- ✨ Added download queue management
- ✨ Added persistent download history
- ✨ Added dark mode toggle
- ✨ Added keyboard shortcuts
- ✨ Added auto-download toggle setting

### v1.0.0 - Initial Release
- 📥 Single video downloads
- 🎵 Audio extraction (MP3)
- 🎨 Clean UI with Tailwind CSS
- 🐳 Docker deployment ready

## 📄 License

Internal use only. Not for public distribution.

---

Built with ❤️ by JARS Team | [GitHub Repository](https://github.com/jishanahmed-shaikh/yt-downloader-jars)