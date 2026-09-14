<script setup lang="ts">
export interface TopListItem {
  key: string
  label: string
  value: number
  hint?: string | null
}

const props = withDefaults(
  defineProps<{
    title: string
    icon: string
    items: TopListItem[]
    limit?: number
    empty?: string
    loading?: boolean
  }>(),
  {
    limit: 8,
    empty: 'Пока нет данных',
    loading: false
  }
)

const numberFormat = new Intl.NumberFormat('ru-RU')

const total = computed(() =>
  props.items.reduce((acc, item) => acc + (item.value || 0), 0)
)

const peak = computed(() =>
  props.items.reduce((acc, item) => Math.max(acc, item.value || 0), 0)
)

const rows = computed(() =>
  props.items.slice(0, props.limit).map(item => ({
    ...item,
    count: numberFormat.format(item.value || 0),
    share: total.value
      ? Math.round(((item.value || 0) / total.value) * 1000) / 10
      : 0,
    bar: peak.value ? `${((item.value || 0) / peak.value) * 100}%` : '0%'
  }))
)

const hidden = computed(() => Math.max(0, props.items.length - props.limit))
</script>

<template>
  <UCard variant="subtle" :ui="{ header: 'p-3 sm:px-4', body: 'p-2 sm:p-3' }">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon :name="icon" class="size-4 text-dimmed shrink-0" />
        <h3 class="text-sm font-semibold text-highlighted">
          {{ title }}
        </h3>
        <UBadge
          v-if="items.length"
          :label="numberFormat.format(total)"
          color="neutral"
          variant="subtle"
          size="sm"
          class="ms-auto tabular-nums"
        />
      </div>
    </template>

    <div v-if="loading && !rows.length" class="flex flex-col gap-2 p-2">
      <USkeleton v-for="index in 4" :key="index" class="h-5 w-full" />
    </div>

    <p
      v-else-if="!rows.length"
      class="px-2 py-6 text-center text-sm text-dimmed"
    >
      {{ empty }}
    </p>

    <ul v-else class="flex flex-col gap-0.5">
      <li
        v-for="row in rows"
        :key="row.key"
        class="relative flex items-center gap-3 overflow-hidden rounded-md px-2 py-1.5"
      >
        <span
          class="absolute inset-y-0 start-0 rounded-md bg-primary/10"
          :style="{ width: row.bar }"
        />
        <span class="relative min-w-0 flex-1 truncate text-sm text-default" :title="row.hint || row.label">
          {{ row.label }}
        </span>
        <span class="relative shrink-0 text-sm tabular-nums text-highlighted">
          {{ row.count }}
        </span>
        <span class="relative w-12 shrink-0 text-end text-xs tabular-nums text-dimmed">
          {{ row.share }}%
        </span>
      </li>
    </ul>

    <p v-if="hidden" class="px-2 pt-2 text-xs text-dimmed">
      и ещё {{ hidden }}
    </p>
  </UCard>
</template>
