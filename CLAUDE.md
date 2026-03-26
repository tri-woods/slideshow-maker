# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"CINEMA SLIDE" — a browser-based photo slideshow-to-MP4 video maker. The entire application is a single self-contained HTML file (`slideshow-maker.html`) with no build system, no package manager, no dependencies to install, and no tests. The UI is in Japanese.

## How to Run

Open `slideshow-maker.html` directly in a browser. No server required. Requires a browser with WebCodecs API support (Safari 17+, Chrome 94+).

There is no build step, no linter, no formatter, and no test suite. Validation is done by opening the file in a browser and testing manually.

## Architecture

The app is a single ~1000-line HTML file containing inline CSS (`<style>`) and a JavaScript ES module (`<script type="module">`). There is no build step.

### File Structure

```
slideshow-maker.html   # The entire application (HTML + CSS + JS)
CLAUDE.md              # This file
```

### Three-Screen Flow
1. **Setup** (`screen-setup`): Photo upload (up to 150 images), title/subtitle/credits input, slideshow settings (duration, fade, resolution)
2. **Encoding** (`screen-encoding`): Real-time canvas rendering + H.264 encoding via WebCodecs API
3. **Done** (`screen-done`): Video preview and MP4 download

### HTML Structure (lines 334–472)

- Fixed `<header>` with logo and step-indicator pills (`pill-1`, `pill-2`, `pill-3`)
- Three `.screen` divs toggled via the `visible` class: `screen-setup`, `screen-encoding`, `screen-done`
- An `#error-toast` div for transient error messages

### CSS (lines 10–332)

- Dark cinema-themed design with CSS custom properties in `:root` (gold accent `#d4a853`, dark backgrounds)
- Two font families: `--serif` (Playfair Display) for titles, `--mono` (IBM Plex Mono) for UI and credits
- Responsive layout: max-width 680px, `clamp()` for title sizing
- Mobile-optimized: `-webkit-tap-highlight-color`, touch-friendly targets, iOS PWA meta tags

### JavaScript Module (lines 474–1002)

#### State (lines 476–492)
- `photos[]` — raw `File` objects from user upload
- `images[]` — preloaded `HTMLImageElement` objects (parallel loading, concurrency limit of 8)
- `settings` — object with `title`, `subtitle`, `credits`, `photoDuration` (default 3s), `fadeDuration` (default 0.8s), `width`, `height`, `fps` (fixed at 15)
- `encodingAborted` / `activeEncoder` — cancellation state

#### Key Functions

| Function | Lines | Purpose |
|---|---|---|
| `showScreen(name)` | 515–527 | Toggles between setup/encoding/done screens and updates pills |
| `handleFiles(files)` | 530–537 | Validates image files (max 150), stores in `photos[]` |
| `renderThumbs()` | 556–577 | Shows thumbnail grid (max 30 shown + overflow count) |
| `buildTimeline()` | 629–649 | Creates segment array: title card → photo slides with fades → credits card |
| `getFrameInfo(timeline, time)` | 651–670 | Binary search to find which segment a timestamp falls in; calculates fade alpha |
| `renderFrame(info)` | 673–693 | Dispatches canvas drawing based on segment type (photo/title/credits) |
| `drawImageCover()` | 695–700 | Scales image to fit canvas maintaining aspect ratio (contain mode, not cover) |
| `drawTitleCard()` | 702–744 | Renders title card with gradient, gold lines, title text, subtitle |
| `drawCreditsCard()` | 746–773 | Renders credits card with "FIN" text and credit lines |
| `wrapText()` | 775–786 | Word-wrapping helper for canvas text |
| `preloadImages()` | 789–816 | Loads all photos as Image elements in parallel batches of 8 |
| `runExport()` | 819–984 | Main encoding pipeline (see below) |

#### Encoding Pipeline (`runExport`, lines 819–984)

1. **WebCodecs check** — verifies `VideoEncoder` exists in browser
2. **Dynamic import** of `mp4-muxer` v5 from CDN (`cdn.jsdelivr.net` primary, `esm.sh` fallback)
3. **Image preloading** — parallel with concurrency limit of 8
4. **Font loading** — ensures Google Fonts are ready via `document.fonts`
5. **Cover image generation** — renders title card to a small 640x360 canvas, converts to JPEG bytes for MP4 cover art
6. **Muxer setup** — `mp4-muxer` with `ArrayBufferTarget` and `fastStart: 'in-memory'`
7. **Codec config** — H.264 (`avc1.42001f`), bitrate scales with resolution (900k/1.8M/3.5M), `latencyMode: 'quality'`
8. **Frame-by-frame encoding loop** — renders each frame to canvas, creates `VideoFrame`, encodes with back-pressure (queue limit 30), keyframes every 5 seconds, UI updates every 6 frames
9. **Finalization** — flushes encoder, finalizes muxer, creates blob URL for download

### Key Technical Details

- **Video encoding**: Uses the browser's WebCodecs `VideoEncoder` API (H.264/AVC) — not FFmpeg or wasm
- **MP4 muxing**: Dynamically imports `mp4-muxer` from CDN (`cdn.jsdelivr.net` with `esm.sh` fallback)
- **Rendering pipeline**: Builds a timeline of segments (title card → photos with fade transitions → credits card), renders each frame to a `<canvas>`, then feeds `VideoFrame` objects to the encoder with back-pressure control (queue limit of 30)
- **Render optimization**: Skips canvas re-render when the same content is at full opacity (hold portion of a segment)
- **Image scaling**: Uses `drawImageCover` which fits images maintaining aspect ratio (contain, not cover, despite the name)
- **Resolution options**: 480p (854x480) / 720p (1280x720, default) / 1080p (1920x1080); FPS is fixed at 15
- **Fonts**: Google Fonts loaded externally — Playfair Display (serif, for titles) and IBM Plex Mono (monospace, for UI and credits)
- **Drag and drop**: Upload zone supports both click-to-select and drag-and-drop file input
- **Memory management**: Object URLs are revoked after use (`URL.revokeObjectURL`); thumbnails limited to 30

## Development Conventions

- **Single-file architecture**: All changes go in `slideshow-maker.html`. Do not split into separate files.
- **No external dependencies** other than Google Fonts and the CDN-loaded `mp4-muxer`. Do not add npm packages or a build system.
- **UI language**: All user-facing strings are in Japanese. Keep new UI text in Japanese.
- **DOM access**: Uses a simple `$(id)` helper (line 512) instead of a framework. No jQuery.
- **CSS**: Uses CSS custom properties for theming. Follow the existing naming conventions (`--bg`, `--gold`, `--text-dim`, etc.).
- **Error handling**: User-facing errors shown via `showError()` which displays a toast for 5 seconds. Console errors for debugging.
- **Cancellation**: The encoding loop checks `encodingAborted` flag each iteration and returns early if set.
