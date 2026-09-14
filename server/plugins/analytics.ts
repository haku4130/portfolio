import { sanitizePath } from '../utils/request'
import { recordEvent } from '../utils/track'
import { isTrackablePath } from '../utils/trackable'

/**
 * Counts the first request of every visit.
 *
 * This lives in the `request` hook rather than in `server/middleware` on
 * purpose: middleware never sees a prerendered page, because the static asset
 * handler answers it first — and every page of this site is prerendered. The
 * hook runs before that handler, so the numbers stay honest.
 *
 * Client side navigation still reports itself through the beacon; this side
 * cannot be blocked, which is what keeps the headline counts trustworthy.
 */
export default defineNitroPlugin((nitro) => {
  if (import.meta.prerender) return

  nitro.hooks.hook('request', async (event) => {
    if (event.method !== 'GET') return

    const url = event.path ?? '/'
    const path = sanitizePath(url)
    if (!path || !isTrackablePath(path)) return

    // Only real document requests: payload fetches and prefetches ask for
    // other content types.
    if (!getRequestHeader(event, 'accept')?.includes('text/html')) return

    await recordEvent(event, {
      type: 'pageview',
      path,
      locale: path === '/en' || path.startsWith('/en/') ? 'en' : 'ru',
      label: null,
      ref: getRequestHeader(event, 'referer') ?? null,
      query: url.includes('?') ? url.slice(url.indexOf('?')) : null
    })
  })
})
