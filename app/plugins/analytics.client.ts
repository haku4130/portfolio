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
})
