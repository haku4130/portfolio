<script setup lang="ts">
const props = defineProps<{
  ts: number
}>()

function plural(value: number, forms: [string, string, string]) {
  const abs = Math.abs(value)
  const tail = abs % 10
  const hundred = abs % 100
  if (tail === 1 && hundred !== 11) return forms[0]
  if (tail >= 2 && tail <= 4 && (hundred < 10 || hundred >= 20)) return forms[1]
  return forms[2]
}

const messages = {
  justNow: 'только что',
  past: '{0} назад',
  future: 'через {0}',
  invalid: '—',
  second: (n: number) => `${n} ${plural(n, ['секунду', 'секунды', 'секунд'])}`,
  minute: (n: number) => `${n} ${plural(n, ['минуту', 'минуты', 'минут'])}`,
  hour: (n: number) => `${n} ${plural(n, ['час', 'часа', 'часов'])}`,
  day: (n: number) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`,
  week: (n: number) => `${n} ${plural(n, ['неделю', 'недели', 'недель'])}`,
  month: (n: number) => `${n} ${plural(n, ['месяц', 'месяца', 'месяцев'])}`,
  year: (n: number) => `${n} ${plural(n, ['год', 'года', 'лет'])}`
}

const relative = useTimeAgo(() => props.ts, {
  messages,
  showSecond: true,
  updateInterval: 30_000
})

const absolute = computed(() => {
  if (!Number.isFinite(props.ts)) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(props.ts))
})
</script>

<template>
  <span :title="absolute" class="whitespace-nowrap tabular-nums">
    <ClientOnly>
      {{ relative }}
      <template #fallback>{{ absolute }}</template>
    </ClientOnly>
  </span>
</template>
