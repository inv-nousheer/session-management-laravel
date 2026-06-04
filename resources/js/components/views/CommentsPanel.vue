<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import api from '../../services/axios.js'
import PageHeading from '@/components/PageHeading.vue'
import PageSubheading from '@/components/PageSubheading.vue'
import CommentsLeftPanel from '@/components/CommentsLeftPanel.vue'
import CommentsRightPanel from '@/components/CommentsRightPanel.vue'

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

const selectAssessment = (assessment) => {
    selectedAssessment.value = assessment
    selectedMember.value = null
}

const updateScoreInput = (uploadId, value) => {
    scoreInputs.value[uploadId] = value
}

const updateReplyText = (value) => {
    if (!selectedAssessment.value?.id) return
    replies.value[selectedAssessment.value.id] = value
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
    <div class="bg-slate-50 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 px-6 py-4 shadow-sm shrink-0">
      <PageHeading>Reviews & Scoring</PageHeading>
      <PageSubheading>Review submissions, add feedback, and assign scores</PageSubheading>
    </div>

    <!-- Body -->
    <div class="flex-1 flex overflow-hidden gap-4 p-4 min-h-0">

      <CommentsLeftPanel
        :assessments="assessments"
        :selected-assessment="selectedAssessment"
        :selected-member="selectedMember"
        @select-assessment="selectAssessment"
        @select-member="selectMember"
      />

      <CommentsRightPanel
        :selected-assessment="selectedAssessment"
        :selected-member="selectedMember"
        :member-uploads="memberUploads"
        :selected-member-comments="selectedMemberComments"
        :active-upload-for-reply="activeUploadForReply"
        :instructor-comment="instructorComment"
        :score-inputs="scoreInputs"
        :reply-text="replies[selectedAssessment?.id] || ''"
        :submitting="submitting"
        :saving-score-upload-id="savingScoreUploadId"
        :score-success-uploads="scoreSuccessUploads"
        @update-score-input="updateScoreInput"
        @save-score="updateScore"
        @score-keydown="handleScoreKeydown"
        @download-file="downloadFile"
        @open-url="openUrl"
        @update-reply="updateReplyText"
        @submit-reply="handleReply"
      />
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
