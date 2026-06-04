<script setup>
import { computed } from 'vue'

const props = defineProps({
  assessments: {
    type: Array,
    required: true,
  },
  userId: {
    type: [Number, String],
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
})

const emit = defineEmits([
  'edit-assessment',
  'delete-assessment',
  'download-supporting-files',
  'open-project-uploads',
  'request-extension',
])

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const isOverdue = (dateString) => new Date(dateString) < new Date()

const userSubmissionsByAssessment = computed(() => {
  const map = new Map()

  for (const assessment of props.assessments) {
    const member = assessment?.session?.session_members?.find(
      (item) => Number(item?.users_id) === Number(props.userId)
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

  return map
})

const hasUserSubmitted = (assessmentId) => {
  return userSubmissionsByAssessment.value.get(assessmentId) || null
}

const getSessionMember = (assessment) => {
  return assessment.session.session_members.find(
    (member) => Number(member.users_id) === Number(props.userId)
  )
}

const checkIfUserCanUpload = (assessment) => {
  const endDate = new Date(assessment.end_date_time)
  const now = new Date()
  const sessionMember = getSessionMember(assessment)

  if (!sessionMember) return false

  const reopenRequest = assessment.reopen_requests.find(
    (request) => request.events_users_id === sessionMember.id && request.status === 1
  )

  if (!reopenRequest) {
    return now < endDate
  }

  return reopenRequest.status === 1
}

const hasRequestedExtension = (assessment) => {
  const sessionMember = getSessionMember(assessment)

  if (!sessionMember) return false

  const request =    assessment.reopen_requests.find(
    (request) => request.events_users_id === sessionMember.id
  )
  return request ? request.status : null
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="assessment in assessments"
      :key="assessment.id"
      class="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
      <div class="p-6">
        <div class="mb-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{{ assessment.name }}</h3>
            <span :class="[
              'shrink-0 px-3 py-1 text-xs font-semibold rounded-full',
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
          <div >
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Score</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white"> {{ hasUserSubmitted(assessment.id)?.score ?? 'N/A' }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <div v-if="assessment.session.created_by === userId" class="w-full flex gap-2">
            <button @click="emit('edit-assessment', assessment)" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button @click="emit('delete-assessment', assessment.id)" class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-red-500 to-red-700 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-800 transition-all duration-200 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete
            </button>
          </div>
          <div v-else class="w-full space-y-3">
            <div>
              <button
                v-if="assessment.supporting_files"
                @click="emit('download-supporting-files', assessment.id)"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm"
              >
                Download supporting files
              </button>
            </div>
            <div
              v-if="
                userRole != 'tl' &&
                hasUserSubmitted(assessment.id)?.score == null
              "
              class="space-y-3"
            >
              <!-- Upload button -->
              <button
                v-if="checkIfUserCanUpload(assessment)"
                @click="emit('open-project-uploads', assessment)"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 text-sm"
              >
                Upload
              </button>

              <!-- Already requested -->
              <button
                v-if="isOverdue(assessment.end_date_time) && hasRequestedExtension(assessment) == 0"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 text-sm border border-orange-200 dark:border-orange-800"
              >
                Already Requested
              </button>

              <!-- Request extension -->
              <button
                v-else-if="isOverdue(assessment.end_date_time) && hasRequestedExtension(assessment) === null "
                @click="emit('request-extension', assessment.id, assessment.events_id)"
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-all duration-200 text-sm border border-orange-200 dark:border-orange-800"
              >
                Request Extension
              </button>
            </div>

            <div v-else-if="hasUserSubmitted(assessment.id)?.score != null">
              <button
                class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-medium rounded-lg text-sm"
              >
                Already Submitted
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-linear-to-t from-purple-600/0 to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  </div>
</template>
