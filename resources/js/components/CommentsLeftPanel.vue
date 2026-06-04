<script setup>
defineProps({
  assessments: {
    type: Array,
    default: () => [],
  },
  selectedAssessment: {
    type: Object,
    default: null,
  },
  selectedMember: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['select-assessment', 'select-member'])

const getInitials = (name) => name?.split(' ').map((n) => n.charAt(0)).join('').toUpperCase() || '?'

const getStatusColor = (status) => status === 1
  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
  : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'

const submissionCount = (assessment) => assessment.session?.session_members
  ?.flatMap((member) => member.project_uploads || [])
  ?.filter((upload) => upload.events_assessments_id === assessment.id)
  .length || 0

const memberHasSubmission = (member, assessment) => {
  return (member.project_uploads || []).some((upload) => upload.events_assessments_id === assessment.id)
}

const hasAssessmentSubmissions = (assessment) => {
  return assessment.session?.session_members?.some((member) => memberHasSubmission(member, assessment))
}

const memberScore = (member) => {
  const upload = member.project_uploads.find((item) => item.score !== null && item.score !== undefined)
  return upload?.score ?? ''
}

const memberStatus = (member) => {
  return member.project_uploads.some((upload) => upload.status === 1) ? 'Submitted' : 'Pending'
}
</script>

<template>
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
            @click="emit('select-assessment', assessment)"
            :class="[
              'w-full px-4 py-3 text-left transition-all duration-150 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/40',
              selectedAssessment?.id === assessment.id
                ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-l-violet-600'
                : ''
            ]"
          >
            <p class="text-sm font-semibold text-slate-950 dark:text-white leading-snug truncate">{{ assessment.name }}</p>
            <p class="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
              {{ submissionCount(assessment) }} submission(s)
            </p>
          </button>

          <!-- Member Sub-list -->
          <div v-if="selectedAssessment?.id === assessment.id" class="bg-slate-100 dark:bg-slate-700/30">
            <template v-for="member in assessment.session?.session_members" :key="member.id">
              <button
                v-if="memberHasSubmission(member, assessment)"
                @click="emit('select-member', member)"
                :class="[
                  'w-full px-4 py-2.5 text-left flex items-center gap-2.5 transition-all duration-150 border-b border-slate-200 dark:border-slate-700/50 hover:bg-gray-200/100 dark:hover:bg-slate-700/50',
                  selectedMember?.id === member.id ? 'bg-gray-200 dark:bg-violet-900/20' : ''
                ]"
              >
                <div class="w-7 h-7 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold">
                  {{ getInitials(member.user.name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-950 dark:text-white truncate">{{ member.user.name }}</p>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span :class="['text-xs px-1.5 py-0.5 rounded font-medium', getStatusColor(member.project_uploads.status)]">
                      {{ memberStatus(member) }}
                    </span>
                    <span class="text-xs font-bold text-violet-600 dark:text-violet-400 ml-auto">
                      {{ memberScore(member) ? memberScore(member) + '/10' : '' }}
                    </span>
                  </div>
                </div>
              </button>
            </template>
            <div
              v-if="!hasAssessmentSubmissions(assessment)"
              class="px-4 py-5 text-center"
            >
              <p class="text-xs text-slate-500">No submissions yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
