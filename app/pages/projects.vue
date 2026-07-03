<script setup lang="ts">
const { locale, t } = useI18n()

const { data: page } = await useAsyncData(
  `projects-page-${locale.value}`,
  () => {
    return queryCollection(
      locale.value === 'en' ? 'projectsPageEn' : 'projectsPageRu'
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

const { data: projects } = await useAsyncData(
  `projects-${locale.value}`,
  () => {
    return queryCollection(locale.value === 'en' ? 'projectsEn' : 'projectsRu')
      .order('date', 'DESC')
      .all()
  },
  { watch: [locale] }
)

const { global } = useAppConfig()

const title = computed(() => page.value?.title)
const description = computed(() => page.value?.description)

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImage('Portfolio', {
  title: title.value,
  description: description.value
})
</script>

<template>
  <UPage v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
      :links="page.links"
      :ui="{
        title: 'mx-0! text-left',
        description: 'mx-0! text-left',
        links: 'justify-start'
      }"
    >
      <template #links>
        <div v-if="page.links" class="flex items-center gap-2">
          <UButton
            :label="page.links[0]?.label"
            :to="global.meetingLink"
            v-bind="page.links[0]"
          />
          <UButton :to="`mailto:${global.email}`" v-bind="page.links[1]" />
        </div>
      </template>
    </UPageHero>
    <UPageSection
      :ui="{
        container: 'pt-0!'
      }"
    >
      <Motion
        v-for="(project, index) in projects"
        :key="project.title"
        :initial="{ opacity: 0, transform: 'translateY(10px)' }"
        :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.2 * index }"
        :in-view-options="{ once: true }"
      >
        <UPageCard
          :title="project.title"
          :description="project.description"
          :to="project.url"
          target="_blank"
          orientation="horizontal"
          variant="naked"
          :reverse="index % 2 === 1"
          class="group"
          :ui="{
            wrapper: 'max-sm:order-last'
          }"
        >
          <template #leading>
            <span class="text-sm text-muted">
              {{ new Date(project.date).getFullYear() }}
            </span>
          </template>
          <template #footer>
            <div class="flex flex-col gap-3">
              <div v-if="project.tags?.length" class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="tag in project.tags"
                  :key="tag"
                  :label="tag"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                />
              </div>
              <ULink
                :to="project.url"
                target="_blank"
                class="text-sm text-primary flex items-center"
              >
                {{ t('projects.view') }}
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
                />
              </ULink>
            </div>
          </template>
          <NuxtImg
            :src="project.image"
            :alt="project.title"
            width="800"
            height="384"
            sizes="(max-width: 640px) 100vw, 50vw"
            format="webp"
            loading="lazy"
            class="object-cover w-full h-48 rounded-lg"
          />
        </UPageCard>
      </Motion>
    </UPageSection>
  </UPage>
</template>
