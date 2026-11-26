import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, RARITY_BY_ID } from '../data/fortunes.js'
import { FREE_FORTUNES, MEMBER_DAILY_FORTUNES } from '../config.js'
import { AuthError } from '../lib/auth.js'
import { asset } from '../lib/assets.js'
import { CATEGORY_BY_ID, getFortune, totalFortunes } from '../lib/fortuneEngine.js'
import { Hanko, LockIcon, Panel, PaperButton, ShareMenu } from './common.jsx'

const RARITIES = ['common', 'uncommon', 'rare', 'very-rare']
const SEAL = { rare: '吉', 'very-rare': '大吉' }

function when(at) {
  const d = new Date(at)
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    iso: d.toISOString(),
  }
}

function usePerPage() {
  const calc = () => {
    if (window.innerWidth < 760) return 6
    const h = Math.min(window.innerHeight * 0.94, 860)
    return Math.max(4, Math.floor((h - 180) / 106))
  }
  const [n, setN] = useState(calc)
  useEffect(() => {
    const on = () => setN(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return n
}

// ------------------------------------------------------------------ journal
export function JournalPanel({ open, onClose, user, kept, history, isKept, keep, unkeep, onUnfold }) {
  const [tab, setTab] = useState('kept')
  const [category, setCategory] = useState(null)
  const [rarity, setRarity] = useState(null)
  const [query, setQuery] = useState('')
  const [newestFirst, setNewestFirst] = useState(true)
  const [page, setPage] = useState(0)
  const [turning, setTurning] = useState('')
  const perPage = usePerPage()

  const source = tab === 'kept' ? kept : history
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = source
      .map((e) => ({ ...e, f: getFortune(e.fortuneId) }))
      .filter((e) => e.f && (!category || e.f.category === category) && (!rarity || e.f.rarity === rarity) && (!q || e.f.text.toLowerCase().includes(q)))
    list.sort((a, b) => (newestFirst ? b.at - a.at : a.at - b.at))
    return list
  }, [source, category, rarity, query, newestFirst])

  const pages = Math.max(1, Math.ceil(entries.length / perPage))
  const current = Math.min(page, pages - 1)
  const shown = entries.slice(current * perPage, current * perPage + perPage)

  const stats = useMemo(() => {
    const fs = history.map((h) => getFortune(h.fortuneId)).filter(Boolean)
    const byCat = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]))
    fs.forEach((f) => (byCat[f.category] += 1))
    return {
      opened: fs.length,
      kept: kept.length,
      rare: fs.filter((f) => f.rarity === 'rare').length,
      veryRare: fs.filter((f) => f.rarity === 'very-rare').length,
      byCat,
      max: Math.max(1, ...Object.values(byCat)),
    }
  }, [history, kept])

  const resetPage = () => setPage(0)
  const flip = (dir) => {
    const next = current + dir
    if (next < 0 || next >= pages) return
    setTurning(dir > 0 ? 'turn-next' : 'turn-prev')
    setTimeout(() => {
      setPage(next)
      setTurning('')
    }, 220)
  }
  const switchTab = (t) => {
    setTab(t)
    resetPage()
  }
  const owner = user ? `${user.name}’s` : 'Your'
  const filtered = category || rarity || query.trim()

  return (
    <Panel open={open} onClose={onClose} className="journal" label="Fortune journal">
      <div className="journal-spread">
        {/* ---------------- left page: about your collection */}
        <section className="journal-left" aria-label="Your collection">
          <header className="journal-title">
            <img src={asset('objects/fortune-journal.webp')} alt="" aria-hidden="true" />
            <div>
              <h2>{owner} Fortune Journal</h2>
              <p>{user ? `Member since ${when(user.createdAt).date}` : 'A guest’s notebook. Sign in to keep it safe.'}</p>
            </div>
          </header>

          <dl className="journal-stats">
            <div>
              <dt>Opened</dt>
              <dd>{stats.opened}</dd>
            </div>
            <div>
              <dt>Kept</dt>
              <dd>{stats.kept}</dd>
            </div>
            <div>
              <dt>Rare</dt>
              <dd>{stats.rare}</dd>
            </div>
            <div>
              <dt>Very rare</dt>
              <dd>{stats.veryRare}</dd>
            </div>
          </dl>

          <h3 className="journal-sub">Find a fortune</h3>
          <label className="journal-search">
            <span className="visually-hidden">Search your fortunes</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6" />
              <path d="M15 15 L20.5 20.5" />
            </svg>
            <input
              type="search"
              placeholder="search for a word…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetPage()
              }}
            />
          </label>

          <div className="journal-tags" role="group" aria-label="Filter by category">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={category === c.id ? 'is-on' : ''}
                aria-pressed={category === c.id}
                onClick={() => {
                  setCategory((v) => (v === c.id ? null : c.id))
                  resetPage()
                }}
                title={c.label}
              >
                <img src={asset(`tags/${c.tag}.webp`)} alt={c.label} />
                <span className="tag-count">{stats.byCat[c.id]}</span>
              </button>
            ))}
          </div>

          <div className="journal-rarity" role="group" aria-label="Filter by rarity">
            {RARITIES.map((r) => (
              <button
                key={r}
                type="button"
                className={`rarity-chip chip-${r} ${rarity === r ? 'is-on' : ''}`}
                aria-pressed={rarity === r}
                onClick={() => {
                  setRarity((v) => (v === r ? null : r))
                  resetPage()
                }}
              >
                {RARITY_BY_ID[r].label}
              </button>
            ))}
          </div>

          <div className="journal-sort">
            <span>Order</span>
            <button type="button" className="ink-link" onClick={() => setNewestFirst((v) => !v)}>
              {newestFirst ? 'newest first' : 'oldest first'}
            </button>
            {filtered && (
              <button
                type="button"
                className="ink-link"
                onClick={() => {
                  setCategory(null)
                  setRarity(null)
                  setQuery('')
                  resetPage()
                }}
              >
                clear filters
              </button>
            )}
          </div>

          <div className="journal-chart" aria-label="Fortunes opened by category">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="chart-row">
                <span>{c.label}</span>
                <span className="chart-bar">
                  <i style={{ width: `${(stats.byCat[c.id] / stats.max) * 100}%` }} />
                </span>
              </div>
            ))}
          </div>
          <p className="journal-footnote">The jar holds {totalFortunes().toLocaleString()} fortunes. Yours are the ones written here.</p>
        </section>

        {/* ---------------- right page: the fortunes themselves */}
        <section className="journal-right" aria-label="Fortunes">
          <div className="journal-bookmarks" role="tablist" aria-label="Journal pages">
            <button type="button" role="tab" aria-selected={tab === 'kept'} className={tab === 'kept' ? 'active' : ''} onClick={() => switchTab('kept')}>
              Kept <small>{kept.length}</small>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'active' : ''} onClick={() => switchTab('all')}>
              Every fortune <small>{history.length}</small>
            </button>
          </div>

          <div className={`journal-leaf ${turning}`}>
            {shown.length === 0 ? (
              <p className="journal-empty">
                {filtered
                  ? 'No fortunes match. Try another tag, or clear the filters.'
                  : tab === 'kept'
                    ? 'No fortunes kept yet. When one feels like yours, press “Keep this fortune” and it will be written here.'
                    : 'The jar has not chosen for you yet. Touch it in the shop to receive your first fortune.'}
              </p>
            ) : (
              <ol className="journal-entries">
                {shown.map((e) => {
                  const k = isKept(e.fortuneId, e.at)
                  const t = when(e.at)
                  const cat = CATEGORY_BY_ID[e.f.category]
                  const key = `${e.fortuneId}@${e.at}`
                  return (
                    <li key={key} className={`entry rarity-${e.f.rarity}`}>
                      <img className="entry-tag" src={asset(`tags/${cat.tag}.webp`)} alt="" aria-hidden="true" />
                      <div className="entry-body">
                        <p className="entry-when">
                          <time dateTime={t.iso}>{t.date}</time> · {t.time}
                          <span className="entry-cat"> · {cat.label}</span>
                          {e.f.rarity !== 'common' && <span className="entry-rarity"> · {RARITY_BY_ID[e.f.rarity].label}</span>}
                        </p>
                        <p className="entry-text">{e.f.text}</p>
                        <div className="entry-actions">
                          <button type="button" className="ink-link" onClick={() => onUnfold(e.f, e)}>
                            unfold
                          </button>
                          <ShareMenu fortune={e.f} asLink>
                            share
                          </ShareMenu>
                          {k ? (
                            <button type="button" className="ink-link" onClick={() => unkeep(e.fortuneId, e.at)}>
                              {tab === 'kept' ? 'remove' : 'kept · remove'}
                            </button>
                          ) : (
                            <button type="button" className="ink-link" onClick={() => keep(e.fortuneId, e.at)}>
                              keep
                            </button>
                          )}
                        </div>
                      </div>
                      {SEAL[e.f.rarity] && <Hanko text={SEAL[e.f.rarity]} size={38} className="entry-seal" />}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>

          <nav className="journal-pager" aria-label="Journal pages">
            <button type="button" className="page-turn" onClick={() => flip(-1)} disabled={current === 0} aria-label="Previous page">
              <svg viewBox="0 0 40 24" aria-hidden="true">
                <path d="M36 12 C 26 10, 16 11, 6 12 M13 5 L5 12 L13 19" />
              </svg>
            </button>
            <span>
              page {current + 1} of {pages}
            </span>
            <button type="button" className="page-turn" onClick={() => flip(1)} disabled={current >= pages - 1} aria-label="Next page">
              <svg viewBox="0 0 40 24" aria-hidden="true">
                <path d="M4 12 C 14 10, 24 11, 34 12 M27 5 L35 12 L27 19" />
              </svg>
            </button>
          </nav>
        </section>
      </div>
    </Panel>
  )
}

// ------------------------------------------------------------------ sign in (Google) / account
function GoogleMark() {
  // Google's "G", as used on its official sign-in buttons
  return (
    <svg className="google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export function AccountPanel({ open, onClose, user, reason, freeLeft, stats, onSignIn, onLogOut }) {
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setError(null)
    setBusy(false)
    onClose()
  }

  const signIn = async () => {
    setError(null)
    setBusy(true)
    try {
      await onSignIn()
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not sign in with Google. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    return (
      <Panel open={open} onClose={close} className="account-panel" label="Your account">
        <div className="account-head">
          <span className="account-art">
            {user.photo ? <img className="account-photo" src={user.photo} alt="" referrerPolicy="no-referrer" /> : <img src={asset('objects/lucky-cat.webp')} alt="" aria-hidden="true" />}
          </span>
          <div>
            <h2>Welcome back, {user.name}</h2>
            <p>{user.email}</p>
          </div>
        </div>
        <ul className="account-facts">
          <li>
            <strong>{MEMBER_DAILY_FORTUNES}</strong> cookies a day · <strong>{freeLeft}</strong> left today
          </li>
          <li>
            <strong>{stats.opened}</strong> opened · <strong>{stats.kept}</strong> kept in your journal
          </li>
          <li>Member since {when(user.createdAt).date}</li>
        </ul>
        <div className="account-actions">
          <PaperButton onClick={close}>Back to the shop</PaperButton>
          <button type="button" className="ink-link" onClick={onLogOut}>
            sign out
          </button>
        </div>
      </Panel>
    )
  }

  const HEADLINES = {
    limit: ['The jar is locked', `You have opened your ${FREE_FORTUNES} free cookies. Sign in to unlock the jar.`],
    journal: ['The journal is for members', 'Sign in to keep every fortune you love in your own journal.'],
    tags: ['Choosing is for members', 'Sign in to tie a paper tag to your wish and choose the kind of fortune you get.'],
    keep: ['Keep this fortune?', 'Sign in to keep fortunes in your own journal.'],
  }
  const [title, lead] =
    HEADLINES[reason] || ['Join the shop', freeLeft > 0 ? `You have ${freeLeft} free ${freeLeft === 1 ? 'cookie' : 'cookies'} left. Members get more, every day.` : 'Members get fresh cookies every day.']

  return (
    <Panel open={open} onClose={close} className={`account-panel ${reason ? `reason-${reason}` : ''}`} label="Sign in">
      <div className="account-head">
        <span className="account-art">
          <img src={asset('objects/lucky-cat.webp')} alt="" aria-hidden="true" />
          {reason && <LockIcon className="account-lock" />}
        </span>
        <div>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>
      </div>
      <ul className="member-perks">
        <li>{MEMBER_DAILY_FORTUNES} fortune cookies every day</li>
        <li>A journal to keep the ones you love</li>
        <li>Paper tags to choose the kind of fortune</li>
      </ul>
      <button type="button" className="google-button" onClick={signIn} disabled={busy}>
        <GoogleMark />
        <span>{busy ? 'Opening Google…' : 'Continue with Google'}</span>
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="account-fine">We only use your Google name and email to keep your journal. No password needed.</p>
    </Panel>
  )
}

// ------------------------------------------------------------------ about
export function AboutPanel({ open, onClose, onForget, isMember }) {
  const [confirming, setConfirming] = useState(false)
  const close = () => {
    setConfirming(false)
    onClose()
  }
  return (
    <Panel open={open} onClose={close} className="about" label="About the shop">
      <div className="about-paper">
        <div className="about-head">
          <img className="about-banner" src={asset('paper/banner-knot.webp')} alt="" aria-hidden="true" />
          <h2>About the Shop</h2>
        </div>
        <p>
          At the end of a narrow lane, between a bookbinder and a closed umbrella maker, there is a tea shop with only one counter. The
          shopkeeper writes fortunes by hand and rolls them into the old blue jar, which by now holds more than {(Math.floor(totalFortunes() / 1000) * 1000).toLocaleString()} of them.
        </p>
        <p>
          Choose a paper tag if you want the jar to listen for something in particular, or let it decide. Some papers are rarer than
          others, and wear gold or a red seal. The rarest ones are the shopkeeper’s own favourites.
        </p>
        <p>
          Visitors may open {FREE_FORTUNES} cookies. Members open {MEMBER_DAILY_FORTUNES} every day (fresh ones arrive at midnight), keep a
          journal, and may choose a category with the paper tags.
        </p>
        <p className="about-hint">Little things in the shop respond to a touch. The cat, especially.</p>
        <nav className="about-links" aria-label="More">
          <a href="/privacy-policy.html">Privacy Policy</a>
          <a href="/terms-of-service.html">Terms of Service</a>
          <a href="https://buymeacoffee.com/fortunecookie" target="_blank" rel="noopener noreferrer">
            Buy us a coffee
          </a>
          <a href="/classic.html">The classic fortune cookie</a>
        </nav>
        {isMember && (
        <div className="about-forget">
          {confirming ? (
            <>
              <span>Erase every fortune in {isMember ? 'your' : 'this'} journal?</span>
              <button type="button" className="ink-link" onClick={() => { onForget(); setConfirming(false) }}>
                yes, erase it
              </button>
              <button type="button" className="ink-link" onClick={() => setConfirming(false)}>
                no, keep it
              </button>
            </>
          ) : (
            <button type="button" className="ink-link" onClick={() => setConfirming(true)}>
              erase journal
            </button>
          )}
        </div>
        )}
      </div>
    </Panel>
  )
}

// ------------------------------------------------------------------ back at midnight
function untilMidnight() {
  const now = new Date()
  const mid = new Date(now)
  mid.setHours(24, 0, 0, 0)
  const total = Math.max(0, Math.floor((mid - now) / 1000))
  return {
    h: String(Math.floor(total / 3600)).padStart(2, '0'),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    s: String(total % 60).padStart(2, '0'),
  }
}

export function WaitPanel({ open, onClose, onJournal }) {
  const [t, setT] = useState(untilMidnight)
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setT(untilMidnight()), 1000)
    return () => clearInterval(id)
  }, [open])
  return (
    <Panel open={open} onClose={onClose} className="wait-panel" label="Come back at midnight">
      <div className="wait-sky" aria-hidden="true">
        <svg className="wait-moon" viewBox="0 0 60 60">
          <path d="M40 8 A24 24 0 1 0 52 44 A19 19 0 1 1 40 8 Z" fill="#f3e2b3" />
        </svg>
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wait-star" style={{ '--i': i }} />
        ))}
      </div>
      <div className="wait-cat">
        <img src={asset('objects/lucky-cat.webp')} alt="" aria-hidden="true" />
        <span className="zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>z</i>
        </span>
      </div>
      <h2>The jar is resting</h2>
      <p className="wait-lead">You have opened all {MEMBER_DAILY_FORTUNES} of today’s cookies. The shopkeeper is baking a fresh batch, ready at 12 am.</p>
      <p className="wait-clock" role="timer" aria-live="off" aria-label={`${t.h} hours ${t.m} minutes ${t.s} seconds until midnight`}>
        <span>{t.h}</span>:<span>{t.m}</span>:<span>{t.s}</span>
      </p>
      <p className="wait-small">until fresh cookies</p>
      <div className="wait-actions">
        <PaperButton onClick={onJournal}>Read my journal</PaperButton>
        <PaperButton variant={2} onClick={onClose}>
          Back to the shop
        </PaperButton>
      </div>
    </Panel>
  )
}
