import { existsSync } from 'node:fs'
import type { CityResponse, Reader } from 'maxmind'
import { open, validate } from 'maxmind'

export interface Geo {
  country: string | null
  city: string | null
}

const UNKNOWN: Geo = { country: null, city: null }

// Addresses that never carry useful location data: loopback, link-local and the
// private ranges a reverse proxy hands us when something is misconfigured.
const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80:)/i

let reader: Promise<Reader<CityResponse> | null> | undefined

function loadReader(): Promise<Reader<CityResponse> | null> {
  const file = process.env.GEOIP_DB

  if (!file || !existsSync(file)) {
    console.warn('[analytics] no GeoIP database found, skipping geo lookups')
    return Promise.resolve(null)
  }

  return open<CityResponse>(file).catch((error) => {
    console.error('[analytics] failed to open GeoIP database:', error)
    return null
  })
}

/**
 * Resolves an address to country and city using the database bundled into the
 * image. Never throws and never reaches the network: a missing or broken
 * database simply means the event is stored without a location.
 */
export async function lookupGeo(ip: string): Promise<Geo> {
  if (!ip || PRIVATE_IP.test(ip) || !validate(ip)) return UNKNOWN

  reader ??= loadReader()
  const db = await reader
  if (!db) return UNKNOWN

  try {
    const found = db.get(ip)
    if (!found) return UNKNOWN

    return {
      country: found.country?.iso_code ?? found.registered_country?.iso_code ?? null,
      city: found.city?.names?.ru ?? found.city?.names?.en ?? null
    }
  } catch (error) {
    console.error('[analytics] geo lookup failed:', error)
    return UNKNOWN
  }
}
