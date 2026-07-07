<script setup lang="ts">
defineProps<{
  image: {
    src: string
    alt: string
  }
  index: number
}>()

// Тап на телефоне включает тот же эффект, что и hover на десктопе
const active = ref(false)
</script>

<template>
  <div
    class="bg-white p-2 flex flex-col drop-shadow-2xl cursor-pointer select-none transition-transform duration-300 ease-in-out hover:scale-105 hover:rotate-0 hover:z-10"
    :class="[
      active
        ? 'scale-105 z-10'
        : index % 2 === 0
          ? '-rotate-5'
          : 'rotate-5',
      index % 2 === 0 ? 'hover:-translate-x-4' : 'hover:translate-x-4',
      active && (index % 2 === 0 ? '-translate-x-4' : 'translate-x-4')
    ]"
    @click="active = !active"
  >
    <NuxtImg
      :src="image.src"
      :alt="image.alt"
      width="256"
      height="256"
      sizes="128px"
      format="webp"
      loading="lazy"
      class="size-20 sm:size-32 object-cover"
    />
    <span
      class="w-20 sm:w-32 text-[10px] sm:text-xs text-black font-serif font-medium text-center mt-2"
    >
      {{ image.alt }}
    </span>
  </div>
</template>
