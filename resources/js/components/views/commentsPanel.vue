<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import api from '../../services/axios.js'

const props = defineProps({
    assessments: Array,
    fetchAssessments: Function
})

const selectedAssessment = ref(null)
const selectedMember = ref(null)
const selectedUpload = ref(null)
const replies = ref({})
const submitting = ref(false)
const savingScore = ref(false)
const scoreInput = ref(null)
const scoreSuccess = ref(false)
const emit = defineEmits('fetchAssessments')
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null

// The uploads for the selected member under the selected assessment
const memberUploads = computed(() => {

    if (!selectedMember.value || !selectedAssessment.value) return []
    console.log('selectedMember',selectedMember);
    console.log('selectedAssessment',selectedAssessment);
    const assessment = selectedMember.value.project_uploads?.filter(a => a.events_assessments_id === selectedAssessment.value.id)
    console.log("selected meber",assessment)
    return assessment || []
})

const selectUpload = (upload) => {
    selectedUpload.value = upload
    scoreInput.value = upload.score ?? null
}

const refreshAssessmentsData = async () => {
    if (typeof props.fetchAssessments === 'function') {
        await props.fetchAssessments()
        await nextTick()
        return
    }
    emit('fetchAssessments')
}

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
        await refreshAssessmentsData()
    } catch (err) {
        console.error('Error submitting reply:', err)
        alert('Failed to submit reply. Please try again.')
    } finally {
        submitting.value = false
    }
}

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
        await refreshAssessmentsData()
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

const getFileName = (filePath) => {
    return filePath?.split('/').pop() || filePath
}

const selectMember = (member) => {
    selectedMember.value = member
    selectedUpload.value = null
    scoreInput.value = null
}

const getInitials = (name) => name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?'

const isStudentComment = (item) => {
    const studentId = selectedMember.value?.users_id ?? selectedMember.value?.user?.id
    if (item?.users_id != null && studentId != null) {
        return Number(item.users_id) === Number(studentId)
    }
    return Boolean(item?.is_upload || item?.file_url)
}

const getAuthorLabel = (item) => isStudentComment(item) ? 'Student' : 'Instructor'
const getAuthorName = (item) => {
    if (isStudentComment(item)) {
        return selectedMember.value?.user?.name || 'Student'
    }
    return item?.user?.name || 'Instructor'
}

const getStatusColor = (status) => status === 1
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'

const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateOnly = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const scoreGrade = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s) || scoreInput.value === null || scoreInput.value === '') return null
    if (s >= 9) return { label: 'A', color: 'text-emerald-600 dark:text-emerald-400' }
    if (s >= 8) return { label: 'B', color: 'text-blue-600 dark:text-blue-400' }
    if (s >= 7) return { label: 'C', color: 'text-yellow-600 dark:text-yellow-400' }
    if (s >= 6) return { label: 'D', color: 'text-orange-600 dark:text-orange-400' }
    return { label: 'F', color: 'text-red-600 dark:text-red-400' }
})

const scoreBarWidth = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s) || s < 0) return '0%'
    return `${Math.min(s, 100)}%`
})

const scoreBarColor = computed(() => {
    const s = Number(scoreInput.value)
    if (isNaN(s)) return 'bg-gray-300'
    if (s >= 9) return 'bg-emerald-500'
    if (s >= 8) return 'bg-blue-500'
    if (s >= 7) return 'bg-yellow-500'
    if (s >= 6) return 'bg-orange-500'
    return 'bg-red-500'
})

// Count members who have submitted for a given assessment
const submissionCount = (assessment) => {
    // This depends on your parent data structure — adjust if needed
    return assessment?.project_uploads?.length || 0
}

