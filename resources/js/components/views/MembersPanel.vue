<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/axios.js'

const props = defineProps({
   // selectedUsers: Array,
    loading: Boolean,
    error: Boolean,
    users: Array,
    sessionId: Number
})

const showModal = ref(false)
const submitting = ref(false)
const downloadingUserId = ref(null)
const selectedUsers = ref([])
const initialSelectedUsers = ref([])
const sessionId = props.sessionId
const searchTerm = ref('')
const showUserSuggestions = ref(false)
const loading = ref(false)
const error = ref(false)

const fetchSelectedUsers = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/session/${sessionId}/members`)
    selectedUsers.value = res.data.map(item => ({
      ...item.user,
      session_member_role: item.role,
      uploads: item.uploads,   // keep uploads if needed
      pivot_id: item.id        // optional if you need relation id
    }))
    initialSelectedUsers.value = res.data.map(item => ({
      ...item.user,
      session_member_role: item.role,
      uploads: item.uploads,   // keep uploads if needed
      pivot_id: item.id        // optional if you need relation id
    }))
  } catch (err) {
    error.value = true
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

const openModal = () => {
    showModal.value = true
    searchTerm.value = ''
    showUserSuggestions.value = false
}
const closeModal = () => {
    showModal.value = false
    searchTerm.value = ''
    showUserSuggestions.value = false
}
const isUserSelected = (user) => selectedUsers.value.some((item) => item.id === user.id)
const addSelectedUser = (user) => {
    if (!isUserSelected(user)) {
        selectedUsers.value.push(user)
    }
}
const removeSelectedUser = async (userId) => {
    initialSelectedUsers.value = initialSelectedUsers.value.filter((item) => item.pivot_id !== userId)
     try {
        await api.post(`/api/session-member/delete/${userId}`)
        //here
        alert('Member deleted successfully!')

    } catch (err) {
        console.error('Error deleting members:', err)
        alert('Failed to delete members. Please try again.')
    }
}

const filteredUsers = computed(() => {
    const term = searchTerm.value.trim().toLowerCase()

    if (!term) return []

    // Split by whitespace, comma, newline
    const keywords = term.split(/[\s,]+/).filter(Boolean)

    return (props.users || []).filter(user => {
        if (isUserSelected(user)) return false
        const name = user.name?.toLowerCase() || ''
        const email = user.email?.toLowerCase() || ''

        // Match if ANY keyword matches
        return keywords.some(keyword =>
            name.includes(keyword) || email.includes(keyword)
        )
    })
})

const removeSelectedUserFromDraft = (userId) => {
    selectedUsers.value = selectedUsers.value.filter((item) => item.id !== userId)
}

const findUserByToken = (token) => {
    const q = token.trim().toLowerCase()
    if (!q) return null

    const available = (props.users || []).filter((u) => !isUserSelected(u))
    return (
        available.find((u) => (u?.email || '').toLowerCase() === q) ||
        available.find((u) => (u?.name || '').toLowerCase() === q) ||
        available.find((u) => (u?.email || '').toLowerCase().startsWith(q)) ||
        available.find((u) => (u?.name || '').toLowerCase().startsWith(q)) ||
        available.find((u) => (u?.name || '').toLowerCase().includes(q) || (u?.email || '').toLowerCase().includes(q))
    )
}

const addFromSearch = () => {
    const token = searchTerm.value.trim()
    if (!token) return
    const match = findUserByToken(token) || filteredUsers.value[0]
    if (match) {
        addSelectedUser(match)
        searchTerm.value = ''
        showUserSuggestions.value = false
    }
}

const handleSearchKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
        e.preventDefault()
        addFromSearch()
    }
}

const handleSearchBlur = () => {
    window.setTimeout(() => {
        showUserSuggestions.value = false
    }, 120)
}

const handleSearchPaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || ''
    if (!pasted.trim()) return
    e.preventDefault()
    showUserSuggestions.value = false

    // Support common paste formats:
    // - comma/newline separated
    // - "Name <email@x.com>"
    // - plain emails inside larger text
    const emailMatches = pasted.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
    const chunks = pasted
        .split(/[\n,;\t]+/)
        .map((t) => t.trim())
        .filter(Boolean)

    const normalizedTokens = [
        ...emailMatches,
        ...chunks.map((chunk) => {
            const angleMatch = chunk.match(/<([^>]+)>/)
            const core = angleMatch?.[1] || chunk
            return core.replace(/^["'\s]+|["'\s]+$/g, '').trim()
        })
    ].filter(Boolean)

    const tokens = [...new Set(normalizedTokens)]
    const unmatched = []
    let matchedCount = 0
    for (const token of tokens) {
        const match = findUserByToken(token)
        if (match) {
            addSelectedUser(match)
            matchedCount += 1
        }
        else unmatched.push(token)
    }



    // If at least one member was matched, clear pasted text from input.
    // Keep text only when nothing got populated as chips.
    searchTerm.value = matchedCount > 0 ? '' : unmatched.join(', ')
    showUserSuggestions.value = false
}

const submitForm = async () => {
    if (selectedUsers.value.length === 0) {
        alert('Please select at least one user to add.')
        return
    }
    submitting.value = true
    try {
        const userIds = selectedUsers.value.map((user) => user.id)
        await api.post(`/api/session/${sessionId}/add-members`, { user_ids: userIds })
        //here
        alert('Members added successfully!')
        closeModal()
        fetchSelectedUsers()
    } catch (err) {
        console.error('Error adding members:', err)
        alert('Failed to add members. Please try again.')
    } finally {
        submitting.value = false
    }
}

const getFilenameFromContentDisposition = (contentDisposition) => {
    if (!contentDisposition) return null

    // RFC 5987 (filename*=UTF-8'')
    const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].trim().replace(/(^"|"$)/g, ''))
        } catch {
            // ignore
        }
    }

    // Basic filename="..."
    const match = contentDisposition.match(/filename\s*=\s*"?([^"]+)"?/i)
    return match?.[1]?.trim() || null
}

/** Session membership (events_users.role): 1 = member, 2 = team lead */
const sessionMemberRoleLabel = (user) => {
    const r = user.session_member_role
    if (r === 2 || r === '2') return 'Team lead'
    return 'Member'
}

/** App user.role when session row not present (e.g. pick list) */
const userAccountRoleLabel = (user) => {
    const key = (user.role || '').toLowerCase()
    const map = { admin: 'Admin', member: 'Member', tl: 'TL', user: 'Member' }
    return map[key] || (user.role ? String(user.role) : '')
}

const roleLabelForMember = (user) => {
    if (user.session_member_role !== undefined && user.session_member_role !== null) {
        return sessionMemberRoleLabel(user)
    }
    return userAccountRoleLabel(user) || '—'
}

const downloadCsvReport = async (user) => {
    downloadingUserId.value = user.id
    try {
        const response = await api.get(`/api/sessions/users/${user.id}/report/${sessionId}`, {
            responseType: 'blob',
        })

        const contentDisposition = response.headers?.['content-disposition']
        const filename =
            getFilenameFromContentDisposition(contentDisposition) ||
            `session_${sessionId}_user_${user.id}_report.csv`

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
        console.error('Error downloading report:', err)
        alert('Failed to download CSV report. Please try again.')
    } finally {
        downloadingUserId.value = null
    }
}
onMounted(() => {
  fetchSelectedUsers()
})

</script>

<template>
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Members</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Add and manage session members</p>
        </div>
        <button @click="openModal"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Member
        </button>
    </div>
    <div v-if="showModal" class="fixed inset-0 z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-black/50 transition-opacity z-40" @click="closeModal"></div>
        <!-- Modal content container -->
        <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg border border-gray-200 dark:border-gray-700">
                <!-- Modal Header -->
                <div class="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
                    <h3 class="text-lg font-bold text-white" id="modal-title">
                        Add Member to Session
                    </h3>
                    <button @click="closeModal" class="text-white/80 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Modal Body -->
                <div class="px-6 py-6 space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            Search Members
                        </label>
                        <div class="relative">
                            <div
                                class="w-full min-h-[48px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all flex flex-wrap items-center gap-2"
                            >
                                <span
                                    v-for="user in selectedUsers"
                                    :key="user.id"
                                    class="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-2.5 py-1 text-xs font-medium"
                                >
                                    <span class="truncate max-w-[180px]">{{ user.name }}</span>
                                    <button
                                        type="button"
                                        @click="removeSelectedUserFromDraft(user.id)"
                                        class="rounded-full hover:bg-purple-200/70 dark:hover:bg-purple-800/60 p-0.5"
                                        :disabled="submitting"
                                    >
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </span>

                                <input
                                    v-model="searchTerm"
                                    type="text"
                                    placeholder="Type name/email, press Enter (or paste many)"
                                    class="flex-1 min-w-[180px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                                    :disabled="submitting"
                                    @focus="showUserSuggestions = true"
                                    @blur="handleSearchBlur"
                                    @keydown="handleSearchKeydown"
                                    @paste="handleSearchPaste"
                                />
                            </div>

                            <!-- Suggestion tooltip -->
                            <div
                                v-if="showUserSuggestions && searchTerm.trim()"
                                class="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
                            >
                                <button
                                    v-for="user in filteredUsers"
                                    :key="user.id"
                                    type="button"
                                    class="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    @mousedown.prevent
                                    @click="addSelectedUser(user); searchTerm=''; showUserSuggestions=true"
                                >
                                    <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ user.name }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                                </button>
                                <p
                                    v-if="filteredUsers.length === 0"
                                    class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400"
                                >
                                    No users match your search.
                                </p>
                            </div>
                        </div>
                        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Tip: paste multiple names/emails separated by comma or new line.
                        </p>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
                    <button @click="closeModal" :disabled="submitting"
                        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                        Cancel
                    </button>
                    <button @click="submitForm" :disabled="submitting || selectedUsers.length === 0"
                        class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                        {{ submitting ? 'Adding...' : 'Add Members' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading members...</p>
        </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center py-12">
        <div class="text-center">
            <div class="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <svg class="w-6 h-6 text-red-600 dark:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z"></path>
                </svg>
            </div>
            <p class="text-red-600 dark:text-red-200">Failed to load members.</p>
        </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="selectedUsers.length === 0" class="flex items-center justify-center py-12">
        <div class="text-center">
            <div class="inline-block p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg class="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M12 12a6 6 0 100 12 6 6 0 000-12z"></path>
                </svg>
            </div>
            <p class="text-gray-600 dark:text-gray-400">No members added yet. Click "Add Member" to get started.</p>
        </div>
    </div>

    <!-- Members List -->
    <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="user in initialSelectedUsers" :key="user.id" class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 p-6">
                <!-- Header accent -->
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>

                <!-- Member Info -->
                <div class="mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3">
                        {{ user.name.charAt(0).toUpperCase() }}
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {{ user.name }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {{ user.email }}
                    </p>
                    <p class="mt-2">
                        <span
                            class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:text-purple-200"
                        >
                            Role: {{ roleLabelForMember(user) }}
                        </span>
                    </p>
                </div>

                <!-- Action Button -->
                <div v-if="user.session_member_role != '2'" class="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        @click="downloadCsvReport(user)"
                        :disabled="downloadingUserId === user.id"
                        class="w-full mb-2 px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {{ downloadingUserId === user.id ? 'Downloading...' : 'Download CSV report' }}
                    </button>
                    <button @click="removeSelectedUser(user.pivot_id)"
                        class="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors duration-200">
                        Remove Member
                    </button>
                </div>
            </div>
        </div>

        <!-- Summary -->
        <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p class="text-sm text-blue-900 dark:text-blue-200">
                <span class="font-semibold">{{ selectedUsers.length }}</span> member{{ selectedUsers.length !== 1 ? 's' : '' }} currently in this session.
            </p>
        </div>
    </div>
</template>
