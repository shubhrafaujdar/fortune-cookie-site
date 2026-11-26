import { useEffect, useRef, useState } from 'react'
import { copyFortune, nativeShare, prefersNativeShare, shareLinks } from '../lib/share.js'

import { asset } from '../lib/assets.js'

/** A button painted on the blank wooden-paper button from the asset sheet. */
export function PaperButton({ children, variant = 1, className = '', ...rest }) {
  return (
    <button type="button" className={`paper-button v${variant} ${className}`} {...rest}>
      <img src={asset(variant === 1 ? 'ui/button-blank.webp' : 'ui/button-blank-2.webp')} alt="" aria-hidden="true" draggable="false" />
      <span>{children}</span>
    </button>
  )
}

/** A hand-carved hanko seal, stamped in vermilion ink. */
export function Hanko({ text = '吉', size = 64, color = '#a8402c', className = '' }) {
  const chars = [...text]
  return (
    <svg className={`hanko ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <filter id="hanko-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.35" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="inked" />
          <feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2" seed="9" result="w" />
          <feDisplacementMap in="inked" in2="w" scale="3" />
        </filter>
      </defs>
      <g filter="url(#hanko-ink)" fill={color} stroke={color}>
        <rect x="8" y="8" width="84" height="84" rx="9" fill="none" strokeWidth="6" />
        {chars.length === 1 ? (
          <text x="50" y="69" textAnchor="middle" fontSize="56" fontFamily="'Shippori Mincho', serif" fontWeight="800" stroke="none">
            {chars[0]}
          </text>
        ) : (
          <g fontSize="35" fontFamily="'Shippori Mincho', serif" fontWeight="800" stroke="none" textAnchor="middle">
            <text x="50" y="47">{chars[0]}</text>
            <text x="50" y="84">{chars[1]}</text>
          </g>
        )}
      </g>
    </svg>
  )
}

/** A rolled-up paper fortune, painted to match the rolls inside the jar. */
export function RolledScroll({ className = '' }) {
  return (
    <svg className={`rolled-scroll ${className}`} viewBox="0 0 60 150" aria-hidden="true">
      <defs>
        <linearGradient id="roll-body" x1="0" x2="1">
          <stop offset="0" stopColor="#c9ac85" />
          <stop offset="0.22" stopColor="#efe0c3" />
          <stop offset="0.5" stopColor="#f7ecd6" />
          <stop offset="0.8" stopColor="#e2cba6" />
          <stop offset="1" stopColor="#b8956b" />
        </linearGradient>
        <filter id="roll-wash" x="-20%" y="-10%" width="140%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="3" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="5" result="g" />
          <feColorMatrix in="g" type="saturate" values="0" result="gg" />
          <feBlend in="d" in2="gg" mode="multiply" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <g filter="url(#roll-wash)">
        <rect x="9" y="12" width="42" height="126" rx="5" fill="url(#roll-body)" stroke="#5b4031" strokeWidth="2.2" />
        <ellipse cx="30" cy="13" rx="21" ry="7" fill="#f6ead2" stroke="#5b4031" strokeWidth="2.2" />
        <path d="M30 13 m-12 0 a12 4.2 0 1 0 24 0 a9 3 0 1 0 -18 0 a6 2 0 1 0 12 0" fill="none" stroke="#a98262" strokeWidth="1.3" />
        <path d="M14 30 q16 4 32 0 M14 120 q16 4 32 0" fill="none" stroke="#c9a77f" strokeWidth="1" opacity=".7" />
        <path d="M9 74 q21 7 42 0" fill="none" stroke="#9d3527" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M27 77 q-6 12 -11 20 M33 77 q7 11 10 19" fill="none" stroke="#9d3527" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="30" cy="77" r="3.6" fill="#b5463a" stroke="#6d2318" strokeWidth="1.2" />
      </g>
    </svg>
  )
}

/** Modal panel with backdrop, Escape-to-close and focus handling. */
export function Panel({ open, onClose, className = '', label, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    ref.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div className={`panel ${className}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5.5 Q12 12 19 18.6 M18.6 5 Q12 12.4 5.4 19" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

/** A tiny handwritten message that drifts up and fades away. */
export function Whisper({ whisper }) {
  if (!whisper) return null
  return (
    <div className="whisper" key={whisper.id} role="status" aria-live="polite">
      <span>{whisper.text}</span>
    </div>
  )
}

/** A small hand-drawn padlock, used on features that need an account. */
export function LockIcon({ className = '', title }) {
  return (
    <svg className={`lock-icon ${className}`} viewBox="0 0 24 24" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title}>
      <path d="M7.5 10.5 V7.6 C7.5 4.9 9.5 3.2 12 3.2 C14.5 3.2 16.5 4.9 16.5 7.6 V10.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5.2 10.4 C8.8 9.9 15.2 9.9 18.8 10.4 C19.3 13.2 19.2 17 18.6 20 C15 20.7 9 20.7 5.4 20 C4.8 17 4.7 13.2 5.2 10.4 Z" fill="currentColor" />
      <circle cx="12" cy="14.6" r="1.5" fill="#f3e6cf" />
      <path d="M12 15.6 V17.6" stroke="#f3e6cf" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/** Share a fortune: the device share sheet on phones, a small menu elsewhere. */
export function ShareMenu({ fortune, className = '', children = 'Share', asLink = false }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const away = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && (e.stopPropagation(), setOpen(false))
    document.addEventListener('pointerdown', away)
    window.addEventListener('keydown', esc, true)
    return () => {
      document.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', esc, true)
    }
  }, [open])

  const onShare = async () => {
    if (prefersNativeShare()) {
      const r = await nativeShare(fortune)
      if (r !== 'unsupported') return
    }
    setOpen((o) => !o)
  }
  const onCopy = async () => {
    setCopied(await copyFortune(fortune))
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <span className={`share ${asLink ? 'share-link' : ''} ${className}`} ref={ref}>
      {asLink ? (
        <button type="button" className="ink-link" onClick={onShare} aria-haspopup="menu" aria-expanded={open}>
          {children}
        </button>
      ) : (
        <PaperButton variant={2} onClick={onShare} aria-haspopup="menu" aria-expanded={open}>
          {children}
        </PaperButton>
      )}
      {open && (
        <span className="share-menu" role="menu">
          <button type="button" role="menuitem" onClick={onCopy}>
            {copied ? 'Copied!' : 'Copy the fortune'}
          </button>
          {shareLinks(fortune).map((l) => (
            <a key={l.id} role="menuitem" href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </span>
      )}
    </span>
  )
}
