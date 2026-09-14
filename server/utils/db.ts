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
`

export const RETENTION_DAYS = 365

export function migrate(db: Database.Database): void {
  db.exec(SCHEMA)
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

/** Keeps the file from growing without bound. Runs once at startup. */
export function pruneOldEvents(db: Database.Database, now = Date.now()): number {
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000
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
