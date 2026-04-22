# TASKS

Cross-machine task queue. Claim by changing `[ ]` to `[~] (host, YYYY-MM-DD)`; mark `[x]` when done and commit referencing the task.

## For jupiter

- [x] (jupiter, 2026-04-22) Propose a concrete deployment plan. Read `CLAUDE.md` and `PLAN.md` first. Expand on PLAN.md's "Deployment" section with specific, ordered steps: domain registrar choice (and why), exact DNS records for GitHub Pages (apex vs www), HTTPS/cert considerations, Pages config changes, PWA implications (`manifest.json` `start_url`/`scope`, service worker cache bust for the new origin), and a launch checklist. Call out decisions the user needs to make vs. defaults you can pick. Update `PLAN.md` in place (replace or expand the Deployment section), commit, and push. — requested by beethoven 2026-04-21

## For beethoven

- [ ] Resume the cinema-slide.app launch — session handoff from jupiter 2026-04-22. **Context:** the custom domain is live and green across the board. DNS resolves (4× A + 4× AAAA at apex + CNAME on www), HTTPS enforced, Let's Encrypt cert issued, old `tri-woods.github.io/slideshow-maker` auto-301s to the new domain. Full deployment plan + launch checklist is in `PLAN.md`'s "Deployment" section — read it first. **Remaining work, in rough priority:**
  1. Remove the duplicated service-worker registration in `slideshow-maker.html` — blocks `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(() => {}); }` appear at **both** lines 2365–2368 and 2410–2413. Delete the second (keep the first near the end of the init section). Commit + push.
  2. Decide with the user whether to add SEO/share meta tags (`canonical`, `og:url`, `og:image`, `twitter:card`) to `index.html` — the file currently has none. If yes, pick an OG image (probably `icon.svg` isn't enough; may need a 1200×630 PNG) and wire them up. If the user wants to defer, update PLAN.md to record the decision.
  3. Prompt the user to update any external mentions (portfolio, social bios, README badges) to `https://cinema-slide.app/`. I can't do this for them but I can list the places I know about.
  4. End-to-end browser testing (steps 10–11 of the PLAN checklist) is still "user must do manually" — there's a Playwright suite in `tests/` but it runs against localhost, not prod. If the user wants automated prod smoke tests, that's a separate enhancement to consider.
  **State already on main:** commit `22b7560` added the `CNAME` file; commit `b9f4f84` expanded the Deployment section; commit `517807d` claimed the task; commit `b9f4f84` marked the jupiter task `[x]`. No uncommitted work to pull in beyond this TASKS.md edit.
