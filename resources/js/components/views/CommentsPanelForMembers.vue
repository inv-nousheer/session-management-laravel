<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/axios.js'
import { useRoute } from 'vue-router'
import CommentMessageBubble from '@/components/CommentMessageBubble.vue'
import CommentReplyInput from '@/components/CommentReplyInput.vue'
import MemberSubmissionsLeftPanel from '@/components/MemberSubmissionsLeftPanel.vue'

const route = useRoute()
const user_id = route.path.startsWith('/user-dashboard/tl-session-detail/') ? route.params.user_id : localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
const sessionId = computed(() => route.params.id)
const loading = ref(false)
const error = ref(false)
const assessments = ref([])
const replies = ref({})
const selectedFeedback = ref(null)
const user_role = route.path.startsWith('/user-dashboard/tl-session-detail/') ? 'tl' : 'user'



const fetchUserAssessments = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/users-assessments/${sessionId.value}/${user_id}`)
    console.log('res',res.data);

    const groupedAssessments = Object.values(
      (Array.isArray(res.data) ? res.data : []).reduce((acc, item) => {
        const assessmentId = item?.assessment?.id
        if (!assessmentId) return acc

        if (!acc[assessmentId]) {
          acc[assessmentId] = {
            ...item,
            upload_ids: [item.id],
            latest_upload_id: item.id,
          }
          return acc
        }

        acc[assessmentId].upload_ids = [
          ...new Set([...(acc[assessmentId].upload_ids || []), item.id]),
        ]

        // Keep the latest upload payload as the representative row.
        acc[assessmentId] = {
          ...acc[assessmentId],
          ...item,
          upload_ids: [...new Set([...(acc[assessmentId].upload_ids || []), item.id])],
          latest_upload_id: item.id,
        }

        return acc
      }, {})
    )
    assessments.value = groupedAssessments
console.log('assessments',assessments.value);
  } catch (err) {
    error.value = true
    console.error('Error fetching assessments:', err)
  } finally {
    loading.value = false
  }
}

const handleReply = async (upload, commentId) => {
  const replyKey = upload?.assessment?.id ?? upload?.events_assessments_id ?? upload?.id
  if (!replyKey) return
  if (!replies.value[replyKey]?.trim()) return
  const assessmentId = upload.events_assessments_id ?? upload.assessment?.id
  if (!assessmentId) {
    alert('Could not determine assessment for this submission.')
    return
  }
  const parentComment = selectedFeedbackComments.value.find((c) => c.id === commentId)
  const uploadIdForComment =
    parentComment?.events_users_events_assessments_id ??
    upload.latest_upload_id ??
    upload.id

  if (!uploadIdForComment) {
    alert('Could not determine upload for this comment.')
    return
  }
  try {
    await api.post('/api/comments', {
      events_users_events_assessments_id: uploadIdForComment,
      events_assessments_id: assessmentId,
      comments: replies.value[replyKey]?.trim(),
      users_id: user_id,
      parent_id: commentId
    })
    replies.value[replyKey] = ''
    await fetchUserAssessments()
    if (selectedFeedback.value) {
      const selectedAssessmentId =
        selectedFeedback.value?.assessment?.id ?? selectedFeedback.value?.events_assessments_id
      const updated = assessments.value.find(
        (a) => (a?.assessment?.id ?? a?.events_assessments_id) === selectedAssessmentId
      )
      if (updated) selectedFeedback.value = updated
    }
  } catch (err) {
    console.error('Error submitting reply:', err)
    alert('Failed to submit reply')
  }
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateOnly = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const selectFeedback = (upload) => {
  selectedFeedback.value = upload
}

// Upload comments are auto-created when user submits a file — they belong to the student
const isUploadComment = (comment) => comment.is_upload || comment.file_url

const getInitials = (name) => name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?'

/** True when this comment/reply was written by the logged-in student */
const isStudentComment = (item) => {
  if (item?.users_id != null && user_id != null) {
    return Number(item.users_id) === Number(user_id)
  }
  return Boolean(item?.is_upload || item?.file_url)
}

const getAuthorLabel = (item) => (isStudentComment(item) ? 'You' : 'Instructor')

const getAuthorName = (item) => {
  if (isStudentComment(item)) {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      return u.name || 'You'
    } catch {
      return 'You'
    }
  }
  return item?.user?.name || 'Instructor'
}

// Parent thread comment from instructor (for reply parent_id) — prefer explicit non-student top-level comment
const instructorComment = computed(() => {
  const list = selectedFeedbackComments.value
  const byRole = list.find((c) => !isStudentComment(c))
  if (byRole) return byRole
  return list.find((c) => !isUploadComment(c))
})

const selectedFeedbackUploadIds = computed(() => {
  if (!selectedFeedback.value) return []
  const ids = selectedFeedback.value.upload_ids
  if (Array.isArray(ids) && ids.length) return ids
  return selectedFeedback.value.id ? [selectedFeedback.value.id] : []
})

const selectedFeedbackComments = computed(() => {
  const comments = selectedFeedback.value?.assessment?.comments || []
  const uploadIds = new Set(selectedFeedbackUploadIds.value)
  if (!uploadIds.size) return comments

  return comments.filter((comment) =>
    uploadIds.has(comment?.events_users_events_assessments_id)
  )
})

const updateReplyText = (value) => {
  if (!selectedFeedback.value?.assessment?.id) return
  replies.value[selectedFeedback.value.assessment.id] = value
}

const hasScore = (upload) => upload?.score !== null && upload?.score !== undefined

const gradeLabel = (score) => {
  if (score >= 9) return 'A'
  if (score >= 8) return 'B'
  if (score >= 7) return 'C'
  if (score >= 6) return 'D'
  return 'F'
}

const gradeMessage = (score) => {
  if (score >= 9) return 'Excellent work!'
  if (score >= 8) return 'Great job!'
  if (score >= 7) return 'Good effort!'
  if (score >= 6) return 'Needs improvement'
  return 'Please review the feedback carefully'
}

const scoreBarColor = (score) => {
  if (score >= 9) return '#1D9E75'
  if (score >= 8) return '#639922'
  if (score >= 7) return '#BA7517'
  if (score >= 6) return '#D85A30'
  return '#E24B4A'
}

onMounted(async () => {
  await fetchUserAssessments()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">

    <!-- Header -->
    <div class="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-6 py-4 shadow-sm shrink-0">
      <h1 class="text-xl font-bold text-slate-950 dark:text-white">My Feedback</h1>
      <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">View instructor feedback and scores on your submissions</p>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden gap-4 p-4 min-h-0">

      <!-- ── LEFT PANEL ── -->
      <MemberSubmissionsLeftPanel
        :assessments="assessments"
        :selected-feedback="selectedFeedback"
        :loading="loading"
        :error="error"
        @select-feedback="selectFeedback"
      />

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-1 hidden lg:flex flex-col min-w-0 min-h-0">

        <!-- Placeholder -->
        <div v-if="!selectedFeedback" class="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center p-10 shadow-sm">
          <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-gray-400">Select a submission to view feedback</p>
          <p class="text-xs text-slate-500 mt-1">Click any item from the left panel</p>
        </div>

        <!-- ── MERGED CARD ── -->
        <div v-else class="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden h-full shadow-sm">

          <!-- Assessment Info -->
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-bold text-slate-950 dark:text-white">{{ selectedFeedback.assessment.name }}</h2>
                <div class="flex gap-4 mt-1.5 text-xs text-slate-500 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                    </svg>
                    {{ formatDateOnly(selectedFeedback.assessment.start_date_time) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.5H7a1 1 0 100 2h4a1 1 0 001-1V7z" clip-rule="evenodd"/>
                    </svg>
                    Due {{ formatDateOnly(selectedFeedback.assessment.end_date_time) }}
                  </span>
                </div>
              </div>
              <span :class="[
                'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                selectedFeedback.status === 1
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              ]">{{ selectedFeedback.status === 1 ? 'Submitted' : 'Pending' }}</span>
            </div>

            <p v-if="selectedFeedback.assessment.description" class="text-xs text-slate-500 dark:text-gray-400 mt-2 leading-relaxed">
              {{ selectedFeedback.assessment.description }}
            </p>

            <!-- Score bar -->
            <div v-if="hasScore(selectedFeedback)" class="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span class="text-xs text-slate-500 dark:text-gray-400">Score</span>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {{ selectedFeedback.score }}/10 · {{ gradeLabel(selectedFeedback.score) }}
              </span>
              <div class="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :style="{ width: (selectedFeedback.score * 10) + '%', background: scoreBarColor(selectedFeedback.score) }"
                ></div>
              </div>
              <span class="text-xs text-slate-500 dark:text-gray-400">{{ gradeMessage(selectedFeedback.score) }}</span>
            </div>
          </div>

          <!-- Thread label -->
          <div class="px-5 py-2 bg-slate-100 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <p class="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">Activity &amp; Feedback</p>
          </div>

          <!-- Comment Thread -->
          <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">

            <!-- No activity -->
            <div v-if="!selectedFeedbackComments.length" class="flex flex-col items-center justify-center h-full text-center py-12">
              <div class="w-11 h-11 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p class="text-sm font-medium text-slate-600 dark:text-gray-400">No activity yet</p>
              <p class="text-xs text-slate-500 mt-1">Your instructor will review your submission soon</p>
            </div>

            <template v-else>
              <div v-for="comment in selectedFeedbackComments" :key="comment.id">
                <div :class="['flex w-full', isStudentComment(comment) ? 'justify-end' : 'justify-start']">
                  <div
                    :class="[
                      'max-w-[95%] flex gap-2 items-start',
                      isStudentComment(comment) ? 'ml-auto flex-row-reverse' : 'mr-auto'
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Reply Input — parent thread must exist to reply -->
          <div
            v-if="instructorComment"
            class="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/40 shrink-0"
          >
            <CommentReplyInput
              v-if="user_role != 'tl'"
              :reply-text="replies[selectedFeedback.assessment?.id] || ''"
              :can-submit="Boolean(replies[selectedFeedback.assessment?.id]?.trim())"
              :parent-comment-id="instructorComment.id"
              placeholder="Reply to instructor feedback…"
              submit-label="Reply"
              button-class="px-4 py-2 text-sm"
              @update-reply="updateReplyText"
              @submit-reply="handleReply(selectedFeedback, instructorComment.id)"
            />
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark ::-webkit-scrollbar-thumb { background: #475569; }
</style>
