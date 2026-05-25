<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../services/axios'

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const user_id     = currentUser?.id   ?? null
const user_role   = currentUser?.role ?? null

const router = useRouter()
const route  = useRoute()

// ─── Core state ───────────────────────────────────────────────────────────
const sessions            = ref([])
const loading             = ref(true)
const error               = ref(null)
const showModal           = ref(false)
const submitting          = ref(false)
const formError           = ref(null)
const duplicatingId       = ref(null)
const downloadingReportId = ref(null)

// ─── Form state ───────────────────────────────────────────────────────────
const formData = ref({ name: '', dateTime: '', description: '', tags: [] })
const tagInput = ref('')

// ─── Users / team leads ───────────────────────────────────────────────────
const allUsers          = ref([])
const usersLoading      = ref(false)
const usersError        = ref(null)
const teamLeadSearch    = ref('')
const selectedTeamLeads = ref([])

// ─── Tags ─────────────────────────────────────────────────────────────────
const existingTags        = ref([])
const existingTagsLoading = ref(false)
const existingTagsError   = ref(null)

// ─── List filters ─────────────────────────────────────────────────────────
const filterMemberSearch   = ref('')
const filterMemberIds      = ref([])
const filterTagsSelected   = ref([])

// ─── Date picker ref & instance ───────────────────────────────────────────
const dateTimeInput = ref(null)
let picker = null

// ─── Helpers ──────────────────────────────────────────────────────────────
const normalizeSessionTags = (session) => {
  const t = session?.tags
  if (Array.isArray(t)) return t.map((x) => String(x).trim()).filter(Boolean)
  if (typeof t === 'string' && t.trim()) return t.split(',').map((s) => s.trim()).filter(Boolean)
  return []
}

const memberRows = (session) => session?.session_members ?? session?.sessionMembers ?? []

// ─── Pre-processed sessions (avoids calling functions in template loops) ──
const processedSessions = computed(() =>
  sessions.value.map((s) => ({
    ...s,
    _tags:    normalizeSessionTags(s),
    _members: memberRows(s),
  }))
)

// ─── My sessions (computed, not called on every render) ───────────────────
const mySessions = computed(() =>
  processedSessions.value.filter((s) => s.created_by === user_id)
)

// ─── Unique members across all sessions ───────────────────────────────────
const uniqueMembersFromSessions = computed(() => {
  const byId = new Map()
  for (const s of processedSessions.value) {
    for (const m of s._members) {
      const uid = m?.users_id
      if (!uid || byId.has(uid)) continue
      const u = m?.user
      byId.set(uid, {
        id:    uid,
        name:  u?.name?.trim() || `User ${uid}`,
        email: (u?.email ?? '').trim(),
      })
    }
  }
  return [...byId.values()].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  )
})

// ─── Members filtered by search ───────────────────────────────────────────
const filteredMembersForFilter = computed(() => {
  const q = filterMemberSearch.value.trim().toLowerCase()
  if (!q) return null
  return uniqueMembersFromSessions.value.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(q)
  )
})

// ─── All tags across sessions ─────────────────────────────────────────────
const allSessionTags = computed(() => {
  const seen = new Set()
  const list = []
  for (const s of processedSessions.value) {
    for (const tag of s._tags) {
      const key = tag.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      list.push(tag)
    }
  }
  return list.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
})

// ─── Tag suggestions for the form ─────────────────────────────────────────
const tagSuggestions = computed(() => {
  const q = tagInput.value.trim().toLowerCase()
  if (!q) return []
  const selected = new Set(formData.value.tags.map((t) => t.toLowerCase()))
  const source   = existingTags.value.length ? existingTags.value : allSessionTags.value
  return source
    .filter((tag) => {
      const norm = String(tag).trim()
      if (!norm) return false
      const key = norm.toLowerCase()
      return key.includes(q) && !selected.has(key)
    })
    .slice(0, 8)
})

