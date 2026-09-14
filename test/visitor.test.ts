import { describe, expect, it } from 'vitest'
import { dayKey, visitorHash } from '../server/utils/visitor'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/140.0.0.0'

describe('dayKey', () => {
  it('formats a timestamp as a UTC calendar day', () => {
    expect(dayKey(Date.UTC(2026, 8, 13, 18, 30))).toBe('2026-09-13')
  })

  it('rolls over at UTC midnight', () => {
    expect(dayKey(Date.UTC(2026, 8, 13, 23, 59, 59))).toBe('2026-09-13')
    expect(dayKey(Date.UTC(2026, 8, 14, 0, 0, 0))).toBe('2026-09-14')
  })
})

describe('visitorHash', () => {
  it('is stable for the same visitor within one day', () => {
    const a = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt')
    const b = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt')
    expect(a).toBe(b)
  })

  it('changes on the next day so visitors cannot be linked across days', () => {
    const a = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt')
    const b = visitorHash('1.2.3.4', UA, '2026-09-14', 'salt')
    expect(a).not.toBe(b)
  })

  it('separates different ip addresses and different browsers', () => {
    const base = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt')
    expect(visitorHash('1.2.3.5', UA, '2026-09-13', 'salt')).not.toBe(base)
    expect(visitorHash('1.2.3.4', 'Firefox/130.0', '2026-09-13', 'salt')).not.toBe(base)
  })

  it('changes when the secret salt changes', () => {
    const a = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt-one')
    const b = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt-two')
    expect(a).not.toBe(b)
  })

  it('is short and opaque, never containing the raw address', () => {
    const hash = visitorHash('1.2.3.4', UA, '2026-09-13', 'salt')
    expect(hash).toMatch(/^[0-9a-f]{16}$/)
    expect(hash).not.toContain('1.2.3.4')
  })
})
