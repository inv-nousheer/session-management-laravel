<script setup>
defineProps({
  comment: {
    type: Object,
    required: true,
  },
  isStudent: {
    type: Boolean,
    required: true,
  },
  authorLabel: {
    type: String,
    required: true,
  },
  formattedDate: {
    type: String,
    required: true,
  },
  upload: {
    type: Object,
    default: null,
  },
  isUploadComment: {
    type: Boolean,
    default: false,
  },
  isFileUrlComment: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['download-file', 'open-url'])
</script>

<template>
  <div
    :class="[
      'rounded-xl px-3 py-2',
      isStudent
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-tl-sm'
        : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-tr-sm'
    ]"
  >
    <div class="flex items-center gap-2 mb-1">
      <span
        :class="[
          'text-xs font-semibold',
          isStudent
            ? 'text-indigo-700 dark:text-indigo-300'
            : 'text-violet-700 dark:text-violet-300'
        ]"
      >
        {{ authorLabel }}
      </span>
      <span class="text-xs text-slate-500 ml-auto">{{ formattedDate }}</span>
    </div>
    <p class="text-sm text-slate-800 dark:text-gray-100 leading-relaxed">{{ comment.comments }}</p>
    <div
      v-if="isUploadComment && upload"
      class="mt-2 flex items-center gap-2"
    >
      <button
        type="button"
        @click="emit('download-file', upload.id)"
        class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
      >
        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </button>
    </div>

    <div v-else-if="isFileUrlComment" class="mt-1">
      <a target="_blank" @click="emit('open-url', upload?.id)" class="text-xs text-violet-600 dark:text-violet-300 hover:underline">click here</a>
    </div>
  </div>
</template>
