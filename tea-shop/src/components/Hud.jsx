import { CATEGORIES } from '../data/fortunes.js'
import { asset } from '../lib/assets.js'
import { LockIcon } from './common.jsx'

export function Title() {
  return (
    <header className="shop-title">
      <h1>The Little Fortune Shop</h1>
      <p>A little wisdom for wherever life takes you.</p>
    </header>
  )
}

/** Paper tags tied to a cord along the counter. Members only: guests see them locked. */
export function CategoryCord({ selected, onSelect, locked, resting }) {
  const label = locked ? 'Sign in to choose a category' : resting ? 'Fresh cookies at midnight' : selected ? 'The jar is listening for…' : 'Tie a tag to your wish, or let the jar decide'
  return (
    <nav className={`category-cord ${locked ? 'is-locked' : ''} ${resting ? 'is-resting' : ''}`} aria-label="Fortune categories">
      <p className="cord-label">
        {locked && <LockIcon />}
        {label}
      </p>
      <svg className="cord-line" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 8 Q 500 34 1000 8" fill="none" stroke="#7b4a2e" strokeWidth="2.6" />
        <path d="M0 9 Q 500 35 1000 9" fill="none" stroke="#c48c5e" strokeWidth="0.9" opacity=".6" />
      </svg>
      <ul>
        {CATEGORIES.map((c, i) => (
          <li key={c.id} style={{ '--i': i, '--sag': (1 - ((i - 3.5) / 3.5) ** 2).toFixed(3) }}>
            <button
              type="button"
              className={`tag ${selected === c.id ? 'is-selected' : ''}`}
              aria-pressed={selected === c.id}
              onClick={() => onSelect(c.id)}
              title={locked ? `${c.label} (members only)` : c.label}
            >
              <img src={asset(`tags/${c.tag}.webp`)} alt={c.label} draggable="false" />
              {locked && <LockIcon className="tag-lock" />}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** A small wooden plaque hanging from a cherry branch: sign in, or your name. */
export function AccountTag({ user, left, onClick }) {
  return (
    <div className="daily-hanger">
      <img className="hanger-branch" src={asset('decor/cherry-branch.webp')} alt="" aria-hidden="true" draggable="false" />
      <button type="button" className={`account-tag ${user ? 'is-member' : left === 0 ? 'is-out' : ''}`} onClick={onClick} aria-label={user ? `Your account, ${user.name}` : 'Sign in with Google'}>
        <svg className="plaque-strings" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 0 L18 40 M50 0 L82 40" stroke="#8a3b2c" strokeWidth="1.6" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="plaque">
          <img src={asset('ui/button-blank.webp')} alt="" draggable="false" />
          <span className="plaque-text">{user ? user.name : 'Sign in'}</span>
        </span>
        <span className="account-note">
          {user
            ? left > 0
              ? `${left} ${left === 1 ? 'cookie' : 'cookies'} left today`
              : 'more at midnight'
            : left > 0
              ? `${left} free ${left === 1 ? 'cookie' : 'cookies'} left`
              : 'sign in for more'}
        </span>
      </button>
    </div>
  )
}

export function AboutLantern({ onClick }) {
  return (
    <button type="button" className="about-lantern" onClick={onClick} aria-label="About the shop">
      <img src={asset('objects/paper-lantern.webp')} alt="" draggable="false" />
      <span>About</span>
    </button>
  )
}

export function JournalBook({ onClick, count, locked }) {
  return (
    <button type="button" className={`journal-book-button ${locked ? 'is-locked' : ''}`} onClick={onClick} aria-label={locked ? 'Fortune journal (members only)' : `Fortune journal, ${count} kept`}>
      <img src={asset('objects/fortune-journal.webp')} alt="" draggable="false" />
      {locked ? (
        <span className="journal-lock">
          <LockIcon />
        </span>
      ) : (
        count > 0 && <span className="journal-count">{count}</span>
      )}
    </button>
  )
}

export function SoundControls({ on, onToggle }) {
  return (
    <div className="sound-controls">
      <button type="button" className="round-icon" onClick={onToggle} aria-label={on ? 'Turn the cookie sound off' : 'Turn the cookie sound on'} aria-pressed={on} title={on ? 'Sound on' : 'Sound off'}>
        <img src={asset(on ? 'ui/sound-on.webp' : 'ui/sound-off.webp')} alt="" draggable="false" />
      </button>
    </div>
  )
}
