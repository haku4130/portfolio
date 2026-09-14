import { parseEventInput } from '../utils/request'
import { recordEvent } from '../utils/track'

/**
 * Beacon endpoint for everything the server cannot observe on its own: client
 * side navigation, resume downloads and contact clicks. Always answers 204,
 * including for rejected bodies — it is a fire-and-forget sink, and telling a
 * caller what passed validation only helps someone probing it.
 */
export default defineEventHandler(async (event) => {
  const input = parseEventInput(await readBody(event).catch(() => null))

  if (input) await recordEvent(event, input)

  setResponseStatus(event, 204)
  return null
})
