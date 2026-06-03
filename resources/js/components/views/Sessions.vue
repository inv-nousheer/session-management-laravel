<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../services/axios'
import CreateSessionModal from '../CreateSessionModal.vue'
import EmptySessionsState from '../EmptySessionsState.vue'
import ErrorState from '../ErrorState.vue'
import LoadingState from '../LoadingState.vue'
import PageHeading from '../PageHeading.vue'
import PageSubheading from '../PageSubheading.vue'
import SessionButton from '../SessionButton.vue'
import SessionCard from '../SessionCard.vue'
import SessionListFilters from '../SessionListFilters.vue'

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

const updateSessionFormField = (field, value) => {
  formData.value = { ...formData.value, [field]: value }
}

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

const toggleFilterTag = (tag) => {
  const key = tag.toLowerCase()
  const i   = filterTagsSelected.value.findIndex((t) => t.toLowerCase() === key)
  if (i >= 0) filterTagsSelected.value.splice(i, 1)
  else        filterTagsSelected.value.push(tag)
}

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
          <PageHeading>Sessions</PageHeading>
          <PageSubheading
            v-if="!loading && !error && sessions.length"
            :showing="filteredSessions.length"
            :total="sessions.length"
            :has-filters="hasActiveListFilters"
          />
        </div>
        <SessionButton
          v-if="user_role !== 'admin'"
          @click="openModal"
        >
          Add Session
        </SessionButton>
      </div>

      <!-- List filters — only shown when user has sessions -->
      <SessionListFilters
        v-if="!loading && !error && sessions.length && mySessions.length"
        v-model:member-search="filterMemberSearch"
        :members="uniqueMembersFromSessions"
        :filtered-members="filteredMembersForFilter"
        :selected-member-ids="filterMemberIds"
        :tags="allSessionTags"
        :selected-tags="filterTagsSelected"
        :has-active-filters="hasActiveListFilters"
        @toggle-member="toggleFilterMember"
        @toggle-tag="toggleFilterTag"
        @clear="clearListFilters"
      />

      <!-- Loading -->
      <LoadingState v-if="loading" message="Loading sessions..." />

      <!-- Error -->
      <ErrorState v-else-if="error" message="Failed to load sessions." />

      <!-- Empty -->
      <EmptySessionsState v-else-if="sessions.length === 0" />

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
        <SessionCard
          v-for="session in filteredSessions"
          :key="session.id"
          :session="session"
          :current-user-id="user_id"
          :downloading-report-id="downloadingReportId"
          :duplicating-id="duplicatingId"
          @edit="$router.push(`/user-dashboard/session-detail/${$event}`)"
          @view="goToSessionDetail"
          @download="downloadSessionReport"
          @duplicate="duplicateSession"
        />
      </div>
    </div>

    <CreateSessionModal
      v-if="showModal"
      v-model:tag-input="tagInput"
      v-model:team-lead-search="teamLeadSearch"
      :form-data="formData"
      :tag-suggestions="tagSuggestions"
      :existing-tags-loading="existingTagsLoading"
      :existing-tags-error="existingTagsError"
      :selected-team-leads="selectedTeamLeads"
      :filtered-users="filteredUsers"
      :users-loading="usersLoading"
      :users-error="usersError"
      :form-error="formError"
      :submitting="submitting"
      @update-field="updateSessionFormField"
      @add-tag="addTag"
      @add-tag-suggestion="addTagFromSuggestion"
      @remove-tag="removeTag"
      @add-team-lead-search="addTeamLeadFromSearch"
      @remove-team-lead="removeTeamLead"
      @submit="submitForm"
      @close="closeModal"
    />
  </main>
</template>
