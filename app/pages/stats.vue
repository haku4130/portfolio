<script setup lang="ts">
import type { TopListItem } from '~/components/stats/TopList.vue'

type StatsPeriod = '24h' | '7d' | '30d' | 'all'
type StatsEventType = 'pageview' | 'resume_download' | 'contact_click'

interface StatsTotals {
  views: number
  visitors: number
}

interface StatsEvent {
  ts: number
  type: StatsEventType
  label: string | null
  path: string | null
  country: string | null
  city: string | null
  referrer: string | null
  device: string | null
  browser: string | null
  os: string | null
  bot: number | null
}

interface StatsSummary {
  period: StatsPeriod
  range: { from: number | null, to: number | null }
  totals: {
    day: StatsTotals
    week: StatsTotals
    month: StatsTotals
  }
  resume: { ru: number, en: number, total: number }
  contacts: { label: string | null, count: number }[]
  timeline: { date: string, views: number | null, visitors: number | null }[]
  pages: { path: string | null, views: number }[]
  referrers: { source: string | null, views: number }[]
  countries: { country: string | null, views: number }[]
  cities: { city: string | null, country: string | null, views: number }[]
  recent: StatsEvent[]
}

useSeoMeta({
  title: 'Статистика',
  robots: 'noindex, nofollow'
})

const period = ref<StatsPeriod>('7d')
const showBots = ref(false)
const bots = computed(() => (showBots.value ? '1' : '0'))

// Дашборд закрыт basic-auth и живёт только для владельца: рендерить его на
// сервере смысла нет, а клиентский запрос избавляет от расхождений гидрации
// (данные успевают измениться между SSR и гидрацией).
const { data, status, error, refresh } = useFetch<StatsSummary>(
  '/api/stats/summary',
  {
    query: { period, bots },
    lazy: true,
    server: false
  }
)

const pending = computed(
  () => status.value === 'pending' || status.value === 'idle'
)
const empty = computed(() => status.value === 'success' && !data.value)

const periodItems = [
  { label: '24 часа', value: '24h' },
  { label: '7 дней', value: '7d' },
  { label: '30 дней', value: '30d' },
  { label: 'Всё время', value: 'all' }
]

const numberFormat = new Intl.NumberFormat('ru-RU')
const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})

function formatNumber(value: number | null | undefined) {
  return numberFormat.format(value ?? 0)
}

const rangeLabel = computed(() => {
  if (pending.value && !data.value) return 'Загрузка…'
  const from = data.value?.range?.from
  const to = data.value?.range?.to
  if (!from || !to) return 'Период не определён'
  return `${dateFormat.format(new Date(from))} — ${dateFormat.format(new Date(to))}`
})

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['ru'], { type: 'region' })
  } catch {
    return null
  }
})()

function countryName(code: string | null | undefined) {
  const upper = code?.toUpperCase()
  if (!upper) return 'Неизвестно'
  if (!/^[A-Z]{2}$/.test(upper)) return upper
  try {
    return regionNames?.of(upper) ?? upper
  } catch {
    return upper
  }
}

function countryFlag(code: string | null | undefined) {
  const upper = code?.toUpperCase()
  if (!upper || !/^[A-Z]{2}$/.test(upper)) return ''
  return String.fromCodePoint(
    ...[...upper].map(char => 0x1f1a5 + char.charCodeAt(0))
  )
}

function referrerLabel(source: string | null | undefined) {
  if (!source || source === 'direct') return 'Прямой заход'
  return source
}

const CONTACT_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  meeting: 'Созвон',
  email: 'Email',
  hh: 'hh.ru'
}

function contactLabel(label: string | null | undefined) {
  if (!label) return 'Без метки'
  return CONTACT_LABELS[label] ?? label
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Десктоп',
  mobile: 'Мобильный',
  tablet: 'Планшет'
}

const EVENT_META = {
  pageview: {
    label: 'Просмотр',
    color: 'neutral' as const,
    icon: 'i-lucide-eye'
  },
  resume_download: {
    label: 'Резюме',
    color: 'primary' as const,
    icon: 'i-lucide-file-down'
  },
  contact_click: {
    label: 'Контакт',
    color: 'success' as const,
    icon: 'i-lucide-mouse-pointer-click'
  }
}

function eventMeta(type: StatsEventType) {
  return (
    EVENT_META[type] ?? {
      label: String(type),
      color: 'neutral' as const,
      icon: 'i-lucide-activity'
    }
  )
}

function eventLabel(event: StatsEvent) {
  if (event.type === 'resume_download') {
    return event.label ? event.label.toUpperCase() : 'Резюме'
  }
  if (event.type === 'contact_click') {
    return contactLabel(event.label)
  }
  return '—'
}

