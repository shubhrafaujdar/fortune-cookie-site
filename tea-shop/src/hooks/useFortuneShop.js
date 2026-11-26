import { useCallback, useEffect, useState } from 'react'
import { FREE_FORTUNES, MEMBER_DAILY_FORTUNES } from '../config.js'
import { drawFortune, getFortune } from '../lib/fortuneEngine.js'
import { dayKey, load, save } from '../lib/storage.js'

const MAX_HISTORY = 5000

/** The next local midnight, when members get fresh cookies. */
export function nextMidnight(from = new Date()) {
  const d = new Date(from)
  d.setHours(24, 0, 0, 0)
  return d
}

const fixEntry = (e) => (e.at ? e : { ...e, at: e.date ? new Date(`${e.date}T12:00:00`).getTime() : Date.now() })

function loadMember(userId) {
  const ns = `user:${userId}:`
  return {
    ns,
    kept: load(`${ns}kept`, []).map(fixEntry).filter((e) => getFortune(e.fortuneId)),
    history: load(`${ns}history`, []).map(fixEntry).filter((e) => getFortune(e.fortuneId)),
    pending: load(`${ns}pending`, null),
    daily: load(`${ns}daily`, { date: dayKey(), used: 0 }),
  }
}

function loadGuest() {
  return {
    ns: 'guest:',
    kept: [],
    history: load('guest:history', []),
    pending: load('guest:pending', null),
    used: load('guest:free-used', 0),
  }
}

/**
 * Everything the shop remembers.
 * Guests: FREE_FORTUNES cookies in total, no journal, no category tags.
 * Members: MEMBER_DAILY_FORTUNES cookies a day, a journal, and category tags.
 */
export function useFortuneShop(userId) {
  const wanted = userId ? `user:${userId}:` : 'guest:'
  const [book, setBook] = useState(() => (userId ? loadMember(userId) : loadGuest()))
  const [soundOn, setSoundOn] = useState(() => load('sound-on', true))
  const [today, setToday] = useState(dayKey)

  // switch books when someone signs in or out
  if (book.ns !== wanted) setBook(userId ? loadMember(userId) : loadGuest())

  // notice when midnight passes while the shop is open
  useEffect(() => {
    const tick = () => setToday(dayKey())
    const id = setInterval(tick, 20_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  useEffect(() => {
    if (book.ns === 'guest:') {
      save('guest:history', book.history.slice(0, 300))
      save('guest:pending', book.pending)
      save('guest:free-used', book.used)
    } else {
      save(`${book.ns}kept`, book.kept)
      save(`${book.ns}history`, book.history)
      save(`${book.ns}pending`, book.pending)
      save(`${book.ns}daily`, book.daily)
    }
  }, [book])
  useEffect(() => save('sound-on', soundOn), [soundOn])

  const isMember = book.ns !== 'guest:'
  const usedToday = isMember && book.daily.date === today ? book.daily.used : 0
  const left = isMember ? Math.max(0, MEMBER_DAILY_FORTUNES - usedToday) : Math.max(0, FREE_FORTUNES - book.used)
  const pendingFortune = book.pending && !book.pending.opened ? getFortune(book.pending.fortuneId) : null
  // 'guest' = free cookies used up (sign in to unlock); 'daily' = member is done for today
  const limit = pendingFortune || left > 0 ? null : isMember ? 'daily' : 'guest'

  /**
   * Draw a fortune. An unopened cookie is always offered first.
   * Returns { fortune, entry, resumed } or { blocked: 'guest' | 'daily' }.
   */
  const draw = useCallback(
    (categoryId) => {
      if (pendingFortune) return { fortune: pendingFortune, entry: book.pending, resumed: true }
      if (limit) return { blocked: limit }
      const recent = book.history.slice(0, 600).map((h) => h.fortuneId)
      const fortune = drawFortune(isMember ? categoryId : null, recent)
      const entry = { fortuneId: fortune.id, at: Date.now(), opened: false }
      setBook((b) => {
        const next = { ...b, pending: entry, history: [{ fortuneId: fortune.id, at: entry.at }, ...b.history].slice(0, MAX_HISTORY) }
        if (b.ns === 'guest:') next.used = b.used + 1
        else next.daily = { date: dayKey(), used: (b.daily.date === dayKey() ? b.daily.used : 0) + 1 }
        return next
      })
      return { fortune, entry, resumed: false }
    },
    [book, isMember, limit, pendingFortune],
  )

  const markOpened = useCallback((at) => {
    setBook((b) => (b.pending && b.pending.at === at ? { ...b, pending: { ...b.pending, opened: true } } : b))
  }, [])

  const keep = useCallback((fortuneId, at) => {
    setBook((b) =>
      b.ns === 'guest:' || b.kept.some((x) => x.fortuneId === fortuneId && x.at === at) ? b : { ...b, kept: [{ fortuneId, at, keptAt: Date.now() }, ...b.kept] },
    )
  }, [])

  const unkeep = useCallback((fortuneId, at) => {
    setBook((b) => ({ ...b, kept: b.kept.filter((x) => !(x.fortuneId === fortuneId && x.at === at)) }))
  }, [])

  const isKept = useCallback((fortuneId, at) => book.kept.some((x) => x.fortuneId === fortuneId && x.at === at), [book.kept])

  /** A guest's unopened cookie comes along when they sign in. */
  const carryGuestCookie = useCallback((newUserId) => {
    const g = load('guest:pending', null)
    if (g && !g.opened && !load(`user:${newUserId}:pending`, null)) save(`user:${newUserId}:pending`, g)
    save('guest:pending', null)
  }, [])

  const forgetJournal = useCallback(() => {
    setBook((b) => (b.ns === 'guest:' ? b : { ...b, kept: [], history: [] }))
  }, [])

  return {
    isMember,
    kept: book.kept,
    history: isMember ? book.history : [],
    pendingFortune,
    left,
    limit,
    soundOn,
    setSoundOn,
    draw,
    markOpened,
    keep,
    unkeep,
    isKept,
    carryGuestCookie,
    forgetJournal,
  }
}
