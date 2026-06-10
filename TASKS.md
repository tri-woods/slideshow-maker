# TASKS

Cross-machine task queue. Claim by changing `[ ]` to `[~] (host, YYYY-MM-DD)`; mark `[x]` when done and commit referencing the task.

## For jupiter

- [ ] Implement Pro unlock once user is unblocked. Read `PLAN.md` → "Monetization" first (tier split, decided defaults, implementation plan are all there). **Blocked on user** providing Lemon Squeezy product ID, store subdomain, webhook secret, and license-key API key after they sign up (~15 min: LS signup + create "CINEMA SLIDE Pro" product at $9 with license keys enabled). Once unblocked, work the "Implementation plan (once unblocked)" list in PLAN.md in order — client license verifier + feature gates + upgrade CTA + Cloudflare Worker for the webhook. Keep one `isPro()` function as the single gate. No rush — launch is already live; this is revenue work. — requested by beethoven 2026-04-22

- [x] (jupiter, 2026-04-22) Propose a concrete deployment plan. Read `CLAUDE.md` and `PLAN.md` first. Expand on PLAN.md's "Deployment" section with specific, ordered steps: domain registrar choice (and why), exact DNS records for GitHub Pages (apex vs www), HTTPS/cert considerations, Pages config changes, PWA implications (`manifest.json` `start_url`/`scope`, service worker cache bust for the new origin), and a launch checklist. Call out decisions the user needs to make vs. defaults you can pick. Update `PLAN.md` in place (replace or expand the Deployment section), commit, and push. — requested by beethoven 2026-04-21

## For beethoven

- [x] (beethoven, 2026-04-22) Resume the cinema-slide.app launch — session handoff from jupiter 2026-04-22. Custom domain live and green across the board: DNS resolves (4× A + 4× AAAA at apex + CNAME on www), HTTPS enforced, Let's Encrypt cert issued, old `tri-woods.github.io/slideshow-maker` auto-301s to the new domain. Deployment plan + launch checklist in `PLAN.md`'s "Deployment" section. State on main: `22b7560` (CNAME file), `b9f4f84` (expanded Deployment section + marked jupiter task `[x]`), `517807d` (task claim). The four follow-ups originally tracked inline under this item have been promoted to standalone tasks below (2 done, 2 open).

- [x] (beethoven, 2026-04-22) Remove the duplicated service-worker registration in `slideshow-maker.html`. **Done** in `4700a7a` — a single `navigator.serviceWorker.register('./sw.js')` now remains (around line 2400). (Promoted from launch follow-up #1.)

- [x] (beethoven, 2026-04-22) Add SEO/share meta tags to `index.html` (`canonical`, `og:url`, `og:image`, `twitter:card`) + a 1200×630 OG image. **Done** in `199dc5b` (tags + initial OG image), refined in `fa11195` (replaced with the user's designed `og-image.png`). Tags reference `https://cinema-slide.app/og-image.png`. (Promoted from launch follow-up #2.)

- [ ] Prompt the user to update external mentions of the project (portfolio, social bios, README badges, any lingering `tri-woods.github.io/slideshow-maker` links) to `https://cinema-slide.app/`. Claude can't edit those external surfaces, but can enumerate the ones it knows about and draft replacement text. (Promoted from launch follow-up #3.)

- [ ] Optional: prod smoke tests. The Playwright suite in `tests/` runs against localhost only — PLAN checklist steps 10–11 remain "user must do manually". If wanted, add a prod-targeted smoke-test config (load `cinema-slide.app`, assert the app boots, the service worker registers, and a basic export path works) as a separate enhancement; otherwise record the decision to defer in `PLAN.md`. (Promoted from launch follow-up #4.)
