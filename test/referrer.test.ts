import { describe, expect, it } from 'vitest'
import { normalizeReferrer, parseUtm } from '../server/utils/referrer'

describe('normalizeReferrer', () => {
  it('returns direct when there is no referrer', () => {
    expect(normalizeReferrer(undefined)).toBe('direct')
    expect(normalizeReferrer('')).toBe('direct')
    expect(normalizeReferrer(null)).toBe('direct')
  })

  it('returns direct for unparseable referrers', () => {
    expect(normalizeReferrer('not a url')).toBe('direct')
  })

  it('strips protocol, www and path', () => {
    expect(normalizeReferrer('https://www.hh.ru/vacancy/123?utm=1')).toBe('hh.ru')
  })

  it('lowercases the host', () => {
    expect(normalizeReferrer('https://T.ME/channel')).toBe('t.me')
  })

  it('treats navigation from our own host as direct', () => {
    expect(normalizeReferrer('https://aosipov.dev/projects', 'aosipov.dev')).toBe('direct')
    expect(normalizeReferrer('https://www.aosipov.dev/', 'aosipov.dev')).toBe('direct')
  })

  it('ignores the port when comparing against our own host', () => {
    expect(normalizeReferrer('http://localhost:3000/projects', 'localhost:3000')).toBe('direct')
    expect(normalizeReferrer('https://aosipov.dev/', 'aosipov.dev:443')).toBe('direct')
  })

  it('keeps other hosts when a self host is given', () => {
    expect(normalizeReferrer('https://github.com/haku4130', 'aosipov.dev')).toBe('github.com')
  })
})

describe('parseUtm', () => {
  it('extracts the three utm fields', () => {
    expect(parseUtm('/?utm_source=hh.ru&utm_medium=cv&utm_campaign=backend')).toEqual({
      source: 'hh.ru',
      medium: 'cv',
      campaign: 'backend'
    })
  })

  it('returns nulls when the url carries no utm tags', () => {
    expect(parseUtm('/projects')).toEqual({ source: null, medium: null, campaign: null })
  })

  it('fills only the fields that are present', () => {
    expect(parseUtm('/?utm_source=telegram')).toEqual({
      source: 'telegram',
      medium: null,
      campaign: null
    })
  })

  it('ignores blank values', () => {
    expect(parseUtm('/?utm_source=&utm_medium=%20')).toEqual({
      source: null,
      medium: null,
      campaign: null
    })
  })

  it('truncates absurdly long values so one visitor cannot bloat the database', () => {
    const long = 'a'.repeat(500)
    expect(parseUtm(`/?utm_source=${long}`).source).toHaveLength(64)
  })

  it('survives a malformed query string', () => {
    expect(parseUtm('/?%')).toEqual({ source: null, medium: null, campaign: null })
  })
})
