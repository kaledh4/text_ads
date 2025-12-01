# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands
From `package.json`:

- `npm install` - Install dependencies (js-yaml, sqlite3, dotenv).
- `npm run generate` (or `node generator.js`) - AI-generate and update daily ads in YAML files and SQLite DB (`ads_history.db`).

No build, lint, or test scripts. Serve statically (e.g., `npx serve .` or GitHub Pages). GitHub Actions (`daily_ads.yml`) runs `npm ci && node generator.js` daily via cron.

## Code Architecture
Static Progressive Web App (PWA) displaying daily Taklifa platform ads for X (Twitter: 8/day), Instagram (4/day), and TikTok (4 video scripts/day). Fully client-side, serverless, Arabic RTL-first (Cairo font), mobile-responsive.

**Big-Picture Flow**:
1. **Daily Update** (GitHub Actions cron): `generator.js` (Node.js) uses AI (OpenRouter?) to generate ads, updates `ads_*.yaml` and `ads_history.db` (SQLite: tracks history to prevent repeats), commits/pushes to `main`.
2. **Client Runtime**: `index.html` loads `script.js` → Parses YAML ads (js-yaml CDN) → Renders tabbed UI (X/IG/TikTok) → Copy-to-clipboard, AI image generation (Pollinations.ai API + logo overlay via Canvas), localStorage for session history. PWA features: offline caching (`service-worker.js`), installable (`manifest.json`).

**Key Concerns**:
- Preserve `ads_history.db` (94KB+ analytics; docs warn NEVER delete).
- YAML structure: Platform-specific (X: text/hashtags; TikTok: JSON scenes).
- Static deploy: GitHub Pages (`https://username.github.io/VIDEOADS`).

**Structure** (flat, no src/):
- UI: `index.html`, `script.js` (18KB core logic), `style.css` (17KB RTL/themes).
- Data: `ads_*.yaml` (daily sources), `ads_history.db`.
- Generator: `generator.js` (13KB Node CLI).
- PWA: `manifest.json`, `service-worker.js`, `icons/`.
- Docs: `README.md` (deploy guide), `docs/` (Arabic platform/DB details).

No frameworks/tests/bundlers. Edits: Update YAML → `npm run generate` → Commit → Deploy.