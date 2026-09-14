import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import type { AnalyticsEvent } from './db'
import { insertEvent, useAnalyticsDb } from './db'
import { lookupGeo } from './geo'
import { normalizeReferrer, parseUtm } from './referrer'
import type { EventInput } from './request'
import { clientIp, createRateLimiter } from './request'
import { createNotifier, formatEvent, sendTelegram } from './telegram'
import { dayKey, visitorHash } from './visitor'

// One visitor cannot write more than this many events per minute. Generous for
// a real person, tight enough that the public endpoint is not a free write API.
const limiter = createRateLimiter(60, 60_000)
const notifier = createNotifier()

let salt: string | undefined

function analyticsSalt(): string {
  if (salt) return salt

  salt = process.env.ANALYTICS_SALT
  if (!salt) {
    salt = randomBytes(16).toString('hex')
    console.warn('[analytics] ANALYTICS_SALT is not set, using a random one: unique visitor counts reset on restart')
  }

  return salt
}

/**
 * Turns a request plus a validated input into a stored event. Analytics is
 * never allowed to break the site, so every failure is swallowed and logged.
 */
export async function recordEvent(h3: H3Event, input: EventInput): Promise<void> {
  try {
    const headers = getRequestHeaders(h3) as Record<string, string | undefined>
    const userAgent = headers['user-agent'] ?? ''
    const ip = clientIp(headers)
    const now = Date.now()
    const visitor = visitorHash(ip, userAgent, dayKey(now), analyticsSalt())

    if (!limiter.allow(visitor, now)) return

    const ua = parseUserAgent(userAgent)
    const utm = parseUtm(`/${input.query ?? ''}`)
    const geo = ua.bot ? { country: null, city: null } : await lookupGeo(ip)

    const event: AnalyticsEvent = {
      ts: now,
      type: input.type,
      path: input.path,
      locale: input.locale,
      label: input.label,
      referrer: normalizeReferrer(input.ref, headers.host),
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmCampaign: utm.campaign,
      country: geo.country,
      city: geo.city,
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
      visitor,
      bot: ua.bot
    }

    insertEvent(useAnalyticsDb(), event)

    if (notifier.shouldNotify(event, now)) {
      // Intentionally not awaited: the visitor should not wait on Telegram.
      void sendTelegram(formatEvent(event))
    }
  } catch (error) {
    console.error('[analytics] failed to record event:', error)
  }
}
