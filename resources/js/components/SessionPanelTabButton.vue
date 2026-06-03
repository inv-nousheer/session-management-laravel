<script setup>
defineProps({
  panel: {
    type: Object,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    @click="$emit('select', panel.id)"
    :class="[
      'group relative flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
      active
        ? 'text-purple-600 dark:text-purple-400'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
    ]"
  >
    <svg
      :class="[
        'w-5 h-5 shrink-0 transition-colors duration-200',
        active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'
      ]"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path fill-rule="evenodd" :d="panel.icon" clip-rule="evenodd" />
    </svg>

    <span>{{ panel.label }}</span>

    <div v-if="active" class="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-purple-600 to-purple-400"></div>
  </button>
</template>
