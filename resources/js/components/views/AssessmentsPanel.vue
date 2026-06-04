<script setup>
import api from '../../services/axios.js'
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeading from '@/components/PageHeading.vue'
import PageSubheading from '@/components/PageSubheading.vue'
import SessionButton from '@/components/SessionButton.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import AssessmentList from '@/components/AssessmentList.vue'
import AssessmentFormModal from '@/components/AssessmentFormModal.vue'
import ProjectUploadModal from '@/components/ProjectUploadModal.vue'

const showModal = ref(false)
const showModalForProjectUploads = ref(false)
const submitting = ref(false)
const formError = ref('')
const route = useRoute()
const isEditMode = ref(false)
const editingAssessmentId = ref(null)
const user_role = route.path.startsWith('/user-dashboard/tl-session-detail/') ? 'tl' : 'user'


// Upload progress tracking
const uploadProgress = ref(0)
const isUploading = ref(false)

const props = defineProps({
  assessments: Array,
  loading: Boolean,
  error: Boolean,
  fetchAssessments: Function,
  activePanel: String,
  sessionDetails: Object
})
const sessionStartDate = computed(() => props.sessionDetails?.date)


const emit = defineEmits(['fetchAssessments'])
const user_id = JSON.parse(localStorage.getItem('user'))?.id

const uploadSubmissionType = ref('file')

const formDataOfUploads = ref({
  file_path: null,
  submission_link: '',
  notes: '',
  user_id: null,
  assessment_id: null,
})

const resetUploadForm = () => {
  uploadSubmissionType.value = 'file'
  formDataOfUploads.value = {
    file_path: null,
    submission_link: '',
    notes: '',
    user_id: null,
    assessment_id: null,
  }
}

const switchUploadSubmissionType = (type) => {
  if (uploadSubmissionType.value === type) return
  uploadSubmissionType.value = type
  formDataOfUploads.value.file_path = null
  formDataOfUploads.value.submission_link = ''
}

const updateUploadField = (field, value) => {
  formDataOfUploads.value[field] = value
}

const canSubmitUpload = computed(() => {
  if (uploadSubmissionType.value === 'file') {
    return Boolean(formDataOfUploads.value.file_path)
  }
  const link = formDataOfUploads.value.submission_link?.trim()
  if (!link) return false
  try {
    const url = new URL(link)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
})

const formData = ref({
  name: '',
  description: '',
  start_date_time: '',
  end_date_time: '',
  supporting_files: null
})

const isSelectedFile = (value) => typeof File !== 'undefined' && value instanceof File

const supportingFileLabel = computed(() => {
  const supportingFile = formData.value.supporting_files
  if (isSelectedFile(supportingFile)) return supportingFile.name
  if (supportingFile) return 'Existing file attached'
  return 'Click to attach a file'
})

const normalizeDateString = (dateStr) => {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  if (str.includes('T')) return str.split('T')[0]
  if (str.includes(' ')) return str.split(' ')[0]
  return str.slice(0, 10)
}

const updateFormField = (field, value) => {
  formData.value[field] = value
}

const updateAssessmentDateRange = ({ startDate, endDate }) => {
  formData.value.start_date_time = startDate
  formData.value.end_date_time = endDate
}

const openAssessmentModal = () => {
  isEditMode.value = false
  editingAssessmentId.value = null
  formData.value = { name: '', description: '', start_date_time: '', end_date_time: '', supporting_files: null }
  showModal.value = true
}

const openEditAssessmentModal = (assessment) => {
  isEditMode.value = true
  editingAssessmentId.value = assessment.id
  formData.value = {
    name: assessment.name ?? '',
    description: assessment.description ?? '',
    start_date_time: normalizeDateString(assessment.start_date_time),
    end_date_time: normalizeDateString(assessment.end_date_time),
    supporting_files: assessment.supporting_files ?? null
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formError.value = ''
  isEditMode.value = false
  editingAssessmentId.value = null
}

const openProjectUploadsModal = (assessment) => {
//   if (assessment.end_date_time < new Date().toISOString()) {
//     alert('Cannot upload files for an assessment that has already ended.')
//     return
//   }
  resetUploadForm()
  showModalForProjectUploads.value = true
  formDataOfUploads.value.assessment_id = assessment.id
}

const closeProjectUploadsModal = () => {
  showModalForProjectUploads.value = false
  resetUploadForm()
}

const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]

  if (!allowedTypes.includes(file.type)) {
    alert('Only PDF and PPT files are allowed')
    e.target.value = '' // reset input
    return
  }
  formData.value.supporting_files = file
}

const handleFileChangeOfUploads = (e) => {
  formDataOfUploads.value.file_path = e.target.files[0]
}

