# PLAN

Notes on deployment and monetization. **Deployment shipped on 2026-04-22 and the section below is now a record of what was done, not a proposal.** Monetization is still forward-looking: planning agreed, no code written, blocked on the user (see that section).

## Deployment

### Current state (verified 2026-10-03)
`.github/workflows/deploy.yml` auto-deploys to GitHub Pages on every push to `main` (and via `workflow_dispatch`). No build step — the repo root is uploaded as the Pages artifact. Static PWA, no backend, and the single-file no-build shape survived the domain move intact: no CI complexity, no preview envs, no CDN.

**Live at `https://cinema-slide.app/`** (custom domain, since 2026-04-22). Measured today:

| Check | Result |
|---|---|
| `https://cinema-slide.app/` | HTTP 200 |
| `https://tri-woods.github.io/slideshow-maker/` | 301 → `https://cinema-slide.app/` |
| `https://www.cinema-slide.app/` | 301 → `https://cinema-slide.app/` |
| `http://cinema-slide.app/` | 301 → HTTPS (Enforce HTTPS is on) |
| Apex DNS | the 4 A + 4 AAAA GitHub Pages addresses from the table below |
| TLS | Let's Encrypt, auto-renewed (current cert issued 2026-08-20) |
| DNSSEC | enabled — DS published, resolver reports AD=true |

The old `tri-woods.github.io/slideshow-maker` origin still serves as a redirect, so old links and old PWA installs keep working.

*This section read "Live at `https://tri-woods.github.io/slideshow-maker/`" and framed the domain work below as a proposal — accurate when written, wrong from 2026-04-22 onward, and left unrevised for the five months after shipping. Corrected 2026-10-03.*

### How the custom domain was set up (shipped 2026-04-22; retained as the record)

**Confirmed domain:** `cinema-slide.app` (confirmed by user 2026-04-22).
- Matches the product name, short, memorable.
- `.app` is HSTS-preloaded — HTTPS-only is enforced at the browser level, which aligns with our Service Worker / WebCodecs requirements anyway.

**Recommended registrar:** Cloudflare Registrar
- At-cost pricing (no markup) — `.app` renews at wholesale (~$15/yr at time of writing).
- Free DNS, DNSSEC, privacy WHOIS, and 2FA by default.
- No upsell friction (vs. Namecheap/GoDaddy).
- *I can pick this unless you prefer Porkbun (similar at-cost, slightly friendlier UI) or you already have a registrar.*

**Subdomain model:** apex-primary with `www` redirect.
- Canonical URL: `https://cinema-slide.app/`
- GitHub Pages issues an automatic `www` → apex redirect when apex is set as the primary custom domain.
- Rationale: shorter canonical, no "do I include www?" ambiguity in marketing; apex still resolves if users type `www.` out of habit.

### Exact DNS records (Cloudflare dashboard → DNS → Records)

| Type | Name | Target | Proxy | TTL |
|---|---|---|---|---|
| A | `@` | `185.199.108.153` | DNS only | Auto |
| A | `@` | `185.199.109.153` | DNS only | Auto |
| A | `@` | `185.199.110.153` | DNS only | Auto |
| A | `@` | `185.199.111.153` | DNS only | Auto |
| AAAA | `@` | `2606:50c0:8000::153` | DNS only | Auto |
| AAAA | `@` | `2606:50c0:8001::153` | DNS only | Auto |
| AAAA | `@` | `2606:50c0:8002::153` | DNS only | Auto |
| AAAA | `@` | `2606:50c0:8003::153` | DNS only | Auto |
| CNAME | `www` | `tri-woods.github.io` | DNS only | Auto |

**Important:** leave all records as "DNS only" (grey cloud), not "Proxied" (orange cloud). Cloudflare proxy in front of GitHub Pages interferes with Pages' Let's Encrypt provisioning and can break Service Worker caching semantics.

Enable **DNSSEC** in Cloudflare (DNS → Settings → DNSSEC → Enable) and paste the DS record into the registrar side of the same dashboard.

### GitHub Pages configuration

1. Add a `CNAME` file at the repo root containing a single line: `cinema-slide.app`. (The existing `actions/upload-pages-artifact@v3` step uploads the repo root, so the file ships automatically — no workflow edit needed.)
2. Repo → Settings → Pages:
   - **Custom domain:** `cinema-slide.app` — save.
   - Wait for the DNS check to pass (green check, usually <5 min after records propagate).
   - **Enforce HTTPS:** tick once the Let's Encrypt cert is issued (typically 15 min – a few hours after DNS check passes).

