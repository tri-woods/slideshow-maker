# TESTING.md — CINEMA SLIDE Test Suite

## Overview

This project uses [Playwright](https://playwright.dev/) for end-to-end testing. Tests are organized by feature area and cover the core user flows.

## Test Structure

```
tests/
├── fixtures/
│   ├── test-photo-1.png    # Red test image (320x240)
│   ├── test-photo-2.png    # Green test image
│   ├── test-photo-3.png    # Blue test image
│   ├── test-photo-4.png    # Yellow test image
│   ├── test-photo-5.png    # Purple test image
│   └── invalid-file.txt    # Non-image file for validation tests
├── photo-upload.spec.ts    # Photo upload, management, reordering, deletion
├── settings.spec.ts        # Title/credits, slideshow settings, audio, profile system
├── export-flow.spec.ts     # Export button state, encoding flow, cancel, done screen
└── i18n-responsive.spec.ts # Language switching, legal links, responsive layout, a11y
```

## MacBook Setup (First Time)

### Prerequisites
- Node.js 18+ (install via `brew install node` or `nvm`)
- Python 3 (for local dev server — usually pre-installed on macOS)

### Install

```bash
cd ~/project/slideshow-maker
npm install
npx playwright install
```

This installs Playwright and downloads Chromium, WebKit, and Firefox browsers.

## Running Tests

### Run all tests (headless)
```bash
npm test
```

### Run with visible browser
```bash
npm run test:headed
```

### Run with Playwright UI (interactive)
```bash
npm run test:ui
```

### Run with debugger (step through)
```bash
npm run test:debug
```

### Run a single test file
```bash
npx playwright test tests/photo-upload.spec.ts
```

### Run tests for a specific browser only
```bash
npx playwright test --project=chromium
npx playwright test --project=webkit
npx playwright test --project=mobile-safari
```

### View test report
```bash
npx playwright show-report
```

## Browser Coverage

| Project | Browser | Use Case |
|---------|---------|----------|
| `chromium` | Desktop Chrome | Primary desktop browser |
| `webkit` | Desktop Safari | macOS Safari compatibility |
| `mobile-safari` | iPhone 15 (Safari) | Primary mobile target |

## How the Dev Server Works

Playwright is configured to automatically start a local HTTP server (`python3 -m http.server 8080`) before running tests. You don't need to start it manually.

If port 8080 is already in use, either stop the existing process or change the port in `playwright.config.ts`.

## Writing New Tests

### Convention
- One spec file per feature area
- Use `test.describe()` to group related tests
- Use `test.beforeEach()` for common setup (upload photos, navigate to page)
- Use fixture images from `tests/fixtures/`
- Set generous timeouts for export tests (`test.setTimeout(120_000)`)

### Selectors
Key element IDs used across tests:

| ID | Element |
|----|---------|
| `#screen-setup` | Setup screen (Screen 1) |
| `#screen-encoding` | Encoding screen (Screen 2) |
| `#screen-done` | Done screen (Screen 3) |
| `#file-input` | Initial photo file input |
| `#file-input-add` | Add more photos file input |
| `#upload-zone` | Drag-drop upload area |
| `#thumbnail-area` | Photo thumbnail container |
| `#thumbs-grid` | Thumbnail grid |
| `#photo-count-label` | "N photos" counter |
| `#btn-export` | Export/create video button |
| `#btn-cancel` | Cancel encoding button |
| `#btn-back-settings` | Return to settings from done screen |
| `#btn-restart` | Start over from done screen |
| `#download-link` | Download MP4 link |
| `#result-video` | Video preview element |
| `#error-toast` | Error notification toast |
| `#profile-overlay` | Profile modal overlay |
| `#btn-lang` | Language toggle button |
| `#lang-menu` | Language dropdown menu |

---

## Playwright MCP (Interactive Testing with Claude Code)

For interactive, exploratory testing with Claude Code, set up Playwright MCP:

### Install MCP Server
```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

### For local file access (optional)
```bash
claude mcp add playwright npx '@playwright/mcp@latest' -- --allow-unrestricted-file-access
```

### Usage
Once configured, ask Claude Code to test the app interactively:
```
Use playwright to test the slideshow maker at http://localhost:8080/slideshow-maker.html.
Upload test photos, configure settings, and verify the export flow works.
```

Claude will control a visible browser in real-time, using accessibility tree snapshots to navigate and verify the app.

### When to Use MCP vs Scripts
| Scenario | Use |
|----------|-----|
| Automated regression testing (CI/CD) | `npm test` (Playwright scripts) |
| Exploratory testing, debugging | Playwright MCP with Claude Code |
| Visual verification, new feature QA | Playwright MCP with Claude Code |
| Pre-commit sanity check | `npm test` (Playwright scripts) |
