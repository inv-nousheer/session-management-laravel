<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/axios'

const sessions = ref([])
const loading = ref(true)
const error = ref(null)
const showModal = ref(false)
const submitting = ref(false)
const formError = ref(null)


const formData = ref({
  name: '',
  description: ''
})
const user_id = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null

onMounted(async () => {
  await fetchSessions()
})

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await api.get('/api/sessions')
    sessions.value = res.data
  } catch (err) {
    error.value = err
    console.error('Error loading sessions:', err)
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  showModal.value = true
  formError.value = null
  formData.value = { name: '', description: '' }
}

const closeModal = () => {
  showModal.value = false
  formError.value = null
  formData.value = { name: '', description: '' }
}

const submitForm = async () => {
  if (!formData.value.name.trim()) {
    formError.value = 'Session name is required'
    return
  }

  submitting.value = true
  try {
    await api.post('/api/sessions', {
      title: formData.value.name,
      description: formData.value.description,
      created_by: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null
    })
    await fetchSessions()
    closeModal()
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create session'
    console.error('Error creating session:', err)
  } finally {
    submitting.value = false
  }
}
</script>
<template>
<main class="h-full overflow-y-auto">
    <div class="container px-6 mx-auto grid">
        <div class="flex items-center justify-between">
            <h2
                class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200"
            >
                Sessions
            </h2>
            <button
                @click="openModal"
                class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple"
            >
                Add Session
            </button>
        </div>
        <div class="w-full overflow-hidden rounded-lg shadow-xs">
                <div class="w-full overflow-x-auto">
                <table class="w-full whitespace-no-wrap">
                    <thead>
                    <tr
                        class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                    >
                        <th class="px-4 py-3">Name</th>
                        <th class="px-4 py-3">Description</th>
                        <th class="px-4 py-3">Created At</th>
                        <th class="px-4 py-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody
                    class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800"
                    >
                      <tr v-if="loading">
                        <td colspan="3" class="px-4 py-3 text-center">
                          Loading sessions...
                        </td>
                      </tr>
                      <tr v-else-if="error">
                        <td colspan="3" class="px-4 py-3 text-center text-red-600">
                          Failed to load sessions.
                        </td>
                      </tr>
                      <tr v-else-if="sessions.length === 0">
                        <td colspan="3" class="px-4 py-3 text-center">
                          No sessions found.
                        </td>
                      </tr>
                      <template v-else>
                        <tr v-for="session in sessions" :key="session.id" class="text-gray-700 dark:text-gray-400">
                          <td class="px-4 py-3 font-semibold">
                            {{ session.title }}
                          </td>
                          <td class="px-4 py-3 text-sm">
                            {{ session.description || 'N/A' }}
                          </td>
                          <td class="px-4 py-3 text-sm">
                            {{ new Date(session.created_at).toLocaleDateString() }}
                          </td>
                          <td>
                            <div  class="flex space-x-2">
                                <button v-if="session.created_by == user_id"
                                    class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple"
                                ><a :href="`/sessions/${session.id}`" class="text-white">
                                    Edit
                                </a>
                                </button>
                                <button
                                    class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple"
                                ><a :href="`/sessions/${session.id}`" class="text-white">
                                    View
                                </a>
                                </button>
                            </div>

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

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Background overlay -->
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-transparent bg-opacity-50 transition-opacity z-40" @click="closeModal"></div>

      <!-- Modal content container -->
      <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200" id="modal-title">
                  Create New Session
                </h3>
                <div class="mt-2">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Name *
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      placeholder="Enter session name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    />
                  </div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      v-model="formData.description"
                      placeholder="Enter session description"
                      rows="4"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    ></textarea>
                  </div>
                  <div v-if="formError" class="mb-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
                    {{ formError }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              @click="submitForm"
              :disabled="submitting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submitting ? 'Creating...' : 'Create Session' }}
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
</main>
</template>
