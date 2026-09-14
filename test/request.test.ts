import { describe, expect, it } from 'vitest'
import { clientIp, createRateLimiter, parseEventInput, sanitizePath } from '../server/utils/request'

describe('clientIp', () => {
  it('takes the first address from x-forwarded-for', () => {
    expect(clientIp({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' })).toBe('203.0.113.7')
  })

  it('trims whitespace around the address', () => {
    expect(clientIp({ 'x-forwarded-for': '  203.0.113.7 ' })).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip', () => {
    expect(clientIp({ 'x-real-ip': '203.0.113.9' })).toBe('203.0.113.9')
  })

  it('returns an empty string when the proxy sent nothing usable', () => {
    expect(clientIp({})).toBe('')
    expect(clientIp({ 'x-forwarded-for': '' })).toBe('')
  })
})

describe('sanitizePath', () => {
  it('keeps an ordinary path', () => {
    expect(sanitizePath('/projects')).toBe('/projects')
  })

  it('drops the query string and hash, which may carry personal data', () => {
    expect(sanitizePath('/projects?utm_source=hh&token=secret')).toBe('/projects')
    expect(sanitizePath('/about#contacts')).toBe('/about')
  })

  it('rejects anything that is not a site-relative path', () => {
    expect(sanitizePath('https://evil.example/x')).toBeNull()
    expect(sanitizePath('//evil.example')).toBeNull()
    expect(sanitizePath('javascript:alert(1)')).toBeNull()
    expect(sanitizePath('')).toBeNull()
    expect(sanitizePath(undefined)).toBeNull()
  })

  it('folds a trailing slash into the same page', () => {
    expect(sanitizePath('/projects/')).toBe('/projects')
    expect(sanitizePath('/en/projects/')).toBe('/en/projects')
    expect(sanitizePath('/projects/?utm_source=hh')).toBe('/projects')
  })

  it('keeps the root path as a single slash', () => {
    expect(sanitizePath('/')).toBe('/')
  })

  it('truncates very long paths', () => {
    expect(sanitizePath(`/${'a'.repeat(500)}`)).toHaveLength(200)
  })
})

describe('parseEventInput', () => {
  it('accepts a well formed page view', () => {
    expect(parseEventInput({ type: 'pageview', path: '/projects', locale: 'en' })).toEqual({
      type: 'pageview',
      path: '/projects',
      locale: 'en',
      label: null,
      ref: null,
      query: null
    })
  })

  it('carries the session entry referrer and query through', () => {
    const input = parseEventInput({
      type: 'resume_download',
      label: 'en',
      path: '/',
      ref: 'https://hh.ru/vacancy/1',
      query: '?utm_source=hh.ru'
    })

    expect(input?.ref).toBe('https://hh.ru/vacancy/1')
    expect(input?.query).toBe('?utm_source=hh.ru')
  })

  it('ignores a referrer or query of the wrong shape instead of failing', () => {
    const input = parseEventInput({ type: 'pageview', path: '/', ref: 42, query: {} })

    expect(input).not.toBeNull()
    expect(input?.ref).toBeNull()
    expect(input?.query).toBeNull()
  })

  it('caps referrer and query length', () => {
    const input = parseEventInput({
      type: 'pageview',
      path: '/',
      ref: `https://x.example/${'a'.repeat(1000)}`,
      query: `?utm_source=${'b'.repeat(1000)}`
    })

    expect(input!.ref!.length).toBeLessThanOrEqual(300)
    expect(input!.query!.length).toBeLessThanOrEqual(300)
  })

  it('accepts the known resume and contact labels', () => {
    expect(parseEventInput({ type: 'resume_download', label: 'en', path: '/' })?.label).toBe('en')
    expect(parseEventInput({ type: 'contact_click', label: 'github', path: '/' })?.label).toBe('github')
  })

  it('rejects unknown event types and labels so the table cannot be polluted', () => {
    expect(parseEventInput({ type: 'whatever', path: '/' })).toBeNull()
    expect(parseEventInput({ type: 'contact_click', label: 'made-up', path: '/' })).toBeNull()
    expect(parseEventInput({ type: 'resume_download', label: 'de', path: '/' })).toBeNull()
  })

  it('requires a label for events that are meaningless without one', () => {
    expect(parseEventInput({ type: 'resume_download', path: '/' })).toBeNull()
    expect(parseEventInput({ type: 'contact_click', path: '/' })).toBeNull()
  })

  it('rejects an unknown locale but tolerates a missing one', () => {
    expect(parseEventInput({ type: 'pageview', path: '/', locale: 'de' })).toBeNull()
    expect(parseEventInput({ type: 'pageview', path: '/' })?.locale).toBeNull()
  })

  it('rejects junk bodies outright', () => {
    expect(parseEventInput(null)).toBeNull()
    expect(parseEventInput('pageview')).toBeNull()
    expect(parseEventInput({})).toBeNull()
    expect(parseEventInput({ type: 'pageview', path: 'https://evil.example' })).toBeNull()
  })
})

describe('createRateLimiter', () => {
  it('allows traffic up to the limit and blocks the excess', () => {
    const limiter = createRateLimiter(3, 60_000)

    expect(limiter.allow('visitor', 0)).toBe(true)
    expect(limiter.allow('visitor', 1)).toBe(true)
    expect(limiter.allow('visitor', 2)).toBe(true)
    expect(limiter.allow('visitor', 3)).toBe(false)
  })

  it('starts a fresh allowance once the window rolls over', () => {
    const limiter = createRateLimiter(2, 60_000)

    expect(limiter.allow('visitor', 0)).toBe(true)
    expect(limiter.allow('visitor', 0)).toBe(true)
    expect(limiter.allow('visitor', 30_000)).toBe(false)
    expect(limiter.allow('visitor', 61_000)).toBe(true)
  })

  it('counts each visitor separately', () => {
    const limiter = createRateLimiter(1, 60_000)

    expect(limiter.allow('a', 0)).toBe(true)
    expect(limiter.allow('b', 0)).toBe(true)
    expect(limiter.allow('a', 0)).toBe(false)
  })
})