### HTTPS / certificate notes
- GitHub Pages provisions a Let's Encrypt cert automatically once DNS verifies. Nothing for us to manage.
- `.app` is HSTS-preloaded in Chromium/Firefox/Safari, so any `http://` request is upgraded client-side before hitting the network — we don't need to (and can't meaningfully) serve HTTP.
- If the cert provisioning stalls, the fix is almost always "records are proxied when they shouldn't be" or "stale DNS from a previous owner" — wait for propagation (`dig +short cinema-slide.app`), then toggle the custom domain off/on in Settings → Pages.

### PWA implications

- **`manifest.json` `start_url`** is `./slideshow-maker.html` (relative) — origin-agnostic, no change needed.
- **`scope`** is unset and thus defaults to the manifest's directory — works on any origin. Explicitly setting `"scope": "/"` would slightly tighten PWA install behaviour; optional.
- **Service worker origin-scoping:** SWs are scoped per-origin, so the new `cinema-slide.app` origin gets a fresh SW + fresh cache. No pollution from the old `github.io` origin.
- **Existing PWA installs on `tri-woods.github.io/slideshow-maker`:** the installed app keeps pointing at the old origin forever. If we want to nudge those users over:
  - Bump `CACHE_NAME` from `cinema-slide-v1` to `cinema-slide-v2` — forces the old-origin SW to re-fetch HTML.
  - Add a one-line banner or redirect on the old origin pointing at the new one.
  - *Pre-launch, there are ~zero installed users, so this is almost certainly unnecessary. Flag only if analytics say otherwise.*
- **Absolute-URL audit:** grep for `tri-woods.github.io` across the repo before launch — anything hard-coded needs to either become relative or switch to `cinema-slide.app`. Quick check:
  ```
  grep -rn "tri-woods.github.io\|github.io/slideshow-maker" .
  ```

### Launch checklist (ordered)

**Boxes 2, 3, 6, 7, 8 and 11 were completed on 2026-04-22 but never ticked; reconciled against live measurements 2026-10-03.**

1. [x] Confirm final domain name with user. (cinema-slide.app, 2026-04-22)
2. [x] Register domain on Cloudflare Registrar; enable DNSSEC + 2FA on the Cloudflare account. — domain registered and resolving; DNSSEC confirmed (DS published, AD=true). *Account 2FA not verifiable from here — user to confirm if it matters.*
3. [x] Add DNS records per table above; verify with `dig +short cinema-slide.app` and `dig +short www.cinema-slide.app`. — apex returns exactly the 4 A + 4 AAAA addresses in the table; `www` resolves and 301s to apex.
4. [x] Grep repo for hard-coded `tri-woods.github.io` strings — audit clean (no matches outside PLAN.md).
5. [x] Add `CNAME` file at repo root containing the apex domain. Commit + push.
6. [x] Repo → Settings → Pages: set custom domain, wait for DNS check ✓. — serving under the custom domain.
7. [x] Wait for Let's Encrypt cert (check `curl -sI https://cinema-slide.app/` until it returns 200). — 200; Let's Encrypt cert current, auto-renewing (issued 2026-08-20).
8. [x] Tick **Enforce HTTPS**. — `http://cinema-slide.app/` 301s to HTTPS.
9. [x] Add `canonical` + `og:*` + `twitter:*` meta tags and a 1200×630 `og-image.png` pointing at `https://cinema-slide.app/`.
10. [~] Smoke test on new origin: app loads, SW registers, encode + download works, PWA installs, offline mode works, language toggle persists, analytics localStorage event fires. — **partially automated** by `tests/prod/smoke.spec.ts` (2026-07-14, `npm run test:prod`, 5/5 green): app boot, SW register + activate, full 2-photo export to a `blob:` download, canonical/`og:url` meta. **Still unverified: PWA install, offline mode, language-toggle persistence, the analytics localStorage event** — and the suite is Chromium-only, so iOS Safari and Edge are untested throughout.
11. [x] Test old origin still resolves (unless we intentionally drop it) — GitHub Pages keeps serving `tri-woods.github.io/slideshow-maker` alongside the custom domain by default. — 301 to the new origin, asserted by the prod smoke suite and re-measured 2026-10-03.
12. [~] Update external mentions (portfolio, socials) to the new canonical URL. — GitHub repo description + homepage done; portfolio link and social bios still open. Tracked in `TASKS.md`.

### Decisions that need you vs. defaults I'll pick

