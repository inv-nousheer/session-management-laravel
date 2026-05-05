<script setup>
import api from '../../services/axios.js'
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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

// Upload progress tracking
const uploadProgress = ref(0)
const isUploading = ref(false)

// Flatpickr refs
const startDateInput = ref(null)
const endDateInput = ref(null)
let startPicker = null
let endPicker = null

defineProps({
  assessments: Array,
  loading: Boolean,
  error: Boolean,
  fetchAssessments: Function,
  activePanel: String
})

const emit = defineEmits('fetchAssessments')
const user_id = JSON.parse(localStorage.getItem('user'))?.id

const formDataOfUploads = ref({
  file_path: null,
  user_id: null,
  assessment_id: null,
})

const formData = ref({
  name: '',
  description: '',
  start_date_time: '',
  end_date_time: '',
  supporting_files: null
})

// Initialize Flatpickr pickers inside the modal
const initPickers = () => {
  nextTick(() => {
    if (startDateInput.value) {
      startPicker = flatpickr(startDateInput.value, {
        enableTime: false,
        dateFormat: 'Y-m-d',
        allowInput: false,
        disableMobile: true,
        onChange: (selectedDates, dateStr) => {
          formData.value.start_date_time = dateStr
          // Update end picker's minDate to start date
          if (endPicker) {
            endPicker.set('minDate', dateStr)
          }
        }
      })
      // Set existing value if edit mode
      if (formData.value.start_date_time) {
        startPicker.setDate(formData.value.start_date_time)
      }
    }

    if (endDateInput.value) {
      endPicker = flatpickr(endDateInput.value, {
        enableTime: false,
        dateFormat: 'Y-m-d',
        allowInput: false,
        disableMobile: true,
        minDate: formData.value.start_date_time || 'today',
        onChange: (selectedDates, dateStr) => {
          formData.value.end_date_time = dateStr
        }
      })
      // Set existing value if edit mode
      if (formData.value.end_date_time) {
        endPicker.setDate(formData.value.end_date_time)
      }
    }
  })
}

const destroyPickers = () => {
  if (startPicker) { startPicker.destroy(); startPicker = null }
  if (endPicker) { endPicker.destroy(); endPicker = null }
}

const openAssessmentModal = () => {
  isEditMode.value = false
  editingAssessmentId.value = null
  formData.value = { name: '', description: '', start_date_time: '', end_date_time: '', supporting_files: null }
  showModal.value = true
  nextTick(() => initPickers())
}

const openEditAssessmentModal = (assessment) => {
  isEditMode.value = true
  editingAssessmentId.value = assessment.id
  formData.value = {
    name: assessment.name ?? '',
    description: assessment.description ?? '',
    start_date_time: assessment.start_date_time ? assessment.start_date_time.split('T')[0] : '',
    end_date_time: assessment.end_date_time ? assessment.end_date_time.split('T')[0] : '',
    supporting_files: assessment.supporting_files ?? null
  }
  showModal.value = true
  nextTick(() => initPickers())
}

const closeModal = () => {
  destroyPickers()
  showModal.value = false
  formError.value = ''
  isEditMode.value = false
  editingAssessmentId.value = null
}

const openProjectUploadsModal = (assessment) => {
  if (assessment.end_date_time < new Date().toISOString()) {
    alert('Cannot upload files for an assessment that has already ended.')
    return
  }
  showModalForProjectUploads.value = true
  formDataOfUploads.value.assessment_id = assessment.id
}

