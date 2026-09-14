import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '../server/utils/db'
import { insertEvent, migrate, pruneOldEvents } from '../server/utils/db'
import { buildSummary, periodRange } from '../server/utils/stats'

const NOW = Date.UTC(2026, 8, 13, 12, 0, 0)
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function makeDb() {
  const db = new Database(':memory:')
  migrate(db)
  return db
}

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

describe('periodRange', () => {
  it('covers the trailing window for each period', () => {
    expect(periodRange('24h', NOW)).toEqual({ from: NOW - DAY, to: NOW })
    expect(periodRange('7d', NOW)).toEqual({ from: NOW - 7 * DAY, to: NOW })
    expect(periodRange('30d', NOW)).toEqual({ from: NOW - 30 * DAY, to: NOW })
  })

  it('starts at the epoch for all time', () => {
    expect(periodRange('all', NOW)).toEqual({ from: 0, to: NOW })
  })
})

describe('buildSummary', () => {
  let db: Database.Database

  beforeEach(() => {
    db = makeDb()
  })

  it('returns zeroed totals and empty lists on an empty database', () => {
    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day).toEqual({ views: 0, visitors: 0 })
    expect(summary.resume).toEqual({ ru: 0, en: 0, total: 0 })
    expect(summary.pages).toEqual([])
    expect(summary.recent).toEqual([])
  })

  it('counts views and unique visitors per window', () => {
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'a' }))
    insertEvent(db, event({ ts: NOW - 2 * HOUR, visitor: 'a' }))
    insertEvent(db, event({ ts: NOW - 3 * HOUR, visitor: 'b' }))
    insertEvent(db, event({ ts: NOW - 3 * DAY, visitor: 'c' }))
    insertEvent(db, event({ ts: NOW - 20 * DAY, visitor: 'd' }))

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day).toEqual({ views: 3, visitors: 2 })
    expect(summary.totals.week).toEqual({ views: 4, visitors: 3 })
    expect(summary.totals.month).toEqual({ views: 5, visitors: 4 })
  })

  it('excludes bots unless they are asked for', () => {
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'human' }))
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'crawler', bot: true }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).totals.day.views).toBe(1)
    expect(buildSummary(db, { period: '7d', bots: true, now: NOW }).totals.day.views).toBe(2)
  })

  it('splits resume downloads by language', () => {
    insertEvent(db, event({ type: 'resume_download', label: 'en', ts: NOW - HOUR }))
    insertEvent(db, event({ type: 'resume_download', label: 'en', ts: NOW - 2 * HOUR }))
    insertEvent(db, event({ type: 'resume_download', label: 'ru', ts: NOW - 3 * HOUR }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).resume).toEqual({
      ru: 1,
      en: 2,
      total: 3
    })
  })

  it('does not count resume downloads as page views', () => {
    insertEvent(db, event({ type: 'resume_download', label: 'ru', ts: NOW - HOUR }))

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day.views).toBe(0)
    expect(summary.totals.day.visitors).toBe(1)
  })

  it('ranks contact clicks by label', () => {
    insertEvent(db, event({ type: 'contact_click', label: 'github', ts: NOW - HOUR }))
    insertEvent(db, event({ type: 'contact_click', label: 'github', ts: NOW - HOUR }))
    insertEvent(db, event({ type: 'contact_click', label: 'telegram', ts: NOW - HOUR }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).contacts).toEqual([
      { label: 'github', count: 2 },
      { label: 'telegram', count: 1 }
    ])
  })

  it('ranks pages, referrers, countries and cities by views', () => {
    insertEvent(db, event({ path: '/', referrer: 'hh.ru', country: 'RU', city: 'Москва' }))
    insertEvent(db, event({ path: '/', referrer: 'hh.ru', country: 'RU', city: 'Москва' }))
    insertEvent(db, event({ path: '/projects', referrer: 'direct', country: 'DE', city: 'Berlin' }))

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.pages[0]).toEqual({ path: '/', views: 2 })
    expect(summary.referrers[0]).toEqual({ source: 'hh.ru', views: 2 })
    expect(summary.countries[0]).toEqual({ country: 'RU', views: 2 })
    expect(summary.cities[0]).toEqual({ city: 'Москва', country: 'RU', views: 2 })
  })

  it('counts distinct sources, countries and cities', () => {
    insertEvent(db, event({ referrer: 'hh.ru', country: 'RU', city: 'Москва' }))
    insertEvent(db, event({ referrer: 'hh.ru', country: 'RU', city: 'Москва' }))
    insertEvent(db, event({ referrer: 'direct', country: 'RU', city: 'Казань' }))
    insertEvent(db, event({ referrer: 'direct', country: 'DE', city: 'Berlin' }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).distinct).toEqual({
      referrers: 2,
      countries: 2,
      cities: 3
    })
  })

  it('counts a failed geo lookup as its own group, matching the rows shown', () => {
    insertEvent(db, event({ country: 'RU', city: 'Москва' }))
    insertEvent(db, event({ country: null, city: null }))

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.countries).toHaveLength(2)
    expect(summary.distinct.countries).toBe(2)
  })

  it('counts distinct values beyond the top-list cap', () => {
    for (let i = 0; i < 15; i++) {
      insertEvent(db, event({ country: `C${i}`, city: `City${i}`, referrer: `ref${i}.example` }))
    }

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.countries).toHaveLength(10)
    expect(summary.distinct).toEqual({ referrers: 15, countries: 15, cities: 15 })
  })

  it('excludes bots from the distinct counts unless asked for', () => {
    insertEvent(db, event({ country: 'RU' }))
    insertEvent(db, event({ country: 'CN', bot: true }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).distinct.countries).toBe(1)
    expect(buildSummary(db, { period: '7d', bots: true, now: NOW }).distinct.countries).toBe(2)
  })

  it('buckets the timeline by day, oldest first', () => {
    insertEvent(db, event({ ts: NOW - DAY, visitor: 'a' }))
    insertEvent(db, event({ ts: NOW - DAY, visitor: 'b' }))
    insertEvent(db, event({ ts: NOW, visitor: 'a' }))

    const timeline = buildSummary(db, { period: '7d', bots: false, now: NOW }).timeline

    expect(timeline.at(-2)).toEqual({ date: '2026-09-12', views: 2, visitors: 2 })
    expect(timeline.at(-1)).toEqual({ date: '2026-09-13', views: 1, visitors: 1 })
  })

  it('fills days with no traffic so the chart cannot compress a gap', () => {
    insertEvent(db, event({ ts: NOW - 3 * DAY, visitor: 'a' }))
    insertEvent(db, event({ ts: NOW, visitor: 'b' }))

    const timeline = buildSummary(db, { period: '7d', bots: false, now: NOW }).timeline

    expect(timeline.map(d => d.date)).toEqual([
      '2026-09-06',
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13'
    ])
    expect(timeline.find(d => d.date === '2026-09-10')).toEqual({
      date: '2026-09-10',
      views: 1,
      visitors: 1
    })
    expect(timeline.find(d => d.date === '2026-09-11')).toEqual({
      date: '2026-09-11',
      views: 0,
      visitors: 0
    })
  })

  it('spans all time from the first event rather than from the epoch', () => {
    insertEvent(db, event({ ts: NOW - 2 * DAY }))

    const timeline = buildSummary(db, { period: 'all', bots: false, now: NOW }).timeline

    expect(timeline.map(d => d.date)).toEqual(['2026-09-11', '2026-09-12', '2026-09-13'])
  })

  it('returns an empty timeline for all time when nothing was recorded', () => {
    expect(buildSummary(db, { period: 'all', bots: false, now: NOW }).timeline).toEqual([])
  })

  it('honours the selected period for rankings but not for the headline totals', () => {
    insertEvent(db, event({ ts: NOW - 10 * DAY, path: '/old' }))
    insertEvent(db, event({ ts: NOW - HOUR, path: '/new' }))

    const week = buildSummary(db, { period: '7d', bots: false, now: NOW })
    expect(week.pages.map(p => p.path)).toEqual(['/new'])
    expect(week.totals.month.views).toBe(2)

    const month = buildSummary(db, { period: '30d', bots: false, now: NOW })
    expect(month.pages.map(p => p.path).sort()).toEqual(['/new', '/old'])
  })

  it('returns the most recent events first, newest at the top', () => {
    insertEvent(db, event({ ts: NOW - 2 * HOUR, path: '/older' }))
    insertEvent(db, event({ ts: NOW - HOUR, path: '/newer' }))

    const recent = buildSummary(db, { period: '7d', bots: false, now: NOW }).recent

    expect(recent.map(e => e.path)).toEqual(['/newer', '/older'])
    expect(recent[0]).toMatchObject({ ts: NOW - HOUR, type: 'pageview', bot: 0 })
  })

  it('keeps rows whose geo lookup failed', () => {
    insertEvent(db, event({ country: null, city: null }))

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day.views).toBe(1)
    expect(summary.recent[0]?.country).toBeNull()
  })
})

describe('pruneOldEvents', () => {
  it('drops events past the retention window and keeps the rest', () => {
    const db = makeDb()
    insertEvent(db, event({ ts: NOW - 400 * DAY }))
    insertEvent(db, event({ ts: NOW - 10 * DAY }))

    expect(pruneOldEvents(db, NOW)).toBe(1)
    expect(db.prepare('SELECT COUNT(*) AS c FROM events').get()).toEqual({ c: 1 })
  })
})