*All resolved at launch — kept for the rationale. The defaults below were taken as written.*

**You decide:**
- Whether to keep `.github.io` serving as a mirror post-launch (default: yes, costs nothing).
- Whether to migrate old-origin PWA users (default: skip — pre-launch, no users).
- Whether to add SEO/share meta tags to `index.html` now (`canonical`, `og:url`, `og:image`, `twitter:card`) or defer.

**Defaults I'll pick unless you object:**
- Registrar: Cloudflare Registrar.
- URL shape: apex canonical, `www` redirects to apex.
- DNS: DNS-only (grey cloud) records, DNSSEC on.
- Pages: Enforce HTTPS on, CNAME file committed to the repo (not UI-only, which is fragile).
- No CDN / no preview envs / no build step — preserve the single-file shape.

## Monetization

**Direction:** freemium "Pro unlock" via a one-time payment that emails a license key. Preserves the static-file / no-account feel — no login, no subscription, no server for normal use.

**Status (2026-04-22):** planning agreed, blocked on user setting up a payment provider account. No code written yet.

### Tier split

| | Free | Pro |
|---|---|---|
| Watermark | yes | no |
| Resolution | 720p | 1080p + vertical + square |
| Photo limit | ~30 | 150 |
| BGM library | — | included |
| Transitions | basic set | full set |

### Decided defaults

- **Price:** $9 USD, one-time (not subscription).
- **Payment provider: Lemon Squeezy** (merchant-of-record). Chosen over Stripe because LS handles global VAT/tax — important for a Japan-based seller reaching EU/US customers — and bundles a license-key API that fits the HMAC scheme below. Fee premium (~5% + $0.50/sale vs Stripe's ~3%) buys tax compliance peace-of-mind. Gumroad and Paddle were considered but LS has the cleanest license-key integration.
- **Serverless host:** Cloudflare Workers. Reason: already on CF for DNS/registrar, free tier covers the webhook comfortably, same dashboard.
- **License scheme:** HMAC-signed token `<payload>.<sig>` where payload = random ID + purchase date, sig = HMAC-SHA256 keyed by a secret embedded in the client. Client verifies offline, no round-trips at runtime, resilient to backend downtime. Accepted loss: no per-install revocation.
- **Delivery:** LS hosted checkout → success page shows the key + "we've also emailed it." Webhook also sends the email (LS sends one automatically; we can supplement if needed).
- **Watermark lever:** the existing 1.5s watermark card in `slideshow-maker.html` (see `renderSingleLayer` 'watermark' branch) is the free-tier gate; Pro should skip it in `buildTimeline`.

### Blocking step (user)

User needs to sign up for Lemon Squeezy (~15 min: legal name, bank account, ID photo), create a product titled "CINEMA SLIDE Pro" at $9, enable license keys for it, and share:
- Product ID / variant ID
- LS store subdomain (for checkout URLs)
- Webhook signing secret (from LS dashboard)
- Any API key LS exposes for license-key verification

### Implementation plan (once unblocked)

1. **License verifier in the client** (`slideshow-maker.html`): parse `?license=<token>` on load → verify HMAC → store in `localStorage` as `cinema-slide-pro`. Add an "Enter license" modal behind a "Pro" button in header. No network call.
2. **Feature gating:** check `isPro()` before each Pro feature — uncap photos (150), expose 1080p/vertical/square in resolution dropdown, skip watermark segment in `buildTimeline`, unhide BGM library UI (not built yet), enable full transition set. Keep one function `isPro()` so the gate stays centralized.
3. **"Upgrade" CTA:** inline prompts when a user hits a free-tier ceiling (e.g. tries to add a 31st photo, selects 1080p) → modal with screenshot + LS buy link.
4. **Cloudflare Worker** (`worker/license.ts`, new): receives LS webhook on `order_created`, validates LS signature, generates an HMAC token, returns it. LS email template can include `{{custom_data.license}}` to deliver to buyer. Worker secrets: `LS_WEBHOOK_SECRET`, `LICENSE_HMAC_SECRET`.
5. **Local dev:** Worker runnable via `wrangler dev`; app continues to live as a static file with no build step.

### Accepted tradeoffs

- Breaks the "single HTML file, no backend" elegance for the payment/license flow only. The Worker is out-of-band; the app itself stays single-file.
- Client-side license verification is trivially bypassable. Treated as honor-system DRM — not worth overengineering anti-piracy.
- HMAC scheme means we can't revoke a specific license if it leaks. If that becomes a real problem, swap to a JWT with a small online validation endpoint later.
