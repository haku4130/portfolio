<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()

const links = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.home'),
    icon: 'i-lucide-home',
    to: localePath('/')
  },
  {
    label: t('nav.projects'),
    icon: 'i-lucide-folder',
    to: localePath('/projects')
  },
  {
    label: t('nav.about'),
    icon: 'i-lucide-user',
    to: localePath('/about')
  }
])

const pillClass =
  'bg-muted/80 backdrop-blur-sm rounded-full border border-muted/50 shadow-lg shadow-neutral-950/5'
</script>

<template>
  <div
    class="fixed top-2 sm:top-4 inset-x-0 z-10 flex justify-center px-2 pointer-events-none"
  >
    <div
      class="flex items-stretch gap-2 pointer-events-none *:pointer-events-auto"
    >
      <UNavigationMenu
        :items="links"
        variant="link"
        color="neutral"
        :class="[pillClass, 'items-center px-2 sm:px-4']"
        :ui="{
          link: 'px-2 py-1',
          linkLeadingIcon: 'size-5 sm:hidden',
          linkLabel: 'hidden sm:inline'
        }"
      />

      <div :class="[pillClass, 'flex items-center gap-1 px-2']">
        <LanguageSwitcher />
        <ColorModeButton />
      </div>
    </div>
  </div>
</template>
