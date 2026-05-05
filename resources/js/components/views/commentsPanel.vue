<script setup>
import { ref, computed, watch } from 'vue'
import api from '../../services/axios.js'

const props = defineProps({
    assessments: Array,
    fetchAssessments: Function
})

const selectedAssessment = ref(null)
const selectedMember = ref(null)
const replies = ref({})
const submitting = ref(false)
const savingScore = ref(false)
const scoreInput = ref(null)
const scoreSuccess = ref(false)
const emit = defineEmits('fetchAssessments')
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null

// Submit reply
const handleReply = async (uploadId, parentCommentId) => {
    const replyText = replies.value[uploadId]
    if (!replyText?.trim()) return

    submitting.value = true
    try {
        await api.post('/api/comments', {
            events_users_events_assessments_id: uploadId,
            comments: replies.value[uploadId]?.trim(),
            users_id: user_id,
            parent_id: parentCommentId || null
        })
        replies.value[uploadId] = ''
        emit('fetchAssessments')
    } catch (err) {
        console.error('Error submitting reply:', err)
        alert('Failed to submit reply. Please try again.')
    } finally {
        submitting.value = false
    }
}

// Update score — called on blur or Enter
const updateScore = async (uploadId) => {
    const score = scoreInput.value
    if (score === null || score === '' || score === undefined) return
    const numeric = Number(score)
    if (isNaN(numeric) || numeric < 0 || numeric > 100) return

    savingScore.value = true
    scoreSuccess.value = false
    try {
        await api.post(`/api/project-uploads/${uploadId}/score`, { score: numeric })
        scoreSuccess.value = true
        // Refresh so the saved score is reflected everywhere
        emit('fetchAssessments')
        setTimeout(() => { scoreSuccess.value = false }, 2500)
    } catch (err) {
        console.error('Error saving score:', err)
        alert('Failed to save score. Please try again.')
    } finally {
        savingScore.value = false
    }
}

const handleScoreKeydown = (e, uploadId) => {
    if (e.key === 'Enter') {
        e.target.blur()
        updateScore(uploadId)
    }
}

const downloadFile = (uploadId) => {
    window.open(`/api/download/${uploadId}`, '_blank')
}

const selectMember = (member) => {
    selectedMember.value = member
    // Sync score input with saved value
    scoreInput.value = member.project_uploads?.score ?? null
}

const getInitials = (name) => name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()

const getStatusColor = (status) => status === 1
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'

const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const scoreGrade = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s) || scoreInput.value === null || scoreInput.value === '') return null
    if (s >= 90) return { label: 'A', color: 'text-emerald-600 dark:text-emerald-400' }
    if (s >= 80) return { label: 'B', color: 'text-blue-600 dark:text-blue-400' }
    if (s >= 70) return { label: 'C', color: 'text-yellow-600 dark:text-yellow-400' }
    if (s >= 60) return { label: 'D', color: 'text-orange-600 dark:text-orange-400' }
    return { label: 'F', color: 'text-red-600 dark:text-red-400' }
})

const scoreBarWidth = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s) || s < 0) return '0%'
    return `${Math.min(s, 100)}%`
})

const scoreBarColor = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s)) return 'from-gray-400 to-gray-500'
    if (s >= 90) return 'from-emerald-400 to-emerald-600'
    if (s >= 80) return 'from-blue-400 to-blue-600'
    if (s >= 70) return 'from-yellow-400 to-yellow-600'
    if (s >= 60) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
})

