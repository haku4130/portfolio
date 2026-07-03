<script setup lang="ts">
const { locale } = useI18n()
const { data: page } = await useAsyncData(
  `index-${locale.value}`,
  async () => {
    const doc = await queryCollection(
      locale.value === 'en' ? 'indexEn' : 'indexRu'
    ).first()
    if (!doc) return null
    const { parseMarkdown } = await import('@nuxtjs/mdc/runtime')
    await Promise.all(
      doc.faq.categories.flatMap(category =>
        category.questions.map(async question => {
          question.content = (await parseMarkdown(
            question.content
          )) as unknown as string
        })
      )
    )
    return doc
  },
  { watch: [locale] }
)
if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true
  })
}

useSeoMeta({
  title: page.value?.seo.title || page.value?.title,
  ogTitle: page.value?.seo.title || page.value?.title,
  description: page.value?.seo.description || page.value?.description,
  ogDescription: page.value?.seo.description || page.value?.description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/portfolio-light.png'
})
</script>

<template>
  <UPage v-if="page">
    <LandingHero :page />
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingAbout :page />
    </UPageSection>
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingWorkExperience :page />
    </UPageSection>
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingEducation :page />
    </UPageSection>
    <UPageSection :ui="{ container: 'pt-0!' }">
      <LandingTechStack :page />
    </UPageSection>
    <LandingTestimonials :page />
    <LandingFAQ :page />
  </UPage>
</template>
