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

const getFileName = (filePath) => {
    return filePath?.split('/').pop() || filePath
}

const selectMember = (member) => {
    selectedMember.value = member
}

const getInitials = (name) => name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || '?'

const isUploadComment = (item) =>
    (item?.comments || '').trim().toLowerCase() === 'new file uploaded'

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

const isLatestUploadComment = (comment) => {
    const upload = uploadForComment(comment)
    return Boolean(upload?.id && activeUploadForReply.value?.id && Number(upload.id) === Number(activeUploadForReply.value.id))
}

const isSavingScore = (uploadId) => savingScoreUploadId.value === uploadId
const isScoreSaved = (uploadId) => Boolean(scoreSuccessUploads.value[uploadId])

const activeUploadForReply = computed(() => {
    const uploads = memberUploads.value
    if (!uploads.length) return null
    return uploads[uploads.length - 1]
})

const instructorComment = computed(() => {
    const list = selectedMemberComments.value
    const byRole = list.find((c) => !isStudentComment(c))
    if (byRole) return byRole
    return list.find((c) => !Boolean(c?.is_upload || c?.file_url)) || null
})

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
                @click="selectedAssessment = assessment; selectedMember = null"
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

        <!-- Member selected — full-width chat -->
        <template v-else>
          <div class="h-full min-h-0">
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden h-full">
                <div class="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 flex items-center gap-2 shrink-0">
                  <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-200">Feedback Thread</h4>
                  <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {{ selectedMember.user.name }} • {{ selectedAssessment.name }}
                  </span>
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
                              <div
                                v-if="isUploadComment(comment) && uploadForComment(comment)"
                                class="mt-2 flex items-center gap-2"
                              >
                                <button
                                  type="button"
                                  @click="downloadFile(uploadForComment(comment).id)"
                                  class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                >
                                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </button>
                                <template v-if="isLatestUploadComment(comment)">
                                  <input
                                    v-model="scoreInputs[uploadForComment(comment).id]"
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Score"
                                    class="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    :disabled="isSavingScore(uploadForComment(comment).id)"
                                    @blur="updateScore(uploadForComment(comment).id)"
                                    @keydown="handleScoreKeydown($event, uploadForComment(comment).id)"
                                  />
                                  <span
                                    v-if="isScoreSaved(uploadForComment(comment).id)"
                                    class="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                  >
                                    Saved
                                  </span>
                                </template>
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
                                    <div
                                      v-if="isUploadComment(reply) && uploadForComment(reply)"
                                      class="mt-2 flex items-center gap-2"
                                    >
                                      <button
                                        type="button"
                                        @click="downloadFile(uploadForComment(reply).id)"
                                        class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                                      >
                                        <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                      </button>
                                      <template v-if="isLatestUploadComment(reply)">
                                        <input
                                          v-model="scoreInputs[uploadForComment(reply).id]"
                                          type="number"
                                          min="0"
                                          max="100"
                                          placeholder="Score"
                                          class="w-20 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                          :disabled="isSavingScore(uploadForComment(reply).id)"
                                          @blur="updateScore(uploadForComment(reply).id)"
                                          @keydown="handleScoreKeydown($event, uploadForComment(reply).id)"
                                        />
                                        <span
                                          v-if="isScoreSaved(uploadForComment(reply).id)"
                                          class="text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                        >
                                          Saved
                                        </span>
                                      </template>
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
                      v-model="replies[selectedAssessment?.id]"
                      placeholder="Write feedback…"
                      rows="2"
                      class="flex-1 px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-all"
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
</style>
