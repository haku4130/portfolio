<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

const props = defineProps<{
  page: IndexRuCollectionItem
}>()

const { t, locale } = useI18n()

// Отсчёт стажа ведётся с мая 2023 года
const CAREER_START = new Date(2023, 4, 1)

const experienceMonths = computed(() => {
  const now = new Date()
  const months =
    (now.getFullYear() - CAREER_START.getFullYear()) * 12 +
    (now.getMonth() - CAREER_START.getMonth())
  return Math.max(0, months)
})

function pluralRu(n: number, forms: [string, string, string]) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return forms[0]
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1]
  return forms[2]
}

const durationText = computed(() => {
  const years = Math.floor(experienceMonths.value / 12)
  const months = experienceMonths.value % 12
  const parts: string[] = []

  if (locale.value === 'en') {
    if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
    if (months) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  } else {
    if (years) parts.push(`${years} ${pluralRu(years, ['год', 'года', 'лет'])}`)
    if (months)
      parts.push(
        `${months} ${pluralRu(months, ['месяц', 'месяца', 'месяцев'])}`
      )
  }

  return parts.join(' ')
})

const sectionTitle = computed(() =>
  durationText.value
    ? `${props.page.experience.title} • ${durationText.value}`
    : props.page.experience.title
)
</script>

<template>
  <UPageSection
    :title="sectionTitle"
    :ui="{
      container: 'p-0! gap-4 sm:gap-4',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'mt-2'
    }"
  >
    <template #description>
      <div class="flex flex-col gap-2">
        <Motion
          v-for="(experience, index) in page.experience.items"
          :key="index"
          :initial="{ opacity: 0, transform: 'translateY(20px)' }"
          :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
          :transition="{ delay: 0.4 + 0.2 * index }"
          :in-view-options="{ once: true }"
        >
          <UModal
            :title="experience.position"
            :description="experience.company.name"
            :ui="{ content: 'max-w-lg' }"
          >
            <button
              type="button"
              class="group w-full text-muted hover:text-default flex items-center justify-between gap-4 cursor-pointer transition-colors"
            >
              <p class="text-sm shrink-0">
                {{ experience.date }}
              </p>
              <USeparator class="flex-1" />
              <span class="flex items-center gap-1 text-nowrap">
                <span class="text-sm">
                  {{ experience.position }}
                </span>
                <span
                  class="inline-flex items-center gap-1"
                  :style="{ color: experience.company.color }"
                >
                  <span class="font-medium">{{ experience.company.name }}</span>
                  <img
                    v-if="experience.company.logo?.startsWith('/')"
                    :src="experience.company.logo"
                    :alt="experience.company.name"
                    class="size-4 object-contain"
                  />
                  <UIcon v-else :name="experience.company.logo" />
                </span>
              </span>
            </button>

            <template #body>
              <div class="flex flex-col gap-5">
                <div class="flex items-center gap-3">
                  <span
                    class="flex items-center justify-center size-10 rounded-lg bg-elevated/50 shrink-0"
                    :style="{ color: experience.company.color }"
                  >
                    <img
                      v-if="experience.company.logo?.startsWith('/')"
                      :src="experience.company.logo"
                      :alt="experience.company.name"
                      class="size-6 object-contain"
                    />
                    <UIcon
                      v-else
                      :name="experience.company.logo"
                      class="size-6"
                    />
                  </span>
                  <div>
                    <p
                      class="font-medium leading-tight"
                      :style="{ color: experience.company.color }"
                    >
                      {{ experience.company.name }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ experience.position }} · {{ experience.date }}
                    </p>
                  </div>
                </div>

                <p v-if="experience.summary" class="text-muted">
                  {{ experience.summary }}
                </p>

                <ul
                  v-if="experience.details?.length"
                  class="flex flex-col gap-2"
                >
                  <li
                    v-for="(detail, i) in experience.details"
                    :key="i"
                    class="flex gap-2 text-sm text-muted"
                  >
                    <UIcon
                      name="i-lucide-check"
                      class="size-4 mt-0.5 shrink-0 text-primary"
                    />
                    <span>{{ detail }}</span>
                  </li>
                </ul>

                <div
                  v-if="experience.stack?.length"
                  class="flex flex-wrap gap-1.5"
                >
                  <UBadge
                    v-for="tag in experience.stack"
                    :key="tag"
                    :label="tag"
                    color="neutral"
                    variant="subtle"
                    size="sm"
                  />
                </div>

                <UButton
                  v-if="experience.company.url"
                  :to="experience.company.url"
                  target="_blank"
                  :label="t('experience.visit')"
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="subtle"
                  class="self-start"
                />
              </div>
            </template>
          </UModal>
        </Motion>
      </div>
    </template>
  </UPageSection>
</template>

<style scoped></style>
