import Database from 'better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'
import type { AnalyticsEvent } from '../server/utils/db'
import { insertEvent, markHuman, migrate, pruneOldEvents } from '../server/utils/db'
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

/** Stores an event from a visitor who already proved to be a person. */
function record(db: Database.Database, partial: Partial<AnalyticsEvent> = {}) {
  const stored = event(partial)
  insertEvent(db, stored)
  markHuman(db, stored.visitor, stored.ts)
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
    record(db, { ts: NOW - HOUR, visitor: 'a' })
    record(db, { ts: NOW - 2 * HOUR, visitor: 'a' })
    record(db, { ts: NOW - 3 * HOUR, visitor: 'b' })
    record(db, { ts: NOW - 3 * DAY, visitor: 'c' })
    record(db, { ts: NOW - 20 * DAY, visitor: 'd' })

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day).toEqual({ views: 3, visitors: 2 })
    expect(summary.totals.week).toEqual({ views: 4, visitors: 3 })
    expect(summary.totals.month).toEqual({ views: 5, visitors: 4 })
  })

  it('excludes bots unless they are asked for', () => {
    record(db, { ts: NOW - HOUR, visitor: 'human' })
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'crawler', bot: true }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).totals.day.views).toBe(1)
    expect(buildSummary(db, { period: '7d', bots: true, now: NOW }).totals.day.views).toBe(2)
  })

  it('splits resume downloads by language', () => {
    record(db, { type: 'resume_download', label: 'en', ts: NOW - HOUR })
    record(db, { type: 'resume_download', label: 'en', ts: NOW - 2 * HOUR })
    record(db, { type: 'resume_download', label: 'ru', ts: NOW - 3 * HOUR })

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).resume).toEqual({
      ru: 1,
      en: 2,
      total: 3
    })
  })

  it('does not count resume downloads as page views', () => {
    record(db, { type: 'resume_download', label: 'ru', ts: NOW - HOUR })

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.totals.day.views).toBe(0)
    expect(summary.totals.day.visitors).toBe(1)
  })

  it('ranks contact clicks by label', () => {
    record(db, { type: 'contact_click', label: 'github', ts: NOW - HOUR })
    record(db, { type: 'contact_click', label: 'github', ts: NOW - HOUR })
    record(db, { type: 'contact_click', label: 'telegram', ts: NOW - HOUR })

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).contacts).toEqual([
      { label: 'github', count: 2 },
      { label: 'telegram', count: 1 }
    ])
  })

  it('ranks pages, referrers, countries and cities by views', () => {
    record(db, { path: '/', referrer: 'hh.ru', country: 'RU', city: 'Москва' })
    record(db, { path: '/', referrer: 'hh.ru', country: 'RU', city: 'Москва' })
    record(db, { path: '/projects', referrer: 'direct', country: 'DE', city: 'Berlin' })

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.pages[0]).toEqual({ path: '/', views: 2 })
    expect(summary.referrers[0]).toEqual({ source: 'hh.ru', views: 2 })
    expect(summary.countries[0]).toEqual({ country: 'RU', views: 2 })
    expect(summary.cities[0]).toEqual({ city: 'Москва', country: 'RU', views: 2 })
  })

  it('counts distinct sources, countries and cities', () => {
    record(db, { referrer: 'hh.ru', country: 'RU', city: 'Москва' })
    record(db, { referrer: 'hh.ru', country: 'RU', city: 'Москва' })
    record(db, { referrer: 'direct', country: 'RU', city: 'Казань' })
    record(db, { referrer: 'direct', country: 'DE', city: 'Berlin' })

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).distinct).toEqual({
      referrers: 2,
      countries: 2,
      cities: 3
    })
  })

  it('counts a failed geo lookup as its own group, matching the rows shown', () => {
    record(db, { country: 'RU', city: 'Москва' })
    record(db, { country: null, city: null })

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.countries).toHaveLength(2)
    expect(summary.distinct.countries).toBe(2)
  })

  it('counts distinct values beyond the top-list cap', () => {
    for (let i = 0; i < 15; i++) {
      record(db, { country: `C${i}`, city: `City${i}`, referrer: `ref${i}.example` })
    }

    const summary = buildSummary(db, { period: '7d', bots: false, now: NOW })

    expect(summary.countries).toHaveLength(10)
    expect(summary.distinct).toEqual({ referrers: 15, countries: 15, cities: 15 })
  })

  it('excludes bots from the distinct counts unless asked for', () => {
    record(db, { country: 'RU' })
    insertEvent(db, event({ country: 'CN', bot: true }))

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).distinct.countries).toBe(1)
    expect(buildSummary(db, { period: '7d', bots: true, now: NOW }).distinct.countries).toBe(2)
  })

  it('buckets the timeline by day, oldest first', () => {
    record(db, { ts: NOW - DAY, visitor: 'a' })
    record(db, { ts: NOW - DAY, visitor: 'b' })
    record(db, { ts: NOW, visitor: 'a' })

    const timeline = buildSummary(db, { period: '7d', bots: false, now: NOW }).timeline

    expect(timeline.at(-2)).toEqual({ date: '2026-09-12', views: 2, visitors: 2 })
    expect(timeline.at(-1)).toEqual({ date: '2026-09-13', views: 1, visitors: 1 })
  })

  it('fills days with no traffic so the chart cannot compress a gap', () => {
    record(db, { ts: NOW - 3 * DAY, visitor: 'a' })
    record(db, { ts: NOW, visitor: 'b' })

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
    record(db, { ts: NOW - 2 * DAY })

    const timeline = buildSummary(db, { period: 'all', bots: false, now: NOW }).timeline

    expect(timeline.map(d => d.date)).toEqual(['2026-09-11', '2026-09-12', '2026-09-13'])
  })

  it('returns an empty timeline for all time when nothing was recorded', () => {
    expect(buildSummary(db, { period: 'all', bots: false, now: NOW }).timeline).toEqual([])
  })

  it('honours the selected period for rankings but not for the headline totals', () => {
    record(db, { ts: NOW - 10 * DAY, path: '/old' })
    record(db, { ts: NOW - HOUR, path: '/new' })

    const week = buildSummary(db, { period: '7d', bots: false, now: NOW })
    expect(week.pages.map(p => p.path)).toEqual(['/new'])
    expect(week.totals.month.views).toBe(2)

    const month = buildSummary(db, { period: '30d', bots: false, now: NOW })
    expect(month.pages.map(p => p.path).sort()).toEqual(['/new', '/old'])
  })

  it('returns the most recent events first, newest at the top', () => {
    record(db, { ts: NOW - 2 * HOUR, path: '/older' })
    record(db, { ts: NOW - HOUR, path: '/newer' })

    const recent = buildSummary(db, { period: '7d', bots: false, now: NOW }).recent

    expect(recent.map(e => e.path)).toEqual(['/newer', '/older'])
    expect(recent[0]).toMatchObject({ ts: NOW - HOUR, type: 'pageview', bot: 0, human: 1 })
  })

  it('hides visitors who never interacted with the page unless bots are asked for', () => {
    record(db, { ts: NOW - HOUR, visitor: 'person' })
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'disguised', browser: 'Safari', os: 'iOS' }))

    const hidden = buildSummary(db, { period: '7d', bots: false, now: NOW })
    expect(hidden.totals.day).toEqual({ views: 1, visitors: 1 })
    expect(hidden.recent).toHaveLength(1)

    const shown = buildSummary(db, { period: '7d', bots: true, now: NOW })
    expect(shown.totals.day).toEqual({ views: 2, visitors: 2 })
    expect(shown.recent.map(e => e.human).sort()).toEqual([0, 1])
  })

  it('counts every event of a visitor once they interact, including earlier ones', () => {
    insertEvent(db, event({ ts: NOW - 2 * HOUR, visitor: 'late' }))
    insertEvent(db, event({ ts: NOW - HOUR, visitor: 'late', path: '/about' }))
    markHuman(db, 'late', NOW - HOUR)

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).totals.day.views).toBe(2)
  })

  it('keeps a user agent bot hidden even if it marked itself as a person', () => {
    insertEvent(db, event({ visitor: 'crawler', bot: true }))
    markHuman(db, 'crawler', NOW)

    expect(buildSummary(db, { period: '7d', bots: false, now: NOW }).totals.day.views).toBe(0)
  })

  it('keeps rows whose geo lookup failed', () => {
    record(db, { country: null, city: null })

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

  it('forgets people past the retention window too', () => {
    const db = makeDb()
    markHuman(db, 'old', NOW - 400 * DAY)
    markHuman(db, 'recent', NOW - 10 * DAY)

    pruneOldEvents(db, NOW)

    expect(db.prepare('SELECT visitor FROM humans').all()).toEqual([{ visitor: 'recent' }])
  })
})

describe('migrate', () => {
  it('treats visitors who clicked a contact or the resume before the upgrade as people', () => {
    const db = makeDb()
    insertEvent(db, event({ visitor: 'clicker', type: 'contact_click', label: 'github' }))
    insertEvent(db, event({ visitor: 'reader' }))
    insertEvent(db, event({ visitor: 'scripted', type: 'resume_download', label: 'ru', bot: true }))

    migrate(db)

    expect(db.prepare('SELECT visitor FROM humans').all()).toEqual([{ visitor: 'clicker' }])
  })
})
