import type Database from 'better-sqlite3'
import type { EventType } from './db'

export type Period = '24h' | '7d' | '30d' | 'all'

export const PERIODS: Period[] = ['24h', '7d', '30d', 'all']

const DAY = 24 * 60 * 60 * 1000
const WINDOWS: Record<Exclude<Period, 'all'>, number> = {
  '24h': DAY,
  '7d': 7 * DAY,
  '30d': 30 * DAY
}
const TOP_LIMIT = 10
const RECENT_LIMIT = 50

export interface Counts {
  views: number
  visitors: number
}

export interface RecentEvent {
  ts: number
  type: EventType
  label: string | null
  path: string | null
  country: string | null
  city: string | null
  referrer: string | null
  device: string | null
  browser: string | null
  os: string | null
  bot: number
}

export interface Summary {
  period: Period
  range: { from: number, to: number }
  totals: { day: Counts, week: Counts, month: Counts }
  resume: { ru: number, en: number, total: number }
  contacts: Array<{ label: string | null, count: number }>
  timeline: Array<{ date: string, views: number, visitors: number }>
  pages: Array<{ path: string | null, views: number }>
  referrers: Array<{ source: string | null, views: number }>
  countries: Array<{ country: string | null, views: number }>
  cities: Array<{ city: string | null, country: string | null, views: number }>
  /** How many distinct values exist, not just the ones that fit in the top lists. */
  distinct: { referrers: number, countries: number, cities: number }
  recent: RecentEvent[]
}

export function periodRange(period: Period, now: number): { from: number, to: number } {
  if (period === 'all') return { from: 0, to: now }

  return { from: now - WINDOWS[period], to: now }
}

/**
 * `bot = 0` is not a filter we can skip when bots are included, because the
 * column is never null — so the clause is simply dropped instead.
 */
function botClause(bots: boolean): string {
  return bots ? '' : ' AND bot = 0'
}

function counts(db: Database.Database, from: number, to: number, bots: boolean): Counts {
  const row = db.prepare(`
    SELECT
      COUNT(CASE WHEN type = 'pageview' THEN 1 END) AS views,
      COUNT(DISTINCT visitor)                       AS visitors
    FROM events
    WHERE ts > ? AND ts <= ?${botClause(bots)}
  `).get(from, to) as Counts

  return { views: row.views, visitors: row.visitors }
}

function isoDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

/**
 * SQL only returns days that saw traffic. A chart that plots those points
 * evenly would silently squeeze a quiet week into the same width as a busy one,
 * so every day in the range gets a row, zero or not.
 *
 * For an open-ended range the series starts at the first day with data: there
 * is nothing to show between the epoch and the site's first visit.
 */
function fillGaps(
  rows: Summary['timeline'],
  from: number | undefined,
  to: number
): Summary['timeline'] {
  const start = from === undefined ? rows[0]?.date : isoDay(from)
  if (!start) return []

  const byDate = new Map(rows.map(row => [row.date, row]))
  const filled: Summary['timeline'] = []
  const end = isoDay(to)

  for (let day = new Date(`${start}T00:00:00Z`); isoDay(day.getTime()) <= end;) {
    const date = isoDay(day.getTime())
    filled.push(byDate.get(date) ?? { date, views: 0, visitors: 0 })
    day = new Date(day.getTime() + DAY)
  }

  return filled
}

/**
 * Counts distinct groups the same way the top lists group them, so the header
 * count matches the rows -- including the "unknown" group, which `COUNT(DISTINCT
 * col)` would silently drop. The top lists are capped, so this cannot be
 * derived on the client.
 */
function countDistinct(
  db: Database.Database,
  columns: string,
  scope: readonly [number, number],
  bot: string
): number {
  const row = db.prepare(`
    SELECT COUNT(*) AS n FROM (
      SELECT DISTINCT ${columns}
      FROM events
      WHERE type = 'pageview' AND ts > ? AND ts <= ?${bot}
    )
  `).get(...scope) as { n: number }

  return row.n
}

