type EventType = 'pageview' | 'resume_download' | 'contact_click'

const ENTRY_KEY = 'a:entry'

interface Entry {
  ref: string | null
  query: string | null
}

/**
 * The referrer and utm tags of the visit are only available on the very first
 * page. They are kept for the rest of the tab session so a resume download an
 * hour later can still be attributed to the link that brought the person here.
 *
 * A later load that arrives from outside or carries fresh utm tags replaces
 * them: that is a new entry into the site, not a continuation of the old one.
 */
export function rememberEntry(): void {
  const entry: Entry = {
    ref: document.referrer || null,
    query: location.search || null
  }

  const external = Boolean(entry.ref) && !entry.ref!.startsWith(location.origin)
  const tagged = entry.query?.includes('utm_') ?? false

  try {
    if (!external && !tagged && sessionStorage.getItem(ENTRY_KEY)) return
    sessionStorage.setItem(ENTRY_KEY, JSON.stringify(entry))
  } catch {
    // Private mode or a full quota: attribution is a nice-to-have, not a reason
    // to throw in the middle of a page load.
  }
}

function entry(): Entry {
  try {
    return JSON.parse(sessionStorage.getItem(ENTRY_KEY) ?? 'null') ?? { ref: null, query: null }
  } catch {
    return { ref: null, query: null }
  }
}

export function trackEvent(type: EventType, label?: string, path?: string): void {
  if (import.meta.server) return

  // Page views report where they actually are. Downloads and contact clicks
  // report the visit's entry instead, so they stay attributable to the link
  // that brought the person here — a page view carrying the same tags would
  // count one campaign visit several times over.
  const source: Entry = type === 'pageview'
    ? { ref: null, query: location.search || null }
    : entry()

  const body = JSON.stringify({
    type,
    label: label ?? null,
    path: path ?? location.pathname,
    locale: location.pathname === '/en' || location.pathname.startsWith('/en/') ? 'en' : 'ru',
    ...source
  })

  try {
    // sendBeacon survives the page being torn down by a navigation or download.
    const sent = navigator.sendBeacon?.('/api/e', new Blob([body], { type: 'application/json' }))
    if (sent) return
  } catch {
    // Fall through to fetch below.
  }

  fetch('/api/e', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {})
}

const CONTACT_LABELS: Record<string, string> = {
  'github': 'github',
  'linkedin': 'linkedin',
  'telegram': 'telegram',
  'email': 'email',
  'резюме на hh': 'hh'
}

/** Maps the aria-label of a contact button to a stable analytics label. */
export function contactLabel(ariaLabel: string | undefined): string | null {
  return CONTACT_LABELS[(ariaLabel ?? '').toLowerCase()] ?? null
}

/** Reports a click on a contact link, ignoring links we do not track. */
export function trackContact(ariaLabel: string | undefined): void {
  const label = contactLabel(ariaLabel)
  if (label) trackEvent('contact_click', label)
}
