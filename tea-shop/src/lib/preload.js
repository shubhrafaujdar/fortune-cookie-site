import { asset } from './assets.js'

// Pictures used during the cookie reveal. Fetch and decode them as soon as the
// shop opens so they are ready (and smooth) the moment a cookie cracks.
const RITUAL_IMAGES = [
  'cookies/cookie-whole.webp',
  'cookies/cookie-broken-left.webp',
  'cookies/cookie-broken-right.webp',
  'cookies/cookie-broken-crumbs.webp',
  'cookies/crumbs.webp',
  'cookies/cookie-shell.webp',
  'paper/slip-plain.webp',
  'paper/slip-sakura.webp',
  'paper/slip-branch.webp',
  'paper/slip-waves.webp',
  'paper/banner-knot.webp',
  'ui/button-blank.webp',
  'ui/button-blank-2.webp',
  'decor/pressed-flower.webp',
  'objects/lucky-cat.webp',
  'objects/fortune-journal.webp',
]

const kept = []
export function preloadRitualImages() {
  for (const p of RITUAL_IMAGES) {
    const img = new Image()
    img.decoding = 'async'
    img.src = asset(p)
    img.decode?.().catch(() => {})
    kept.push(img) // keep a reference so the decoded image stays in memory
  }
}