// ─── Users filtered by team-lead search ───────────────────────────────────
const filteredUsers = computed(() => {
  const q = teamLeadSearch.value.trim().toLowerCase()
  if (!q) return allUsers.value
  return allUsers.value.filter((u) =>
    `${u?.name ?? ''} ${u?.email ?? ''}`.toLowerCase().includes(q)
  )
})

// ─── Active filter indicator ──────────────────────────────────────────────
const hasActiveListFilters = computed(
  () => filterMemberIds.value.length > 0 || filterTagsSelected.value.length > 0
)

// ─── Filtered sessions list ───────────────────────────────────────────────
const filteredSessions = computed(() => {
  let list = processedSessions.value

  if (filterMemberIds.value.length) {
    const want = new Set(filterMemberIds.value)
    list = list.filter((s) => s._members.some((m) => want.has(m?.users_id)))
  }

  if (filterTagsSelected.value.length) {
    const wantLower = filterTagsSelected.value.map((t) => t.toLowerCase())
    list = list.filter((s) =>
      wantLower.some((w) => s._tags.map((t) => t.toLowerCase()).includes(w))
    )
  }

  return list
})

// ─── Data fetching ────────────────────────────────────────────────────────
const fetchSessions = async () => {
  loading.value = true
  error.value = null
  try {
    // Resolve user id without wrapping in computed()
    const resolvedUserId = route.path.startsWith('/user-dashboard/users/sessions')
      ? route.params.id
      : user_id

    const res = await api.get(`/api/sessions/user/${resolvedUserId}`)
    sessions.value = res.data
  } catch (err) {
    error.value = err
    console.error('Error loading sessions:', err)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  if (usersLoading.value) return
  usersLoading.value = true
  usersError.value   = null
  try {
    const res      = await api.get('/api/users')
    allUsers.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    usersError.value = err
    console.error('Error loading users:', err)
  } finally {
    usersLoading.value = false
  }
}

const fetchExistingTags = async () => {
  if (existingTagsLoading.value) return
  existingTagsLoading.value = true
  existingTagsError.value   = null
  try {
    const res         = await api.get('/api/sessions/tags')
    existingTags.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    existingTagsError.value = err
    console.error('Error loading existing tags:', err)
  } finally {
    existingTagsLoading.value = false
  }
}

onMounted(fetchSessions)

// ─── Actions ──────────────────────────────────────────────────────────────
const duplicateSession = async (sessionId) => {
  if (!sessionId || duplicatingId.value) return
  duplicatingId.value = sessionId
  try {
    const res = await api.post(`/api/sessions/${sessionId}/duplicate`, { created_by: user_id })
    await fetchSessions()
    const newId = res?.data?.session?.id
    if (newId) {
      await nextTick()
      await router.push(`/user-dashboard/session-detail/${newId}`)
    }
  } catch (err) {
    console.error('Error duplicating session:', err)
    formError.value = err?.response?.data?.message || 'Failed to duplicate session'
    setTimeout(() => { formError.value = null }, 3000)
  } finally {
    duplicatingId.value = null
  }
}

const downloadSessionReport = async (session) => {
  const sessionId = session?.id
  if (!sessionId || downloadingReportId.value) return
  downloadingReportId.value = sessionId
  formError.value            = null
  try {
    const res = await api.get(`/api/sessions/${sessionId}/report`, { responseType: 'blob' })
    const contentDisposition = res?.headers?.['content-disposition'] || ''
    const match    = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(contentDisposition)
    const filename = decodeURIComponent(match?.[1] || `session_${sessionId}_report.csv`)
    const blob     = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
    const url      = window.URL.createObjectURL(blob)
    const link     = document.createElement('a')
    link.href      = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error downloading session report:', err)
    formError.value = err?.response?.data?.message || 'Failed to download report'
    setTimeout(() => { formError.value = null }, 3000)
  } finally {
    downloadingReportId.value = null
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────
const openModal = () => {
  showModal.value = true
  formError.value = null
  formData.value  = { name: '', description: '', dateTime: '', tags: [] }
  teamLeadSearch.value    = ''
  selectedTeamLeads.value = []
  // Parallel fetch — no need to await sequentially
  fetchUsers()
  fetchExistingTags()
}

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const resetForm = () => {
  formData.value          = { name: '', dateTime: '', description: '', tags: [] }
  tagInput.value          = ''
  formError.value         = ''
  teamLeadSearch.value    = ''
  selectedTeamLeads.value = []
}

// ─── Flatpickr — lazy loaded only when modal opens ────────────────────────
const initializeDatePicker = async () => {
  if (!dateTimeInput.value) return
  if (picker) { picker.destroy(); picker = null }

  // Dynamic import so flatpickr (~50 KB) is NOT in the initial bundle
  const [{ default: flatpickr }] = await Promise.all([
    import('flatpickr'),
    import('flatpickr/dist/flatpickr.min.css'),
  ])

  picker = flatpickr(dateTimeInput.value, {
    enableTime:    true,
    dateFormat:    'Y-m-d H:i',
    time_24hr:     true,
    minDate:       'today',
    clickOpens:    true,
    allowInput:    false,
    disableMobile: true,
    onChange: (_dates, dateStr) => {
      formData.value.dateTime = dateStr
    },
  })
}

watch(showModal, async (val) => {
  if (val) {
    await nextTick()
    initializeDatePicker()
  } else {
    if (picker) { picker.destroy(); picker = null }
  }
})

// ─── Tags ─────────────────────────────────────────────────────────────────
const addTag = () => {
  const tag = tagInput.value.trim()
  if (!tag) return
  if (formData.value.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
    formError.value = 'This tag already exists'
    setTimeout(() => { formError.value = '' }, 3000)
    return
  }
  if (formData.value.tags.length >= 10) {
    formError.value = 'Maximum 10 tags allowed'
    setTimeout(() => { formError.value = '' }, 3000)
    return
  }
  formData.value.tags.push(tag)
  tagInput.value = ''
}

const addTagFromSuggestion = (tag) => {
  if (!tag || submitting.value) return
  tagInput.value = tag
  addTag()
}

const removeTag = (index) => { formData.value.tags.splice(index, 1) }

// ─── Team leads ───────────────────────────────────────────────────────────
const isSelectedTeamLead = (user) => selectedTeamLeads.value.some((u) => u?.id === user?.id)

const toggleTeamLead = (user) => {
  if (!user?.id) return
  const idx = selectedTeamLeads.value.findIndex((u) => u?.id === user?.id)
  if (idx >= 0) selectedTeamLeads.value.splice(idx, 1)
  else          selectedTeamLeads.value.push(user)
}

const addTeamLeadFromSearch = () => {
  const q = teamLeadSearch.value.trim()
  if (!q) return
  const qLower = q.toLowerCase()
  const match  =
    allUsers.value.find((u) => (u?.email ?? '').toLowerCase() === qLower) ||
    allUsers.value.find((u) => (u?.name  ?? '').toLowerCase() === qLower) ||
    filteredUsers.value[0]
  if (match) {
    if (!isSelectedTeamLead(match)) selectedTeamLeads.value.push(match)
    teamLeadSearch.value = ''
  }
}

const removeTeamLead = (id) => {
  const idx = selectedTeamLeads.value.findIndex((u) => u?.id === id)
  if (idx >= 0) selectedTeamLeads.value.splice(idx, 1)
}

// ─── List filter helpers ──────────────────────────────────────────────────
const toggleFilterMember = (user) => {
  const id = user?.id
  if (!id) return
  const i = filterMemberIds.value.indexOf(id)
  if (i >= 0) filterMemberIds.value.splice(i, 1)
  else        filterMemberIds.value.push(id)
}

const isFilterMemberSelected = (id) => filterMemberIds.value.includes(id)

const toggleFilterTag = (tag) => {
  const key = tag.toLowerCase()
  const i   = filterTagsSelected.value.findIndex((t) => t.toLowerCase() === key)
  if (i >= 0) filterTagsSelected.value.splice(i, 1)
  else        filterTagsSelected.value.push(tag)
}

const isFilterTagSelected = (tag) =>
  filterTagsSelected.value.some((t) => t.toLowerCase() === tag.toLowerCase())

const clearListFilters = () => {
  filterMemberIds.value    = []
  filterTagsSelected.value = []
  filterMemberSearch.value = ''
}

// ─── Form submit ──────────────────────────────────────────────────────────
const submitForm = async () => {
  formError.value = ''
  if (!formData.value.name.trim()) {
    formError.value = 'Session name is required'
    return
  }
  if (!formData.value.dateTime) {
    formError.value = 'Session date and time are required'
    return
  }

  submitting.value = true
  try {
    const [date, time] = formData.value.dateTime.split(' ')
    const isoDateTime  = `${date}T${time}:00`

    await api.post('/api/sessions', {
      title:        formData.value.name,
      description:  formData.value.description,
      created_by:   user_id,
      date:         isoDateTime,
      tags:         formData.value.tags ?? [],
      teamlead_ids: selectedTeamLeads.value.map((u) => u.id).filter(Boolean),
    })

    await fetchSessions()
    closeModal()
  } catch (err) {
    formError.value = err?.response?.data?.message || 'Failed to create session. Please try again.'
    console.error('Error creating session:', err)
  } finally {
    submitting.value = false
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────
const goToSessionDetail = (sessionId) => {
  if (route.path.startsWith('/user-dashboard/users/sessions')) {
    router.push(`/user-dashboard/tl-session-detail/${sessionId}/${route.params.id}`)
  } else {
    router.push(`/user-dashboard/session-detail/${sessionId}`)
  }
}
</script>

<template>
  <main class="h-full overflow-y-auto">
    <div class="container px-6 mx-auto grid">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="my-6">
          <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200">Sessions</h2>
          <p
            v-if="!loading && !error && sessions.length"
            class="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            Showing {{ filteredSessions.length }} of {{ sessions.length }}
            <span v-if="hasActiveListFilters">(filters active)</span>
          </p>
        </div>
        <button
          v-if="user_role !== 'admin'"
          @click="openModal"
          class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple shrink-0"
        >
          Add Session
        </button>
      </div>

      <!-- List filters — only shown when user has sessions -->
      <div
        v-if="!loading && !error && sessions.length && mySessions.length"
        class="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/80 p-4 sm:p-5 shadow-sm"
      >
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          <!-- Members filter -->
          <div class="flex-1 min-w-0 space-y-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Members</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">Session includes any selected member</span>
            </div>
            <input
              v-model="filterMemberSearch"
              type="text"
              placeholder="Search members…"
              class="w-full max-w-md px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div
              v-if="uniqueMembersFromSessions.length === 0"
              class="text-xs text-gray-500 dark:text-gray-400 italic"
            >
              No members loaded on sessions yet. Open a session and add members, then refresh.
            </div>
            <div v-else class="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              <template v-if="filteredMembersForFilter">
                <button
                  v-for="u in filteredMembersForFilter"
                  :key="u.id"
                  type="button"
                  @click="toggleFilterMember(u)"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    isFilterMemberSelected(u.id)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-400',
                  ]"
                >
                  <span>{{ u.name }}</span>
                  <span v-if="u.email" class="opacity-80 font-normal truncate max-w-[140px]">{{ u.email }}</span>
                </button>
              </template>
              <template v-else>
                <button
                  v-for="u in uniqueMembersFromSessions"
                  :key="u.id"
                  type="button"
                  @click="toggleFilterMember(u)"
                  :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    isFilterMemberSelected(u.id)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-400',
                  ]"
                >
                  <span>{{ u.name }}</span>
                  <span v-if="u.email" class="opacity-80 font-normal truncate max-w-[140px]">{{ u.email }}</span>
                </button>
              </template>
            </div>
          </div>

          <!-- Tags filter -->
          <div class="flex-1 min-w-0 space-y-3 sm:border-l sm:border-gray-200 sm:dark:border-gray-700 sm:pl-5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Tags</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">Any selected tag matches</span>
            </div>
            <div v-if="allSessionTags.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic">
              No tags on any session yet.
            </div>
            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="tag in allSessionTags"
                :key="tag"
                type="button"
                @click="toggleFilterTag(tag)"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  isFilterTagSelected(tag)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400',
                ]"
              >
                #{{ tag }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="hasActiveListFilters" class="mt-4 flex justify-end">
          <button
            type="button"
            @click="clearListFilters"
            class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg class="w-6 h-6 text-red-600 dark:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </div>
          <p class="text-red-600 dark:text-red-200">Failed to load sessions.</p>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="sessions.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">No sessions found. Create one to get started!</p>
        </div>
      </div>

      <!-- No filter match -->
      <div v-else-if="filteredSessions.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center max-w-md">
          <p class="text-gray-700 dark:text-gray-300 font-medium mb-2">No sessions match your filters</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Try different members or tags, or clear filters.</p>
          <button
            type="button"
            @click="clearListFilters"
            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Clear filters
          </button>
        </div>
      </div>

      <!-- Session cards — use pre-processed sessions -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="group relative bg-gray-200 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
        >
          <div class="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>

          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {{ session.title }}
            </h3>

            <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
              {{ session.description || 'No description provided' }}
            </p>

            <!-- Tags — use pre-processed _tags -->
            <div v-if="session._tags.length" class="flex flex-wrap gap-1.5 mb-4">
              <span
                v-for="t in session._tags"
                :key="t"
                class="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
              >
                #{{ t }}
              </span>
            </div>

            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ new Date(session.date).toLocaleDateString() }}</span>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                v-if="session.created_by === user_id"
                @click="$router.push(`/user-dashboard/session-detail/${session.id}`)"
                class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Edit
              </button>
              <button
                v-else
                @click="goToSessionDetail(session.id)"
                class="flex-1 px-4 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                View
              </button>
              <button
                type="button"
                @click="downloadSessionReport(session)"
                :disabled="downloadingReportId === session.id"
                class="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ downloadingReportId === session.id ? 'Downloading...' : 'Download CSV' }}
              </button>
              <button
                type="button"
                @click="duplicateSession(session.id)"
                :disabled="duplicatingId === session.id"
                class="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ duplicatingId === session.id ? 'Duplicating...' : 'Duplicate' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal ──────────────────────────────────────────────────────────── -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-40"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
        @click="closeModal"
      ></div>

      <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all w-full max-w-2xl border border-gray-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

          <!-- Modal header -->
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 sm:px-8 py-6">
            <h3 class="text-2xl font-bold text-white" id="modal-title">Create New Session</h3>
            <p class="text-purple-100 text-sm mt-1">Set up a new session with details and tags</p>
          </div>

          <!-- Modal body -->
          <div class="create-session-scrollbar px-6 sm:px-8 py-6 space-y-6 overflow-y-auto">

            <!-- Session name -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Session Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="e.g., Introduction to Web Development"
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :disabled="submitting"
              />
            </div>

            <!-- Date & time -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Session Date & Time <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  ref="dateTimeInput"
                  type="text"
                  placeholder="Click to select date and time"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  :disabled="submitting"
                />
                <svg
                  class="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Click to select the date and time when your session starts</p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea
                v-model="formData.description"
                placeholder="Enter session description, learning objectives, and key topics..."
                rows="4"
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                :disabled="submitting"
              ></textarea>
            </div>

            <!-- Tags -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Tags <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <div class="flex gap-2 mb-3">
                <input
                  v-model="tagInput"
                  type="text"
                  placeholder="Enter a tag and press Enter"
                  class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  @keydown.enter.prevent="addTag"
                  :disabled="submitting"
                />
                <button
                  type="button"
                  @click="addTag"
                  class="px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                  :disabled="submitting || !tagInput.trim()"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <div v-if="existingTagsLoading" class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Loading existing tags...
              </div>
              <div v-else-if="tagSuggestions.length" class="mb-3">
                <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">Suggestions</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in tagSuggestions"
                    :key="tag"
                    type="button"
                    @click="addTagFromSuggestion(tag)"
                    class="px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 hover:border-indigo-400 transition-colors"
                  >
                    #{{ tag }}
                  </button>
                </div>
              </div>
              <p v-else-if="tagInput.trim() && existingTagsError" class="mb-2 text-xs text-red-700 dark:text-red-300">
                Unable to load existing tags.
              </p>

              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium"
                >
                  <span>#{{ tag }}</span>
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div v-if="formData.tags.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic py-1">
                  No tags added yet
                </div>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Tags help categorize and organize your sessions</p>
            </div>

            <!-- Team leads -->
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Team leads <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
              </label>

              <div class="flex flex-wrap gap-2 mb-3">
                <div
                  v-for="u in selectedTeamLeads"
                  :key="u.id"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm font-medium border border-emerald-200 dark:border-emerald-800"
                >
                  <span>{{ u.name }}<span v-if="u.email" class="text-xs font-normal opacity-80"> ({{ u.email }})</span></span>
                  <button
                    type="button"
                    @click="removeTeamLead(u.id)"
                    class="hover:text-emerald-950 dark:hover:text-emerald-100 transition-colors"
                    :disabled="submitting"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div v-if="selectedTeamLeads.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic py-1">
                  No team leads selected
                </div>
              </div>

              <input
                v-model="teamLeadSearch"
                type="text"
                placeholder="Search users by name or email..."
                list="teamlead-users"
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :disabled="submitting"
                @change="addTeamLeadFromSearch"
                @keydown.enter.prevent="addTeamLeadFromSearch"
              />
              <datalist id="teamlead-users">
                <option
                  v-for="u in filteredUsers"
                  :key="u.id"
                  :value="u.email || u.name"
                  :label="u.name"
                />
              </datalist>

              <p v-if="usersLoading"  class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading users…</p>
              <p v-else-if="usersError" class="mt-2 text-xs text-red-700 dark:text-red-300">Failed to load users.</p>
              <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">Type to search, then pick from suggestions (or press Enter). You can select multiple team leads.</p>
            </div>

            <!-- Error -->
            <div
              v-if="formError"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
            >
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium text-red-800 dark:text-red-200">{{ formError }}</p>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 px-6 sm:px-8 py-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              @click="submitForm"
              :disabled="submitting"
              class="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-base font-semibold text-white hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="submitting" class="animate-spin">⟳</span>
              {{ submitting ? 'Creating...' : 'Create Session' }}
            </button>
            <button
              @click="closeModal"
              :disabled="submitting"
              class="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm px-6 py-3 bg-white dark:bg-slate-800 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ── Flatpickr dark-mode overrides ──────────────────────────────────────── */
