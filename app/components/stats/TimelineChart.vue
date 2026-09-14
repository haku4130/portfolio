<script setup lang="ts">
export interface TimelinePoint {
  date: string
  views: number | null
  visitors: number | null
}

const props = defineProps<{
  points: TimelinePoint[]
}>()

const WIDTH = 760
const HEIGHT = 260
const PAD_TOP = 16
const PAD_RIGHT = 12
const PAD_BOTTOM = 30
const PAD_LEFT = 44
const INNER_WIDTH = WIDTH - PAD_LEFT - PAD_RIGHT
const INNER_HEIGHT = HEIGHT - PAD_TOP - PAD_BOTTOM
const BASE_Y = PAD_TOP + INNER_HEIGHT

const numberFormat = new Intl.NumberFormat('ru-RU')

function niceMax(peak: number) {
  if (peak <= 5) return 5
  const magnitude = 10 ** Math.floor(Math.log10(peak))
  for (const step of [1, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude
    if (peak <= candidate) return candidate
  }
  return magnitude * 10
}

function shortDate(date: string) {
  const [, month, day] = date.split('-')
  if (!month || !day) return date
  return `${day}.${month}`
}

function longDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(parsed)
}

const maxValue = computed(() => {
  const peak = props.points.reduce(
    (acc, point) => Math.max(acc, point.views ?? 0, point.visitors ?? 0),
    0
  )
  return niceMax(peak)
})

function scaleY(value: number) {
  return BASE_Y - (value / maxValue.value) * INNER_HEIGHT
}

const scaled = computed(() =>
  props.points.map((point, index) => {
    const ratio =
      props.points.length > 1 ? index / (props.points.length - 1) : 0.5
    const views = point.views ?? 0
    const visitors = point.visitors ?? 0
    return {
      date: point.date,
      views,
      visitors,
      x: PAD_LEFT + ratio * INNER_WIDTH,
      viewsY: scaleY(views),
      visitorsY: scaleY(visitors)
    }
  })
)

const hitAreas = computed(() => {
  const count = scaled.value.length
  const width = count > 1 ? INNER_WIDTH / (count - 1) : INNER_WIDTH
  return scaled.value.map(point => {
    const left = Math.max(PAD_LEFT, point.x - width / 2)
    const right = Math.min(PAD_LEFT + INNER_WIDTH, point.x + width / 2)
    return {
      date: point.date,
      views: point.views,
      visitors: point.visitors,
      x: left,
      width: Math.max(1, right - left)
    }
  })
})

const viewsLine = computed(() =>
  scaled.value.map(point => `${point.x},${point.viewsY}`).join(' ')
)

const visitorsLine = computed(() =>
  scaled.value.map(point => `${point.x},${point.visitorsY}`).join(' ')
)

const viewsArea = computed(() => {
  const points = scaled.value
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ''
  const body = points.map(point => `L ${point.x},${point.viewsY}`).join(' ')
  return `M ${first.x},${BASE_Y} ${body} L ${last.x},${BASE_Y} Z`
})

const gridLines = computed(() => {
  const steps = 4
  return Array.from({ length: steps + 1 }, (_, index) => {
    const value = (maxValue.value / steps) * index
    return {
      value,
      y: scaleY(value),
      label: numberFormat.format(Math.round(value))
    }
  })
})

const axisLabels = computed(() => {
  const points = scaled.value
  if (!points.length) return []
  const stride = Math.max(1, Math.ceil(points.length / 6))
  const picked = points.filter(
    (_, index) => index % stride === 0 || index === points.length - 1
  )
  return picked
    .filter((point, index) => {
      const next = picked[index + 1]
      return !next || next.x - point.x > 48
    })
    .map(point => ({ x: point.x, label: shortDate(point.date) }))
})

const showDots = computed(() => scaled.value.length <= 40)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-4 text-xs text-muted mb-2">
      <span class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full bg-primary" />
        Просмотры
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full bg-(--ui-text-dimmed)" />
        Уникальные
      </span>
    </div>

    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Динамика просмотров и уникальных посетителей"
      class="w-full h-auto overflow-visible"
    >
      <g>
        <line
          v-for="line in gridLines"
          :key="`grid-${line.value}`"
          :x1="PAD_LEFT"
          :x2="WIDTH - PAD_RIGHT"
          :y1="line.y"
          :y2="line.y"
          class="stroke-default"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />
        <text
          v-for="line in gridLines"
          :key="`grid-label-${line.value}`"
          :x="PAD_LEFT - 8"
          :y="line.y + 3"
          text-anchor="end"
          class="fill-current text-dimmed text-[10px] tabular-nums"
        >
          {{ line.label }}
        </text>
      </g>

      <path :d="viewsArea" class="fill-primary/10" />

      <polyline
        :points="viewsLine"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
        class="stroke-primary"
      />

      <polyline
        :points="visitorsLine"
        fill="none"
        stroke-width="2"
        stroke-dasharray="4 4"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
        class="stroke-current text-dimmed"
      />

      <template v-if="showDots">
        <circle
          v-for="point in scaled"
          :key="`dot-${point.date}`"
          :cx="point.x"
          :cy="point.viewsY"
          r="2.5"
          class="fill-primary"
        />
      </template>

      <g>
        <rect
          v-for="area in hitAreas"
          :key="`hit-${area.date}`"
          :x="area.x"
          :y="PAD_TOP"
          :width="area.width"
          :height="INNER_HEIGHT"
          fill="transparent"
          class="hover:fill-(--ui-bg-elevated)"
        >
          <title>
            {{ longDate(area.date) }} — просмотров: {{ area.views }}, уникальных: {{ area.visitors }}
          </title>
        </rect>
      </g>

      <text
        v-for="label in axisLabels"
        :key="`axis-${label.x}`"
        :x="label.x"
        :y="HEIGHT - 8"
        text-anchor="middle"
        class="fill-current text-dimmed text-[10px] tabular-nums"
      >
        {{ label.label }}
      </text>
    </svg>
  </div>
</template>
