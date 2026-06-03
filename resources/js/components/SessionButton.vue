<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'cardPrimary', 'success', 'secondary'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
  },
})
</script>

<template>
  <button
    :type="type"
    :class="[
      'text-sm font-medium rounded-lg transition-colors focus:outline-none',
      variant === 'primary' && 'px-4 py-2 leading-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium  hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl shrink-0',
      variant === 'cardPrimary' && 'flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium  hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl',
      variant === 'success' && 'px-4 py-2.5 text-white bg-emerald-600 hover:bg-emerald-700 duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'secondary' && 'px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed',
    ]"
  >
    <slot />
  </button>
</template>
