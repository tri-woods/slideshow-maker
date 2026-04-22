# PLAN

Forward-looking notes on deployment and monetization. Not yet committed to — these are working directions, open to revision.

## Deployment

### Current state
`.github/workflows/deploy.yml` auto-deploys to GitHub Pages on every push to `main` (and via `workflow_dispatch`). No build step — the repo root is uploaded as the Pages artifact. Live at `https://tri-woods.github.io/slideshow-maker/`. Static PWA, no backend. The single-file, no-build shape is a feature worth preserving; the plan below adds a domain without adding CI complexity or preview envs.

### Proposed next step: custom domain on Cloudflare Registrar

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

1. [x] Confirm final domain name with user. (cinema-slide.app, 2026-04-22)
2. [ ] Register domain on Cloudflare Registrar; enable DNSSEC + 2FA on the Cloudflare account.
3. [ ] Add DNS records per table above; verify with `dig +short cinema-slide.app` and `dig +short www.cinema-slide.app`.
4. [x] Grep repo for hard-coded `tri-woods.github.io` strings — audit clean (no matches outside PLAN.md).
5. [x] Add `CNAME` file at repo root containing the apex domain. Commit + push.
6. [ ] Repo → Settings → Pages: set custom domain, wait for DNS check ✓.
7. [ ] Wait for Let's Encrypt cert (check `curl -sI https://cinema-slide.app/` until it returns 200).
8. [ ] Tick **Enforce HTTPS**.
9. [x] Add `canonical` + `og:*` + `twitter:*` meta tags and a 1200×630 `og-image.png` pointing at `https://cinema-slide.app/`.
10. [ ] Smoke test on new origin: app loads, SW registers, encode + download works, PWA installs, offline mode works, language toggle persists, analytics localStorage event fires.
11. [ ] Test old origin still resolves (unless we intentionally drop it) — GitHub Pages keeps serving `tri-woods.github.io/slideshow-maker` alongside the custom domain by default.
12. [ ] Update external mentions (portfolio, socials) to the new canonical URL.

### Decisions that need you vs. defaults I'll pick

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

**Direction:** freemium "Pro unlock" via a one-time Stripe payment that emails a license key. Preserves the static-file / no-account feel — no login, no subscription, no server for normal use.

**Proposed tier split:**

| | Free | Pro |
|---|---|---|
| Watermark | yes | no |
| Resolution | 720p | 1080p + vertical + square |
| Photo limit | ~30 | 150 |
| BGM library | — | included |
| Transitions | basic set | full set |

**Implementation sketch:** Stripe Payment Link → tiny serverless webhook → emailed license key → client-side check unlocks Pro features. The existing 1.5s watermark card is the free-tier lever; Pro should cleanly skip it.

**Accepted tradeoffs:**
- Breaks the "single HTML file, no backend" elegance for the payment/license flow only.
- Client-side license verification is trivially bypassable. Treated as honor-system DRM — not worth overengineering anti-piracy.
