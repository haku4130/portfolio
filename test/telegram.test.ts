import { describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '../server/utils/db'
import { createNotifier, formatEvent } from '../server/utils/telegram'

const NOW = Date.UTC(2026, 8, 13, 12, 0, 0)
const MINUTE = 60 * 1000

function event(partial: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    ts: NOW,
    type: 'pageview',
    path: '/',
    locale: 'ru',
    label: null,
    referrer: 'direct',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    country: 'RU',
    city: 'Москва',
    device: 'desktop',
    browser: 'Chrome',
    os: 'macOS',
    visitor: 'visitor-a',
    bot: false,
    ...partial
  }
}

describe('createNotifier', () => {
  it('notifies about resume downloads and contact clicks', () => {
    const notifier = createNotifier()

    expect(notifier.shouldNotify(event({ type: 'resume_download', label: 'en' }), NOW)).toBe(true)
    expect(notifier.shouldNotify(event({ type: 'contact_click', label: 'github' }), NOW)).toBe(true)
  })

  it('stays quiet about ordinary page views', () => {
    const notifier = createNotifier()

    expect(notifier.shouldNotify(event(), NOW)).toBe(false)
  })

  it('notifies about a page view that arrived through a tagged link', () => {
    const notifier = createNotifier()

    expect(notifier.shouldNotify(event({ utmSource: 'hh.ru' }), NOW)).toBe(true)
  })

  it('never notifies about bots, whatever they do', () => {
    const notifier = createNotifier()

    expect(notifier.shouldNotify(event({ type: 'resume_download', label: 'ru', bot: true }), NOW)).toBe(false)
    expect(notifier.shouldNotify(event({ utmSource: 'hh.ru', bot: true }), NOW)).toBe(false)
  })

  it('suppresses a repeat of the same event from the same visitor', () => {
    const notifier = createNotifier()
    const download = () => notifier.shouldNotify(event({ type: 'resume_download', label: 'en' }), NOW)

    expect(download()).toBe(true)
    expect(download()).toBe(false)
  })

  it('lets the same event through again once the quiet window passes', () => {
    const notifier = createNotifier(10 * MINUTE)
    const download = (at: number) =>
      notifier.shouldNotify(event({ type: 'resume_download', label: 'en' }), at)

    expect(download(NOW)).toBe(true)
    expect(download(NOW + 9 * MINUTE)).toBe(false)
    expect(download(NOW + 11 * MINUTE)).toBe(true)
  })

  it('treats different visitors, types and labels as separate events', () => {
    const notifier = createNotifier()

    expect(notifier.shouldNotify(event({ type: 'resume_download', label: 'en' }), NOW)).toBe(true)
    expect(notifier.shouldNotify(event({ type: 'resume_download', label: 'ru' }), NOW)).toBe(true)
    expect(notifier.shouldNotify(event({ type: 'contact_click', label: 'en' }), NOW)).toBe(true)
    expect(notifier.shouldNotify(
      event({ type: 'resume_download', label: 'en', visitor: 'visitor-b' }),
      NOW
    )).toBe(true)
  })

  it('forgets stale entries so the map cannot grow without bound', () => {
    const notifier = createNotifier(10 * MINUTE)

    for (let i = 0; i < 100; i++) {
      notifier.shouldNotify(event({ type: 'contact_click', label: 'github', visitor: `v${i}` }), NOW)
    }
    expect(notifier.size()).toBe(100)

    notifier.shouldNotify(event({ type: 'contact_click', label: 'github', visitor: 'later' }), NOW + 60 * MINUTE)
    expect(notifier.size()).toBe(1)
  })
})

describe('formatEvent', () => {
  it('describes a resume download with place and source', () => {
    const text = formatEvent(event({ type: 'resume_download', label: 'en', referrer: 'hh.ru' }))

    expect(text).toContain('резюме')
    expect(text).toContain('EN')
    expect(text).toContain('Москва')
    expect(text).toContain('hh.ru')
  })

  it('names the contact that was clicked', () => {
    expect(formatEvent(event({ type: 'contact_click', label: 'github' }))).toContain('GitHub')
  })

  it('omits missing pieces instead of printing null', () => {
    const text = formatEvent(event({
      type: 'resume_download',
      label: 'ru',
      country: null,
      city: null,
      referrer: 'direct',
      browser: null,
      os: null
    }))

    expect(text).not.toContain('null')
    expect(text).not.toContain('undefined')
  })

  it('mentions the campaign for a tagged visit', () => {
    const text = formatEvent(event({ utmSource: 'telegram', utmCampaign: 'outreach' }))

    expect(text).toContain('telegram')
    expect(text).toContain('outreach')
  })
})
