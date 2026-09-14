import { describe, expect, it } from 'vitest'
import { isTrackablePath } from '../server/utils/trackable'

describe('isTrackablePath', () => {
  it.each(['/', '/en', '/projects', '/en/projects', '/about'])('tracks the real page %s', (path) => {
    expect(isTrackablePath(path)).toBe(true)
  })

  it.each([
    ['/api/e', 'our own beacon'],
    ['/api/stats/summary', 'the dashboard api'],
    ['/_nuxt/entry.js', 'build assets'],
    ['/_ipx/w_400/avatar.png', 'resized images'],
    ['/_fonts/inter.woff2', 'fonts'],
    ['/_og/image.png', 'generated og images'],
    ['/__nuxt_content/query', 'content queries'],
    ['/.well-known/security.txt', 'well known files']
  ])('ignores %s (%s)', (path) => {
    expect(isTrackablePath(path)).toBe(false)
  })

  it.each(['/avatar.png', '/resume-ru.pdf', '/robots.txt', '/favicon.ico', '/sitemap.xml'])(
    'ignores the static file %s',
    (path) => {
      expect(isTrackablePath(path)).toBe(false)
    }
  )

  it('ignores the internal error route, which is a render detail and not a visit', () => {
    expect(isTrackablePath('/__nuxt_error')).toBe(false)
  })

  it('ignores the analytics dashboard itself, in both locales', () => {
    expect(isTrackablePath('/stats')).toBe(false)
    expect(isTrackablePath('/en/stats')).toBe(false)
  })

  it('still tracks a page whose name merely starts like an ignored prefix', () => {
    expect(isTrackablePath('/apiary')).toBe(true)
    expect(isTrackablePath('/statsman')).toBe(true)
  })
})
