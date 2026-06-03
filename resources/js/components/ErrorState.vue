<script setup>
defineProps({
  message: {
    type: String,
    default: 'Something went wrong.',
  },
})
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
        <svg class="w-6 h-6 text-red-600 dark:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </div>
      <p class="text-red-600 dark:text-red-200">{{ message }}</p>
    </div>
  </div>
</template>
