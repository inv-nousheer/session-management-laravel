<script setup>
defineProps({
  showing: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  hasFilters: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
    Showing {{ showing }} of {{ total }}
    <span v-if="hasFilters">(filters active)</span>
  </p>
</template>
