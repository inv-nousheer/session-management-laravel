<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/axios.js'

const loading = ref(true)
const error = ref(null)
/** @type {import('vue').Ref<Array<{ session: object, members: object[] }>>} */
const tlSessions = ref([])

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

const mapMemberRowToUser = (item) => ({
  ...item.user,
  session_member_role: item.role,
  pivot_id: item.id,
})

const fetchTlSessionsWithMembers = async () => {
  loading.value = true
  error.value = null
  tlSessions.value = []

  const uid = userId.value
  if (!uid) {
    loading.value = false
    error.value = new Error('Not signed in')
    return
  }

  try {
    const res = await api.get(`/api/sessions/user/${uid}/as-team-lead/members`)
    const groups = Array.isArray(res.data) ? res.data : []
    // tlSessions.value = groups.map((group) => ({
    // //   session: group.session,
    //   members: (group.members || []).map(mapMemberRowToUser).filter((m) => m?.id),
    // }))
    tlSessions.value = groups
  } catch (err) {
    error.value = err
    console.error('usersList: load failed', err)
  } finally {
    loading.value = false
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
      filename = m?.[1]?.trim() || `session_${sessionId}_user_${user.id}_report.csv`
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

      <div v-else-if="tlSessions.length === 0" class="flex items-center justify-center py-12">
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

      <div v-else class="space-y-10">
        <!-- <section v-for=" members in tlSessions" :key="members.id" class="space-y-4"> -->
          <!-- Session strip (sessions.vue card style, compact) -->
          <!-- <div
            class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden"
          > -->
            <!-- <div class="h-1 bg-linear-to-r from-purple-600 to-purple-400"></div>
            <div class="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {{ session.title }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                  {{ session.description || 'No description provided' }}
                </p>
                <div class="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-500">
                  <span class="inline-flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {{ session.date ? new Date(session.date).toLocaleString() : '—' }}
                  </span>
                  <span class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:text-purple-200">
                    {{ members.length }} member{{ members.length !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
              <router-link
                :to="`/user-dashboard/session-detail/${session.id}`"
                class="shrink-0 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 rounded-lg transition-colors text-center"
              >
                Open session
              </router-link>
            </div> -->
          <!-- </div> -->

          <!-- Members grid (membersPanel.vue style) -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="member in tlSessions"
              :key="`${member.id}`"
              class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 p-6"
            >
              <div class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-600 to-purple-400"></div>
              <a href=""  @click="$router.push(`users/sessions/${member.user.id}`)">
              <div class="mb-4">
                <div
                  class="w-12 h-12 bg-linear-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3"
                >
                  {{ (member.user.name || '?').charAt(0).toUpperCase() }}
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {{member.user.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ member.user.email }}
                </p>
                <p class="mt-2">
                  <span
                    class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:text-purple-200"
                  >
                    Role: {{ sessionMemberRoleLabel(member.user.session_member_role) }}
                  </span>
                </p>
              </div>
              </a>
              <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  @click="downloadCsvReport( member.user)"
                  :disabled="downloading.key === `${member.user.id}`"
                  class="w-full px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ downloading.key === `${member.user.id}` ? 'Downloading…' : 'Download CSV report' }}
                </button>
              </div>
            </div>
          </div>
        <!-- </section> -->
      </div>
    </div>
  </main>
</template>
