<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../../services/axios.js'

const loading = ref(true)
const error = ref(null)
/** @type {import('vue').Ref<Array<{ session: { id: number, title?: string, date?: string }, members: object[] }>>} */
const sessionGroups = ref([])

const selectedSessionId = ref(null)
const sessionAssessments = ref([])
const selectedAssessmentId = ref(null)
const assessmentScores = ref({})
const assessmentsLoading = ref(false)
const scoresLoading = ref(false)

/** 'all' or stringified users_id */
const selectedMemberFilter = ref('all')

const currentSessionGroup = computed(() => {
  const id = selectedSessionId.value
  if (id == null) return null
  return sessionGroups.value.find((g) => Number(g.session?.id) === Number(id)) ?? null
})

const currentSessionMembers = computed(() => currentSessionGroup.value?.members ?? [])

const filteredTableMembers = computed(() => {
  const list = currentSessionMembers.value
  if (selectedMemberFilter.value === 'all') return list
  const uid = Number(selectedMemberFilter.value)
  if (Number.isNaN(uid)) return list
  return list.filter((m) => Number(m.users_id) === uid)
})

const fetchAssessmentsForSession = async () => {
  const sid = selectedSessionId.value
  if (sid == null) {
    sessionAssessments.value = []
    selectedAssessmentId.value = null
    assessmentScores.value = {}
    return
  }
  assessmentsLoading.value = true
  try {
    const res = await api.get(`/api/sessions/${sid}/assessments`)
    sessionAssessments.value = Array.isArray(res.data) ? res.data : []
    if (sessionAssessments.value.length) {
      selectedAssessmentId.value = sessionAssessments.value[0].id
    } else {
      selectedAssessmentId.value = null
      assessmentScores.value = {}
    }
  } catch (e) {
    console.error('usersList: assessments failed', e)
    sessionAssessments.value = []
    selectedAssessmentId.value = null
    assessmentScores.value = {}
  } finally {
    assessmentsLoading.value = false
  }
}

const fetchScoresForSelection = async () => {
  const sid = selectedSessionId.value
  const aid = selectedAssessmentId.value
  if (sid == null || aid == null) {
    assessmentScores.value = {}
    return
  }
  scoresLoading.value = true
  try {
    const res = await api.get(`/api/sessions/${sid}/assessments/${aid}/member-scores`)
    const raw = res.data?.scores
    assessmentScores.value = raw && typeof raw === 'object' ? { ...raw } : {}
  } catch (e) {
    console.error('usersList: scores failed', e)
    assessmentScores.value = {}
  } finally {
    scoresLoading.value = false
  }
}

watch(selectedSessionId, async () => {
  selectedMemberFilter.value = 'all'
  await fetchAssessmentsForSession()
})

watch(selectedAssessmentId, () => {
  fetchScoresForSelection()
})

const scoreDisplayForMember = (member) => {
  if (!selectedAssessmentId.value) return '—'
  if (scoresLoading.value) return '…'
  const key = String(member.id)
  const map = assessmentScores.value
  if (!Object.prototype.hasOwnProperty.call(map, key)) return '—'
  const v = map[key]
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
})

const userId = computed(() => currentUser.value?.id ?? null)
const accountRole = computed(() => (currentUser.value?.role || '').toLowerCase())

const sessionMemberRoleLabel = (role) => {
  const r = Number(role)
  if (r === 2) return 'Team lead'
  return 'Member'
}

const fetchTlSessionsWithMembers = async () => {
  loading.value = true
  error.value = null
  sessionGroups.value = []

  const uid = userId.value
  if (!uid) {
    loading.value = false
    error.value = new Error('Not signed in')
    return
  }

  try {
    const res = await api.get(`/api/sessions/user/${uid}/as-team-lead/members`)
    const groups = Array.isArray(res.data) ? res.data : []
    sessionGroups.value = groups
    if (groups.length) {
      const firstId = groups[0].session?.id
      if (firstId != null) {
        selectedSessionId.value = firstId
      }
    } else {
      selectedSessionId.value = null
    }
    selectedMemberFilter.value = 'all'
  } catch (err) {
    error.value = err
    console.error('usersList: load failed', err)
  } finally {
    loading.value = false
  }
}

const formatSessionDate = (dateString) => {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return String(dateString)
  }
}

onMounted(fetchTlSessionsWithMembers)

