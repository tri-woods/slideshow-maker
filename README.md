# CINEMA SLIDE

**Turn your photos into cinematic slideshows — entirely in your browser.**
写真から、映画のようなスライドショーを。ブラウザだけで完結します。

[**cinema-slide.app**](https://cinema-slide.app/) · no account · no upload · free

Pick up to 150 photos, choose a transition and a resolution, add music if you
like, and CINEMA SLIDE encodes an H.264 MP4 and hands it back as a download.
The photos never leave your device: encoding runs locally through the
[WebCodecs API](https://developer.mozilla.org/docs/Web/API/WebCodecs_API), and
there is no backend to upload them to.

---

## Features

- **Up to 150 photos** — JPEG, PNG, HEIC
- **Transitions** — fade to black, crossfade (dissolve), slide, wipe
- **Ken Burns** — slow pan and zoom on each photo
- **Per-photo duration** — override the global timing photo by photo
- **Title and credits cards** — opening and closing text
- **Background music** — add an audio file; it is mixed into the MP4
- **Output** — 480p, 720p, 1080p, square 1:1, or vertical 9:16, at 24 or 30 fps
- **Bilingual UI** — Japanese and English, switchable in-app
- **Installable PWA** — works offline once loaded

Exports end with a short CINEMA SLIDE card.

## Privacy

Photos, audio, and the rendered video are processed in the browser and never
uploaded — there is no server to upload them to. Settings and profiles are kept
in `localStorage` on your own device.

Two things *are* fetched over the network when the page loads: the
[mp4-muxer](https://www.npmjs.com/package/mp4-muxer) library from a CDN, and web
fonts from Google Fonts. Neither receives your photos. See
[privacy.html](privacy.html) and [terms.html](terms.html) for the full policies
(both bilingual).

**You are responsible for the rights to the photos and music you use.** The app
does not check them.

## Browser support

Video export needs the WebCodecs `VideoEncoder` and an H.264 encoder. It is
developed and tested against Chrome/Edge and Safari 17+ (iOS and macOS).

The app feature-detects rather than sniffing user agents: if `VideoEncoder` is
absent or H.264 is unavailable it says so instead of failing silently, and if
`AudioEncoder` is missing it exports the video without music and tells you.

## Running it locally

No build step. Any static file server works:

```bash
npm install          # only needed for the test suite
npm run serve        # python3 -m http.server 8080
# open http://localhost:8080
```

Opening `slideshow-maker.html` straight off the filesystem will not work — the
service worker and module imports need an `http://` origin.

## Tests

```bash
npx playwright install   # first time
npm test                 # end-to-end suite against localhost
npm run test:prod        # 5 smoke tests against the live site
```

The local suite is 65 tests run across three profiles — Chromium, WebKit, and
an iPhone 15 — so `npm test` reports 195. The prod smoke suite is Chromium-only
and hits the live site, so it needs no local server. See [TESTING.md](TESTING.md) for the layout and
for what each spec covers.

## Project layout

```
index.html             Landing page (bilingual)
slideshow-maker.html   The entire app — markup, styles, and logic in one file
sw.js                  Service worker (offline caching)
manifest.json          PWA manifest
privacy.html           Privacy policy (bilingual)
terms.html             Terms of service (bilingual)
tests/                 Playwright suites; tests/prod/ runs against production
```

The single-file app is deliberate: no bundler, no framework, no build. Changes
go straight into `slideshow-maker.html`.

## Deployment

`.github/workflows/deploy.yml` publishes the repo root to GitHub Pages on every
push to `main`. The `CNAME` file pins the custom domain, and the old
`tri-woods.github.io/slideshow-maker` origin redirects to it. Details and the
launch record are in [PLAN.md](PLAN.md).

## License

[MIT](LICENSE). Third-party components and their licenses are listed in
[ATTRIBUTIONS.md](ATTRIBUTIONS.md).
