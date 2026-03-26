# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"CINEMA SLIDE" — a browser-based photo slideshow-to-MP4 video maker. The entire application is a single self-contained HTML file (`slideshow-maker.html`) with no build system, no dependencies to install, and no tests. The UI is in Japanese.

## How to Run

Open `slideshow-maker.html` directly in a browser. No server required. Requires a browser with WebCodecs API support (Safari 17+, Chrome 94+).

## Architecture

The app is a single HTML file containing inline CSS and a JavaScript ES module. There is no build step.

### Three-Screen Flow
1. **Setup** (`screen-setup`): Photo upload (up to 150 images), title/subtitle/credits input, slideshow settings (duration, fade, resolution)
2. **Encoding** (`screen-encoding`): Real-time canvas rendering + H.264 encoding via WebCodecs API
3. **Done** (`screen-done`): Video preview and MP4 download

### Key Technical Details
- **Video encoding**: Uses the browser's WebCodecs `VideoEncoder` API (H.264/AVC) — not FFmpeg or wasm
- **MP4 muxing**: Dynamically imports `mp4-muxer` from CDN (`cdn.jsdelivr.net` with `esm.sh` fallback)
- **Rendering pipeline**: Builds a timeline of segments (title card → photos with fade transitions → credits card), renders each frame to a `<canvas>`, then feeds `VideoFrame` objects to the encoder with back-pressure control (queue limit of 30)
- **Image scaling**: Uses `drawImageCover` which fits images maintaining aspect ratio (contain, not cover, despite the name)
- **Resolution options**: 480p / 720p (default) / 1080p; FPS is fixed at 15
- **Fonts**: Google Fonts loaded externally — Playfair Display (serif, for titles) and IBM Plex Mono (monospace, for UI and credits)
