#!/bin/bash
# Install yt-dlp for Vercel serverless functions

echo "Installing yt-dlp..."

# Create bin directory
mkdir -p /vercel/.local/bin

# Download yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /vercel/.local/bin/yt-dlp
chmod +x /vercel/.local/bin/yt-dlp

# Add to PATH
export PATH="/vercel/.local/bin:$PATH"

# Verify installation
yt-dlp --version

echo "yt-dlp installed successfully!"
