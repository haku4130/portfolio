<script setup lang="ts">
const { locale } = useI18n()
const { data: page } = await useAsyncData(
  `index-${locale.value}`,
  () => {
    return queryCollection(
      locale.value === 'en' ? 'indexEn' : 'indexRu'
    ).first()
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
    <!--
      Блок FAQ скрыт: вместо него внизу главной стоит тизер проектов.
      Чтобы вернуть – поставить <LandingFAQ :page /> сюда и вернуть в
      useAsyncData выше разбор markdown у page.faq (LandingFAQ ждёт
      question.content уже распаршенным через @nuxtjs/mdc/runtime).
      Сам компонент, контент faq: в index.yml и его схема на месте.
    -->
    <LandingProjectsPreview :page />
  </UPage>
</template>
