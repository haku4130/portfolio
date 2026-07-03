<script setup lang="ts">
import type { IndexRuCollectionItem } from '@nuxt/content'

const { footer, global } = useAppConfig()
const { t } = useI18n()

defineProps<{
  page: IndexRuCollectionItem
}>()

function downloadResume(lang: 'ru' | 'en') {
  const link = document.createElement('a')
  link.href = lang === 'en' ? '/resume-en.pdf' : '/resume-ru.pdf'
  link.download =
    lang === 'en' ? 'Andrey-Osipov-CV.pdf' : 'Андрей-Осипов-резюме.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const resumeItems = computed(() => [
  [
    {
      label: 'Русский',
      icon: 'i-lucide-file-text',
      onSelect: () => downloadResume('ru')
    },
    {
      label: 'English',
      icon: 'i-lucide-file-text',
      onSelect: () => downloadResume('en')
    }
  ]
])
</script>

<template>
  <UPageHero
    :ui="{
      headline: 'flex items-center justify-center',
      title: 'text-shadow-md max-w-lg mx-auto',
      links: 'mt-4 flex-col justify-center items-center'
    }"
  >
    <template #headline>
      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.1
        }"
      >
        <NuxtImg
          :src="global.picture?.light!"
          :alt="global.picture?.alt!"
          width="400"
          height="400"
          sizes="200px"
          format="webp"
          preload
          fetchpriority="high"
          class="size-50 rounded-full ring ring-default ring-offset-3 ring-offset-bg"
        />
      </Motion>
    </template>

    <template #title>
      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.1
        }"
      >
        {{ page.title }}
      </Motion>
    </template>

    <template #description>
      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.3
        }"
      >
        {{ page.description }}
      </Motion>
    </template>

    <template #links>
      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.5
        }"
      >
        <div
          v-if="page.hero.links"
          class="flex flex-wrap items-center justify-center gap-2"
        >
          <UButton v-bind="page.hero.links[0]" />
          <UButton
            :color="global.available ? 'success' : 'error'"
            variant="ghost"
            class="gap-2"
            :target="global.available ? '_blank' : ''"
            :to="global.available ? global.meetingLink : ''"
            :label="
              global.available ? t('hero.available') : t('hero.unavailable')
            "
          >
            <template #leading>
              <span class="relative flex size-2">
                <span
                  class="absolute inline-flex size-full rounded-full opacity-75"
                  :class="
                    global.available ? 'bg-success animate-ping' : 'bg-error'
                  "
                />
                <span
                  class="relative inline-flex size-2 scale-90 rounded-full"
                  :class="global.available ? 'bg-success' : 'bg-error'"
                />
              </span>
            </template>
          </UButton>
        </div>
      </Motion>

      <div class="gap-x-4 inline-flex mt-4">
        <Motion
          v-for="(link, index) of footer?.links"
          :key="index"
          :initial="{
            scale: 1.1,
            opacity: 0,
            filter: 'blur(20px)'
          }"
          :animate="{
            scale: 1,
            opacity: 1,
            filter: 'blur(0px)'
          }"
          :transition="{
            duration: 0.6,
            delay: 0.5 + index * 0.1
          }"
        >
          <UButton
            v-bind="{ size: 'md', color: 'neutral', variant: 'ghost', ...link }"
          />
        </Motion>
      </div>

      <Motion
        :initial="{
          scale: 1.1,
          opacity: 0,
          filter: 'blur(20px)'
        }"
        :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)'
        }"
        :transition="{
          duration: 0.6,
          delay: 0.7
        }"
        class="mt-4"
      >
        <UDropdownMenu
          :items="resumeItems"
          :content="{ align: 'center' }"
          :ui="{ content: 'w-40' }"
        >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            trailing-icon="i-lucide-chevron-down"
            :label="t('resume.download')"
          />
        </UDropdownMenu>
      </Motion>
    </template>
  </UPageHero>
</template>
