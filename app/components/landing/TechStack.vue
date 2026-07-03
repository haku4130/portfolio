<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexRuCollectionItem
}>()
</script>

<template>
  <UPageSection
    :title="page.stack.title"
    :description="page.stack.description"
    :ui="{
      container: 'p-0! gap-4 sm:gap-4',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'text-left mt-2 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <div class="flex flex-wrap gap-2 mt-2">
      <Motion
        v-for="(item, index) in page.stack.items"
        :key="index"
        :initial="{ opacity: 0, scale: 0.9 }"
        :while-in-view="{ opacity: 1, scale: 1 }"
        :transition="{ delay: 0.02 * index }"
        :in-view-options="{ once: true }"
      >
        <span
          class="group inline-flex items-center gap-2 rounded-lg bg-elevated/60 px-3 py-1.5 text-sm text-highlighted transition-colors hover:bg-muted/50"
          :style="{ '--brand': item.color }"
        >
          <UIcon
            :name="item.icon"
            class="size-4 shrink-0 text-dimmed transition-colors duration-200 group-hover:text-(--brand)"
          />
          {{ item.name }}
        </span>
      </Motion>
    </div>
  </UPageSection>
</template>