:deep(.flatpickr-calendar)                  { background: rgb(30, 41, 59); border-color: rgb(71, 85, 105); }
:deep(.flatpickr-calendar.dark)             { background: rgb(30, 41, 59); }
:deep(.flatpickr-months .flatpickr-month)   { background: rgb(15, 23, 42); color: white; }
:deep(.flatpickr-weekdays)                  { background: rgb(15, 23, 42); color: rgb(148, 163, 184); }
:deep(.flatpickr-days .flatpickr-day)       { color: rgb(71, 85, 105); }
:deep(.flatpickr-days .flatpickr-day.today) { border-color: rgb(168, 85, 247); }
:deep(.flatpickr-days .flatpickr-day.selected) { background: rgb(168, 85, 247); border-color: rgb(168, 85, 247); }
:deep(.flatpickr-days .flatpickr-day:hover) { background: rgb(51, 65, 85); cursor: pointer; }
:deep(.flatpickr-time input)                { color: white; background: rgb(30, 41, 59); border-color: rgb(71, 85, 105); }
:deep(.numInputWrapper span)                { color: white; }
:deep(.flatpickr-input::placeholder)        { color: rgb(148, 163, 184); }

/* ── Modal scrollbar ────────────────────────────────────────────────────── */
.create-session-scrollbar::-webkit-scrollbar        { width: 5px; }
.create-session-scrollbar::-webkit-scrollbar-track  { background: transparent; }
.create-session-scrollbar::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 4px; }
.dark .create-session-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
</style>
