import { useEffect, useRef, useState } from 'react'
import { sound } from '../lib/audio.js'
import { asset } from '../lib/assets.js'
import { LockIcon, PaperButton, RolledScroll, ShareMenu } from './common.jsx'
import FortunePaper from './FortunePaper.jsx'

// draw:   shake → rise → fly → cookie
// cookie: cookie (waits for a tap) → crack → split → emerge → unfold → text → done
const DRAW_STEPS = [
  ['shake', 0],
  ['rise', 650],
  ['fly', 1600],
  ['cookie', 2850],
]
const OPEN_STEPS = [
  ['crack', 0],
  ['split', 300],
  ['emerge', 820],
  ['unfold', 1380],
  ['text', 2080],
  ['done', 2780],
]
const ORDER = ['shake', 'rise', 'fly', 'cookie', 'crack', 'split', 'emerge', 'unfold', 'text', 'done']

export default function FortuneRitual({ mode, fortune, origin, rollWidth, isMember, kept, note, footnote, anotherLabel, onOpened, onKeep, onClose, onAnother }) {
  const [step, setStep] = useState(mode === 'paper' ? 'done' : mode === 'cookie' ? 'cookie' : 'shake')
  const timers = useRef([])
  const run = (steps) => {
    timers.current.forEach(clearTimeout)
    timers.current = steps.map(([name, at]) => setTimeout(() => setStep(name), at))
  }

  useEffect(() => {
    if (mode === 'draw') run(DRAW_STEPS)
    const t = timers
    return () => t.current.forEach(clearTimeout)
  }, [mode])

  const opened = useRef(false)
  useEffect(() => {
    if (step === 'text' && !opened.current) {
      opened.current = true
      onOpened()
    }
  }, [step, onOpened])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && step === 'done' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose])

  const openCookie = () => {
    if (step !== 'cookie') return
    sound.crack()
    run(OPEN_STEPS)
  }

  const at = (name) => ORDER.indexOf(step) >= ORDER.indexOf(name)
  const rollVisible = mode === 'draw' && !at('crack')

  return (
    <div className={`ritual mode-${mode} step-${step}`} style={{ '--ox': `${origin.x}px`, '--oy': `${origin.y}px`, '--roll-w': `${rollWidth}px` }}>
      <div className="ritual-dim" aria-hidden="true" />
      <div className="ritual-glow" aria-hidden="true" />

      {rollVisible && (
        <div className={`roll-clip ${at('fly') ? 'unclipped' : ''}`} aria-hidden="true">
          <div className="roll-flight">
            <RolledScroll />
          </div>
        </div>
      )}

      {at('cookie') && (
        <div className="cookie-stage">
          <button type="button" className="cookie-button" onClick={openCookie} disabled={step !== 'cookie'} aria-label="Open the fortune cookie">
            <img className="cookie-whole" src={asset('cookies/cookie-whole.webp')} alt="" draggable="false" />
            <span className="cookie-broken" aria-hidden="true">
              <img className="broken-crumbs" src={asset('cookies/cookie-broken-crumbs.webp')} alt="" draggable="false" />
              <img className="broken-piece left" src={asset('cookies/cookie-broken-left.webp')} alt="" draggable="false" />
              <img className="broken-piece right" src={asset('cookies/cookie-broken-right.webp')} alt="" draggable="false" />
            </span>
            <span className="crumbs" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <img key={i} src={asset('cookies/crumbs.webp')} alt="" style={{ '--i': i }} />
              ))}
            </span>
          </button>
          <p className="ritual-hint">Tap the cookie to open it.</p>
        </div>
      )}

      {at('emerge') && (
        <div className="paper-stage">
          <div className="paper-row">
            <img className="slip-cookie left" src={asset('cookies/cookie-shell.webp')} alt="" aria-hidden="true" draggable="false" />
            <div className="paper-unfold">
              <FortunePaper fortune={fortune} showText={at('text')} />
            </div>
            <img className="slip-cookie right" src={asset('cookies/cookie-shell.webp')} alt="" aria-hidden="true" draggable="false" />
          </div>
          <div className="ritual-actions" aria-hidden={!at('done')}>
            {isMember ? (
              <PaperButton onClick={onKeep} disabled={kept} className={kept ? 'is-kept' : ''}>
                {kept ? 'Kept in journal' : 'Keep in journal'}
              </PaperButton>
            ) : (
              <PaperButton onClick={onKeep} className="is-locked">
                <LockIcon /> Keep in journal
              </PaperButton>
            )}
            <ShareMenu fortune={fortune} />
            <PaperButton variant={2} onClick={onAnother}>
              {anotherLabel}
            </PaperButton>
            <p className="ritual-footnote">
              {footnote}{' '}
              <button type="button" className="ink-link light" onClick={onClose}>
                back to the shop
              </button>
            </p>
          </div>
        </div>
      )}
      {note && at('done') && (
        <aside className="shopkeeper-note">
          <span>{note}</span>
        </aside>
      )}
    </div>
  )
}
