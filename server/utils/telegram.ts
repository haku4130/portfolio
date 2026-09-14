import type { AnalyticsEvent } from './db'

const QUIET_WINDOW = 10 * 60 * 1000

const CONTACT_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  email: 'почте',
  meeting: 'ссылке на встречу'
}

/**
 * Decides which events are worth a push. Ordinary page views are deliberately
 * silent — only a visit through a tagged link (one sent to a specific person)
 * is interesting enough to interrupt for.
 */
export function createNotifier(quietWindow: number = QUIET_WINDOW) {
  const seen = new Map<string, number>()

  return {
    shouldNotify(event: AnalyticsEvent, now: number = Date.now()): boolean {
      if (event.bot) return false

      const interesting = event.type !== 'pageview' || Boolean(event.utmSource)
      if (!interesting) return false

      // Drop expired entries first, otherwise the map grows for as long as the
      // process lives.
      for (const [key, at] of seen) {
        if (now - at >= quietWindow) seen.delete(key)
      }

      const key = `${event.visitor}:${event.type}:${event.label ?? ''}`
      const last = seen.get(key)
      if (last !== undefined && now - last < quietWindow) return false

      seen.set(key, now)
      return true
    },

    size(): number {
      return seen.size
    }
  }
}

function place(event: AnalyticsEvent): string | null {
  return [event.city, event.country].filter(Boolean).join(', ') || null
}

function client(event: AnalyticsEvent): string | null {
  return [event.browser, event.device].filter(Boolean).join(', ') || null
}

export function formatEvent(event: AnalyticsEvent): string {
  const lines: string[] = []

  if (event.type === 'resume_download') {
    lines.push(`📄 Скачали резюме (${(event.label ?? '').toUpperCase()})`)
  } else if (event.type === 'contact_click') {
    const contact = CONTACT_LABELS[event.label ?? ''] ?? event.label ?? 'контакту'
    lines.push(`🔗 Клик по ${contact}`)
  } else {
    lines.push('👀 Открыли сайт по именной ссылке')
  }

  const details = [place(event), client(event)].filter(Boolean).join(' · ')
  if (details) lines.push(details)

  if (event.path) lines.push(`Страница: ${event.path}`)

  const source = event.utmSource ?? (event.referrer !== 'direct' ? event.referrer : null)
  if (source) {
    const campaign = event.utmCampaign ? ` / ${event.utmCampaign}` : ''
    lines.push(`Источник: ${source}${campaign}`)
  }

  return lines.join('\n')
}

/** A short, token-free description of a failure. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown error'

  const cause = error.cause instanceof Error ? ` (${error.cause.name})` : ''
  return `${error.name}${cause}`
}

/**
 * Fire and forget: a missing token, a blocked bot or a network hiccup must
 * never turn into a failed page load.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await $fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      },
      timeout: 5000
    })
  } catch (error) {
    // Never log the error object: the request URL carries the bot token, and
    // fetch errors quote that URL verbatim in their message.
    console.error(`[analytics] telegram notification failed: ${describe(error)}`)
  }
}
