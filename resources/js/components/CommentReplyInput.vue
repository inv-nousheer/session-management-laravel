<script setup>
defineProps({
  replyText: {
    type: String,
    default: '',
  },
  canSubmit: {
    type: Boolean,
    default: false,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  parentCommentId: {
    type: [Number, String],
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Write feedback…',
  },
  submitLabel: {
    type: String,
    default: 'Send',
  },
  buttonClass: {
    type: String,
    default: 'px-3 py-2 text-xs',
  },
})

const emit = defineEmits(['update-reply', 'submit-reply'])
</script>

<template>
  <div class="flex gap-2 items-center">
    <textarea
      :value="replyText"
      @input="emit('update-reply', $event.target.value)"
      @keydown.enter.prevent="canSubmit ? emit('submit-reply', parentCommentId || null) : null"
      :placeholder="placeholder"
      rows="2"
      class="flex-1 px-3 py-2 text-sm text-slate-950 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
      :disabled="submitting"
    ></textarea>
    <button
      @click="emit('submit-reply', parentCommentId || null)"
      :disabled="!canSubmit"
      :class="[
        'bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0',
        buttonClass
      ]"
    >
      {{ submitting ? '…' : submitLabel }}
    </button>
  </div>
</template>
