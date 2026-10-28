import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'

export type EventType = 'pageview' | 'resume_download' | 'contact_click'

export interface AnalyticsEvent {
  ts: number
  type: EventType
  path: string | null
  locale: string | null
  label: string | null
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  country: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  visitor: string
  bot: boolean
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY,
    ts           INTEGER NOT NULL,
    type         TEXT    NOT NULL,
    path         TEXT,
    locale       TEXT,
    label        TEXT,
    referrer     TEXT,
    utm_source   TEXT,
    utm_medium   TEXT,
    utm_campaign TEXT,
    country      TEXT,
    city         TEXT,
    device       TEXT,
    browser      TEXT,
    os           TEXT,
    visitor      TEXT    NOT NULL,
    bot          INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
  CREATE INDEX IF NOT EXISTS idx_events_type_ts ON events (type, ts);
  CREATE TABLE IF NOT EXISTS humans (
    visitor TEXT    PRIMARY KEY,
    ts      INTEGER NOT NULL
  );
`

// A click on a contact or the resume is proof of a person, so visitors who did
// either before the humans table existed are carried over. Idempotent, and
// cheap enough to simply run on every start.
const BACKFILL_HUMANS = `
  INSERT OR IGNORE INTO humans (visitor, ts)
  SELECT visitor, MIN(ts) FROM events
  WHERE type IN ('resume_download', 'contact_click') AND bot = 0
  GROUP BY visitor
`

export const RETENTION_DAYS = 365

export function migrate(db: Database.Database): void {
  db.exec(SCHEMA)
  db.exec(BACKFILL_HUMANS)
}

export function insertEvent(db: Database.Database, event: AnalyticsEvent): void {
  db.prepare(`
    INSERT INTO events (
      ts, type, path, locale, label, referrer,
      utm_source, utm_medium, utm_campaign,
      country, city, device, browser, os, visitor, bot
    ) VALUES (
      @ts, @type, @path, @locale, @label, @referrer,
      @utmSource, @utmMedium, @utmCampaign,
      @country, @city, @device, @browser, @os, @visitor, @bot
    )
  `).run({ ...event, bot: event.bot ? 1 : 0 })
}

/**
 * Records that this visitor has done something only a person does: moved the
 * pointer, touched, scrolled with a wheel, pressed a key. Most of the traffic
 * is crawlers and scanners in cloud networks posing as an ordinary browser, and
 * they never do any of that, so this, not the user agent, is what decides
 * whether a visit shows up on the dashboard.
 */
export function markHuman(db: Database.Database, visitor: string, ts: number): void {
  db.prepare('INSERT OR IGNORE INTO humans (visitor, ts) VALUES (?, ?)').run(visitor, ts)
}

/** Keeps the file from growing without bound. Runs once at startup. */
export function pruneOldEvents(db: Database.Database, now = Date.now()): number {
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000
  db.prepare('DELETE FROM humans WHERE ts < ?').run(cutoff)
  return db.prepare('DELETE FROM events WHERE ts < ?').run(cutoff).changes
}

let instance: Database.Database | undefined

export function useAnalyticsDb(): Database.Database {
  if (instance) return instance

  const file = process.env.ANALYTICS_DB || '.data/analytics.db'
  mkdirSync(dirname(file), { recursive: true })

  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  migrate(db)
  pruneOldEvents(db)

  instance = db
  return db
}
