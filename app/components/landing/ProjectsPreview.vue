<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexRuCollectionItem
}>()

const { locale, t } = useI18n()
const localePath = useLocalePath()

// Тизер, а не копия страницы проектов: двух карточек хватает, чтобы показать,
// что за ссылкой есть на что посмотреть, и остаётся повод туда перейти.
const { data: projects } = await useAsyncData(
  `projects-preview-${locale.value}`,
  () => {
    return queryCollection(locale.value === 'en' ? 'projectsEn' : 'projectsRu')
      .order('date', 'DESC')
      .limit(2)
      .all()
  },
  { watch: [locale] }
)
</script>

<template>
  <UPageSection
    :title="page.projects.title"
    :description="page.projects.description"
    :ui="{
      container: 'px-0 pt-0! gap-4 sm:gap-4',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'text-left mt-2 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <div class="grid gap-6 sm:grid-cols-2">
      <Motion
        v-for="(project, index) in projects"
        :key="project.title"
        :initial="{ opacity: 0, transform: 'translateY(10px)' }"
        :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.1 * index }"
        :in-view-options="{ once: true }"
      >
        <!-- Ведёт на страницу проектов, а не на сайт проекта: задача блока –
             довести до /projects, ссылки наружу есть уже там. -->
        <ULink :to="localePath('/projects')" class="group block">
          <div class="overflow-hidden rounded-lg bg-elevated/60">
            <NuxtImg
              :src="project.image"
              :alt="project.title"
              width="800"
              height="384"
              sizes="100vw sm:50vw"
              format="webp"
              loading="lazy"
              class="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div class="mt-3 flex items-baseline gap-2">
            <h3 class="text-base font-medium text-highlighted">
              {{ project.title }}
            </h3>
            <span class="text-sm text-muted">
              {{ new Date(project.date).getFullYear() }}
            </span>
          </div>

          <p class="mt-1 line-clamp-2 text-sm text-muted">
            {{ project.description }}
          </p>

          <div v-if="project.tags?.length" class="mt-2 flex flex-wrap gap-1.5">
            <UBadge
              v-for="tag in project.tags.slice(0, 3)"
              :key="tag"
              :label="tag"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </div>
        </ULink>
      </Motion>
    </div>

    <ULink
      :to="localePath('/projects')"
      class="group mt-2 flex items-center text-sm text-primary"
    >
      {{ t('projects.all') }}
      <UIcon
        name="i-lucide-arrow-right"
        class="size-4 text-primary transition-all opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
      />
    </ULink>
  </UPageSection>
</template>
