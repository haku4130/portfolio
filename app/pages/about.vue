<script setup lang="ts">
const { locale } = useI18n()
const { data: page } = await useAsyncData(
  `about-${locale.value}`,
  async () => {
    const doc = await queryCollection(
      locale.value === 'en' ? 'aboutEn' : 'aboutRu'
    ).first()
    if (!doc) return null
    const { parseMarkdown } = await import('@nuxtjs/mdc/runtime')
    return { ...doc, content: await parseMarkdown(doc.content) }
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

const { global } = useAppConfig()

const title = page.value?.title
const description = page.value?.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Portfolio', { title, description })
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      orientation="horizontal"
      :ui="{
        container: 'lg:flex sm:flex-row items-center',
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <NuxtImg
        :src="global.picture?.light!"
        :alt="global.picture?.alt!"
        width="288"
        height="288"
        sizes="144px"
        format="webp"
        preload
        fetchpriority="high"
        class="sm:rotate-4 size-36 rounded-lg ring ring-default ring-offset-3 ring-offset-bg"
      />
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <div
        class="space-y-4 text-muted leading-relaxed [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-highlighted [&_strong]:font-medium [&_strong]:text-highlighted [&_a]:text-primary [&_a]:font-medium [&_a:hover]:underline"
      >
        <MDC :value="page.content" />
      </div>
      <div class="flex flex-row justify-center items-center py-10 -space-x-8">
        <PolaroidItem
          v-for="(image, index) in page.images"
          :key="index"
          :image="image"
          :index
        />
      </div>
    </UPageSection>
  </UPage>
</template>
