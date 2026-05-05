<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/axios.js'
import { useRoute } from 'vue-router'

defineProps({
  selectedUsers: Array,
  assessments: Array,
  loading: Boolean,
  error: Boolean
})

const route = useRoute()
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
const sessionId = computed(() => route.params.id)
const loading = ref(false)
const error = ref(false)
const assessments = ref([])
const replies = ref({})
const selectedFeedback = ref(null)

const fetchUserAssessments = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/users-assessments/${sessionId.value}/${user_id}`)
    assessments.value = res.data
  } catch (err) {
    error.value = true
    console.error('Error fetching assessments:', err)
  } finally {
    loading.value = false
  }
}

const handleReply = async (uploadId, commentId) => {
  if (!replies.value[uploadId]?.trim()) return
  try {
    await api.post('/api/comments', {
      events_users_events_assessments_id: uploadId,
      comments: replies.value[uploadId]?.trim(),
      users_id: user_id,
      parent_id: commentId
    })
    replies.value[uploadId] = ''
    await fetchUserAssessments()
    // Re-sync selected feedback after refresh
    if (selectedFeedback.value) {
      const updated = assessments.value.find(a => a.id === selectedFeedback.value.id)
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

// Helpers for score display
const gradeLabel = (score) => {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

const gradeMessage = (score) => {
  if (score >= 90) return 'Excellent work!'
  if (score >= 80) return 'Great job!'
  if (score >= 70) return 'Good effort!'
  if (score >= 60) return 'Needs improvement'
  return 'Please review the feedback carefully'
}

const scoreBarClass = (score) => {
  if (score >= 90) return 'from-emerald-400 to-emerald-600'
  if (score >= 80) return 'from-blue-400 to-blue-600'
  if (score >= 70) return 'from-yellow-400 to-yellow-600'
  if (score >= 60) return 'from-orange-400 to-orange-600'
  return 'from-red-400 to-red-600'
}

const gradeBadgeClass = (score) => {
  if (score >= 90) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
  if (score >= 80) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
  if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
  if (score >= 60) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
  return 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
}

const hasScore = (upload) => upload?.score !== null && upload?.score !== undefined

onMounted(async () => {
  await fetchUserAssessments()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5 shadow-sm">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Feedback</h1>
      <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">View instructor feedback and scores on your submissions</p>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden gap-5 p-5">

      <!-- ── LEFT PANEL ── -->
      <div class="w-80 shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col">
        <div class="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600">
          <h2 class="text-sm font-bold text-white uppercase tracking-wider">Submissions</h2>
          <p class="text-violet-200 text-xs mt-0.5">{{ assessments?.length || 0 }} assessments</p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <svg class="w-10 h-10 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
            <p class="text-sm font-medium text-gray-700 dark:text-white">Failed to load</p>
            <p class="text-xs text-gray-400 mt-1">Try refreshing the page</p>
          </div>
        </div>

        <!-- Empty -->
        <div v-else-if="assessments.length === 0" class="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div class="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-700 dark:text-white">No submissions yet</p>
            <p class="text-xs text-gray-400 mt-1">Submit an assessment to see feedback</p>
          </div>
        </div>

        <!-- List -->
        <div v-else class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700">
          <button
            v-for="upload in assessments"
            :key="upload.id"
            @click="selectFeedback(upload)"
            :class="[
              'w-full px-5 py-3.5 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-slate-700/40 flex items-start gap-3',
              selectedFeedback?.id === upload.id ? 'bg-violet-50 dark:bg-violet-900/20 border-l-[3px] border-l-violet-600' : ''
            ]"
          >
            <!-- Dot indicator -->
            <div class="shrink-0 pt-1.5">
              <div :class="['w-2.5 h-2.5 rounded-full', upload.comments?.length > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600']"></div>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ upload.assessment.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Due {{ formatDateOnly(upload.assessment.end_date_time) }}</p>

              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <span :class="[
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  upload.status === 1
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                ]">{{ upload.status === 1 ? 'Submitted' : 'Pending' }}</span>

                <span v-if="upload.comments?.length > 0" class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Feedback
                </span>

                <!-- Score pill in sidebar -->
                <span v-if="hasScore(upload)" :class="['text-xs px-2 py-0.5 rounded-full font-bold', gradeBadgeClass(upload.score)]">
                  {{ upload.score }}/100
                </span>
              </div>
            </div>

            <!-- Chevron when selected -->
            <svg v-if="selectedFeedback?.id === upload.id" class="w-4 h-4 text-violet-500 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-1 hidden lg:flex flex-col min-w-0">
        <!-- Placeholder -->
        <div v-if="!selectedFeedback" class="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center p-12">
          <div class="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-9 h-9 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-base font-semibold text-gray-500 dark:text-gray-400">Select a submission to view feedback</p>
          <p class="text-sm text-gray-400 mt-1">Click any item from the left panel</p>
        </div>

        <!-- Content -->
        <div v-else class="flex flex-col gap-5 overflow-y-auto">

          <!-- ── ASSESSMENT HEADER CARD ── -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
            <!-- Gradient Top -->
            <div class="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-6">
              <h2 class="text-xl font-bold text-white">{{ selectedFeedback.assessment.name }}</h2>
              <div class="flex gap-6 mt-3 text-sm text-violet-200">
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                  </svg>
                  {{ formatDateOnly(selectedFeedback.assessment.start_date_time) }}
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.5H7a1 1 0 100 2h4a1 1 0 001-1V7z" clip-rule="evenodd" />
                  </svg>
                  Due {{ formatDateOnly(selectedFeedback.assessment.end_date_time) }}
                </div>
              </div>
            </div>

            <!-- Description -->
            <div v-if="selectedFeedback.assessment.description" class="px-6 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40">
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{{ selectedFeedback.assessment.description }}</p>
            </div>

            <!-- Details Grid -->
            <div class="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
              <!-- File -->
              <div class="col-span-2">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">File</p>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedFeedback.file_name }}</span>
                </div>
              </div>

              <!-- Status -->
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                <span :class="[
                  'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold',
                  selectedFeedback.status === 1
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                ]">
                  <span class="w-1.5 h-1.5 rounded-full" :class="selectedFeedback.status === 1 ? 'bg-green-600' : 'bg-yellow-600'"></span>
                  {{ selectedFeedback.status === 1 ? 'Submitted' : 'Pending' }}
                </span>
                <span v-if="selectedFeedback.is_submitted_late" class="ml-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Late
                </span>
              </div>

              <!-- Submitted On -->
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Submitted On</p>
                <p class="text-sm text-gray-800 dark:text-gray-200">{{ formatDateTime(selectedFeedback.created_at) }}</p>
              </div>
            </div>

            <!-- ── SCORE SECTION (shown only when score exists) ── -->
            <div v-if="hasScore(selectedFeedback)" class="mx-5 mb-5">
              <div class="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-5">
                <!-- Top row -->
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <svg class="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <p class="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Your Score</p>
                    </div>
                    <div class="flex items-end gap-1.5">
                      <span class="text-5xl font-black text-gray-900 dark:text-white leading-none">{{ selectedFeedback.score }}</span>
                      <span class="text-lg text-gray-400 mb-1">/ 100</span>
                    </div>
                    <p class="text-sm mt-1.5" :class="[gradeBadgeClass(selectedFeedback.score).replace('bg-', 'text-').split(' ')[0]]">
                      {{ gradeMessage(selectedFeedback.score) }}
                    </p>
                  </div>

                  <!-- Grade Badge -->
                  <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black', gradeBadgeClass(selectedFeedback.score)]">
                    {{ gradeLabel(selectedFeedback.score) }}
                  </div>
                </div>

                <!-- Progress bar -->
                <div class="h-3 bg-white dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    :class="['h-full rounded-full bg-gradient-to-r transition-all duration-700', scoreBarClass(selectedFeedback.score)]"
                    :style="{ width: `${selectedFeedback.score}%` }"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── FEEDBACK CARD ── -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col" style="max-height: 420px;">
            <div class="px-5 py-3.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white">Instructor Feedback</h3>
            </div>

            <!-- Thread -->
            <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <div v-if="selectedFeedback.comments?.length > 0">
                <div class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                  <div class="flex items-center gap-2.5 mb-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">I</div>
                    <div>
                      <p class="text-xs font-bold text-indigo-900 dark:text-indigo-200">Instructor</p>
                      <p class="text-xs text-indigo-400">{{ formatDateTime(selectedFeedback.comments[0].created_at) }}</p>
                    </div>
                  </div>
                  <p class="text-sm text-indigo-950 dark:text-indigo-100 leading-relaxed pl-10">{{ selectedFeedback.comments[0].comments }}</p>

                  <!-- Replies -->
                  <div v-if="selectedFeedback.comments[0].replies?.length > 0" class="mt-3 pl-4 space-y-2 border-l-2 border-indigo-200 dark:border-indigo-700">
                    <div
                      v-for="reply in selectedFeedback.comments[0].replies"
                      :key="reply.id"
                      class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3"
                    >
                      <p class="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Your Reply</p>
                      <p class="text-sm text-emerald-950 dark:text-emerald-100">{{ reply.comments }}</p>
                      <p class="text-xs text-gray-400 mt-1.5">{{ formatDateTime(reply.created_at) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Feedback -->
              <div v-else class="flex flex-col items-center justify-center py-10 text-center">
                <div class="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No feedback yet</p>
                <p class="text-xs text-gray-400 mt-1">Your instructor will review your submission soon</p>
              </div>
            </div>

            <!-- Reply Input -->
            <div v-if="selectedFeedback.comments?.length > 0" class="px-5 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <div v-if="selectedFeedback.comments[0].replies?.length > 0">
                <p class="text-xs text-gray-500 dark:text-gray-400 italic">You've already replied to this feedback</p>
              </div>
              <div v-else class="space-y-2">
                <textarea
                  v-model="replies[selectedFeedback.id]"
                  placeholder="Write your reply..."
                  rows="2"
                  class="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
                ></textarea>
                <button
                  @click="handleReply(selectedFeedback.id, selectedFeedback.comments[0].id)"
                  :disabled="!replies[selectedFeedback.id]?.trim()"
                  class="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Send Reply
                </button>
              </div>
            </div>
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
