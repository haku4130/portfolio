export interface UaInfo {
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string | null
  os: string | null
  bot: boolean
}

// Crawlers, link previewers and scripted clients. Anything matching is still
// recorded, just flagged, so the dashboard can hide it without losing the fact
// that a link preview was generated (a Telegram preview means someone pasted
// the link somewhere).
const BOT_RE = /bot\b|bots\b|crawler|crawling|spider|slurp|headless|phantomjs|puppeteer|playwright|lighthouse|monitor|uptime|pingdom|curl\/|wget\/|python-requests|python-urllib|go-http-client|java\/|okhttp|axios\/|node-fetch|got\/|libwww|scrapy|facebookexternalhit|whatsapp|discordbot|slackbot|vkshare|skypeuripreview|telegram|twitterbot|linkedinbot|embedly|quora link preview|redditbot|applebot|ia_archiver|semrush|ahrefs|mj12|dotbot|petalsearch|bytespider/i

// Ordered most specific first: Edge, Opera and Yandex Browser all carry
// "Chrome" in their user agent, and Chrome itself carries "Safari".
const BROWSERS: Array<[RegExp, string]> = [
  [/\bEdgA?\//, 'Edge'],
  [/\bOPR\/|\bOpera\//, 'Opera'],
  [/\bYaBrowser\//, 'Yandex Browser'],
  [/\bVivaldi\//, 'Vivaldi'],
  [/\bBrave\//, 'Brave'],
  [/\bSamsungBrowser\//, 'Samsung Internet'],
  [/\bFirefox\/|\bFxiOS\//, 'Firefox'],
  [/\bChrome\/|\bCriOS\//, 'Chrome'],
  [/\bSafari\//, 'Safari']
]

const OSES: Array<[RegExp, string]> = [
  [/\bWindows NT\b|\bWindows\b/, 'Windows'],
  [/\biPhone\b|\biPad\b|\biPod\b|\bCPU OS\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bLinux\b|\bX11\b/, 'Linux']
]

function match(ua: string, table: Array<[RegExp, string]>): string | null {
  for (const [re, name] of table) {
    if (re.test(ua)) return name
  }
  return null
}

export function parseUserAgent(userAgent: string | undefined | null): UaInfo {
  // A request with no user agent at all is never a real browser.
  if (!userAgent) {
    return { device: 'desktop', browser: null, os: null, bot: true }
  }

  const bot = BOT_RE.test(userAgent)
  const tablet = /\bTablet\b|\biPad\b|\bPlayBook\b|\bSilk\b|Android(?!.*\bMobile\b)/i.test(userAgent)
  const mobile = /\bMobile\b|\biPhone\b|\biPod\b|\bAndroid\b|\bIEMobile\b|\bOpera Mini\b/i.test(userAgent)

  return {
    device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
    browser: match(userAgent, BROWSERS),
    os: match(userAgent, OSES),
    bot
  }
}
