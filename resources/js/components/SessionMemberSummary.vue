<script setup>
defineProps({
  count: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <p class="text-sm text-blue-900 dark:text-blue-200">
      <span class="font-semibold">{{ count }}</span> member{{ count !== 1 ? 's' : '' }} currently in this session.
    </p>
  </div>
</template>
