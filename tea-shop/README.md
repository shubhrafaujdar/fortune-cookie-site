# The Little Fortune Shop

A tiny watercolor tea shop on a rainy evening. Touch the jar, follow the paper
fortune as it floats out, crack open the cookie and unfold the little message
meant for you. Two free cookies for visitors, five a day for members.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/ (relative paths, host anywhere)
npm run lint
```

## How it fits together

| Path | What lives there |
| --- | --- |
| `src/App.jsx` | Wires the shop, the ritual, panels and whispers together |
| `src/components/ShopScene.jsx` | The painted stage: background, rain, lantern glow, counter props, jar, hotspots |
| `src/components/FortuneRitual.jsx` | Jar → floating scroll → cookie → crack → unfolding paper sequence |
| `src/components/FortunePaper.jsx` | Paper styles by rarity (gold leaf, hanko seal, pressed-flower stamp) |
| `src/components/Hud.jsx` | Title, category tags on a cord, lantern (About), hanging account plaque, journal book, sound icons |
| `src/components/Panels.jsx` | Fortune Journal, Sign in with Google / Account, Back-at-midnight, About |
| `src/components/Atmosphere.jsx` | Rain on the window, lantern flicker, steam, falling petals |
| `src/hooks/useFortuneShop.js` | Free and daily cookie counts, journal, unopened cookie, sound on/off |
| `src/hooks/useAuth.js`, `src/lib/auth.js` | Google sign-in (Firebase) |
| `src/hooks/useStageLayout.js` | Scales the 1412×928 painting to any screen (taller phones get a blurred backdrop) |
| `src/lib/audio.js`, `src/lib/share.js` | The cookie-crack sound; sharing |
| `public/fortunes/fortunes.json` | Every fortune (loaded at startup) |
| `src/data/fortunes.js` | Categories and rarity levels |
| `public/assets/` | Illustrations cut from the watercolor asset sheet (`scene/`, `objects/`, `cookies/`, `paper/`, `tags/`, `ui/`, `decor/`, `textures/`) |

## How the shop works

- **Rules (`src/config.js`):** guests get `FREE_FORTUNES` (2) cookies in total, then the jar
  locks with a padlock. Signed-in members get `MEMBER_DAILY_FORTUNES` (5) a day; after that
  the jar shows "Closed until 12 am" and a countdown to local midnight.
- **Members only:** the Fortune Journal, the "Keep in journal" button and the category tags.
  Guests see these with a lock, and tapping them opens sign-up.
- **Fortunes live in `public/fortunes/fortunes.json`**, a separate file the site loads when it
  opens (about 55,000 fortunes). `signature` holds the 160 hand-written ones (Rare and Very Rare
  always come from here); `phrases` holds the building blocks the jar combines. To add fortunes,
  append to the END of any list; never reorder or delete lines, because saved journals remember
  fortunes by position.
- **Sound:** only the crack when a cookie is opened (`src/lib/audio.js`), with an on/off button.
- **Share:** after a cookie opens, and from the journal. Phones use their own share sheet;
  computers get Copy, X, WhatsApp, Facebook and Email (`src/lib/share.js`).
- **Sign-in: Google only**, through Firebase Authentication (`src/lib/auth.js`, settings in
  `src/lib/firebaseConfig.js`). One-time setup in the Firebase console for project
  `daily-fortune-cookies`:
  1. Authentication → Sign-in method → **Google** → Enable → Save.
  2. Authentication → Settings → Authorized domains → add `dailyfortunecookies.com` and
     `www.dailyfortunecookies.com` (`localhost` is already there for `npm run dev`).
- **Storage:** `localStorage`, prefix `little-fortune-shop:`; members under `user:<id>:…`.

## Tests

The tests use a special build where Google sign-in is replaced by a pretend account
(`.env.e2e`); normal builds never include it.

```bash
npx vite build --mode e2e --outDir dist-e2e
npx vite preview --outDir dist-e2e --port 4174 &
python3 tools/flow_test.py desktop   # or phone (needs Python + Playwright + Chrome)
```

Asset cut-outs were produced with `tools/extract_assets.py` from the original sheet.

## In the website repo

This app lives in `tea-shop/` (source) and builds into `/shop` at the repo root, so the site
serves it at `…/shop/` while everything else is untouched.

```bash
cd tea-shop
npm install
npm run dev      # work on it locally
npm run build    # rebuilds ../shop: commit that folder to publish
```
