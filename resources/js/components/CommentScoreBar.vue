<script setup>
const props = defineProps({
  activeUpload: {
    type: Object,
    required: true,
  },
  scoreInputs: {
    type: Object,
    required: true,
  },
  savingScoreUploadId: {
    type: [Number, String],
    default: null,
  },
  scoreSuccessUploads: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update-score-input', 'save-score', 'score-keydown'])

const getFileName = (filePath) => {
  return filePath?.split('/').pop() || filePath
}

const isSavingScore = (uploadId) => props.savingScoreUploadId === uploadId
const isScoreSaved = (uploadId) => Boolean(props.scoreSuccessUploads[uploadId])
</script>

<template>
  <div
    class="score-bar px-4 py-3 border-b border-violet-200 dark:border-violet-900/40 bg-linear-to-r from-violet-50 via-slate-50 to-violet-100/60 dark:from-violet-950/40 dark:via-slate-800 dark:to-violet-950/20 flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0"
  >
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </span>
      <span class="text-lg font-semibold text-slate-700 dark:text-gray-200">Score</span>
      <span class="text-lg text-slate-500 dark:text-gray-400 truncate max-w-[min(100%,30rem)]" :title="getFileName(activeUpload.file_path)">
        · {{ getFileName(activeUpload.file_path) }}
      </span>
    </div>
    <div class="ml-auto flex items-center gap-2">
      <label class="score-input-group flex items-stretch overflow-hidden rounded-lg border-2 border-violet-300 bg-slate-50 shadow-sm transition-shadow focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30 dark:border-violet-500/50 dark:bg-slate-900 dark:focus-within:ring-violet-400/25">
        <span class="sr-only">Score out of 100 for latest upload</span>
        <input
          :value="scoreInputs[activeUpload.id]"
          type="number"
          min="0"
          max="100"
          inputmode="numeric"
          placeholder="—"
          class="score-input w-14 border-0 bg-transparent py-2 pl-3 pr-1 text-center text-base font-bold tabular-nums text-violet-900 placeholder:text-violet-300 focus:outline-none focus:ring-0 disabled:cursor-wait disabled:opacity-60 dark:text-violet-50 dark:placeholder:text-violet-500/70"
          :disabled="isSavingScore(activeUpload.id)"
          :aria-busy="isSavingScore(activeUpload.id)"
          @input="emit('update-score-input', activeUpload.id, $event.target.value)"
          @blur="emit('save-score', activeUpload.id)"
          @keydown="emit('score-keydown', $event, activeUpload.id)"
        />
        <span class="flex items-center border-l border-violet-200 bg-violet-50 px-2.5 text-lg font-bold text-violet-600 select-none dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
          /10
        </span>
      </label>
      <span
        v-if="isSavingScore(activeUpload.id)"
        class="text-xs font-medium text-violet-600 dark:text-violet-400 animate-pulse"
      >
        Saving…
      </span>
      <span
        v-else-if="isScoreSaved(activeUpload.id)"
        class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    </div>
  </div>
</template>
