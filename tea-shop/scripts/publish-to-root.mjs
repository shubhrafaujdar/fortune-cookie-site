// Copies the built shop (tea-shop/dist) to the root of the website repo, so it
// is the homepage at https://www.dailyfortunecookies.com/.
//
// It only touches what the shop owns: index.html, favicon.png, assets/ and
// fortunes/ at the root, plus shop/ (kept as a redirect for old links).
// Everything else at the root (classic.html, privacy and terms pages, ads.txt,
// functions/, images/ ...) is left alone.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const MARKER = 'content="little-fortune-shop"'

if (!existsSync(`${dist}index.html`)) {
  console.error('No build found. Run `npm run build` (it builds, then publishes).')
  process.exit(1)
}

// Safety: never overwrite a homepage that is not the shop's own.
const homepage = `${root}index.html`
if (existsSync(homepage) && !readFileSync(homepage, 'utf8').includes(MARKER)) {
  console.error('The root index.html is not the shop. Move it first (for example to classic.html), then run again.')
  process.exit(1)
}

for (const dir of ['assets', 'fortunes']) rmSync(`${root}${dir}`, { recursive: true, force: true })
for (const name of readdirSync(dist)) cpSync(`${dist}${name}`, `${root}${name}`, { recursive: true })

// Old links to /shop/ go to the homepage.
rmSync(`${root}shop`, { recursive: true, force: true })
mkdirSync(`${root}shop`)
writeFileSync(
  `${root}shop/index.html`,
  '<!doctype html><meta charset="utf-8"><title>The Little Fortune Shop</title>' +
    '<link rel="canonical" href="/"><meta http-equiv="refresh" content="0; url=/">' +
    '<script>location.replace("/" + location.hash)</script><a href="/">Enter the Little Fortune Shop</a>\n',
)

console.log('Published the shop to the repo root (index.html, assets/, fortunes/, favicon.png).')
