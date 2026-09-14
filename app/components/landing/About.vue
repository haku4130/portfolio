<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexRuCollectionItem
}>()
</script>

<template>
  <UPageSection
    :ui="{
      container: 'p-0!',
      title: 'text-left text-xl sm:text-xl lg:text-2xl font-medium',
      description: 'text-left mt-3 text-sm sm:text-md lg:text-sm text-muted'
    }"
  >
    <template #title>
      <Motion
        as="span"
        class="inline-block"
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :while-in-view="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.2
        }"
        :in-view-options="{ once: true }"
      >
        {{ page.about.title }}
      </Motion>
    </template>

    <template #description>
      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :while-in-view="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.35
        }"
        :in-view-options="{ once: true }"
      >
        {{ page.about.description }}
      </Motion>
    </template>
  </UPageSection>
</template>

<style scoped></style>
