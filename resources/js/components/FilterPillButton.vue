<script setup>
defineProps({
  as: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'span'].includes(value),
  },
  selected: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'member',
    validator: (value) => ['member', 'tag', 'cardTag'].includes(value),
  },
})
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :class="[
      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
      variant === 'member' && 'inline-flex items-center gap-1.5',
      variant === 'member' && selected && 'bg-purple-600 text-white border-purple-600',
      variant === 'member' && !selected && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-400',
      variant === 'tag' && selected && 'bg-indigo-600 text-white border-indigo-600',
      variant === 'tag' && !selected && 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400',
      variant === 'cardTag' && 'inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-transparent',
    ]"
  >
    <slot />
  </component>
</template>
