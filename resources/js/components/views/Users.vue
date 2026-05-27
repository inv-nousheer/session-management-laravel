<script setup>

import { ref, onMounted, computed } from 'vue'
import api from '../../services/axios'

const importLoading = ref(false)
const importError = ref(null)
const importResult = ref(null)
const importFile = ref(null)
const showImportModal = ref(false)

const handleImportFileChange = (e) => {
  importFile.value = e.target.files[0] || null
}

const openImportModal = () => {
  showImportModal.value = true
  importError.value = null
  importResult.value = null
  importFile.value = null
  if (document.getElementById('import-users-file')) {
    document.getElementById('import-users-file').value = ''
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  importError.value = null
  importResult.value = null
  importFile.value = null
  if (document.getElementById('import-users-file')) {
    document.getElementById('import-users-file').value = ''
  }
}

const importUsers = async () => {
  if (!importFile.value) {
    importError.value = 'Please select a CSV file.'
    return
  }
  importLoading.value = true
  importError.value = null
  importResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    const res = await api.post('/api/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    importResult.value = res.data
    await fetchUsers()
  } catch (err) {
    importError.value = err.response?.data?.message || 'Failed to import users.'
    if (err.response?.data?.errors) {
      importError.value += ' ' + Object.values(err.response.data.errors).flat().join(' ')
    }
  } finally {
    importLoading.value = false
    importFile.value = null
    if (document.getElementById('import-users-file')) {
      document.getElementById('import-users-file').value = ''
    }
  }
}

const users = ref([])
const loading = ref(true)
const error = ref(null)
const showModal = ref(false)
const submitting = ref(false)
const formError = ref(null)
const editingUserId = ref(null)
const pagination = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: 0,
  to: 0,
  total: 0,
})

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'tl', label: 'TL' },
]

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  role: 'member',
})

const formData = ref(emptyForm())

const isEditMode = computed(() => editingUserId.value !== null)

const formRoleForApi = (role) => (role === 'user' ? 'member' : role)

const mapUserRoleToForm = (role) => {
  if (role === 'user') return 'member'
  if (['member', 'admin', 'tl'].includes(role)) return role
  return 'member'
}

onMounted(async () => {
  await fetchUsers()
})

const paginationPages = computed(() => {
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const pages = new Set([1, last])

  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= last) pages.add(page)
  }

  return [...pages].sort((a, b) => a - b)
})

const paginationSummary = computed(() => {
  if (!pagination.value.total) return 'Showing 0 of 0'

  return `Showing ${pagination.value.from}-${pagination.value.to} of ${pagination.value.total}`
})

