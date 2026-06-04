<script setup>
defineProps({
  assessments: {
    type: Array,
    default: () => [],
  },
  selectedFeedback: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-feedback'])

const formatDateOnly = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const hasScore = (upload) => upload?.score !== null && upload?.score !== undefined
</script>

<template>
  <div class="w-72 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
    <div class="px-4 py-3 bg-violet-700 dark:bg-violet-800 shrink-0">
      <h2 class="text-xs font-semibold text-violet-100 uppercase tracking-wider">Submissions</h2>
      <p class="text-violet-300 text-xs mt-0.5">{{ assessments?.length || 0 }} assessments</p>
    </div>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-8 h-8 border-[3px] border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-xs text-slate-500">Loading…</p>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center p-5 text-center">
      <div>
        <svg class="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-xs font-medium text-slate-600 dark:text-white">Failed to load</p>
      </div>
    </div>

    <div v-else-if="assessments.length === 0" class="flex-1 flex items-center justify-center p-5 text-center">
      <p class="text-xs font-medium text-slate-500 dark:text-gray-400">No submissions yet</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 min-h-0">
      <button
        v-for="upload in assessments"
        :key="upload.id"
        @click="emit('select-feedback', upload)"
        :class="[
          'w-full px-4 py-3 text-left transition-all duration-150 flex items-start gap-2.5',
          selectedFeedback?.id === upload.id
            ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-l-violet-600'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700/40'
        ]"
      >
        <div class="shrink-0 pt-1.5">
          <div :class="['w-2 h-2 rounded-full', upload.comments?.length > 0 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600']"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-950 dark:text-white truncate">{{ upload.assessment.name }}</p>
          <p class="text-xs text-slate-500 mt-0.5">Due {{ formatDateOnly(upload.assessment.end_date_time) }}</p>
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span :class="[
              'text-xs px-2 py-0.5 rounded-full',
              upload.status === 1
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            ]">{{ upload.status === 1 ? 'Submitted' : 'Pending' }}</span>
            <span v-if="hasScore(upload)" class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
              {{ upload.score }}/10
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
