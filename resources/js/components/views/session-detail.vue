<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/axios.js'
import Page from './page.vue'

const route = useRoute()
const activePanel = ref('members')
const showModal = ref(false)
const submitting = ref(false)
const loading = ref(false)
const error = ref(false)
const sessionDetails  = ref({
  name: '',
  description: '',
  created_at: '',
  updated_at: ''
})
const users = ref([])
const selectedUsers = ref([])
const panels = [
  { id: 'members', label: 'Manage Members' },
  { id: 'uploads', label: 'Project Uploads' },
  { id: 'comments', label: 'Comments' },
  { id: 'settings', label: 'Session Settings' }
]

const sessionId = computed(() => route.params.id)

onMounted(async () => {
  await fetchSessionDetails()
  await fetchUsers()
  await fetchSelectedUsers()
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
    const res = await api.get(`/api/users`)
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
    selectedUsers.value = res.data
  } catch (err) {
    error.value = true
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}
const openModal = () => {
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
}

const isUserSelected = (user) => selectedUsers.value.some((item) => item.id === user.id)
const addSelectedUser = (user) => {
  if (!isUserSelected(user)) {
    console.log('Adding user:', user)
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
    selectedUsers.value = userList.data
  } catch (err) {
    console.error('Error adding members:', err)
    alert('Failed to add members. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Page>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">{{ sessionDetails.title }}</h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ sessionDetails.description }}</p>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside class="rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Session menu</h2>
          <nav class="mt-4 space-y-2">
            <button
              v-for="panel in panels"
              :key="panel.id"
              @click="activePanel = panel.id"
              :class="[
                'w-full text-left rounded-lg px-4 py-3 text-sm font-medium transition',
                activePanel === panel.id
                  ? 'bg-purple-600 text-white hover:bg-purple-600'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              ]"
            >
              {{ panel.label }}
            </button>
          </nav>
        </aside>

        <section class="rounded-xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div v-if="activePanel === 'members'">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Manage Members</h2>
                <button @click="openModal"
                    class="px-4 py-2 mt-4 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple"
                >Add Member</button>
            </div>
            <div class="w-full overflow-hidden rounded-lg shadow-xs">
                <div class="w-full overflow-x-auto">
                    <table class="w-full whitespace-no-wrap">
                        <thead>
                        <tr
                            class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                        >
                            <th class="px-4 py-3">Name</th>
                            <th class="px-4 py-3">Email</th>
                        </tr>
                        </thead>
                        <tbody
                        class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800"
                        >
                        <tr v-if="loading">
                            <td colspan="3" class="px-4 py-3 text-center">
                            Loading users...
                            </td>
                        </tr>
                        <tr v-else-if="error">
                            <td colspan="3" class="px-4 py-3 text-center text-red-600">
                            Failed to load users.
                            </td>
                        </tr>
                        <tr v-else-if="users.length === 0">
                            <td colspan="3" class="px-4 py-3 text-center">
                            No users found.
                            </td>
                        </tr>
                        <template v-else>
                            <tr v-for="user in selectedUsers" :key="user.id" class="text-gray-700 dark:text-gray-400">
                            <td class="px-4 py-3">
                                <div class="flex items-center text-sm">

                                <div>
                                    <p class="font-semibold">{{ user.user.name }}</p>
                                </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-sm">
                                {{ user.user.email }}
                            </td>
                            </tr>
                        </template>
                        </tbody>
                    </table>
                </div>
                <div
                class="grid px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase border-t dark:border-gray-700 bg-gray-50 sm:grid-cols-9 dark:text-gray-400 dark:bg-gray-800"
                >
                <span class="flex items-center col-span-3">
                    Showing 21-30 of 100
                </span>
                <span class="col-span-2"></span>
                <!-- Pagination -->
                <span class="flex col-span-4 mt-2 sm:mt-auto sm:justify-end">
                    <nav aria-label="Table navigation">
                    <ul class="inline-flex items-center">
                        <li>
                        <button
                            class="px-3 py-1 rounded-md rounded-l-lg focus:outline-none focus:shadow-outline-purple"
                            aria-label="Previous"
                        >
                            <svg
                            aria-hidden="true"
                            class="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                            >
                            <path
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                                fill-rule="evenodd"
                            ></path>
                            </svg>
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            1
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            2
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 text-white transition-colors duration-150 bg-purple-600 border border-r-0 border-purple-600 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            3
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            4
                        </button>
                        </li>
                        <li>
                        <span class="px-3 py-1">...</span>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            8
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            9
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md rounded-r-lg focus:outline-none focus:shadow-outline-purple"
                            aria-label="Next"
                        >
                            <svg
                            class="w-4 h-4 fill-current"
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            >
                            <path
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                                fill-rule="evenodd"
                            ></path>
                            </svg>
                        </button>
                        </li>
                    </ul>
                    </nav>
                </span>
                </div>
            </div>
          </div>

          <div v-if="activePanel === 'uploads'">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Project Uploads</h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">View and manage uploaded project files.</p>
            <div class="w-full overflow-hidden rounded-lg shadow-xs">
                <div class="w-full overflow-x-auto">
                    <table class="w-full whitespace-no-wrap">
                        <thead>
                        <tr
                            class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                        >
                            <th class="px-4 py-3">Name</th>
                            <th class="px-4 py-3">Email</th>
                            <th class="px-4 py-3">Actions</th>
                        </tr>
                        </thead>
                        <tbody
                        class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800"
                        >
                        <tr v-if="loading">
                            <td colspan="3" class="px-4 py-3 text-center">
                            Loading users...
                            </td>
                        </tr>
                        <tr v-else-if="error">
                            <td colspan="3" class="px-4 py-3 text-center text-red-600">
                            Failed to load users.
                            </td>
                        </tr>
                        <tr v-else-if="users.length === 0">
                            <td colspan="3" class="px-4 py-3 text-center">
                            No users found.
                            </td>
                        </tr>
                        <template v-else>
                            <tr v-for="user in selectedUsers" :key="user.id" class="text-gray-700 dark:text-gray-400">
                            <td class="px-4 py-3">
                                <div class="flex items-center text-sm">

                                <div>
                                    <p class="font-semibold">{{ user.user.name }}</p>
                                </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-sm">
                                {{ user.user.email }}
                            </td>
                            <td class="px-4 py-3 text-sm">
                                <button v-if="user.user.uploads"
                                    class="px-3 py-1 text-xs font-semibold text-white transition-colors duration-150 bg-purple-600 border border-r-0 border-purple-600 rounded-md focus:outline-none focus:shadow-outline-purple"
                                    @click="downloadFile(user)"
                                >
                                    Download
                                </button>
                                <button v-if="user.user.uploads"
                                    class="px-3 py-1 text-xs font-semibold text-white transition-colors duration-150 bg-purple-600 border border-r-0 border-purple-600 rounded-md focus:outline-none focus:shadow-outline-purple"
                                    @click="downloadFile(user)"
                                >
                                    Comment
                                </button>
                            </td>
                            </tr>
                        </template>
                        </tbody>
                    </table>
                </div>
                <div
                class="grid px-4 py-3 text-xs font-semibold tracking-wide text-gray-500 uppercase border-t dark:border-gray-700 bg-gray-50 sm:grid-cols-9 dark:text-gray-400 dark:bg-gray-800"
                >
                <span class="flex items-center col-span-3">
                    Showing 21-30 of 100
                </span>
                <span class="col-span-2"></span>
                <!-- Pagination -->
                <span class="flex col-span-4 mt-2 sm:mt-auto sm:justify-end">
                    <nav aria-label="Table navigation">
                    <ul class="inline-flex items-center">
                        <li>
                        <button
                            class="px-3 py-1 rounded-md rounded-l-lg focus:outline-none focus:shadow-outline-purple"
                            aria-label="Previous"
                        >
                            <svg
                            aria-hidden="true"
                            class="w-4 h-4 fill-current"
                            viewBox="0 0 20 20"
                            >
                            <path
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                                fill-rule="evenodd"
                            ></path>
                            </svg>
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            1
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            2
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 text-white transition-colors duration-150 bg-purple-600 border border-r-0 border-purple-600 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            3
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            4
                        </button>
                        </li>
                        <li>
                        <span class="px-3 py-1">...</span>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            8
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple"
                        >
                            9
                        </button>
                        </li>
                        <li>
                        <button
                            class="px-3 py-1 rounded-md rounded-r-lg focus:outline-none focus:shadow-outline-purple"
                            aria-label="Next"
                        >
                            <svg
                            class="w-4 h-4 fill-current"
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            >
                            <path
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clip-rule="evenodd"
                                fill-rule="evenodd"
                            ></path>
                            </svg>
                        </button>
                        </li>
                    </ul>
                    </nav>
                </span>
                </div>
            </div>
          </div>

          <div v-if="activePanel === 'comments'">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Comments</h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Review and respond to session comments.</p>
          </div>

          <div v-if="activePanel === 'settings'">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Session Settings</h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Update session metadata, dates, or visibility.</p>
          </div>
        </section>
      </div>
    </div>
    <div v-if="showModal" class="fixed inset-0 z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Background overlay -->
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-transparent bg-opacity-50 transition-opacity z-40" @click="closeModal"></div>

      <!-- Modal content container -->
      <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 ">
        <div class="bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg border border-gray-300 dark:border-gray-700">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200" id="modal-title">
                  Add Member
                </h3>
                <div class="mt-2">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add Member to Session
                    </label>
                    <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Selected Members
                      </label>
                      <div class="min-h-[3rem] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex flex-wrap gap-2 items-center">
                        <template v-if="selectedUsers.length">
                          <span
                            v-for="user in selectedUsers"
                            :key="user.id"
                            class="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/60 dark:text-purple-200"
                          >
                            <span>{{ user.name }}</span>
                            <button
                              type="button"
                              @click="removeSelectedUser(user.id)"
                              class="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-purple-700 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-200 dark:hover:bg-purple-700"
                              aria-label="Remove {{ user.name }}"
                            >
                              &times;
                            </button>
                          </span>
                        </template>
                        <span v-else class="text-sm text-gray-500 dark:text-gray-400">No members selected yet.</span>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Member Name or Email"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    />
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                            Select User
                        </label>
                        <div class="space-y-2">
                          <button
                            v-for="user in users"
                            :key="user.id"
                            type="button"
                            @click="addSelectedUser(user)"
                            :disabled="isUserSelected(user)"
                            :class="[
                              'w-full rounded-lg px-3 py-2 text-left text-sm transition',
                              isUserSelected(user)
                                ? 'border border-purple-600 bg-purple-50 text-purple-700 dark:border-purple-500 dark:bg-purple-900/40 dark:text-purple-200 cursor-not-allowed'
                                : 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                            ]"
                          >
                            {{ user.name }} ({{ user.email }})
                          </button>
                        </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
                @click="submitForm""
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Add
            </button>
            <button
              @click="closeModal"
              :disabled="submitting"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
