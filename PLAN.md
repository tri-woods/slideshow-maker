# PLAN

Forward-looking notes on deployment and monetization. Not yet committed to — these are working directions, open to revision.

## Deployment

**Today:** `.github/workflows/deploy.yml` auto-deploys to GitHub Pages on every push to `main` (and via manual `workflow_dispatch`). No build step — the repo root is uploaded as the Pages artifact. Static PWA, no backend.

**Next step:** register a custom domain (e.g. `cinema-slide.app`) for branding and shareability. No CI complexity or preview envs planned — the single-static-file nature is a feature worth preserving.

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
