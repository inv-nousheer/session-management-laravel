<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/axios.js'
import SessionButton from '@/components/SessionButton.vue'
import PageHeading from '@/components/PageHeading.vue'
import PageSubheading from '@/components/PageSubheading.vue'
import AddMemberModal from '@/components/AddMemberModal.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyMembersState from '@/components/EmptySessionsState.vue'
import SessionMemberSummary from '@/components/SessionMemberSummary.vue'
import SessionMembersList from '@/components/SessionMembersList.vue'

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
    selectedUsers.value = selectedUsers.value.filter((item) => item.pivot_id !== userId)
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
            <PageHeading>Manage Members</PageHeading>
            <PageSubheading>Add and manage session members</PageSubheading>
        </div>
        <SessionButton variant="primary" @click="openModal" >Add Member</SessionButton>
    </div>
    <AddMemberModal
        v-if="showModal"
        v-model:search-term="searchTerm"
        v-model:show-user-suggestions="showUserSuggestions"
        :selected-users="selectedUsers"
        :filtered-users="filteredUsers"
        :submitting="submitting"
        @close="closeModal"
        @submit="submitForm"
        @remove-draft-user="removeSelectedUserFromDraft"
        @add-selected-user="addSelectedUser"
        @search-blur="handleSearchBlur"
        @search-keydown="handleSearchKeydown"
        @search-paste="handleSearchPaste"
    />
    <!-- Loading State -->
    <LoadingState v-if="loading" message="Loading members..." />

    <!-- Error State -->
    <ErrorState v-else-if="error" message="Failed to load members." />

    <!-- Empty State -->
    <EmptyMembersState v-else-if="selectedUsers.length === 0" message="No members added yet. Click 'Add Member' to get started." />

    <!-- Members List -->
    <div v-else>
        <SessionMembersList
            :members="initialSelectedUsers"
            :downloading-user-id="downloadingUserId"
            @download-report="downloadCsvReport"
            @remove-member="removeSelectedUser"
        />

        <!-- Summary -->
        <SessionMemberSummary :count="selectedUsers.length" />
    </div>
</template>
