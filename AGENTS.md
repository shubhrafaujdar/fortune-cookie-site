# AGENTS.md

## Project Overview
A fortune cookie web application (`fortune-cookie`) with static frontend assets and Node.js/Firebase helper scripts.

## Key Files
- `index.html`, `privacy-policy.html`, `terms-of-service.html` — Static HTML pages
- `script.js`, `style.css` — Frontend logic and styling
- `fortunes.json` — Fortune data
- `scripts/upload_fortunes.js` — Script to upload fortunes (uses `firebase-admin`)
- `package.json` — Project metadata, dependencies (`express`, `firebase-admin`), and npm scripts

## Commands
- `npm start` — Runs `node server.js`
- `npm run upload-fortunes` — Runs `node scripts/upload_fortunes.js`

## Conventions
- Keep static frontend assets (`index.html`, `script.js`, `style.css`) clean and self-contained.
- Never commit credentials, service account keys, or `.env` files.
