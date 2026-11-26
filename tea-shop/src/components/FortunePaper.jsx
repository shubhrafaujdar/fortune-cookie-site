import { CATEGORY_BY_ID, paperFor } from '../lib/fortuneEngine.js'
import { RARITY_BY_ID } from '../data/fortunes.js'
import { asset } from '../lib/assets.js'
import { Hanko } from './common.jsx'

const HANKO = { rare: '吉', 'very-rare': '大吉' }

/** Gold leaf corner ornament for rare papers. */
function GoldCorner({ className }) {
  return (
    <svg className={`gold-corner ${className}`} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M4 40 Q4 4 40 4 M10 46 Q12 12 46 10 M4 40 q8 -2 10 -10 M40 4 q-2 8 -10 10" fill="none" stroke="url(#gold-leaf)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="18" cy="18" r="3.2" fill="url(#gold-leaf)" />
    </svg>
  )
}

export function GoldDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="gold-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d793" />
          <stop offset="0.45" stopColor="#c99a45" />
          <stop offset="0.7" stopColor="#f6e2a8" />
          <stop offset="1" stopColor="#a8792f" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function FortunePaper({ fortune, showText = true, className = '', compact = false }) {
  const paper = paperFor(fortune)
  const [pt, pr, pb, pl] = paper.pad
  const rarity = RARITY_BY_ID[fortune.rarity]
  const long = fortune.text.length > 64
  const xlong = fortune.text.length > 100
  return (
    <figure className={`fortune-paper rarity-${fortune.rarity} ${showText ? 'is-revealed' : ''} ${compact ? 'compact' : ''} ${className}`} style={{ aspectRatio: paper.ratio }}>
      <img className="paper-art" src={asset(paper.src)} alt="" draggable="false" />
      {(fortune.rarity === 'rare' || fortune.rarity === 'very-rare') && (
        <>
          <GoldCorner className="tl" />
          <GoldCorner className="br" />
        </>
      )}
      {fortune.rarity === 'very-rare' && <span className="gold-flecks" aria-hidden="true" />}
      <blockquote className={`fortune-text ${showText ? 'is-shown' : ''} ${long ? 'is-long' : ''} ${xlong ? 'is-xlong' : ''}`} style={{ inset: `${pt}% ${pr}% ${pb}% ${pl}%` }}>
        <p>{fortune.text}</p>
      </blockquote>
      {paper.flower && <img className="flower-stamp" src={asset('decor/pressed-flower.webp')} alt="" aria-hidden="true" />}
      {HANKO[fortune.rarity] && <Hanko text={HANKO[fortune.rarity]} size={compact ? 30 : 54} className="paper-hanko" />}
      {!compact && (
        <figcaption className={`paper-caption ${showText ? 'is-shown' : ''}`}>
          <span>{CATEGORY_BY_ID[fortune.category].label}</span>
          {fortune.rarity !== 'common' && <span className="rarity-mark"> · {rarity.label}</span>}
        </figcaption>
      )}
    </figure>
  )
}
