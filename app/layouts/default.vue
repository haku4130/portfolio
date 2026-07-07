<script setup lang="ts"></script>

<template>
  <div class="overflow-x-clip">
    <UContainer class="sm:border-x border-default pt-10">
      <AppHeader />
      <slot />
      <AppFooter />
    </UContainer>
  </div>
</template>
