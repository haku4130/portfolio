<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexRuCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.education.title"
    :description="page.education.description"
    :ui="{
      container: 'p-0! gap-4 sm:gap-4',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'text-left mt-2 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <div class="flex flex-col gap-2 mt-2">
      <Motion
        v-for="(item, index) in page.education.items"
        :key="index"
        :initial="{ opacity: 0, transform: 'translateY(20px)' }"
        :while-in-view="{ opacity: 1, transform: 'translateY(0)' }"
        :transition="{ delay: 0.4 + 0.2 * index }"
        :in-view-options="{ once: true }"
        class="text-muted flex items-center justify-between gap-4"
      >
        <p class="text-sm shrink-0">
          {{ item.date }}
        </p>
        <USeparator class="flex-1" />
        <ULink
          class="flex items-center gap-2 text-nowrap"
          :to="item.url"
          target="_blank"
        >
          <div class="flex flex-col items-end text-right">
            <span class="text-highlighted font-medium text-sm">
              {{ item.institution }}
            </span>
            <span class="text-xs text-muted">
              {{ item.degree }}
            </span>
          </div>
          <img
            v-if="item.logo"
            :src="item.logo"
            :alt="item.institution"
            class="size-6 shrink-0 rounded object-contain"
          />
        </ULink>
      </Motion>
    </div>
  </UPageSection>
</template>
