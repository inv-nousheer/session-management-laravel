<script setup>
defineProps({
  message: {
    type: String,
    default: 'No sessions found. Create one to get started!',
  },
})
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
        <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p class="text-gray-600 dark:text-gray-400">{{ message }}</p>
    </div>
  </div>
</template>
