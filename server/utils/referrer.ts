export interface Utm {
  source: string | null
  medium: string | null
  campaign: string | null
}

const MAX_UTM_LENGTH = 64

/**
 * Reduces a referrer URL to a bare host, or `direct` when there is no usable
 * referrer. Navigation from our own host counts as direct: it is the visitor
 * moving around the site, not a new source of traffic.
 */
export function normalizeReferrer(
  referrer: string | undefined | null,
  selfHost?: string
): string {
  if (!referrer) return 'direct'

  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return 'direct'
  }
  if (!host) return 'direct'

  const bare = host.replace(/^www\./, '')
  // The Host header carries a port in development and behind some proxies.
  const self = selfHost?.toLowerCase().replace(/^www\./, '').replace(/:\d+$/, '')
  if (self && bare === self) return 'direct'

  return bare
}

function readUtm(params: URLSearchParams, key: string): string | null {
  const raw = params.get(key)
  if (!raw) return null

  const value = raw.trim()
  if (!value) return null

  return value.slice(0, MAX_UTM_LENGTH)
}

/** Pulls utm tags out of a request URL. Accepts a path or an absolute URL. */
export function parseUtm(url: string): Utm {
  let params: URLSearchParams
  try {
    params = new URL(url, 'http://localhost').searchParams
  } catch {
    return { source: null, medium: null, campaign: null }
  }

  return {
    source: readUtm(params, 'utm_source'),
    medium: readUtm(params, 'utm_medium'),
    campaign: readUtm(params, 'utm_campaign')
  }
}
