const ENGAGE_EVENTS = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'keydown']

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()

  rememberEntry()

  // The first page view is already counted by the server middleware; only
  // navigations that happen after hydration need to be reported from here.
  let hydrated = false
  nuxtApp.hook('app:mounted', () => {
    hydrated = true
  })

  router.afterEach((to) => {
    if (hydrated) trackEvent('pageview', undefined, to.path)
  })

  // The dashboard only counts visitors who did something a person does. Real
  // input events, not `scroll`: crawlers that render the page scroll it
  // programmatically, but none of them move a pointer or press a key.
  const engage = () => {
    for (const type of ENGAGE_EVENTS) removeEventListener(type, engage, true)
    trackEvent('engage')
  }
  for (const type of ENGAGE_EVENTS) {
    addEventListener(type, engage, { capture: true, passive: true })
  }
})
