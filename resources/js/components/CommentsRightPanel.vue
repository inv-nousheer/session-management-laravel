<script setup>
import { computed } from 'vue'
import CommentMessageBubble from '@/components/CommentMessageBubble.vue'
import CommentReplyInput from '@/components/CommentReplyInput.vue'
import CommentScoreBar from '@/components/CommentScoreBar.vue'
import CommentsEmptySelection from '@/components/CommentsEmptySelection.vue'

const props = defineProps({
  selectedAssessment: {
    type: Object,
    default: null,
  },
  selectedMember: {
    type: Object,
    default: null,
  },
  memberUploads: {
    type: Array,
    default: () => [],
  },
  selectedMemberComments: {
    type: Array,
    default: () => [],
  },
  activeUploadForReply: {
    type: Object,
    default: null,
  },
  instructorComment: {
    type: Object,
    default: null,
  },
  scoreInputs: {
    type: Object,
    required: true,
  },
  replyText: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
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

const emit = defineEmits([
  'update-score-input',
  'save-score',
  'score-keydown',
  'download-file',
  'open-url',
  'update-reply',
  'submit-reply',
])

const getInitials = (name) => name?.split(' ').map((n) => n.charAt(0)).join('').toUpperCase() || '?'

const getFileName = (filePath) => {
  return filePath?.split('/').pop() || filePath
}

const isUploadComment = (item) =>
  (item?.comments || '').trim().toLowerCase() === 'new file uploaded'

const isFileUrlComment = (item) =>
  (item?.comments || '').trim().toLowerCase() === 'project link submitted'

const isStudentComment = (item) => {
  const studentId = props.selectedMember?.users_id ?? props.selectedMember?.user?.id
  if (item?.users_id != null && studentId != null) {
    return Number(item.users_id) === Number(studentId)
  }
  return Boolean(item?.is_upload || item?.file_url)
}

const getAuthorLabel = (item) => isStudentComment(item) ? 'Student' : 'Instructor'

const getAuthorName = (item) => {
  if (isStudentComment(item)) {
    return props.selectedMember?.user?.name || 'Student'
  }
  return item?.user?.name || 'Instructor'
}

const selectedMemberUploadsById = computed(() => {
  const map = new Map()
  for (const upload of props.memberUploads) {
    if (!upload?.id) continue
    map.set(Number(upload.id), upload)
  }
  return map
})

const uploadForComment = (comment) => {
  const uploadId = Number(comment?.events_users_events_assessments_id)
  if (!uploadId) return null
  return selectedMemberUploadsById.value.get(uploadId) || null
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const canSubmitReply = computed(() => {
  return Boolean(props.replyText?.trim()) && !props.submitting && Boolean(props.activeUploadForReply)
})
</script>

<template>
  <div class="flex-1 hidden lg:flex flex-col min-w-0 min-h-0 overflow-hidden">
    <!-- Placeholder: no member selected -->
    <CommentsEmptySelection v-if="!selectedMember" />

    <!-- Member selected — full-width chat -->
    <template v-else>
      <div class="h-full min-h-0">
        <div class="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden h-full shadow-sm">
          <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/40 flex items-center gap-2 shrink-0">
            <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h4 class="text-xs font-semibold text-slate-700 dark:text-gray-200">Feedback Thread</h4>
            <span class="ml-auto text-xs text-slate-500 dark:text-gray-400">
              {{ selectedMember.user.name }} • {{ selectedAssessment.name }}
            </span>
          </div>

          <!-- Score applies to the latest uploaded file for this assessment -->
          <CommentScoreBar
            v-if="activeUploadForReply"
            :active-upload="activeUploadForReply"
            :score-inputs="scoreInputs"
            :saving-score-upload-id="savingScoreUploadId"
            :score-success-uploads="scoreSuccessUploads"
            @update-score-input="(...args) => emit('update-score-input', ...args)"
            @save-score="(...args) => emit('save-score', ...args)"
            @score-keydown="(...args) => emit('score-keydown', ...args)"
          />

          <!-- Thread -->
          <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            <template v-if="selectedMemberComments.length > 0">
              <div v-for="comment in selectedMemberComments" :key="comment.id">
                <div :class="['flex w-full', isStudentComment(comment) ? 'justify-start' : 'justify-end']">
                  <div
                    :class="[
                      'max-w-[95%] flex gap-2 items-start',
                      isStudentComment(comment) ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    ]"
                  >
                    <div
                      :class="[
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isStudentComment(comment)
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                          : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                      ]"
                    >
                      {{ getInitials(getAuthorName(comment)).charAt(0) }}
                    </div>
                    <div class="min-w-0 w-fit max-w-[calc(100%-2rem)]">
                      <CommentMessageBubble
                        :comment="comment"
                        :is-student="isStudentComment(comment)"
                        :author-label="getAuthorLabel(comment)"
                        :formatted-date="formatDateTime(comment.created_at)"
                        :upload="uploadForComment(comment)"
                        :is-upload-comment="isUploadComment(comment)"
                        :is-file-url-comment="isFileUrlComment(comment)"
                        @download-file="(...args) => emit('download-file', ...args)"
                        @open-url="(...args) => emit('open-url', ...args)"
                      />


                    </div>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="flex flex-col items-center justify-center h-full py-8 text-center">
              <div class="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-2">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p class="text-xs text-slate-500">No feedback yet</p>
              <p class="text-xs text-slate-500 mt-0.5">Write a comment below</p>
            </div>
          </div>

          <!-- Reply Input — always visible for instructor -->
          <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/40 shrink-0">
            <CommentReplyInput
              :reply-text="replyText"
              :can-submit="canSubmitReply"
              :submitting="submitting"
              :parent-comment-id="instructorComment?.id || null"
              @update-reply="(...args) => emit('update-reply', ...args)"
              @submit-reply="(...args) => emit('submit-reply', ...args)"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark ::-webkit-scrollbar-thumb { background: #475569; }
</style>
