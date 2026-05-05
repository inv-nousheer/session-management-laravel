<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/axios.js'
import MembersPanel from '@/components/views/membersPanel.vue'
import UploadsPanel from '@/components/views/uploadsPanel.vue'
import AssessmentsPanel from '@/components/views/assessmentsPanel.vue'
import CommentsPanel from '@/components/views/commentsPanel.vue'
import CommentsPanelForMembers from '@/components/views/CommentsPanelForMembers.vue'
import SessionSettings from '@/components/views/session-settings.vue'
import ReopenrequestsPanel from '@/components/views/reopenrequestsPanel.vue'

const route = useRoute()
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
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">{{ sessionDetails.title }}</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ sessionDetails.description }}</p>
        </div>
      </div>

      <!-- Horizontal Navigation Tabs -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Navigation</h2>
        </div>

        <nav class="flex gap-2 overflow-x-auto pb-4 border-b border-gray-200 dark:border-gray-700">
          <button
           v-for="panel in panels.filter(panel =>
              sessionDetails.created_by === user_id
                  ? ['members', 'assessments', 'comments','reopen_requests', 'settings'].includes(panel.id)
                  : ['uploads', 'comments'].includes(panel.id)
              )"
            :key="panel.id"
            @click="activePanel = panel.id"
            :class="[
              'group relative flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none  focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
              activePanel === panel.id
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            <!-- Icon -->
            <svg
              :class="[
                'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                activePanel === panel.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'
              ]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" :d="panel.icon" clip-rule="evenodd"/>
            </svg>

            <!-- Label -->
            <span>{{ panel.label }}</span>

            <!-- Active underline indicator -->
            <div v-if="activePanel === panel.id" class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
          </button>
        </nav>
      </div>

      <!-- Content Section -->
      <section class="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm dark:border-gray-700/80 dark:bg-gray-800">
            <MembersPanel
                v-if="activePanel === 'members'"
                :selectedUsers="selectedUsers"
                :loading="loading"
                :error="error"
                @openModal="openModal"
                :users="users"
                :sessionId="sessionId"
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
            />
            <AssessmentsPanel
                v-if="activePanel === 'assessments'"
                :selectedUsers="selectedUsers"
                :assessments="assessments"
                :loading="loading"
                :error="error"
                :activePanel="activePanel"
                @fetchAssessments="fetchAssessments"
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