function geoLabel(country: string | null, city: string | null) {
  if (!country && !city) return '—'
  const flag = countryFlag(country)
  const parts = [city || countryName(country)]
  if (city && country) parts.push(countryName(country))
  return `${flag ? `${flag} ` : ''}${parts.join(', ')}`
}

function deviceLabel(event: StatsEvent) {
  const parts = [
    event.device ? DEVICE_LABELS[event.device] ?? event.device : null,
    event.browser,
    event.os
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

const totalsCards = computed(() => {
  const totals = data.value?.totals
  return [
    {
      key: 'day',
      title: 'За сутки',
      views: totals?.day?.views ?? 0,
      visitors: totals?.day?.visitors ?? 0
    },
    {
      key: 'week',
      title: 'За неделю',
      views: totals?.week?.views ?? 0,
      visitors: totals?.week?.visitors ?? 0
    },
    {
      key: 'month',
      title: 'За месяц',
      views: totals?.month?.views ?? 0,
      visitors: totals?.month?.visitors ?? 0
    }
  ]
})

const timeline = computed(() => data.value?.timeline ?? [])
const recent = computed(() => data.value?.recent ?? [])

const topPages = computed<TopListItem[]>(() =>
  (data.value?.pages ?? []).map((item, index) => ({
    key: `${index}-${item.path ?? 'unknown'}`,
    label: item.path || '—',
    value: item.views ?? 0
  }))
)

const topReferrers = computed<TopListItem[]>(() =>
  (data.value?.referrers ?? []).map((item, index) => ({
    key: `${index}-${item.source ?? 'unknown'}`,
    label: referrerLabel(item.source),
    value: item.views ?? 0
  }))
)

const topCountries = computed<TopListItem[]>(() =>
  (data.value?.countries ?? []).map((item, index) => {
    const flag = countryFlag(item.country)
    return {
      key: `${index}-${item.country ?? 'unknown'}`,
      label: `${flag ? `${flag} ` : ''}${countryName(item.country)}`,
      value: item.views ?? 0
    }
  })
)

const topCities = computed<TopListItem[]>(() =>
  (data.value?.cities ?? []).map((item, index) => ({
    key: `${index}-${item.city ?? 'unknown'}-${item.country ?? ''}`,
    label: item.city || 'Неизвестно',
    hint: item.country ? countryName(item.country) : null,
    value: item.views ?? 0
  }))
)

const topContacts = computed<TopListItem[]>(() =>
  (data.value?.contacts ?? []).map((item, index) => ({
    key: `${index}-${item.label ?? 'unknown'}`,
    label: contactLabel(item.label),
    value: item.count ?? 0
  }))
)
</script>

<template>
  <div class="py-8 sm:py-12 space-y-6">
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted">
            Статистика
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ rangeLabel }}
          </p>
        </div>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="pending"
          label="Обновить"
          @click="refresh()"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <UTabs
          :model-value="period"
          :items="periodItems"
          :content="false"
          size="sm"
          color="primary"
          class="max-w-full overflow-x-auto"
          @update:model-value="value => (period = value as StatsPeriod)"
        />

        <USwitch v-model="showBots" label="Показывать ботов" size="sm" />
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="Не удалось загрузить статистику"
      :description="error?.message"
      :actions="[
        {
          label: 'Повторить',
          color: 'error',
          variant: 'outline',
          onClick: () => refresh()
        }
      ]"
    />

    <UAlert
      v-else-if="empty"
      color="neutral"
      variant="subtle"
      icon="i-lucide-database"
      title="Данных пока нет"
      description="Сервер не вернул статистику за выбранный период."
    />

    <div
      v-else
      class="space-y-6 transition-opacity"
      :class="pending && data && 'opacity-60'"
    >
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard
          v-for="card in totalsCards"
          :key="card.key"
          variant="subtle"
          :ui="{ body: 'p-4' }"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-dimmed">
            {{ card.title }}
          </p>
          <template v-if="pending && !data">
            <USkeleton class="mt-2 h-8 w-20" />
            <USkeleton class="mt-2 h-3 w-24" />
          </template>
          <template v-else>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-highlighted">
              {{ formatNumber(card.views) }}
            </p>
            <p class="mt-1 text-xs text-muted tabular-nums">
              {{ formatNumber(card.visitors) }} уникальных
            </p>
          </template>
        </UCard>

        <UCard variant="subtle" :ui="{ body: 'p-4' }">
          <p class="text-xs font-medium uppercase tracking-wide text-dimmed">
            Резюме
          </p>
          <template v-if="pending && !data">
            <USkeleton class="mt-2 h-8 w-20" />
            <USkeleton class="mt-2 h-4 w-28" />
          </template>
          <template v-else>
            <p class="mt-2 text-2xl font-semibold tabular-nums text-highlighted">
              {{ formatNumber(data?.resume?.total) }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <UBadge
                :label="`RU ${formatNumber(data?.resume?.ru)}`"
                color="neutral"
                variant="subtle"
                size="sm"
              />
              <UBadge
                :label="`EN ${formatNumber(data?.resume?.en)}`"
                color="neutral"
                variant="subtle"
                size="sm"
              />
            </div>
          </template>
        </UCard>
      </div>

      <UCard variant="subtle" :ui="{ header: 'p-3 sm:px-4', body: 'p-3 sm:p-4' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-line-chart" class="size-4 text-dimmed" />
            <h2 class="text-sm font-semibold text-highlighted">
              Динамика за период
            </h2>
          </div>
        </template>

        <USkeleton v-if="pending && !data" class="h-56 w-full" />
        <p
          v-else-if="!timeline.length"
          class="py-12 text-center text-sm text-dimmed"
        >
          За выбранный период событий не было
        </p>
        <StatsTimelineChart v-else :points="timeline" />
      </UCard>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatsTopList
          title="Страницы"
          icon="i-lucide-file-text"
          :items="topPages"
          :loading="pending && !data"
          empty="Просмотров пока нет"
        />
        <StatsTopList
          title="Источники"
          icon="i-lucide-share-2"
          :items="topReferrers"
          :loading="pending && !data"
          empty="Источников пока нет"
        />
        <StatsTopList
          title="Страны"
          icon="i-lucide-globe"
          :items="topCountries"
          :loading="pending && !data"
          empty="Гео не определено"
        />
        <StatsTopList
          title="Города"
          icon="i-lucide-map-pin"
          :items="topCities"
          :loading="pending && !data"
          empty="Гео не определено"
        />
        <StatsTopList
          title="Клики по контактам"
          icon="i-lucide-mouse-pointer-click"
          :items="topContacts"
          :loading="pending && !data"
          empty="Кликов пока нет"
        />
      </div>

      <UCard variant="subtle" :ui="{ header: 'p-3 sm:px-4', body: 'p-0 sm:p-0' }">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-history" class="size-4 text-dimmed" />
            <h2 class="text-sm font-semibold text-highlighted">
              Последние события
            </h2>
            <UBadge
              v-if="recent.length"
              :label="formatNumber(recent.length)"
              color="neutral"
              variant="subtle"
              size="sm"
              class="ms-auto tabular-nums"
            />
          </div>
        </template>

        <USkeleton v-if="pending && !data" class="m-4 h-40" />
        <p v-else-if="!recent.length" class="p-8 text-center text-sm text-dimmed">
          Событий пока нет
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-3xl text-left text-sm">
            <thead class="text-xs uppercase tracking-wide text-dimmed">
              <tr class="border-b border-default">
                <th class="px-4 py-2 font-medium">
                  Время
                </th>
                <th class="px-4 py-2 font-medium">
                  Событие
                </th>
                <th class="px-4 py-2 font-medium">
                  Метка
                </th>
                <th class="px-4 py-2 font-medium">
                  Страница
                </th>
                <th class="px-4 py-2 font-medium">
                  Гео
                </th>
                <th class="px-4 py-2 font-medium">
                  Источник
                </th>
                <th class="px-4 py-2 font-medium">
                  Устройство
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr
                v-for="(event, index) in recent"
                :key="`${event.ts}-${index}`"
                class="hover:bg-elevated/50"
              >
                <td class="px-4 py-2 text-muted">
                  <StatsTimeAgo :ts="event.ts" />
                </td>
                <td class="px-4 py-2">
                  <UBadge
                    :label="eventMeta(event.type).label"
                    :icon="eventMeta(event.type).icon"
                    :color="eventMeta(event.type).color"
                    variant="subtle"
                    size="sm"
                  />
                  <UBadge
                    v-if="event.bot"
                    label="бот"
                    color="warning"
                    variant="subtle"
                    size="sm"
                    class="ms-1"
                  />
                </td>
                <td class="px-4 py-2 text-default">
                  {{ eventLabel(event) }}
                </td>
                <td class="px-4 py-2 text-muted max-w-[16rem] truncate" :title="event.path || ''">
                  {{ event.path || '—' }}
                </td>
                <td class="px-4 py-2 text-muted whitespace-nowrap">
                  {{ geoLabel(event.country, event.city) }}
                </td>
                <td class="px-4 py-2 text-muted whitespace-nowrap">
                  {{ referrerLabel(event.referrer) }}
                </td>
                <td class="px-4 py-2 text-muted whitespace-nowrap">
                  {{ deviceLabel(event) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <p class="pt-2 text-xs text-dimmed">
      IP geolocation by
      <ULink
        to="https://db-ip.com"
        target="_blank"
        rel="noopener noreferrer"
        class="underline underline-offset-2"
      >
        DB-IP
      </ULink>
    </p>
  </div>
</template>