const downloading = ref({ key: null })
const downloadCsvReport = async ( user) => {
  const key = `${user.id}`
  downloading.value = { key }
  try {
    const response = await api.get(`/api/sessions/users/${user.id}/report`, {
      responseType: 'blob',
    })
    const cd = response.headers?.['content-disposition'] || ''
    const utf8Match = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    let filename = utf8Match?.[1] ? decodeURIComponent(utf8Match[1].trim().replace(/(^"|"$)/g, '')) : null
    if (!filename) {
      const m = cd.match(/filename\s*=\s*"?([^"]+)"?/i)
      filename = m?.[1]?.trim() || `user_${user.id}_report.csv`
    }
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('usersList: CSV download failed', err)
    alert('Failed to download CSV report. Please try again.')
  } finally {
    downloading.value = { key: null }
  }
}
</script>

<template>
  <main class="h-full overflow-y-auto">
    <div class="container px-6 mx-auto grid pb-10">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200">
            Session members
          </h2>
          <p class="-mt-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
            Sessions where you are a team lead and everyone enrolled in each session.
          </p>
        </div>
      </div>

      <div
        v-if="accountRole && accountRole !== 'tl'"
        class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
      >
        This view is intended for team lead accounts. You can still open it directly, but member lists are
        only loaded for sessions where your session role is team lead.
      </div>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Loading sessions and members…</p>
        </div>
      </div>

      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg class="w-6 h-6 text-red-600 dark:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z"></path>
            </svg>
          </div>
          <p class="text-red-600 dark:text-red-200">Failed to load data. Please try again.</p>
        </div>
      </div>

      <div v-else-if="sessionGroups.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center max-w-md">
          <div class="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M12 12a6 6 0 100 12 6 6 0 000-12z"></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            No sessions found where you are a team lead, or there are no members yet. When an organiser assigns you
            as a team lead on a session, members for that session will appear here.
          </p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div
          class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap"
        >
          <div class="flex-1 min-w-[200px]">
            <label
              for="tl-session-filter"
              class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Session
            </label>
            <select
              id="tl-session-filter"
              v-model.number="selectedSessionId"
              class="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
            >
              <option v-for="g in sessionGroups" :key="g.session?.id" :value="g.session?.id">
                {{ g.session?.title || 'Untitled session' }}
              </option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label
              for="tl-assessment-filter"
              class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Assessment
            </label>
            <select
              id="tl-assessment-filter"
              v-model.number="selectedAssessmentId"
              class="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
              :disabled="assessmentsLoading || !sessionAssessments.length"
            >
              <template v-if="!sessionAssessments.length">
                <option disabled :value="null">
                  {{ assessmentsLoading ? 'Loading…' : 'No assessments' }}
                </option>
              </template>
              <template v-else>
                <option v-for="a in sessionAssessments" :key="a.id" :value="a.id">
                  {{ a.name }}
                </option>
              </template>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label
              for="tl-member-filter"
              class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
            >
              Member
            </label>
            <select
              id="tl-member-filter"
              v-model="selectedMemberFilter"
              class="w-full rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 disabled:opacity-50"
              :disabled="!currentSessionMembers.length"
            >
              <option value="all">All members</option>
              <option
                v-for="m in currentSessionMembers"
                :key="m.id"
                :value="String(m.users_id)"
              >
                {{ m.user?.name || 'Unknown' }}
              </option>
            </select>
          </div>
          <p
            v-if="currentSessionGroup?.session"
            class="text-xs text-gray-500 dark:text-gray-400 sm:ml-auto sm:pb-2.5 w-full sm:w-auto"
          >
            {{ formatSessionDate(currentSessionGroup.session.date) }}
          </p>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
              >
                Member
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
              >
                Email
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
              >
                Role
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
              >
                Score
              </th>
              <th
                scope="col"
                class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-if="filteredTableMembers.length === 0"
            >
              <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No members match this filter for the selected session.
              </td>
            </tr>
            <tr
              v-for="member in filteredTableMembers"
              :key="`${member.id}`"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <router-link
                  :to="`/user-dashboard/users/sessions/${member.user.id}`"
                  class="inline-flex items-center gap-3 group min-w-0"
                >
                  <div
                    class="w-10 h-10 shrink-0 rounded-full bg-linear-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm"
                  >
                    {{ (member.user.name || '?').charAt(0).toUpperCase() }}
                  </div>
                  <span
                    class="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  >
                    {{ member.user.name }}
                  </span>
                </router-link>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" :title="member.user.email">
                {{ member.user.email }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:text-purple-200"
                >
                  {{ sessionMemberRoleLabel(member.role ?? member.user?.session_member_role) }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap tabular-nums text-sm text-gray-800 dark:text-gray-200">
                {{ scoreDisplayForMember(member) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right">
                <button
                  type="button"
                  @click="downloadCsvReport(member.user)"
                  :disabled="downloading.key === `${member.user.id}`"
                  class="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ downloading.key === `${member.user.id}` ? 'Downloading…' : 'Download CSV' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  </main>
</template>
