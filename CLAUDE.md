# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"CINEMA SLIDE" — a browser-based photo slideshow-to-MP4 video maker. The entire application is a single self-contained HTML file (`slideshow-maker.html`) with supporting PWA files. No build system, no dependencies to install, and no tests. The UI supports English and Japanese with a language toggle.

## How to Run

Open `slideshow-maker.html` directly in a browser or serve it from a web server. Requires a browser with WebCodecs API support (Safari 17+, Chrome 94+). For PWA/offline support, serve via HTTPS or localhost.

## File Structure

- `slideshow-maker.html` — Main application (~2284 lines, inline CSS + JS ES module)
- `index.html` — Marketing landing page (bilingual JP/EN, links to the app)
- `manifest.json` — PWA web app manifest
- `sw.js` — Service worker for offline caching
- `icon.svg` — App icon (SVG, used by PWA manifest and apple-touch-icon)

## Architecture

The app is a single HTML file containing inline CSS and a JavaScript ES module. There is no build step.

### Three-Screen Flow
1. **Setup** (`screen-setup`): Photo upload (up to 150 images), title/subtitle/credits input, slideshow settings (duration, fade, transitions, resolution, FPS, Ken Burns, audio)
2. **Encoding** (`screen-encoding`): Real-time canvas rendering + H.264 encoding via WebCodecs API
3. **Done** (`screen-done`): Video preview, download, and options to go back to settings or start fresh

### Key Technical Details
- **Video encoding**: Uses the browser's WebCodecs `VideoEncoder` API (H.264/AVC) — not FFmpeg or wasm
- **MP4 muxing**: Dynamically imports `mp4-muxer` from CDN (`cdn.jsdelivr.net` with `esm.sh` fallback)
- **Audio**: Optional BGM via AudioEncoder API (AAC), decoded with AudioContext, resampled via OfflineAudioContext
- **Rendering pipeline**: Builds a timeline of segments (title card → photos with transitions → credits card → watermark), renders each frame to a `<canvas>`, then feeds `VideoFrame` objects to the encoder with back-pressure control (queue limit of 30)
- **Image loading**: Lazy sliding-window approach — only ~5 images loaded at a time, distant images evicted to keep memory under ~56 MB even with 150 photos
- **Image scaling**: Uses `drawImageContain` which fits images maintaining aspect ratio (contain, not cover). Browser auto-applies EXIF orientation — no manual rotation needed
- **Transitions**: Fade-to-black, crossfade (dissolve), slide (left/right), wipe (clip rect reveal)
- **Ken Burns**: Optional slow pan/zoom effect (1.0→1.08x scale with alternating pan direction)
- **Resolution options**: 480p / 720p (default) / 1080p / 1:1 square / 9:16 vertical; FPS selectable (12/15/24/30)
- **Codec levels**: H.264 level auto-derived from resolution (Level 3.0 for 480p, 3.1 for 720p, 4.0 for 1080p+)
- **Fonts**: Google Fonts loaded externally — Playfair Display (serif, for titles) and IBM Plex Mono (monospace, for UI and credits)

### i18n
- Translation object `i18n` with `ja` and `en` keys containing ~80 strings
- `t(key)` function for lookups, `applyLanguage()` updates all `data-i18n` attributes
- Language selector dropdown (🌐 globe button) in header, persisted to localStorage
- Extensible: add new languages by adding to `i18n` object and a menu-item in the HTML

### Photo Management
- Drag-to-reorder via arrow buttons (◀ ▶) on thumbnails
- Remove individual photos via ✕ button on thumbnails
- Add more photos without replacing existing selection
- Per-photo duration overrides via clickable badges on thumbnails
- Parallel arrays: `photos[]`, `images[]`, `durations[]`, `orientations[]`

### Profile System
- User preferences (name, default duration/fade/resolution/fps) saved to localStorage
- Profile modal accessible via header button
- Auto-fills credits with profile name

### PWA
- `manifest.json` with standalone display mode
- `sw.js` service worker: network-first for HTML, cache-first for assets
- Installable to iOS home screen

### Analytics
- Privacy-respecting, local-first event tracking via `trackEvent()`
- Events stored in localStorage (capped at 200): page_view, photos_selected, export_start, export_complete, export_cancel, lang_change

### Watermark
- 1.5-second branded card ("CINEMA SLIDE" + URL) appended at end of every export
- Playfair Display font, gold color, fade in/out

### Error Handling
- Encoder errors propagate via `encodingError` variable checked each frame
- Export button debounced with `exporting` flag + disabled state
- Blob URLs properly revoked on restart
- Corrupt images silently become null (black frame fallback)
- CDN fallback from jsdelivr to esm.sh for mp4-muxer

### Accessibility
- Error toast: `role="alert"`, `aria-live="assertive"`
- Profile modal: `role="dialog"`, `aria-modal`, Escape key to close
- Form labels associated via `for` attributes
- `prefers-reduced-motion` support (disables transitions)
- File input has `aria-label`