export function buildSummary(
  db: Database.Database,
  options: { period: Period, bots: boolean, now?: number }
): Summary {
  const now = options.now ?? Date.now()
  const { period, bots } = options
  const range = periodRange(period, now)
  const scope = [range.from, range.to] as const
  const bot = botClause(bots)

  const resumeRows = db.prepare(`
    SELECT label, COUNT(*) AS count
    FROM events
    WHERE type = 'resume_download' AND ts > ? AND ts <= ?${bot}
    GROUP BY label
  `).all(...scope) as Array<{ label: string | null, count: number }>

  const ru = resumeRows.find(r => r.label === 'ru')?.count ?? 0
  const en = resumeRows.find(r => r.label === 'en')?.count ?? 0

  return {
    period,
    range,

    totals: {
      day: counts(db, now - DAY, now, bots),
      week: counts(db, now - 7 * DAY, now, bots),
      month: counts(db, now - 30 * DAY, now, bots)
    },

    resume: { ru, en, total: resumeRows.reduce((sum, r) => sum + r.count, 0) },

    contacts: db.prepare(`
      SELECT label, COUNT(*) AS count
      FROM events
      WHERE type = 'contact_click' AND ts > ? AND ts <= ?${bot}
      GROUP BY label
      ORDER BY count DESC, label ASC
      LIMIT ?
    `).all(...scope, TOP_LIMIT) as Summary['contacts'],

    timeline: fillGaps(
      db.prepare(`
        SELECT
          DATE(ts / 1000, 'unixepoch')                  AS date,
          COUNT(CASE WHEN type = 'pageview' THEN 1 END) AS views,
          COUNT(DISTINCT visitor)                       AS visitors
        FROM events
        WHERE ts > ? AND ts <= ?${bot}
        GROUP BY date
        ORDER BY date ASC
      `).all(...scope) as Summary['timeline'],
      period === 'all' ? undefined : range.from,
      range.to
    ),

    pages: db.prepare(`
      SELECT path, COUNT(*) AS views
      FROM events
      WHERE type = 'pageview' AND ts > ? AND ts <= ?${bot}
      GROUP BY path
      ORDER BY views DESC, path ASC
      LIMIT ?
    `).all(...scope, TOP_LIMIT) as Summary['pages'],

    referrers: db.prepare(`
      SELECT referrer AS source, COUNT(*) AS views
      FROM events
      WHERE type = 'pageview' AND ts > ? AND ts <= ?${bot}
      GROUP BY referrer
      ORDER BY views DESC, source ASC
      LIMIT ?
    `).all(...scope, TOP_LIMIT) as Summary['referrers'],

    countries: db.prepare(`
      SELECT country, COUNT(*) AS views
      FROM events
      WHERE type = 'pageview' AND ts > ? AND ts <= ?${bot}
      GROUP BY country
      ORDER BY views DESC, country ASC
      LIMIT ?
    `).all(...scope, TOP_LIMIT) as Summary['countries'],

    cities: db.prepare(`
      SELECT city, country, COUNT(*) AS views
      FROM events
      WHERE type = 'pageview' AND ts > ? AND ts <= ?${bot}
      GROUP BY city, country
      ORDER BY views DESC, city ASC
      LIMIT ?
    `).all(...scope, TOP_LIMIT) as Summary['cities'],

    distinct: {
      referrers: countDistinct(db, 'referrer', scope, bot),
      countries: countDistinct(db, 'country', scope, bot),
      cities: countDistinct(db, 'city, country', scope, bot)
    },

    recent: db.prepare(`
      SELECT ts, type, label, path, country, city, referrer, device, browser, os, bot
      FROM events
      WHERE ts > ? AND ts <= ?${bot}
      ORDER BY ts DESC
      LIMIT ?
    `).all(...scope, RECENT_LIMIT) as RecentEvent[]
  }
}
