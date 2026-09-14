// Internal routes: build output, generated images, content queries, our own
// endpoints. None of them is a page a person asked for.
const IGNORED_PREFIX = /^\/(api|_nuxt|_ipx|_fonts|_og|_i18n|__nuxt_content|\.well-known)(\/|$)/
const IGNORED_EXACT = new Set(['/__nuxt_error', '/stats', '/en/stats'])

// Anything with a file extension: images, the resume pdfs, robots.txt, payloads.
const FILE = /\.[a-z0-9]{2,5}$/i

/** Whether a request path represents a page view worth recording. */
export function isTrackablePath(path: string): boolean {
  return !IGNORED_PREFIX.test(path) && !IGNORED_EXACT.has(path) && !FILE.test(path)
}
