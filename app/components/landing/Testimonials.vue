<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

defineProps<{
  page: IndexRuCollectionItem
}>()
</script>

<template>
  <UPageSection
    :ui="{
      container: 'px-0 pt-0!'
    }"
  >
    <UCarousel
      v-slot="{ item }"
      :items="page.testimonials"
      :autoplay="{ delay: 4000 }"
      loop
      dots
      :ui="{
        viewport:
          '-mx-4 sm:-mx-12 lg:-mx-16 bg-elevated/50 max-w-(--ui-container)',
        container: 'items-stretch',
        item: 'flex flex-col justify-center'
      }"
    >
      <UPageCTA
        :description="item.quote"
        variant="naked"
        class="rounded-none"
        :ui="{
          container: 'sm:py-12 lg:py-12 sm:gap-8',
          description:
            'relative text-base! text-balance px-8 lg:px-16 before:content-[open-quote] before:text-5xl lg:before:text-7xl before:text-dimmed before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:leading-none after:content-[close-quote] after:text-5xl lg:after:text-7xl after:text-dimmed after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:leading-none'
        }"
      >
        <UUser v-bind="item.author" size="xl" class="justify-center" />
      </UPageCTA>
    </UCarousel>
  </UPageSection>
</template>
