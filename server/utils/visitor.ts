import { createHash } from 'node:crypto'

/** UTC calendar day, the rotation window for visitor hashes. */
export function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

/**
 * An opaque per-day identifier for a visitor. The raw address never reaches
 * disk, and because the day is part of the input the same person cannot be
 * followed from one day to the next.
 */
export function visitorHash(
  ip: string,
  userAgent: string,
  day: string,
  salt: string
): string {
  return createHash('sha256')
    .update(`${salt}|${day}|${ip}|${userAgent}`)
    .digest('hex')
    .slice(0, 16)
}
