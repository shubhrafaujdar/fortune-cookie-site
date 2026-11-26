// Sharing a fortune: the phone's own share sheet where there is one,
// otherwise a small menu of links (see ShareMenu).

const SITE = 'The Little Fortune Shop'

export function shareUrl() {
  return window.location.href.split('#')[0]
}

export function shareText(fortune) {
  return `“${fortune.text}”\n— my fortune from ${SITE}`
}

/** Opens the device share sheet. Returns 'shared', 'cancelled' or 'unsupported'. */
export async function nativeShare(fortune) {
  if (!navigator.share) return 'unsupported'
  try {
    await navigator.share({ title: SITE, text: shareText(fortune), url: shareUrl() })
    return 'shared'
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

/** Prefer the share sheet on touch devices; desktops get the menu. */
export function prefersNativeShare() {
  return !!navigator.share && window.matchMedia?.('(pointer: coarse)').matches
}

export function shareLinks(fortune) {
  const text = shareText(fortune)
  const url = shareUrl()
  const t = encodeURIComponent(text)
  const u = encodeURIComponent(url)
  return [
    { id: 'x', label: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` },
    { id: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { id: 'email', label: 'Email', href: `mailto:?subject=${encodeURIComponent(`A fortune for you from ${SITE}`)}&body=${encodeURIComponent(`${text}\n\n${url}`)}` },
  ]
}

export async function copyFortune(fortune) {
  const value = `${shareText(fortune)}\n${shareUrl()}`
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // older browsers: a hidden textarea
    try {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
