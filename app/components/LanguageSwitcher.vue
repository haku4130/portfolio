<script setup lang="ts">
const { locale, setLocale, t } = useI18n()

const target = computed(() => (locale.value === 'ru' ? 'en' : 'ru'))
</script>

<template>
  <UButton
    :aria-label="t('lang.switch')"
    color="neutral"
    variant="ghost"
    size="sm"
    class="rounded-full font-medium uppercase"
    @click="setLocale(target)"
  >
    {{ target }}
  </UButton>
</template>
