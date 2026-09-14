import { describe, expect, it } from 'vitest'
import { parseUserAgent } from '../server/utils/ua'

const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1'
const FIREFOX_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0'
const YANDEX_BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 YaBrowser/25.4.0.0 Safari/537.36'

describe('parseUserAgent', () => {
  it('detects desktop Chrome on macOS', () => {
    expect(parseUserAgent(CHROME_MAC)).toEqual({
      device: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      bot: false
    })
  })

  it('detects mobile Safari on iOS', () => {
    const ua = parseUserAgent(SAFARI_IPHONE)
    expect(ua.device).toBe('mobile')
    expect(ua.browser).toBe('Safari')
    expect(ua.os).toBe('iOS')
  })

  it('detects Android phones as mobile', () => {
    expect(parseUserAgent(CHROME_ANDROID).device).toBe('mobile')
    expect(parseUserAgent(CHROME_ANDROID).os).toBe('Android')
  })

  it('detects iPad as tablet, not mobile', () => {
    expect(parseUserAgent(IPAD).device).toBe('tablet')
  })

  it('does not mistake Chrome-derived browsers for Chrome', () => {
    expect(parseUserAgent(EDGE).browser).toBe('Edge')
    expect(parseUserAgent(YANDEX_BROWSER).browser).toBe('Yandex Browser')
  })

  it('detects Firefox on Windows', () => {
    expect(parseUserAgent(FIREFOX_WIN)).toEqual({
      device: 'desktop',
      browser: 'Firefox',
      os: 'Windows',
      bot: false
    })
  })

  it.each([
    ['Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['TelegramBot (like TwitterBot)'],
    ['WhatsApp/2.23'],
    ['facebookexternalhit/1.1'],
    ['Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/140.0.0.0'],
    ['curl/8.7.1'],
    ['python-requests/2.32.3']
  ])('flags %s as a bot', (ua) => {
    expect(parseUserAgent(ua).bot).toBe(true)
  })

  it('does not flag ordinary browsers as bots', () => {
    for (const ua of [CHROME_MAC, SAFARI_IPHONE, FIREFOX_WIN, EDGE, YANDEX_BROWSER]) {
      expect(parseUserAgent(ua).bot).toBe(false)
    }
  })

  it('survives a missing user agent', () => {
    expect(parseUserAgent(undefined)).toEqual({
      device: 'desktop',
      browser: null,
      os: null,
      bot: true
    })
  })
})
