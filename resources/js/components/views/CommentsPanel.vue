<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import api from '../../services/axios.js'

const props = defineProps({
    assessments: Array,
    fetchAssessments: Function
})

const selectedAssessment = ref(null)
const selectedMember = ref(null)
const replies = ref({})
const submitting = ref(false)
const savingScoreUploadId = ref(null)
const scoreInputs = ref({})
const scoreSuccessUploads = ref({})
const emit = defineEmits('fetchAssessments')
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null

// The uploads for the selected member under the selected assessment
const memberUploads = computed(() => {

    if (!selectedMember.value || !selectedAssessment.value) return []
    console.log('selectedMember',selectedMember);
    console.log('selectedAssessment',selectedAssessment);
    const assessment = selectedMember.value.project_uploads?.filter(a => a.events_assessments_id === selectedAssessment.value.id)
    return assessment || []
})

const refreshAssessmentsData = async () => {
    if (typeof props.fetchAssessments === 'function') {
        await props.fetchAssessments()
        await nextTick()
        return
    }
    emit('fetchAssessments')
}

const handleReply = async (parentCommentId) => {
    const replyKey = selectedAssessment.value?.id
    if (!replyKey) return
    const replyText = replies.value[replyKey]
    if (!replyText?.trim()) return
    const assessmentId = selectedAssessment.value?.id
    if (!assessmentId) {
        alert('Could not determine assessment for this submission.')
        return
    }
    const parentComment = selectedMemberComments.value.find((c) => c.id === parentCommentId)
    const uploadIdForComment = parentComment?.events_users_events_assessments_id ?? activeUploadForReply.value?.id
    if (!uploadIdForComment) {
        alert('Could not determine upload for this comment.')
        return
    }
    submitting.value = true
    try {
        await api.post('/api/comments', {
            events_users_events_assessments_id: uploadIdForComment,
            events_assessments_id: assessmentId,
            comments: replies.value[replyKey]?.trim(),
            users_id: user_id,
            parent_id: parentCommentId || null
        })
        replies.value[replyKey] = ''
        await refreshAssessmentsData()
    } catch (err) {
        console.error('Error submitting reply:', err)
        alert('Failed to submit reply. Please try again.')
    } finally {
        submitting.value = false
    }
}

