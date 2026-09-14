import { useAnalyticsDb } from '../../utils/db'
import type { Period } from '../../utils/stats'
import { PERIODS, buildSummary } from '../../utils/stats'

/**
 * Read model for the dashboard. Access is enforced by basic auth at the proxy,
 * which covers both this route and the page that calls it.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const requested = String(query.period ?? '7d') as Period
  const period = PERIODS.includes(requested) ? requested : '7d'
  const bots = query.bots === '1' || query.bots === 'true'

  setResponseHeader(event, 'Cache-Control', 'no-store')

  return buildSummary(useAnalyticsDb(), { period, bots })
})