const fetchUsers = async (page = pagination.value.current_page) => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/api/users', {
      params: {
        page,
        per_page: pagination.value.per_page,
      },
    })

    if (Array.isArray(res.data)) {
      users.value = res.data
      pagination.value = {
        ...pagination.value,
        current_page: 1,
        last_page: 1,
        from: res.data.length ? 1 : 0,
        to: res.data.length,
        total: res.data.length,
      }
    } else {
      users.value = res.data.data || []
      pagination.value = {
        current_page: res.data.current_page || 1,
        last_page: res.data.last_page || 1,
        per_page: Number(res.data.per_page || pagination.value.per_page),
        from: res.data.from || 0,
        to: res.data.to || 0,
        total: res.data.total || 0,
      }
    }
  } catch (err) {
    error.value = err
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

const goToPage = async (page) => {
  if (page < 1 || page > pagination.value.last_page || page === pagination.value.current_page || loading.value) return

  await fetchUsers(page)
}

const openModal = () => {
  editingUserId.value = null
  showModal.value = true
  formError.value = null
  formData.value = emptyForm()
}

const openEditModal = (user) => {
  editingUserId.value = user.id
  showModal.value = true
  formError.value = null
  formData.value = {
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: mapUserRoleToForm(user.role) || 'member',
  }
}

const closeModal = () => {
  showModal.value = false
  formError.value = null
  editingUserId.value = null
  formData.value = emptyForm()
}

const submitForm = async () => {
  if (!formData.value.name.trim()) {
    formError.value = 'Name is required'
    return
  }
  if (!formData.value.email.trim()) {
    formError.value = 'Email is required'
    return
  }
  if (!formData.value.role) {
    formError.value = 'Role is required'
    return
  }
  if (!isEditMode.value && !formData.value.password) {
    formError.value = 'Password is required'
    return
  }

  submitting.value = true
  formError.value = null
  try {
    const role = formRoleForApi(formData.value.role)
    if (isEditMode.value) {
      const payload = {
        name: formData.value.name.trim(),
        email: formData.value.email.trim(),
        role,
      }
      if (formData.value.password) {
        payload.password = formData.value.password
      }
      await api.put(`/api/users/${editingUserId.value}`, payload)
    } else {
      await api.post('/api/users', {
        name: formData.value.name.trim(),
        email: formData.value.email.trim(),
        role,
        password: formData.value.password,
      })
    }
    await fetchUsers()
    closeModal()
  } catch (err) {
    const msg = err.response?.data?.message
    const errors = err.response?.data?.errors
    formError.value =
      (errors && Object.values(errors).flat().join(' ')) ||
      msg ||
      (isEditMode.value ? 'Failed to update user' : 'Failed to create user')
    console.error(isEditMode.value ? 'Error updating user:' : 'Error creating user:', err)
  } finally {
    submitting.value = false
  }
}
</script>
<template>
<main class="h-full overflow-y-auto">
    <div class="container px-6 mx-auto grid">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <h2
            class="my-6 text-2xl font-semibold text-gray-700 dark:text-gray-200"
          >
            Users
          </h2>
          <div class="flex gap-2 items-center flex-wrap">
            <button @click="openModal"
              class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-purple-600 border border-transparent rounded-lg active:bg-purple-600 hover:bg-purple-700 focus:outline-none focus:shadow-outline-purple"
            >
              Add User
            </button>
            <button @click="openImportModal" class="px-4 py-2 text-sm font-medium leading-5 text-white transition-colors duration-150 bg-green-600 border border-transparent rounded-lg active:bg-green-600 hover:bg-green-700 focus:outline-none focus:shadow-outline-green">
              Import Users
            </button>
            <a href="/user_import_format.csv" download class="px-4 py-2 text-sm font-medium leading-5 text-purple-700 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 focus:outline-none focus:shadow-outline-purple">
              Download Format
            </a>
          </div>
        </div>

        <!-- Import Users Modal (AssessmentPanel style) -->
        <Teleport to="body">
          <div v-if="showImportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <!-- Backdrop -->
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeImportModal"></div>

            <!-- Dialog -->
            <div class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <!-- Header -->
              <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
                <h3 class="text-xl font-bold text-white">
                  Import Users from CSV
                </h3>
                <p class="text-purple-100 text-sm mt-0.5">
                  Upload a CSV file to bulk import users
                </p>
              </div>

              <!-- Body -->
              <div class="px-6 py-6 space-y-5 overflow-y-auto max-h-[65vh]">
                <input id="import-users-file" type="file" accept=".csv,text/csv" class="mb-4 block w-full text-sm text-gray-700 dark:text-gray-200" @change="handleImportFileChange" />
                <div v-if="importError" class="mb-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded text-sm">
                  {{ importError }}
                </div>
                <div v-if="importResult" class="mb-2 p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded text-sm">
                  Imported: {{ importResult.imported }} users.
                  <span v-if="importResult.errors && importResult.errors.length">Some rows failed: {{ importResult.errors.length }}</span>
                </div>
                <div class="mb-2 text-xs text-gray-500 dark:text-gray-400">CSV columns: <b>name, email, password, role</b></div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  @click="closeImportModal"
                  :disabled="importLoading"
                  class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  @click="importUsers"
                  :disabled="importLoading || !importFile"
                  class="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span v-if="importLoading" class="animate-spin inline-block">⟳</span>
                  {{ importLoading ? 'Importing...' : 'Import Users' }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>
        <div class="w-full overflow-hidden rounded-lg shadow-xs">
                <div class="w-full overflow-x-auto">
                <table class="w-full whitespace-no-wrap">
                    <thead>
                    <tr
                        class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
                    >
                        <th class="px-4 py-3">Name</th>
                        <th class="px-4 py-3">Email</th>
                        <th class="px-4 py-3">Role</th>
                         <th class="px-4 py-3">Actions</th>
                    </tr>
                    </thead>
                    <tbody
                    class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800"
                    >
                      <tr v-if="loading">
                        <td colspan="4" class="px-4 py-3 text-center">
                          Loading users...
                        </td>
                      </tr>
                      <tr v-else-if="error">
                        <td colspan="4" class="px-4 py-3 text-center text-red-600">
                          Failed to load users.
                        </td>
                      </tr>
                      <tr v-else-if="users.length === 0">
                        <td colspan="4" class="px-4 py-3 text-center">
                          No users found.
                        </td>
                      </tr>
                      <template v-else>
                        <tr v-for="user in users" :key="user.id" class="text-gray-700 dark:text-gray-400">
                          <td class="px-4 py-3">
                            <div class="flex items-center text-sm">
                             
                              <div>
                                <p class="font-semibold">{{ user.name }}</p>
                                <p class="text-xs text-gray-600 dark:text-gray-400">
                                  {{ user.role }}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td class="px-4 py-3 text-sm">
                            {{ user.email }}
                          </td>
                          <td class="px-4 py-3 text-xs">
                            <span
                              class="px-2 py-1 font-semibold leading-tight text-green-700 bg-green-100 rounded-full dark:bg-green-700 dark:text-green-100"
                            >
                              {{ user.role }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-sm">
                            <button
                              type="button"
                              @click="openEditModal(user)"
                              class="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800"
                            >
                              Edit
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
                    {{ paginationSummary }}
                </span>
                <span class="col-span-2"></span>
                <!-- Pagination -->
                <span class="flex col-span-4 mt-2 sm:mt-auto sm:justify-end">
                    <nav aria-label="Table navigation">
                    <ul class="inline-flex items-center">
                        <li>
                        <button
                            @click="goToPage(pagination.current_page - 1)"
                            :disabled="loading || pagination.current_page <= 1"
                            class="px-3 py-1 rounded-md rounded-l-lg focus:outline-none focus:shadow-outline-purple disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <template v-for="(page, index) in paginationPages" :key="page">
                        <li v-if="index > 0 && page - paginationPages[index - 1] > 1" :key="`ellipsis-${page}`">
                            <span class="px-3 py-1">...</span>
                        </li>
                        <li>
                            <button
                            @click="goToPage(page)"
                            :disabled="loading || page === pagination.current_page"
                            :class="[
                                'px-3 py-1 rounded-md focus:outline-none focus:shadow-outline-purple disabled:cursor-not-allowed',
                                page === pagination.current_page
                                ? 'text-white transition-colors duration-150 bg-purple-600 border border-r-0 border-purple-600'
                                : ''
                            ]"
                            >
                            {{ page }}
                            </button>
                        </li>
                        </template>
                        <li>
                        <button
                            @click="goToPage(pagination.current_page + 1)"
                            :disabled="loading || pagination.current_page >= pagination.last_page"
                            class="px-3 py-1 rounded-md rounded-r-lg focus:outline-none focus:shadow-outline-purple disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div class="fixed inset-0 bg-transparent bg-opacity-75 transition-opacity z-40" @click="closeModal"></div>

      <!-- Modal content container -->
      <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
          <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200" id="modal-title">
                  {{ isEditMode ? 'Edit User' : 'Create New User' }}
                </h3>
                <div class="mt-2">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      placeholder="Enter name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    />
                  </div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                     <input
                      v-model="formData.email"
                      type="email"
                      placeholder="Enter email"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    />
                  </div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      v-model="formData.role"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    >
                      <option v-for="opt in ROLE_OPTIONS" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                  </div>
                   <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password {{ isEditMode ? '(optional)' : '*' }}
                    </label>
                     <input
                      v-model="formData.password"
                      type="password"
                      :placeholder="isEditMode ? 'Leave blank to keep current password' : 'Enter password'"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      :disabled="submitting"
                    />
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
              {{ submitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save User' : 'Create User') }}
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
