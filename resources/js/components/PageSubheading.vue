<script setup>
defineProps({
  showing: {
    type: Number,
    default: null,
  },
  total: {
    type: Number,
    default: null,
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
    <slot v-if="$slots.default" />
    <template v-else>
      Showing {{ showing }} of {{ total }}
      <span v-if="hasFilters">(filters active)</span>
    </template>
  </p>
</template>