watch(() => props.assessments, (newAssessments) => {
    if (!selectedMember.value || !selectedAssessment.value) return
    const updatedAssessment = newAssessments?.find(a => a.id === selectedAssessment.value.id)
    if (!updatedAssessment) return
    const updatedMember = updatedAssessment.session.session_members.find(m => m.id === selectedMember.value.id)
    if (updatedMember) {
        selectedMember.value = updatedMember
        // Only reset input if not currently focused
        if (document.activeElement?.id !== 'score-input') {
            scoreInput.value = updatedMember.project_uploads?.score ?? null
        }
    }
}, { deep: true })
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-slate-900">

    <!-- Page Header -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5 shadow-sm">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reviews & Scoring</h1>
      <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Review submissions, add feedback, and assign scores</p>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden gap-5 p-5">

      <!-- ── LEFT PANEL ── -->
      <div class="w-80 shrink-0 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
        <!-- Panel Header -->
        <div class="px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600">
          <h2 class="text-sm font-bold text-white uppercase tracking-wider">Assessments</h2>
          <p class="text-violet-200 text-xs mt-0.5">{{ assessments?.length || 0 }} total</p>
        </div>

        <div class="flex-1 overflow-y-auto">
          <!-- Empty -->
          <div v-if="!assessments || assessments.length === 0" class="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No assessments found</p>
          </div>

          <!-- List -->
          <div v-else>
            <div v-for="assessment in assessments" :key="assessment.id">
              <!-- Assessment Row -->
              <button
                @click="selectedAssessment = assessment; selectedMember = null; scoreInput = null"
                :class="[
                  'w-full px-5 py-3.5 text-left transition-all duration-150 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40',
                  selectedAssessment?.id === assessment.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-l-[3px] border-l-violet-600'
                    : ''
                ]"
              >
                <p class="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{{ assessment.name }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ assessment.session.session_members.filter(m => m.project_uploads && m.project_uploads.events_assessments_id === assessment.id).length }} submission(s)
                </p>
              </button>

              <!-- Member Sub-list -->
              <div v-if="selectedAssessment?.id === assessment.id" class="bg-slate-50 dark:bg-slate-700/30">
                <template v-for="member in assessment.session.session_members" :key="member.id">
                  <button
                    v-if="member.project_uploads && member.project_uploads.events_assessments_id === assessment.id"
                    @click="selectMember(member)"
                    :class="[
                      'w-full px-5 py-3 text-left flex items-center gap-3 transition-all duration-150 border-b border-gray-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700/50',
                      selectedMember?.id === member.id
                        ? 'bg-white dark:bg-slate-700 shadow-sm'
                        : ''
                    ]"
                  >
                    <!-- Avatar -->
                    <div class="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {{ getInitials(member.user.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ member.user.name }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span :class="['text-xs px-1.5 py-0.5 rounded font-medium', getStatusColor(member.project_uploads.status)]">
                          {{ member.project_uploads.status === 1 ? 'Submitted' : 'Pending' }}
                        </span>
                        <span v-if="member.project_uploads?.is_submitted_late" class="text-xs text-orange-500 dark:text-orange-400">· Late</span>
                        <!-- Score Badge -->
                        <span v-if="member.project_uploads?.score !== null && member.project_uploads?.score !== undefined" class="ml-auto text-xs font-bold text-violet-600 dark:text-violet-400">
                          {{ member.project_uploads.score }}/100
                        </span>
                      </div>
                    </div>
                    <!-- Chevron -->
                    <svg v-if="selectedMember?.id === member.id" class="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </template>

                <div v-if="!assessment.session.session_members.some(m => m.project_uploads && m.project_uploads.events_assessments_id === assessment.id)" class="px-5 py-6 text-center">
                  <p class="text-xs text-gray-400 dark:text-gray-500">No submissions yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-1 hidden lg:flex flex-col gap-5 overflow-y-auto min-w-0">

        <!-- Placeholder -->
        <div v-if="!selectedMember" class="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 flex flex-col items-center justify-center text-center p-12">
          <div class="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
            <svg class="w-9 h-9 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p class="text-base font-semibold text-gray-500 dark:text-gray-400">Select a member to review</p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Choose an assessment and a student from the left panel</p>
        </div>

        <!-- Content -->
        <template v-else>

          <!-- ── MEMBER HEADER CARD ── -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div class="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {{ getInitials(selectedMember.user.name) }}
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">{{ selectedMember.user.name }}</h3>
                  <p class="text-violet-200 text-sm">{{ selectedMember.user.email }}</p>
                </div>
              </div>
            </div>

            <!-- Submission Info -->
            <div v-if="selectedMember.project_uploads" class="p-5 grid grid-cols-3 gap-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">File</p>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <button @click="downloadFile(selectedMember.project_uploads.id)" class="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium truncate max-w-[140px]">
                    {{ selectedMember.project_uploads.file_name }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Status</p>
                <div class="flex items-center gap-2">
                  <span :class="['text-xs px-2.5 py-1 rounded-lg font-semibold', getStatusColor(selectedMember.project_uploads.status)]">
                    {{ selectedMember.project_uploads.status === 1 ? 'Submitted' : 'Pending' }}
                  </span>
                  <span v-if="selectedMember.project_uploads.is_submitted_late" class="text-xs px-2.5 py-1 rounded-lg font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    Late
                  </span>
                </div>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Submitted</p>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ formatDateTime(selectedMember.project_uploads.created_at) }}</p>
              </div>
            </div>

            <!-- ── SCORE SECTION ── -->
            <div v-if="selectedMember.project_uploads" class="p-5">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-3">
                    <svg class="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">Score</p>
                    <span v-if="scoreSuccess" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Saved
                    </span>
                  </div>

                  <!-- Score Bar -->
                  <div class="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div
                      :class="['h-full bg-gradient-to-r rounded-full transition-all duration-500', scoreBarColor]"
                      :style="{ width: scoreBarWidth }"
                    ></div>
                  </div>
                </div>

                <!-- Score Input Group -->
                <div class="flex items-center gap-2 shrink-0">
                  <!-- Grade Badge -->
                  <div v-if="scoreGrade" :class="['text-2xl font-black w-10 text-center', scoreGrade.color]">
                    {{ scoreGrade.label }}
                  </div>

                  <!-- Number input -->
                  <div class="relative">
                    <input
                      id="score-input"
                      v-model="scoreInput"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      @blur="updateScore(selectedMember.project_uploads.id)"
                      @keydown="handleScoreKeydown($event, selectedMember.project_uploads.id)"
                      class="w-20 text-center text-xl font-bold px-2 py-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="savingScore"
                    />
                    <span class="absolute -bottom-5 left-0 right-0 text-center text-xs text-gray-400">/100</span>
                  </div>

                  <!-- Saving Spinner -->
                  <div v-if="savingScore" class="w-5 h-5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin"></div>
                </div>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-6">Press Enter or click outside the field to save the score</p>
            </div>
          </div>

          <!-- ── FEEDBACK / COMMENTS CARD ── -->
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col" style="max-height: 440px;">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex items-center gap-2">
              <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h4 class="text-sm font-bold text-gray-900 dark:text-white">Feedback Thread</h4>
            </div>

            <!-- Thread -->
            <div class="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <template v-if="selectedMember.project_uploads?.comments?.length > 0">
                <div
                  v-for="comment in selectedMember.project_uploads.comments"
                  :key="comment.id"
                  class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4"
                >
                  <div class="flex items-center gap-2.5 mb-2">
                    <div class="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">I</div>
                    <div>
                      <p class="text-xs font-bold text-indigo-900 dark:text-indigo-200">Instructor</p>
                      <p class="text-xs text-indigo-400">{{ formatDateTime(comment.created_at) }}</p>
                    </div>
                  </div>
                  <p class="text-sm text-indigo-950 dark:text-indigo-100 leading-relaxed pl-9">{{ comment.comments }}</p>

                  <!-- Replies -->
                  <div v-if="comment.replies?.length > 0" class="mt-3 pl-4 space-y-2 border-l-2 border-indigo-200 dark:border-indigo-700">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      :class="[
                        'p-3 rounded-lg text-sm',
                        reply.users_id === selectedAssessment.session.created_by
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600'
                      ]"
                    >
                      <p :class="['text-xs font-bold mb-1', reply.users_id === selectedAssessment.session.created_by ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400']">
                        {{ reply.users_id === selectedAssessment.session.created_by ? 'You' : 'Student' }}
                      </p>
                      <p :class="reply.users_id === selectedAssessment.session.created_by ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-800 dark:text-gray-200'">
                        {{ reply.comments }}
                      </p>
                      <p class="text-xs text-gray-400 mt-1.5">{{ formatDateTime(reply.created_at) }}</p>
                    </div>
                  </div>
                </div>
              </template>

              <div v-else class="text-center py-10">
                <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">No feedback yet</p>
              </div>
            </div>

            <!-- Reply Input -->
            <div class="px-5 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <textarea
                v-model="replies[selectedMember.project_uploads.id]"
                placeholder="Write your comment..."
                rows="2"
                class="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
                :disabled="submitting"
              ></textarea>
              <button
                @click="handleReply(selectedMember.project_uploads.id, selectedMember.project_uploads.comments[0]?.id || null)"
                :disabled="!replies[selectedMember.project_uploads.id]?.trim() || submitting"
                class="mt-2 w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {{ submitting ? 'Sending…' : 'Send Comment' }}
              </button>
            </div>
          </div>

        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark ::-webkit-scrollbar-thumb { background: #475569; }
</style>
