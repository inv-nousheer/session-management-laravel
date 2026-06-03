<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/axios.js'
import MembersPanel from '@/components/views/MembersPanel.vue'
import UploadsPanel from '@/components/views/UploadsPanel.vue'
import AssessmentsPanel from '@/components/views/AssessmentsPanel.vue'
import CommentsPanel from '@/components/views/CommentsPanel.vue'
import CommentsPanelForMembers from '@/components/views/CommentsPanelForMembers.vue'
import SessionSettings from '@/components/views/SessionSettings.vue'
import ReopenrequestsPanel from '@/components/views/ReopenrequestsPanel.vue'
import PageHeading from '@/components/PageHeading.vue'
import PageSubheading from '@/components/PageSubheading.vue'
import SessionPanelTabButton from '@/components/SessionPanelTabButton.vue'
import BackButton from '@/components/BackButton.vue'

const route = useRoute()
const router = useRouter()

const user_role = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : null

const sessionsListPath = computed(() =>
  user_role === 'admin' ? '/dashboard/sessions' : '/user-dashboard/sessions'
)

const goBackToSessions = () => {
  router.push(sessionsListPath.value)
}
const showModal = ref(false)
const submitting = ref(false)
const loading = ref(false)
const error = ref(false)
const assessments = ref([])
const sessionDetails  = ref({
  name: '',
  description: '',
  created_at: '',
  updated_at: ''
})
const users = ref([])
const selectedUsers = ref([])
const panels = [
  { id: 'members', label: 'Manage Members', icon: 'M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M12 12a6 6 0 100 12 6 6 0 000-12z' },
  { id: 'assessments', label: 'Assessments', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'uploads', label: 'Project Uploads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { id: 'comments', label: 'Comments', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { id: 'settings', label: 'Session Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { id:'reopen_requests', label:'Assessment Reopen Requests', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }
]

const sessionId = computed(() => route.params.id)
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
const activePanel = ref('')



onMounted(async () => {
  await fetchSessionDetails()
  await fetchUsers()
  await fetchSelectedUsers()
  await fetchAssessments()
   activePanel.value =sessionDetails.value.created_by === user_id ? 'members' : 'uploads'
})

const fetchSessionDetails = async () => {
  try {
    const res = await api.get(`/api/sessions/${sessionId.value}`)
    sessionDetails.value = res.data
  } catch (error) {
    console.error('Error fetching session details:', error)
  }
}
const fetchUsers = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/seminar-users/${sessionId.value}`)
    users.value = res.data
  } catch (err) {
    error.value = true
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}
const fetchSelectedUsers = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/session/${sessionId.value}/members`)
    selectedUsers.value = res.data.map(item => ({
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

const fetchAssessments = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/sessions-assessments/${sessionId.value}`)
    assessments.value = res.data
  } catch (err) {
    error.value = true
    console.error('Error fetching assessments:', err)
  } finally {
    loading.value = false
  }
}


const openModal = () => {
    console.log("Opening modal to add members")
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
}

const isUserSelected = (user) => selectedUsers.value.some((item) => item.id === user.id)
const addSelectedUser = (user) => {
  if (!isUserSelected(user)) {
    console.log('Adding user:', user.value)
    selectedUsers.value.push(user)
    console.log('Selected Users:', selectedUsers.value)
  }
}
const removeSelectedUser = (userId) => {
  selectedUsers.value = selectedUsers.value.filter((item) => item.id !== userId)
}
const submitForm = async () => {
  if (selectedUsers.value.length === 0) {
    alert('Please select at least one user to add.')
    return
  }
  submitting.value = true
  try {
    const userIds = selectedUsers.value.map((user) => user.id)
    const userList  =await api.post(`/api/session/${sessionId.value}/add-members`, { user_ids: userIds })
    alert('Members added successfully!')
    closeModal()
     selectedUsers.value = userList.data.map(item => ({
      ...item.user,
      session_member_role: item.role,
      uploads: item.uploads,   // keep uploads if needed
      pivot_id: item.id        // optional if you need relation id
    }))
    //  selectedUsers.value = userList.data
  } catch (err) {
    console.error('Error adding members:', err)
    alert('Failed to add members. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
    <div class="p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div class="flex items-start gap-3 min-w-0">
          <BackButton @click="goBackToSessions" />
          <div class="min-w-0">
            <PageHeading>{{ sessionDetails.title }}</PageHeading>
            <PageSubheading>{{ sessionDetails.description }}</PageSubheading>
          </div>
        </div>
      </div>

      <!-- Horizontal Navigation Tabs -->
      <div class="mb-8">
       

        <nav class="flex gap-2 overflow-x-auto pb-4 border-b border-gray-200 dark:border-gray-700">
          <SessionPanelTabButton
            v-for="panel in panels.filter(panel =>
              sessionDetails.created_by === user_id
                  ? ['members', 'assessments', 'comments','reopen_requests', 'settings'].includes(panel.id)
                  : ['uploads', 'comments'].includes(panel.id)
              )"
            :key="panel.id"
            :panel="panel"
            :active="activePanel === panel.id"
            @select="activePanel = $event"
          />
        </nav>
      </div>

      <!-- Content Section -->
      <section class="rounded-2xl border border-gray-200/80 bg-gray-200 p-8 shadow-sm dark:border-gray-700/80 dark:bg-gray-800">
            <MembersPanel
                v-if="activePanel === 'members'"

                :loading="loading"
                :error="error"
                :users="users"
                :sessionId="Number(sessionId)"
            />

            <UploadsPanel
               v-if="activePanel === 'uploads' && sessionDetails.created_by === user_id"
                :selectedUsers="selectedUsers"
                :loading="loading"
                :error="error"
            />
            <AssessmentsPanel
               v-if="activePanel === 'uploads' && sessionDetails.created_by !== user_id"
                :selectedUsers="selectedUsers"
                :assessments="assessments"
                :loading="loading"
                :error="error"
                :activePanel="activePanel"
                @fetchAssessments="fetchAssessments"
                :sessionDetails="sessionDetails"
            />
            <AssessmentsPanel
                v-if="activePanel === 'assessments'"
                :selectedUsers="selectedUsers"
                :assessments="assessments"
                :loading="loading"
                :error="error"
                :activePanel="activePanel"
                @fetchAssessments="fetchAssessments"
                :sessionDetails="sessionDetails"
            />
             <CommentsPanelForMembers
                v-if="activePanel === 'comments' && sessionDetails.created_by !== user_id"
                :selectedUsers="selectedUsers"
                :assessments="assessments"
                :loading="loading"
                :error="error"
            />
             <CommentsPanel
                v-if="activePanel === 'comments' && sessionDetails.created_by === user_id"
                :selectedUsers="selectedUsers"
                :assessments="assessments"
                :loading="loading"
                :error="error"
                @fetchAssessments="fetchAssessments"
            />





          <div v-if="activePanel === 'settings'">
            <SessionSettings />
          </div>
          <div v-if="activePanel ==='reopen_requests'">
            <ReopenrequestsPanel  />

          </div>
        </section>
      </div>


</template>