const updateScore = async (uploadId) => {
    const score = scoreInputs.value[uploadId]
    if (score === null || score === '' || score === undefined) return
    const numeric = Number(score)
    if (isNaN(numeric) || numeric < 0 || numeric > 100) return
    savingScoreUploadId.value = uploadId
    scoreSuccessUploads.value[uploadId] = false
    try {
        await api.post(`/api/project-uploads/${uploadId}/score`, { score: numeric })
        scoreSuccessUploads.value[uploadId] = true
        await refreshAssessmentsData()
        setTimeout(() => {
            scoreSuccessUploads.value[uploadId] = false
        }, 2500)
    } catch (err) {
        console.error('Error saving score:', err)
        alert('Failed to save score. Please try again.')
    } finally {
        savingScoreUploadId.value = null
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
const openUrl = (uploadId) => {
    const upload = selectedMemberUploadsById.value.get(uploadId)
    console.log('Opening URL for upload:', upload)
    if (upload?.file_path) {
        window.open(upload.file_path, '_blank')
    } else {
        alert('No URL found for this file.')
    }
}

const getFileName = (filePath) => {
    return filePath?.split('/').pop() || filePath
}

const selectMember = (member) => {
    selectedMember.value = member
}

const getInitials = (name) => name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?'

const isUploadComment = (item) =>
    (item?.comments || '').trim().toLowerCase() === 'new file uploaded'
const isFileUrlComment = (item) =>
     (item?.comments || '').trim().toLowerCase() === 'project link submitted'

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

const selectedMemberUploadIds = computed(() => {
    return memberUploads.value
        .map((u) => u?.id)
        .filter(Boolean)
})

const selectedMemberComments = computed(() => {
    const comments = selectedAssessment.value?.comments || []
    console.log('All comments for assessment:', comments)
    const uploadIds = new Set(selectedMemberUploadIds.value)
    if (!uploadIds.size) return []
    return comments.filter((c) => uploadIds.has(c?.events_users_events_assessments_id))
})

const selectedMemberUploadsById = computed(() => {
    const map = new Map()
    for (const upload of memberUploads.value) {
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

const isSavingScore = (uploadId) => savingScoreUploadId.value === uploadId
const isScoreSaved = (uploadId) => Boolean(scoreSuccessUploads.value[uploadId])

const activeUploadForReply = computed(() => {
    const uploads = memberUploads.value
    if (!uploads.length) return null
    return uploads[uploads.length - 1]
})

watch(activeUploadForReply, (upload) => {
    if (!upload?.id) return
    const cur = scoreInputs.value[upload.id]
    if (cur === undefined || cur === null || cur === '') {
        scoreInputs.value[upload.id] = upload.score ?? ''
    }
}, { immediate: true })

const instructorComment = computed(() => {
    const list = selectedMemberComments.value
    const byRole = list.find((c) => !isStudentComment(c))
    if (byRole) return byRole
    return list.find((c) => !Boolean(c?.is_upload || c?.file_url)) || null
})

const getStatusColor = (status) => status === 1
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'

const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateOnly = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Count members who have submitted for a given assessment
const submissionCount = (assessment) => {
    // This depends on your parent data structure — adjust if needed
    return assessment?.project_uploads?.length || 0
}

watch(() => props.assessments, (newAssessments) => {
    if (!Array.isArray(newAssessments) || !selectedAssessment.value) return

    const updatedAssessment = newAssessments.find((a) => a.id === selectedAssessment.value.id)
    if (!updatedAssessment) return
    selectedAssessment.value = updatedAssessment

    if (!selectedMember.value) return
    const updatedMember = (updatedAssessment.session?.session_members || [])
        .find((m) => m.id === selectedMember.value.id)
    if (!updatedMember) return

    selectedMember.value = updatedMember
    for (const upload of (updatedMember.project_uploads || [])) {
        if (!upload?.id) continue
        if (scoreInputs.value[upload.id] === undefined || scoreInputs.value[upload.id] === null || scoreInputs.value[upload.id] === '') {
            scoreInputs.value[upload.id] = upload.score ?? ''
        }
    }

}, { deep: true })
</script>

<template>
  <div class="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 overflow-hidden">

    <!-- Page Header -->
    <div class="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-6 py-4 shadow-sm flex-shrink-0">
      <h1 class="text-xl font-bold text-slate-950 dark:text-white">Reviews & Scoring</h1>
      <p class="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Review submissions, add feedback, and assign scores</p>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden gap-4 p-4 min-h-0">

      <!-- ── LEFT PANEL ── -->
      <div class="w-72 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm">
        <div class="px-4 py-3 bg-violet-700 dark:bg-violet-800 shrink-0">
          <h2 class="text-xs font-semibold text-violet-100 uppercase tracking-wider">Assessments</h2>
          <p class="text-violet-300 text-xs mt-0.5">{{ assessments?.length || 0 }} total</p>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="!assessments || assessments.length === 0" class="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <p class="text-sm font-medium text-slate-500 dark:text-gray-400">No assessments found</p>
          </div>

          <div v-else>
            <div v-for="assessment in assessments" :key="assessment.id">
              <!-- Assessment Row -->
              <button
                @click="selectedAssessment = assessment; selectedMember = null"
                :class="[
                  'w-full px-4 py-3 text-left transition-all duration-150 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/40',
                  selectedAssessment?.id === assessment.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-l-violet-600'
                    : ''
                ]"
              >
                <p class="text-sm font-semibold text-slate-950 dark:text-white leading-snug truncate">{{ assessment.name }}</p>
                <p class="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
                {{ assessment.session?.session_members
                    ?.flatMap(m => m.project_uploads || [])
                    ?.filter(upload => upload.events_assessments_id === assessment.id)
                    .length || 0
                }} submission(s)
                </p>
              </button>

              <!-- Member Sub-list -->
              <div v-if="selectedAssessment?.id === assessment.id" class="bg-slate-100 dark:bg-slate-700/30">
                <template v-for="member in assessment.session?.session_members" :key="member.id">
                 <button
                    v-if="(member.project_uploads || []).some(upload => upload.events_assessments_id === assessment.id)"
                    @click="selectMember(member)"
                    :class="[
                        'w-full px-4 py-2.5 text-left flex items-center gap-2.5 transition-all duration-150 border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                        selectedMember?.id === member.id ? 'bg-violet-50 dark:bg-slate-700' : ''
                    ]"
                    >
                    <div class="w-7 h-7 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold">
                      {{ getInitials(member.user.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-950 dark:text-white truncate">{{ member.user.name }}</p>
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
                <p class="text-xs text-slate-500">No submissions yet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-1 hidden lg:flex flex-col min-w-0 min-h-0 overflow-hidden">

        <!-- Placeholder: no member selected -->
        <div v-if="!selectedMember" class="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 h-full flex flex-col items-center justify-center text-center p-10 shadow-sm">
          <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-7 h-7 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p class="text-sm font-medium text-slate-600 dark:text-gray-400">Select a student to review</p>
          <p class="text-xs text-slate-500 mt-1">Choose an assessment and student from the left panel</p>
        </div>

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
                <div
                  v-if="activeUploadForReply"
                  class="score-bar px-4 py-3 border-b border-violet-200 dark:border-violet-900/40 bg-gradient-to-r from-violet-50 via-slate-50 to-violet-100/60 dark:from-violet-950/40 dark:via-slate-800 dark:to-violet-950/20 flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0"
                >
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </span>
                    <span class="text-lg font-semibold text-slate-700 dark:text-gray-200">Score</span>
                    <span class="text-lg text-slate-500 dark:text-gray-400 truncate max-w-[min(100%,30rem)]" :title="getFileName(activeUploadForReply.file_path)">
                      · {{ getFileName(activeUploadForReply.file_path) }}
                    </span>
                  </div>
                  <div class="ml-auto flex items-center gap-2">
                    <label class="score-input-group flex items-stretch overflow-hidden rounded-lg border-2 border-violet-300 bg-slate-50 shadow-sm transition-shadow focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30 dark:border-violet-500/50 dark:bg-slate-900 dark:focus-within:ring-violet-400/25">
                      <span class="sr-only">Score out of 100 for latest upload</span>
                      <input
                        v-model="scoreInputs[activeUploadForReply.id]"
                        type="number"
                        min="0"
                        max="100"
                        inputmode="numeric"
                        placeholder="—"
                        class="score-input w-14 border-0 bg-transparent py-2 pl-3 pr-1 text-center text-base font-bold tabular-nums text-violet-900 placeholder:text-violet-300 focus:outline-none focus:ring-0 disabled:cursor-wait disabled:opacity-60 dark:text-violet-50 dark:placeholder:text-violet-500/70"
                        :disabled="isSavingScore(activeUploadForReply.id)"
                        :aria-busy="isSavingScore(activeUploadForReply.id)"
                        @blur="updateScore(activeUploadForReply.id)"
                        @keydown="handleScoreKeydown($event, activeUploadForReply.id)"
                      />
                      <span class="flex items-center border-l border-violet-200 bg-violet-50 px-2.5 text-lg font-bold text-violet-600 select-none dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
                        /10
                      </span>
                    </label>
                    <span
                      v-if="isSavingScore(activeUploadForReply.id)"
                      class="text-xs font-medium text-violet-600 dark:text-violet-400 animate-pulse"
                    >
                      Saving…
                    </span>
                    <span
                      v-else-if="isScoreSaved(activeUploadForReply.id)"
                      class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </span>
                  </div>
                </div>

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
                            <div
                              :class="[
                                'rounded-xl px-3 py-2',
                                isStudentComment(comment)
                                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-tl-sm'
                                  : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-tr-sm'
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
                                <span class="text-xs text-slate-500 ml-auto">{{ formatDateTime(comment.created_at) }}</span>
                              </div>
                              <p class="text-sm text-slate-800 dark:text-gray-100 leading-relaxed">{{ comment.comments }}</p>
                              <div
                                v-if="isUploadComment(comment) && uploadForComment(comment)"
                                class="mt-2 flex items-center gap-2"
                              >
                                <button
                                  type="button"
                                  @click="downloadFile(uploadForComment(comment).id)"
                                  class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                >
                                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </button>
                              </div>

                              <div v-else-if="isFileUrlComment(comment)" class="mt-1">
                                <a target="_blank" @click="openUrl(uploadForComment(comment).id)" class="text-xs text-violet-600 dark:text-violet-300 hover:underline">click here</a>
                              </div>
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
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-tl-sm'
                                        : 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-tr-sm'
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
                                      <span class="text-xs text-slate-500 dark:text-gray-500">{{ formatDateTime(reply.created_at) }}</span>
                                    </div>
                                    <p class="text-sm text-slate-800 dark:text-gray-100">{{ reply.comments }}</p>
                                    <div
                                      v-if="isUploadComment(reply) && uploadForComment(reply)"
                                      class="mt-2 flex items-center gap-2"
                                    >
                                      <button
                                        type="button"
                                        @click="downloadFile(uploadForComment(reply).id)"
                                        class="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                      >
                                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                      </button>
                                    </div>
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
                  <div class="flex gap-2 items-end">
                    <textarea
                      v-model="replies[selectedAssessment?.id]"
                       @keydown.enter.prevent="
                            !replies[selectedAssessment?.id]?.trim() || submitting || !activeUploadForReply
                            ? null
                            : handleReply(instructorComment?.id || null)
                        "
                      placeholder="Write feedback…"
                      rows="2"
                      class="flex-1 px-3 py-2 text-sm text-slate-950 dark:text-white bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
                      :disabled="submitting"
                    ></textarea>
                    <button
                      @click="handleReply(instructorComment?.id || null)"
                      :disabled="!replies[selectedAssessment?.id]?.trim() || submitting || !activeUploadForReply"
                      class="px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {{ submitting ? '…' : 'Send' }}
                    </button>
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

.score-input::-webkit-outer-spin-button,
.score-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.score-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
.score-input::placeholder {
  opacity: 1;
  font-weight: 600;
}
.score-input-group:has(.score-input:disabled) {
  opacity: 0.75;
}
</style>
