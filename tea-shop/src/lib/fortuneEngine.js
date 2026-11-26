import { CATEGORIES, RARITY } from '../data/fortunes.js'

// The fortunes themselves live in public/fortunes/fortunes.json and are
// loaded once when the shop opens (see loadFortunes). Nothing here works
// until that file has been loaded.

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
const RARITY_IDS = new Set(Object.values(RARITY).map((r) => r.id))

let DATA = null // { signature: {id: fortune}, byCategory: {cat: [fortune]}, when, images, banks, counts, total }

// ------------------------------------------------------------ loading
export async function loadFortunes(url = `${import.meta.env.BASE_URL}fortunes/fortunes.json`) {
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Could not load fortunes (${res.status})`)
  setFortuneData(await res.json())
}

/** Validate and index the fortune file. Throws with a readable message if it is malformed. */
export function setFortuneData(json) {
  const fail = (msg) => {
    throw new Error(`fortunes.json: ${msg}`)
  }
  if (!json || typeof json !== 'object') fail('not a JSON object')
  const { signature = {}, phrases = {} } = json
  const { when = [], images = [], categories: banks = {} } = phrases
  if (!when.length || !images.length) fail('phrases.when and phrases.images must not be empty')
  const sig = {}
  const byCategory = {}
  for (const c of CATEGORIES) {
    const bank = banks[c.id]
    if (!bank) fail(`phrases.categories.${c.id} is missing`)
    for (const k of ['subjects', 'predicates', 'actions', 'results', 'meanings']) {
      if (!Array.isArray(bank[k]) || !bank[k].length) fail(`phrases.categories.${c.id}.${k} must be a non-empty list`)
    }
    byCategory[c.id] = (signature[c.id] || []).map((f, i) => {
      if (!f?.text || !RARITY_IDS.has(f.rarity)) fail(`signature.${c.id}[${i}] needs "text" and a "rarity" of ${[...RARITY_IDS].join(', ')}`)
      const id = `${c.id}-${String(i + 1).padStart(2, '0')}`
      return (sig[id] = { id, category: c.id, text: f.text, rarity: f.rarity })
    })
  }
  DATA = { signature: sig, byCategory, when, images, banks }
  cache.clear()
  const counts = Object.fromEntries(
    CATEGORIES.map((c) => [c.id, byCategory[c.id].length + Object.keys(TEMPLATES).reduce((s, t) => s + templateSize(c.id, t), 0)]),
  )
  DATA.counts = counts
  DATA.total = Object.values(counts).reduce((a, b) => a + b, 0)
}

export const fortunesLoaded = () => !!DATA
export const fortuneCounts = () => DATA.counts
export const totalFortunes = () => DATA.total

// ------------------------------------------------------------ generated fortunes
// id format: "<category>~<template>~<i>.<j>[.<k>]"  e.g. "luck~A~3.11.7"

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

const TEMPLATES = {
  A: { dims: (b) => [b.subjects.length, b.predicates.length, DATA.when.length], text: (b, [i, j, k]) => `${b.subjects[i]} ${b.predicates[j]} ${DATA.when[k]}.` },
  B: { dims: (b) => [b.actions.length, b.results.length], text: (b, [i, j]) => `${b.actions[i]}, and ${b.results[j]}.` },
  C: { dims: (b) => [DATA.images.length, b.meanings.length], text: (b, [i, j]) => `${DATA.images[i]} ${b.meanings[j]}` },
}

function templateSize(category, t) {
  return TEMPLATES[t].dims(DATA.banks[category]).reduce((a, n) => a * n, 1)
}

function generatedRarity(id) {
  return hash(id) % 100 < 72 ? 'common' : 'uncommon'
}

function buildGenerated(id) {
  const [category, t, idx] = id.split('~')
  const bank = DATA.banks[category]
  const tpl = TEMPLATES[t]
  if (!bank || !tpl || !idx) return null
  const parts = idx.split('.').map(Number)
  const dims = tpl.dims(bank)
  if (parts.length !== dims.length || parts.some((n, i) => !(n >= 0 && n < dims[i]))) return null
  return { id, category, text: tpl.text(bank, parts), rarity: generatedRarity(id), generated: true }
}

const cache = new Map()
/** Look up any fortune (signature or generated) by id. Returns null if unknown. */
export function getFortune(id) {
  if (!id || !DATA) return null
  if (DATA.signature[id]) return DATA.signature[id]
  if (!cache.has(id)) cache.set(id, buildGenerated(id))
  return cache.get(id)
}

function pickWeighted(entries) {
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = Math.random() * total
  for (const [value, w] of entries) {
    roll -= w
    if (roll <= 0) return value
  }
  return entries[entries.length - 1][0]
}

function randomGenerated(category) {
  // mix the three sentence shapes so fortunes do not all sound alike
  const t = pickWeighted([['A', 58], ['B', 22], ['C', 20]])
  const dims = TEMPLATES[t].dims(DATA.banks[category])
  return `${category}~${t}~${dims.map((n) => Math.floor(Math.random() * n)).join('.')}`
}

/**
 * Draw one fortune at random from the whole collection (or one category).
 * Rarity is rolled first. Rare and Very Rare fortunes are always signature
 * (hand-written) ones; Common and Uncommon come mostly from the large
 * combined collection. Fortunes already received are avoided.
 */
export function drawFortune(categoryId, seenIds = []) {
  const seen = new Set(seenIds)
  const category = categoryId || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].id
  const rarity = pickWeighted(Object.values(RARITY).map((r) => [r.id, r.weight]))
  const handPool = DATA.byCategory[category].filter((f) => f.rarity === rarity && !seen.has(f.id))
  const special = rarity === 'rare' || rarity === 'very-rare'
  if (handPool.length && (special || Math.random() < 0.12)) return handPool[Math.floor(Math.random() * handPool.length)]

  for (let tries = 0; tries < 400; tries++) {
    const id = randomGenerated(category)
    if (seen.has(id)) continue
    const f = getFortune(id)
    if (special || f.rarity === rarity || tries > 60) return f
  }
  return getFortune(randomGenerated(category))
}

/** Paper style per rarity; stable per fortune id so a fortune always looks the same. */
export function paperFor(fortune) {
  const h = [...fortune.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7)
  switch (fortune.rarity) {
    case 'very-rare':
      return { src: 'paper/banner-knot.webp', ratio: 972 / 346, pad: [24, 15, 22, 15], flower: true }
    case 'rare':
      return { src: 'paper/slip-sakura.webp', ratio: 378 / 164, pad: [22, 13, 22, 13], flower: h % 2 === 0 }
    case 'uncommon':
      return h % 2
        ? { src: 'paper/slip-branch.webp', ratio: 512 / 170, pad: [22, 12, 24, 12], flower: h % 7 === 0 }
        : { src: 'paper/slip-waves.webp', ratio: 488 / 178, pad: [22, 12, 24, 12], flower: h % 7 === 0 }
    default:
      return { src: 'paper/slip-plain.webp', ratio: 390 / 160, pad: [22, 12, 22, 12], flower: h % 9 === 0 }
  }
}

export const SHOPKEEPER_NOTES = [
  'Stay as long as the tea is warm. — the shopkeeper',
  'I fold every fortune by hand. Yours took two tries; it wanted to be right.',
  'The cat chose the cushion by the window. You may choose any seat.',
  'If the rain gets loud, that only means the garden is happy.',
  'Come back anytime. The jar likes familiar faces.',
  'This one was near the top. It was waiting, I think.',
  'Fortunes are only suggestions. You are the one who writes the day.',
]

export const LITTLE_MESSAGES = {
  teacup: ['Your tea is ready.', 'Sencha, steeped for exactly as long as it needed.', 'Careful, still warm.'],
  teapot: ['The iron kettle hums an old song.', 'There is always more tea.', 'The pot was here before the shop was.'],
  cat: [
    'The cat blinks slowly at you. That is a compliment.',
    'Maneki-neko waves good fortune in through the door.',
    'Mrrp.',
    'The cat has been here longer than the counter.',
  ],
  lantern: ['The lantern flickers, as if nodding.', 'Paper lanterns remember every evening.', 'A little warmth for the walk home.'],
  window: ['The rain has no plans to stop. Neither do you need to.', 'Somewhere out there, a puddle reflects a lantern.', 'Listen. The rain keeps its own time.'],
  banner: ['福 — fuku, good fortune. Some shops hang it upside down so fortune “arrives”.', 'The banner was a gift from the first customer.'],
  vase: ['A petal lets go. It was ready.', 'The blossoms were picked this morning, in the rain.'],
  slips: ['Old fortunes, left behind by earlier guests.', 'Someone wrote “thank you” on the back of this one.'],
  cookie: ['This cookie is only for admiring. The jar decides.', 'Still warm from the oven.'],
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}