const submitForm = async () => {
  submitting.value = true

  try {
    const payload = new FormData()

    payload.append('name', formData.value.name)
    payload.append('description', formData.value.description)

    if (!isEditMode.value) {
      payload.append('events_id', route.params.id)
    }

    payload.append('start_date_time', formData.value.start_date_time)
    payload.append('end_date_time', formData.value.end_date_time)

    if (isSelectedFile(formData.value.supporting_files)) {
      payload.append('supporting_files', formData.value.supporting_files)
    }

    if (isEditMode.value && editingAssessmentId.value) {
      payload.append('_method', 'PUT')

      await api.post(`/api/assessments/${editingAssessmentId.value}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      await api.post('/api/assessments', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }

    emit('fetchAssessments')
    closeModal()

  } catch (err) {
    formError.value =
      err.response?.data?.message ||
      (isEditMode.value
        ? 'Failed to update assessment'
        : 'Failed to create assessment')
  } finally {
    submitting.value = false
  }
}

const submitFormOfUploads = async () => {
  const userId = JSON.parse(localStorage.getItem('user'))?.id
  const isFileSubmission = uploadSubmissionType.value === 'file'

  if (isFileSubmission) {
    if (!formDataOfUploads.value.file_path) {
      alert('Please select a ZIP file to upload')
      return
    }

    const maxBytes = 30 * 1024 * 1024
    if (formDataOfUploads.value.file_path.size > maxBytes) {
      alert('Selected ZIP is larger than 30MB. Please upload a smaller file or increase server upload limits (upload_max_filesize/post_max_size).')
      return
    }
  } else {
    if (!canSubmitUpload.value) {
      alert('Please enter a valid URL (must start with http:// or https://)')
      return
    }
  }

  submitting.value = true
  isUploading.value = isFileSubmission
  uploadProgress.value = 0
  try {
    if (isFileSubmission) {
      const formDataMultipart = new FormData()
      formDataMultipart.append('user_id', userId)
      formDataMultipart.append('events_id', route.params.id)
      formDataMultipart.append('assessment_id', formDataOfUploads.value.assessment_id)
      formDataMultipart.append('file_path', formDataOfUploads.value.file_path)
      if (formDataOfUploads.value.notes?.trim()) {
        formDataMultipart.append('notes', formDataOfUploads.value.notes.trim())
      }

      await api.post('/api/project-uploads', formDataMultipart, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        }
      })
    } else {
      await api.post('/api/project-uploads', {
        user_id: userId,
        events_id: route.params.id,
        assessment_id: formDataOfUploads.value.assessment_id,
        submission_link: formDataOfUploads.value.submission_link.trim(),
        notes: formDataOfUploads.value.notes?.trim() || undefined,
      })
    }

    alert(isFileSubmission ? 'File uploaded successfully' : 'Link submitted successfully')
    emit('fetchAssessments')
    closeProjectUploadsModal()
  } catch (err) {
    console.error('[upload] error:', err.response?.data || err.message)
    const errors = err.response?.data?.errors
    const message =
      errors?.file_path?.[0] ||
      errors?.submission_link?.[0] ||
      err.response?.data?.message ||
      err.message
    alert(`Submission failed: ${message}`)
  } finally {
    submitting.value = false
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const requestExtension = async (assessmentId, eventId) => {
  try {
    await api.post('/api/request-extension', {
      assessment_id: assessmentId,
      events_id: eventId,
      user_id: user_id
    })
    alert('Extension request submitted successfully')
    emit('fetchAssessments')
  } catch (err) {
    alert('Failed to submit extension request')
  }
}

const downloadSupportingFiles = (assessmentId) => {
  window.open(`/api/assessments/${assessmentId}/supporting-file`, '_blank')
}

const hasUserUpload = (assessment) => {
  const member = assessment.session.session_members.find(m => m.users_id === user_id)
  return member && member.project_uploads
}

const deleteAssessment = async (assessmentId) => {
              if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) return;
              try {
                await api.delete(`/api/assessments/${assessmentId}`);
                emit('fetchAssessments');
              } catch (err) {
                alert('Failed to delete assessment.');
              }
            }

</script>

<template>
  <div class="w-full">
    <!-- Header Section -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <PageHeading>Assessments</PageHeading>
        <PageSubheading>Manage and track assessment submissions</PageSubheading>
      </div>
      <SessionButton  v-if="activePanel === 'assessments'" variant="primary" @click="openAssessmentModal" >New Assessment</SessionButton>
    </div>

    <!-- Loading State -->
    <LoadingState v-if="loading" message="Loading assessments..." />

    <!-- Error State -->
    <ErrorState v-else-if="error" message="Failed to load assessments. Please try again." />

    <!-- Empty State -->
    <div v-else-if="assessments.length === 0" class="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12">
      <div class="flex flex-col items-center gap-4 text-center">
        <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">No assessments yet</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">Create your first assessment to get started</p>
        </div>
      </div>
      <SessionButton  v-if="activePanel === 'assessments'" variant="primary" @click="openAssessmentModal" >New Assessment</SessionButton>
    </div>

    <!-- Grid Layout -->
    <AssessmentList
      v-else
      :assessments="assessments"
      :user-id="user_id"
      :user-role="user_role"
      @edit-assessment="openEditAssessmentModal"
      @delete-assessment="deleteAssessment"
      @download-supporting-files="downloadSupportingFiles"
      @open-project-uploads="openProjectUploadsModal"
      @request-extension="requestExtension"
    />

    <!-- ─────────────────────────────────────────
         Add / Edit Assessment Modal
    ───────────────────────────────────────── -->
    <AssessmentFormModal
      v-if="showModal"
      :form-data="formData"
      :form-error="formError"
      :submitting="submitting"
      :is-edit-mode="isEditMode"
      :supporting-file-label="supportingFileLabel"
      :session-start-date="sessionStartDate"
      @close="closeModal"
      @submit="submitForm"
      @file-change="handleFileChange"
      @update-field="updateFormField"
      @update-date-range="updateAssessmentDateRange"
    />

    <!-- ─────────────────────────────────────────
         Upload Files Modal
    ───────────────────────────────────────── -->
    <ProjectUploadModal
      v-if="showModalForProjectUploads"
      :upload-submission-type="uploadSubmissionType"
      :form-data="formDataOfUploads"
      :can-submit-upload="canSubmitUpload"
      :submitting="submitting"
      :is-uploading="isUploading"
      :upload-progress="uploadProgress"
      @close="closeProjectUploadsModal"
      @submit="submitFormOfUploads"
      @switch-submission-type="switchUploadSubmissionType"
      @file-change="handleFileChangeOfUploads"
      @update-field="updateUploadField"
    />
  </div>
</template>

<style scoped>
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.grid > * { animation: slideUp 0.4s ease-out both; }
.grid > *:nth-child(1) { animation-delay: 0.05s; }
.grid > *:nth-child(2) { animation-delay: 0.10s; }
.grid > *:nth-child(3) { animation-delay: 0.15s; }
.grid > *:nth-child(4) { animation-delay: 0.20s; }
.grid > *:nth-child(5) { animation-delay: 0.25s; }
.grid > *:nth-child(6) { animation-delay: 0.30s; }

input:focus, textarea:focus { outline: none; }

/* ── Flatpickr range picker (purple) ── */
.assessment-date-picker-section {
  overflow: visible;
}

.assessment-flatpickr-wrap {
  position: relative;
}

/* Force the calendar to a fixed width so day cells never wrap */
.assessment-flatpickr-wrap :deep(.flatpickr-calendar) {
  position: absolute !important;
  top: calc(100% + 8px) !important;
  left: 0 !important;
  width: 308px !important;       /* ← fixed width: 7 cols × 44px */
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 8px;
  font-family: inherit;
  z-index: 9999;
}

.assessment-flatpickr-wrap :deep(.flatpickr-months .flatpickr-month) {
  background: transparent;
  color: #111827;
}

.assessment-flatpickr-wrap :deep(.flatpickr-current-month) {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.assessment-flatpickr-wrap :deep(span.flatpickr-weekday) {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Fixed cell size so 7 days × 44px = 308px, never wraps to 6 rows */
.assessment-flatpickr-wrap :deep(.flatpickr-day) {
  color: #374151;
  border-radius: 10px;
  max-width: 38px !important;
  width: 38px !important;
  height: 38px !important;
  line-height: 38px !important;
  flex-basis: 14.2857% !important;
}

.assessment-flatpickr-wrap :deep(.flatpickr-days),
.assessment-flatpickr-wrap :deep(.dayContainer) {
  width: 100% !important;
  min-width: unset !important;
  max-width: unset !important;
}

.assessment-flatpickr-wrap :deep(.flatpickr-day:hover) {
  background: #f3e8ff;
  border-color: transparent;
  color: #7c3aed;
}

.assessment-flatpickr-wrap :deep(.flatpickr-day.today) {
  border-color: #7c3aed;
  color: #7c3aed;
  font-weight: 700;
}

.assessment-flatpickr-wrap :deep(.flatpickr-day.selected),
.assessment-flatpickr-wrap :deep(.flatpickr-day.startRange),
.assessment-flatpickr-wrap :deep(.flatpickr-day.endRange),
.assessment-flatpickr-wrap :deep(.flatpickr-day.selected:hover),
.assessment-flatpickr-wrap :deep(.flatpickr-day.startRange:hover),
.assessment-flatpickr-wrap :deep(.flatpickr-day.endRange:hover) {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border-color: transparent;
  color: #ffffff;
  font-weight: 700;
}

.assessment-flatpickr-wrap :deep(.flatpickr-day.inRange) {
  background: #ede9fe;
  border-color: transparent;
  color: #5b21b6;
  box-shadow: none;
}

.dark .assessment-flatpickr-wrap :deep(.flatpickr-calendar) {
  background: #1e293b;
  border-color: #334155;
}

.dark .assessment-flatpickr-wrap :deep(.flatpickr-months .flatpickr-month),
.dark .assessment-flatpickr-wrap :deep(.flatpickr-current-month) {
  color: #f1f5f9;
}

.dark .assessment-flatpickr-wrap :deep(.flatpickr-day) {
  color: #cbd5e1;
}

.dark .assessment-flatpickr-wrap :deep(.flatpickr-day:hover) {
  background: #312e81;
  color: #e0e7ff;
}

.dark .assessment-flatpickr-wrap :deep(.flatpickr-day.inRange) {
  background: #3730a3;
  color: #e0e7ff;
}
</style>
