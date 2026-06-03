<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  cardClass: {
    type: String,
    default: 'bg-slate-50 border-slate-300'
  },
  decorationClass: {
    type: String,
    default: 'from-purple-500/10 to-violet-500/10'
  },
  iconClass: {
    type: String,
    default: 'from-purple-500 to-violet-600'
  }
})
</script>

<template>
  <div
    class="relative overflow-hidden dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border dark:border-slate-700"
    :class="cardClass"
  >
    <div
      class="absolute top-0 right-0 w-32 h-32 bg-linear-to-br rounded-full -mr-16 -mt-16"
      :class="decorationClass"
    ></div>
    <div class="p-6 relative">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600 dark:text-gray-400">
            {{ title }}
          </p>
          <p class="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
            {{ value }}
          </p>
        </div>
        <div
          class="p-4 bg-linear-to-br rounded-xl shadow-lg"
          :class="iconClass"
        >
          <slot name="icon" />
        </div>
      </div>
    </div>
  </div>
</template>
