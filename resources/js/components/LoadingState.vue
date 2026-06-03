<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...',
  },
})
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">{{ message }}</p>
    </div>
  </div>
</template>
