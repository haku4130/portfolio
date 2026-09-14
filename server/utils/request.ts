import type { EventType } from './db'

const MAX_PATH_LENGTH = 200
const MAX_SOURCE_LENGTH = 300

const RESUME_LABELS = new Set(['ru', 'en'])
const CONTACT_LABELS = new Set(['github', 'linkedin', 'telegram', 'email', 'hh', 'meeting'])
const LOCALES = new Set(['ru', 'en'])

export interface EventInput {
  type: EventType
  path: string | null
  locale: string | null
  label: string | null
  /** Raw referrer of the visit that started this page session. */
  ref: string | null
  /** Raw query string of that first page, where utm tags live. */
  query: string | null
}

/** The real client address as handed over by Traefik. */
export function clientIp(headers: Record<string, string | undefined>): string {
  const forwarded = headers['x-forwarded-for']
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return headers['x-real-ip']?.trim() || ''
}

/**
 * Path values arrive from the browser, so they are untrusted. Query strings are
 * dropped on purpose: they can carry tokens or personal data we have no reason
 * to store, and the utm tags we do care about are read separately.
 */
export function sanitizePath(input: unknown): string | null {
  if (typeof input !== 'string' || !input.startsWith('/') || input.startsWith('//')) return null

  const path = input.split(/[?#]/)[0]
  if (!path) return null

  // `/projects` and `/projects/` are the same page and must not split the
  // rankings in two. The router reports the first form, a typed URL the second.
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path

  return (normalized || '/').slice(0, MAX_PATH_LENGTH)
}

function labelFor(type: EventType, raw: unknown): string | null | false {
  if (type === 'pageview') return null

  if (typeof raw !== 'string') return false

  const allowed = type === 'resume_download' ? RESUME_LABELS : CONTACT_LABELS
  return allowed.has(raw) ? raw : false
}

/**
 * Validates a beacon body. Everything unknown is rejected rather than stored,
 * so a stranger posting to the endpoint cannot fill the table with junk
 * categories that would then show up on the dashboard.
 */
export function parseEventInput(body: unknown): EventInput | null {
  if (!body || typeof body !== 'object') return null

  const raw = body as Record<string, unknown>
  const type = raw.type
  if (type !== 'pageview' && type !== 'resume_download' && type !== 'contact_click') return null

  const path = sanitizePath(raw.path)
  if (!path) return null

  const label = labelFor(type, raw.label)
  if (label === false) return null

  let locale: string | null = null
  if (raw.locale !== undefined && raw.locale !== null) {
    if (typeof raw.locale !== 'string' || !LOCALES.has(raw.locale)) return null
    locale = raw.locale
  }

  return { type, path, locale, label, ref: text(raw.ref), query: text(raw.query) }
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value ? value.slice(0, MAX_SOURCE_LENGTH) : null
}

/** Fixed-window limiter, keyed by visitor hash. */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number, start: number }>()

  return {
    allow(key: string, now: number = Date.now()): boolean {
      for (const [entryKey, entry] of hits) {
        if (now - entry.start >= windowMs) hits.delete(entryKey)
      }

      const current = hits.get(key)
      if (!current || now - current.start >= windowMs) {
        hits.set(key, { count: 1, start: now })
        return true
      }

      if (current.count >= max) return false

      current.count += 1
      return true
    }
  }
}