const closeProjectUploadsModal = () => {
  showModalForProjectUploads.value = false
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
  // Validate file exists
  if (!formDataOfUploads.value.file_path) {
    alert('Please select a ZIP file to upload')
    return
  }

  // PHP on many servers rejects uploads above upload_max_filesize (often 2MB by default).
  // If that happens, Laravel won't receive the file at all and will return "file_path required".
  const maxBytes = 2 * 1024 * 1024 // 2MB
  if (formDataOfUploads.value.file_path.size > maxBytes) {
    alert('Selected ZIP is larger than 2MB. Please upload a smaller file or increase server upload limits (upload_max_filesize/post_max_size).')
    return
  }

  submitting.value = true
  isUploading.value = true
  uploadProgress.value = 0
  try {
    const formDataMultipart = new FormData()
    formDataMultipart.append('user_id', JSON.parse(localStorage.getItem('user'))?.id)
    formDataMultipart.append('events_id', route.params.id)
    formDataMultipart.append('assessment_id', formDataOfUploads.value.assessment_id)
    // Append file with proper field name matching backend expectation
    formDataMultipart.append('file_path', formDataOfUploads.value.file_path)

    console.log("[v0] Uploading file:", formDataOfUploads.value.file_path.name)
    console.log([...formDataMultipart.entries()])

    await api.post('/api/project-uploads', formDataMultipart, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        }
      }
    })
    alert('File uploaded successfully')
    emit('fetchAssessments')
    closeProjectUploadsModal()
    // Reset form
    formDataOfUploads.value.file_path = null
    formDataOfUploads.value.assessment_id = null
  } catch (err) {
    console.error("[v0] Upload error:", err.response?.data || err.message)
    alert(`Upload failed: ${err.response?.data?.errors?.file_path?.[0] || err.response?.data?.message || err.message}`)
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
              <button @click="openProjectUploadsModal(assessment)" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Upload
              </button>
              <button v-if="isOverdue(assessment.end_date_time)" @click="requestExtension(assessment.id, assessment.events_id)" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 text-sm border border-orange-200 dark:border-orange-800">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request Extension
              </button>
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
        <div class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">

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
            <div class="grid grid-cols-2 gap-4">
              <!-- Start Date -->
              <div>
                <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                  Start Date <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    ref="startDateInput"
                    type="text"
                    placeholder="Select start date"
                    readonly
                    class="w-full pl-4 pr-9 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm cursor-pointer"
                    :disabled="submitting || isEditMode"
                  />
                  <svg class="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <!-- End Date -->
              <div>
                <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                  End Date <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <input
                    ref="endDateInput"
                    type="text"
                    placeholder="Select end date"
                    readonly
                    class="w-full pl-4 pr-9 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm cursor-pointer"
                    :disabled="submitting"
                  />
                  <svg class="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
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
            <h3 class="text-xl font-bold text-white">Upload Assessment Files</h3>
            <p class="text-purple-100 text-sm mt-0.5">Submit your completed work for this assessment</p>
          </div>

          <div class="p-6 space-y-5">
            <div>
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
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
                rows="3"
                placeholder="Add notes or links related to your submission..."
                :disabled="isUploading"
              ></textarea>
            </div>
          </div>

          <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
            <button @click="closeProjectUploadsModal" :disabled="submitting" class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button @click="submitFormOfUploads" :disabled="submitting || !formDataOfUploads.file_path" class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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

/* ── Flatpickr custom theme (purple) ── */
:deep(.flatpickr-calendar) {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  padding: 8px;
  font-family: inherit;
}
:deep(.flatpickr-months) {
  padding: 4px 0;
}
:deep(.flatpickr-months .flatpickr-month) {
  background: transparent;
  color: #111827;
  height: 36px;
}
:deep(.flatpickr-current-month) {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}
:deep(.flatpickr-current-month .numInputWrapper input) {
  color: #111827;
}
:deep(.flatpickr-monthDropdown-months) {
  background: #ffffff;
  color: #111827;
}
:deep(.flatpickr-prev-month svg),
:deep(.flatpickr-next-month svg) {
  fill: #6b7280;
}
:deep(.flatpickr-prev-month:hover svg),
:deep(.flatpickr-next-month:hover svg) {
  fill: #7c3aed;
}
:deep(.flatpickr-weekdays) {
  background: transparent;
  margin-top: 4px;
}
:deep(span.flatpickr-weekday) {
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
}
:deep(.flatpickr-day) {
  color: #374151;
  border-radius: 10px;
  font-size: 0.85rem;
  height: 36px;
  line-height: 36px;
}
:deep(.flatpickr-day:hover) {
  background: #f3e8ff;
  border-color: transparent;
  color: #7c3aed;
}
:deep(.flatpickr-day.today) {
  border-color: #7c3aed;
  color: #7c3aed;
  font-weight: 700;
}
:deep(.flatpickr-day.selected),
:deep(.flatpickr-day.selected:hover) {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border-color: transparent;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(124,58,237,0.35);
}
:deep(.flatpickr-day.flatpickr-disabled) {
  color: #d1d5db;
}

/* Dark mode overrides */
.dark :deep(.flatpickr-calendar) {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.dark :deep(.flatpickr-months .flatpickr-month),
.dark :deep(.flatpickr-current-month),
.dark :deep(.flatpickr-current-month .numInputWrapper input) {
  color: #f1f5f9;
}
.dark :deep(.flatpickr-monthDropdown-months) {
  background: #1e293b;
  color: #f1f5f9;
}
.dark :deep(span.flatpickr-weekday) { color: #64748b; }
.dark :deep(.flatpickr-day) { color: #cbd5e1; }
.dark :deep(.flatpickr-day:hover) {
  background: #312e81;
  color: #e0e7ff;
}
.dark :deep(.flatpickr-day.today) {
  border-color: #a78bfa;
  color: #a78bfa;
}
.dark :deep(.flatpickr-day.flatpickr-disabled) { color: #475569; }
</style>
