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

const now = useNow({ interval: 60_000 })

const valid = computed(() => Number.isFinite(props.ts))

const time = new Intl.DateTimeFormat('ru-RU', { timeStyle: 'medium' })
const dayAndTime = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})
const full = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'long',
  timeStyle: 'medium'
})

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

/**
 * Exact local time, because a relative label alone is too coarse to tell events
 * apart: everything between one and two hours old reads "час назад".
 */
const label = computed(() => {
  if (!valid.value) return '—'

  const date = new Date(props.ts)
  return sameDay(date, now.value) ? time.format(date) : dayAndTime.format(date)
})

const tooltip = computed(() =>
  valid.value ? `${full.format(new Date(props.ts))} · ${relative.value}` : ''
)
</script>

<template>
  <ClientOnly>
    <UTooltip :text="tooltip" :delay-duration="200">
      <span class="whitespace-nowrap tabular-nums">{{ label }}</span>
    </UTooltip>

    <template #fallback>
      <span class="whitespace-nowrap tabular-nums">{{ label }}</span>
    </template>
  </ClientOnly>
</template>