watch(() => props.assessments, (newAssessments) => {
    if (!selectedMember.value || !selectedAssessment.value) return
    // Re-find the member across the new data
    // Assumes parent passes a flat members array; adjust path as needed
    const updatedMember = newAssessments?.flatMap(a => a.session?.session_members || [])
        .find(m => m.id === selectedMember.value.id)
    if (updatedMember) {
        selectedMember.value = updatedMember
        if (selectedUpload.value) {
            const updatedUpload = updatedMember.project_uploads
                ?.find(u => u.id === selectedUpload.value.id)
            if (updatedUpload && document.activeElement?.id !== 'score-input') {
                selectedUpload.value = updatedUpload
                scoreInput.value = updatedUpload.score ?? null
            }
        }
    }
}, { deep: true })
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden">

    <!-- Page Header -->
    <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 shadow-sm flex-shrink-0">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Reviews & Scoring</h1>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review submissions, add feedback, and assign scores</p>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden gap-4 p-4 min-h-0">

      <!-- ── LEFT PANEL ── -->
      <div class="w-72 shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
        <div class="px-4 py-3 bg-violet-700 dark:bg-violet-800 shrink-0">
          <h2 class="text-xs font-semibold text-violet-100 uppercase tracking-wider">Assessments</h2>
          <p class="text-violet-300 text-xs mt-0.5">{{ assessments?.length || 0 }} total</p>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="!assessments || assessments.length === 0" class="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">No assessments found</p>
          </div>

          <div v-else>
            <div v-for="assessment in assessments" :key="assessment.id">
              <!-- Assessment Row -->
              <button
                @click="selectedAssessment = assessment; selectedMember = null; selectedUpload = null; scoreInput = null"
                :class="[
                  'w-full px-4 py-3 text-left transition-all duration-150 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40',
                  selectedAssessment?.id === assessment.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-l-violet-600'
                    : ''
                ]"
              >
                <p class="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">{{ assessment.name }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {{ assessment.session?.session_members
                    ?.flatMap(m => m.project_uploads || [])
                    ?.filter(upload => upload.events_assessments_id === assessment.id)
                    .length || 0
                }} submission(s)
                </p>
              </button>

              <!-- Member Sub-list -->
              <div v-if="selectedAssessment?.id === assessment.id" class="bg-slate-50 dark:bg-slate-700/30">
                <template v-for="member in assessment.session?.session_members" :key="member.id">
                 <button
                    v-if="(member.project_uploads || []).some(upload => upload.events_assessments_id === assessment.id)"
                    @click="selectMember(member)"
                    :class="[
                        'w-full px-4 py-2.5 text-left flex items-center gap-2.5 transition-all duration-150 border-b border-gray-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-700/50',
                        selectedMember?.id === member.id ? 'bg-white dark:bg-slate-700' : ''
                    ]"
                    >
                    <div class="w-7 h-7 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold">
                      {{ getInitials(member.user.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ member.user.name }}</p>
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <span :class="['text-xs px-1.5 py-0.5 rounded font-medium', getStatusColor(member.project_uploads.status)]">
                          {{ member.project_uploads.status === 1 ? 'Submitted' : 'Pending' }}
                        </span>
                        <span v-if="member.project_uploads?.score !== null && member.project_uploads?.score !== undefined" class="text-xs font-bold text-violet-600 dark:text-violet-400 ml-auto">
                          {{ member.project_uploads.score }}/10
                        </span>
                      </div>
                    </div>
                  </button>
                </template>
               <div
                v-if="!assessment.session?.session_members?.some(m =>
                    (m.project_uploads || []).some(upload =>
                    upload.events_assessments_id === assessment.id
                    )
                )"
                class="px-4 py-5 text-center"
                >
                <p class="text-xs text-gray-400">No submissions yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-1 hidden lg:flex flex-col min-w-0 min-h-0 overflow-hidden">

        <!-- Placeholder: no member selected -->
        <div v-if="!selectedMember" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center p-10">
          <div class="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-7 h-7 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Select a student to review</p>
          <p class="text-xs text-gray-400 mt-1">Choose an assessment and student from the left panel</p>
        </div>

        <!-- Member selected — two-column layout -->
        <template v-else>
          <div class="flex gap-4 h-full min-h-0">

            <!-- ── MIDDLE: Upload list + selected upload detail ── -->
            <div class="flex-1 flex flex-col gap-4 min-h-0 min-w-0 overflow-y-auto">

              <!-- Member header -->
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex-shrink-0">
                <div class="px-5 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-slate-700">
                  <div class="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-bold shrink-0">
                    {{ getInitials(selectedMember.user.name) }}
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ selectedMember.user.name }}</h3>
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ selectedMember.user.email }}</p>
                  </div>
                  <div class="ml-auto text-right">
                    <p class="text-xs text-gray-400">Assessment</p>
                    <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ selectedAssessment.name }}</p>
                  </div>
                </div>

                <!-- Upload list for this member -->
                <div class="px-4 py-3">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Submissions ({{ memberUploads.length }})
                  </p>

                  <div v-if="memberUploads.length === 0" class="text-xs text-gray-400 py-2 text-center">No files uploaded yet</div>

                  <div v-else class="space-y-1.5">
                    <button
                      v-for="(upload, index) in memberUploads"
                      :key="upload.id"
                      @click="selectUpload(upload)"
                      :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150',
                        selectedUpload?.id === upload.id
                          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700'
                          : 'bg-gray-50 dark:bg-slate-700/40 border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                      ]"
                    >
                      <!-- File icon -->
                      <div :class="[
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold',
                        selectedUpload?.id === upload.id
                          ? 'bg-violet-100 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300'
                          : 'bg-white dark:bg-slate-600 text-gray-500 dark:text-gray-300'
                      ]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>

                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                          Submission {{ index + 1 }}
                          <span v-if="upload.is_submitted_late" class="ml-1 text-orange-500 dark:text-orange-400">· Late</span>
                        </p>
                        <p class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(upload.created_at) }}</p>
                      </div>

                      <div class="shrink-0 flex flex-col items-end gap-1">
                        <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(upload.status)]">
                          {{ upload.status === 1 ? 'Submitted' : 'Pending' }}
                        </span>
                        <span v-if="upload.score !== null && upload.score !== undefined" class="text-xs font-bold text-violet-600 dark:text-violet-400">
                          {{ upload.score }}/10
                        </span>
                        <span v-else class="text-xs text-gray-400">No score</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload detail: score + download — only when an upload is selected -->
              <div v-if="selectedUpload" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex-shrink-0">
                <div class="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">Score &amp; Download</p>
                  <span v-if="scoreSuccess" class="text-xs text-emerald-500 font-medium ml-auto flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    Saved
                  </span>
                </div>

                <div class="px-5 py-4 flex items-center gap-4">
                  <!-- Download button -->
                  <button
                    @click="downloadFile(selectedUpload.id)"
                    class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-all shrink-0"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download file
                  </button>

                  <!-- Score bar -->
                  <div class="flex-1 min-w-0">
                    <div class="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        :class="['h-full rounded-full transition-all duration-500', scoreBarColor]"
                        :style="{ width: scoreBarWidth }"
                      ></div>
                    </div>
                  </div>

                  <!-- Grade -->
                  <div v-if="scoreGrade" :class="['text-xl font-black w-8 text-center shrink-0', scoreGrade.color]">
                    {{ scoreGrade.label }}
                  </div>

                  <!-- Score input -->
                  <div class="relative shrink-0">
                    <input
                      id="score-input"
                      v-model="scoreInput"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      @blur="updateScore(selectedUpload.id)"
                      @keydown="handleScoreKeydown($event, selectedUpload.id)"
                      class="w-16 text-center text-base font-bold px-2 py-1.5 border-2 border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :disabled="savingScore"
                    />
                    <span class="absolute -bottom-4 left-0 right-0 text-center text-xs text-gray-400">/10</span>
                  </div>

                  <div v-if="savingScore" class="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin shrink-0"></div>
                </div>
                <p class="px-5 pb-3 text-xs text-gray-400">Press Enter or click outside to save the score</p>
              </div>
            </div>

            <!-- ── RIGHT: Feedback thread — only when upload is selected ── -->
            <div class="w-80 shrink-0 flex flex-col min-h-0">
              <!-- Placeholder: no upload selected -->
              <div v-if="!selectedUpload" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center p-8">
                <div class="w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-gray-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Select a submission to view &amp; add feedback</p>
              </div>

              <!-- Feedback card -->
              <div v-else class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden h-full">
                <div class="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 flex items-center gap-2 shrink-0">
                  <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-200">Feedback Thread</h4>
                </div>

                <!-- Thread -->
                <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                  <template v-if="selectedUpload.comments?.length > 0">
                    <div v-for="comment in selectedUpload.comments" :key="comment.id">
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
                            <div
                              :class="[
                                'rounded-xl px-3 py-2',
                                isStudentComment(comment)
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-tl-sm'
                                  : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50 rounded-tr-sm'
                              ]"
                            >
                              <div class="flex items-center gap-2 mb-1">
                                <span
                                  :class="[
                                    'text-xs font-semibold',
                                    isStudentComment(comment)
                                      ? 'text-indigo-700 dark:text-indigo-300'
                                      : 'text-violet-700 dark:text-violet-300'
                                  ]"
                                >
                                  {{ getAuthorLabel(comment) }}
                                </span>
                                <span class="text-xs text-gray-400 ml-auto">{{ formatDateTime(comment.created_at) }}</span>
                              </div>
                              <p class="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{{ comment.comments }}</p>
                            </div>

                            <div
                              v-if="comment.replies?.length"
                              :class="['mt-1.5 space-y-1.5', isStudentComment(comment) ? 'ml-3' : 'mr-3']"
                            >
                              <div
                                v-for="reply in comment.replies"
                                :key="reply.id"
                                :class="['flex w-full', isStudentComment(reply) ? 'justify-start' : 'justify-end']"
                              >
                                <div
                                  :class="[
                                    'max-w-[90%] flex gap-2 items-start',
                                    isStudentComment(reply) ? 'mr-auto' : 'ml-auto flex-row-reverse'
                                  ]"
                                >
                                  <div
                                    :class="[
                                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                      isStudentComment(reply)
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                                        : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                                    ]"
                                  >
                                    {{ getInitials(getAuthorName(reply)).charAt(0) }}
                                  </div>
                                  <div
                                    :class="[
                                      'rounded-xl px-3 py-2',
                                      isStudentComment(reply)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-tl-sm'
                                        : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50 rounded-tr-sm'
                                    ]"
                                  >
                                    <div class="flex items-center gap-2 mb-0.5">
                                      <span
                                        :class="[
                                          'text-xs font-medium',
                                          isStudentComment(reply)
                                            ? 'text-indigo-700 dark:text-indigo-300'
                                            : 'text-violet-700 dark:text-violet-300'
                                        ]"
                                      >
                                        {{ getAuthorLabel(reply) }}
                                      </span>
                                      <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDateTime(reply.created_at) }}</span>
                                    </div>
                                    <p class="text-sm text-gray-800 dark:text-gray-100">{{ reply.comments }}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>

                  <div v-else class="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-2">
                      <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p class="text-xs text-gray-400">No feedback yet</p>
                    <p class="text-xs text-gray-400 mt-0.5">Write a comment below</p>
                  </div>
                </div>

                <!-- Reply Input — always visible for instructor -->
                <div class="px-4 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 shrink-0">
                  <div class="flex gap-2 items-end">
                    <textarea
                      v-model="replies[selectedUpload.id]"
                      placeholder="Write feedback…"
                      rows="2"
                      class="flex-1 px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
                      :disabled="submitting"
                    ></textarea>
                    <button
                      @click="handleReply(selectedUpload.id, selectedUpload.comments?.[0]?.id || null)"
                      :disabled="!replies[selectedUpload.id]?.trim() || submitting"
                      class="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {{ submitting ? '…' : 'Send' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </template>
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
