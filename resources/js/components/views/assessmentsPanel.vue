<script setup>
import api from '../../services/axios.js'
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'

const error = ref(false)
const loading = ref(false)
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


const emit = defineEmits('fetchAssessments')
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

const dateRangeInput = ref(null)
const datePickerWrap = ref(null)
let rangePicker = null

const normalizeDateString = (dateStr) => {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  if (str.includes('T')) return str.split('T')[0]
  if (str.includes(' ')) return str.split(' ')[0]
  return str.slice(0, 10)
}

const parsePickerDate = (dateStr) => {
  const normalized = normalizeDateString(dateStr)
  if (!normalized) return null
  const parsed = new Date(`${normalized}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toFormDateString = (date) => {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getDefaultPickerDates = () => {
  const start = parsePickerDate(formData.value.start_date_time)
  const end = parsePickerDate(formData.value.end_date_time)
  if (start && end) return [start, end]
  if (start) return [start]
  return null
}

const minPickerDate = computed(() => {
  const sessionDate = parsePickerDate(sessionStartDate.value)
  const assessmentStart = parsePickerDate(formData.value.start_date_time)

  if (sessionDate && assessmentStart) {
    return assessmentStart < sessionDate ? assessmentStart : sessionDate
  }
  if (sessionDate) return sessionDate
  if (isEditMode.value && assessmentStart) return assessmentStart
  return 'today'
})

const destroyDatePicker = () => {
  if (rangePicker) {
    rangePicker.destroy()
    rangePicker = null
  }
}

const initDatePicker = () => {
  // Double nextTick: modal is teleported + v-if, DOM may not be ready after one tick
  nextTick(() => {
    nextTick(() => {
    if (!dateRangeInput.value) return

    destroyDatePicker()

    const defaultDates = getDefaultPickerDates()

    rangePicker = flatpickr(dateRangeInput.value, {
      mode: 'range',
      enableTime: false,
      dateFormat: 'Y-m-d',
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      static: true,
      minDate: minPickerDate.value,
      defaultDate: defaultDates ?? undefined,
      appendTo: datePickerWrap.value || undefined,
      onChange: (selectedDates) => {
        formData.value.start_date_time = selectedDates[0]
          ? toFormDateString(selectedDates[0])
          : ''
        formData.value.end_date_time = selectedDates[1]
          ? toFormDateString(selectedDates[1])
          : ''
      },
    })

    if (defaultDates) {
      rangePicker.setDate(defaultDates, false)
    }
    })
  })
}

const openAssessmentModal = () => {
  isEditMode.value = false
  editingAssessmentId.value = null
  formData.value = { name: '', description: '', start_date_time: '', end_date_time: '', supporting_files: null }
  showModal.value = true
  initDatePicker()
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
  initDatePicker()
}

const closeModal = () => {
  destroyDatePicker()
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
    const file = event.target.files[0]
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
  formData.value.supporting_files = e.target.files[0]
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
      payload.append('start_date_time', formData.value.start_date_time)
      payload.append('events_id', route.params.id)
    }

    payload.append('end_date_time', formData.value.end_date_time)

    if (formData.value.supporting_files) {
      payload.append('supporting_files', formData.value.supporting_files)
    }

    if (isEditMode.value && editingAssessmentId.value) {
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

const hasUserUpload = (assessment) => {
  const member = assessment.session.session_members.find(m => m.users_id === user_id)
  return member && member.project_uploads
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const isOverdue = (dateString) => new Date(dateString) < new Date()

const deleteAssessment = async (assessmentId) => {
              if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) return;
              try {
                await api.delete(`/api/assessments/${assessmentId}`);
                emit('fetchAssessments');
              } catch (err) {
                alert('Failed to delete assessment.');
              }
            }

const userSubmissionsByAssessment = computed(() => {
  const map = new Map()
  const list = Array.isArray(props.assessments) ? props.assessments : []

  for (const assessment of list) {
    const member = assessment?.session?.session_members?.find(
      (m) => Number(m?.users_id) === Number(user_id)
    )
    const uploads = Array.isArray(member?.project_uploads) ? member.project_uploads : []

    const candidates = uploads
      .filter((upload) => Number(upload?.events_assessments_id) === Number(assessment?.id))
      .sort((a, b) => {
        const aTime = new Date(a?.created_at || 0).getTime()
        const bTime = new Date(b?.created_at || 0).getTime()
        if (bTime !== aTime) return bTime - aTime
        return Number(b?.id || 0) - Number(a?.id || 0)
      })

    map.set(assessment.id, candidates[0] || null)
  }
  console.log('User submissions by assessment:', map)

  return map
})

const hasUserSubmitted = (assessmentId) => {
  return userSubmissionsByAssessment.value.get(assessmentId) || null
}

const checkIfUserCanUpload = (assessment) => {
    console.log('Checking if user can upload for assessment:', assessment.name)
    const endDate = new Date(assessment.end_date_time)
    const now = new Date()

        const user = JSON.parse(localStorage.getItem('user'))

        const sessionMember = assessment.session.session_members.find(
            member => member.users_id === user.id
        )

        if (!sessionMember) return false

       const reopenRequest = assessment.reopen_requests.find(
            request => request.events_users_id === sessionMember.id
        )

        if (!reopenRequest) {
            console.log('User has not requested a reopen for this assessment.')
             if (now < endDate)
                return true
        }
        console.log('User has a reopen request with status:', reopenRequest.status)

        if (reopenRequest.status === 1) {
            return true
        }

        return false

    


}
const hasRequestedExtension = (assessment) => {
    const user = JSON.parse(localStorage.getItem('user'))

    const sessionMember = assessment.session.session_members.find(
        member => member.users_id === user.id
    )

    if (!sessionMember) return false

    const hasRequestedReopen = assessment.reopen_requests.some(
        request => request.events_users_id === sessionMember.id && request.status === 0
    )
    return hasRequestedReopen
}

</script>

<template>
  <div class="w-full">
    <!-- Header Section -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Assessments</h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage and track assessment submissions</p>
      </div>
      <button
        v-if="activePanel === 'assessments'"
        @click="openAssessmentModal"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Assessment
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p class="text-gray-600 dark:text-gray-400">Loading assessments...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
      <p class="text-red-800 dark:text-red-200 font-medium">Failed to load assessments. Please try again.</p>
    </div>

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
        <button
          v-if="activePanel === 'assessments'"
          @click="openAssessmentModal"
          class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Assessment
        </button>
      </div>
    </div>

    <!-- Grid Layout -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="assessment in assessments"
        :key="assessment.id"
        class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
        <div class="p-6">
          <div class="mb-4">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{{ assessment.name }}</h3>
              <span :class="[
                'flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full',
                isOverdue(assessment.end_date_time)
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              ]">{{ isOverdue(assessment.end_date_time) ? 'Overdue' : 'Active' }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ assessment.description || 'No description provided' }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-700">
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Start Date</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(assessment.start_date_time) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(assessment.end_date_time) }}</p>
            </div>
            <div v-if="hasUserSubmitted(assessment.id)">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Score</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white"> {{ hasUserSubmitted(assessment.id)?.score ?? 'N/A' }}</p>
            </div>
          </div>
            <div class="flex gap-3">
              <div v-if="assessment.session.created_by === user_id" class="w-full flex gap-2">
                <button @click="openEditAssessmentModal(assessment)" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button @click="deleteAssessment(assessment.id)" class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-800 transition-all duration-200 text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Delete
                </button>
              </div>
            <div v-else class="w-full space-y-3">
                <div
                    v-if="
                        user_role != 'tl' &&
                        hasUserSubmitted(assessment.id)?.score == null
                    "
                    class="space-y-3"
                    >
                    <!-- Upload button -->
                    <button
                         v-if="checkIfUserCanUpload(assessment)"
                        @click="openProjectUploadsModal(assessment)"
                        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm"
                    >
                        Upload
                    </button>

                    <!-- Already requested -->
                    <button
                        v-if="isOverdue(assessment.end_date_time) && hasRequestedExtension(assessment)"
                        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 text-sm border border-orange-200 dark:border-orange-800"
                    >
                        Already Requested
                    </button>

                    <!-- Request extension -->
                    <button
                        v-else-if="isOverdue(assessment.end_date_time) && !hasRequestedExtension(assessment)"
                        @click="requestExtension(assessment.id, assessment.events_id)"
                        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 text-sm border border-orange-200 dark:border-orange-800"
                    >
                        Request Extension
                    </button>
                    </div>

                    <div v-else-if="hasUserSubmitted(assessment.id)?.score != null">
                    <button
                        class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg text-sm"
                    >
                        Already Submitted
                    </button>
                    </div>
            </div>

          </div>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-purple-600/0 to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>

    <!-- ─────────────────────────────────────────
         Add / Edit Assessment Modal
    ───────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

        <!-- Dialog -->
        <div class="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700">

          <!-- Header -->
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
            <h3 class="text-xl font-bold text-white">
              {{ isEditMode ? 'Edit Assessment' : 'Create Assessment' }}
            </h3>
            <p class="text-purple-100 text-sm mt-0.5">
              {{ isEditMode ? 'Update assessment details below' : 'Fill in the details for your new assessment' }}
            </p>
          </div>

          <!-- Body -->
          <div class="px-6 py-6 space-y-5 overflow-y-auto max-h-[65vh]">

            <!-- Name -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Assessment Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="e.g., Final Project Submission"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                :disabled="submitting"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Description
              </label>
              <textarea
                v-model="formData.description"
                placeholder="Add any instructions or requirements..."
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                :disabled="submitting"
              ></textarea>
            </div>

            <!-- Date Range -->
            <div class="assessment-date-picker-section">
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Assessment Date Range <span class="text-red-500">*</span>
              </label>
              <div ref="datePickerWrap" class="assessment-flatpickr-wrap">
                <input
                  ref="dateRangeInput"
                  type="text"
                  placeholder="Select start and end date"
                  readonly
                  class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm cursor-pointer"
                  :disabled="submitting"
                />
              </div>
              <p
                v-if="formData.start_date_time && formData.end_date_time"
                class="mt-2 text-sm font-medium text-purple-700 dark:text-purple-300"
              >
                Selected: {{ formData.start_date_time }} – {{ formData.end_date_time }}
              </p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Click a start date, then an end date on the calendar.
              </p>
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Supporting Files
              </label>
              <label class="flex items-center gap-3 px-4 py-2.5 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group">
                <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {{ formData.supporting_files ? formData.supporting_files.name : 'Click to attach a file' }}
                </span>
                <input @change="handleFileChange" type="file" class="hidden" :disabled="submitting" accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"/>
              </label>
            </div>

            <!-- Error -->
            <div v-if="formError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p class="text-sm text-red-800 dark:text-red-200">{{ formError }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              @click="closeModal"
              :disabled="submitting"
              class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              @click="submitForm"
              :disabled="submitting"
              class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="submitting" class="animate-spin inline-block">⟳</span>
              {{ isEditMode ? 'Save Changes' : 'Create Assessment' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─────────────────────────────────────────
         Upload Files Modal
    ───────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="showModalForProjectUploads" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeProjectUploadsModal"></div>

        <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg z-50 border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
            <h3 class="text-xl font-bold text-white">Submit Assessment</h3>
            <p class="text-purple-100 text-sm mt-0.5">Upload a ZIP file or paste a project link</p>
          </div>

          <div class="p-6 space-y-5">
            <div class="flex rounded-xl bg-gray-100 dark:bg-slate-700/60 p-1 gap-1">
              <button
                type="button"
                @click="switchUploadSubmissionType('file')"
                :disabled="isUploading || submitting"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
                  uploadSubmissionType === 'file'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                File
              </button>
              <button
                type="button"
                @click="switchUploadSubmissionType('link')"
                :disabled="isUploading || submitting"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
                  uploadSubmissionType === 'link'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link
              </button>
            </div>

            <div v-if="uploadSubmissionType === 'file'">
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">ZIP File <span class="text-red-500">*</span></label>
              <div class="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all cursor-pointer" :class="{ 'opacity-50 pointer-events-none': isUploading }">
                <input type="file" accept=".zip" @change="handleFileChangeOfUploads" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" :disabled="isUploading" />
                <div class="text-center pointer-events-none">
                  <svg class="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">Drop your ZIP file here</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse</p>
                </div>
              </div>
              <p v-if="formDataOfUploads.file_path && !isUploading" class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="truncate">{{ formDataOfUploads.file_path.name }}</span>
              </p>
            </div>

            <div v-else>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Project Link <span class="text-red-500">*</span></label>
              <input
                v-model="formDataOfUploads.submission_link"
                type="url"
                placeholder="https://github.com/username/project or https://drive.google.com/..."
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                :disabled="submitting"
              />
              <p v-if="formDataOfUploads.submission_link && !canSubmitUpload" class="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Enter a valid URL starting with http:// or https://
              </p>
              <p v-else-if="canSubmitUpload" class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="truncate">{{ formDataOfUploads.submission_link }}</span>
              </p>
            </div>

            <!-- Upload Progress Bar -->
            <div v-if="isUploading" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
                <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out" :style="{ width: uploadProgress + '%' }"></div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Notes (Optional)</label>
              <textarea
                v-model="formDataOfUploads.notes"
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                rows="3"
                placeholder="Add notes about your submission..."
                :disabled="isUploading || submitting"
              ></textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
            <button @click="closeProjectUploadsModal" :disabled="submitting" class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button @click="submitFormOfUploads" :disabled="submitting || !canSubmitUpload" class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <span v-if="submitting" class="animate-spin inline-block">⟳</span>
              Submit
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

.assessment-flatpickr-wrap :deep(.flatpickr-calendar) {
  position: relative !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  max-width: 100%;
  margin-top: 0.75rem;
  box-shadow: none;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 8px;
  font-family: inherit;
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

.assessment-flatpickr-wrap :deep(.flatpickr-day) {
  color: #374151;
  border-radius: 10px;
  max-width: 38px;
  height: 38px;
  line-height: 38px;
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
