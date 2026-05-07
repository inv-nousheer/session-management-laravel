<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">Session Settings</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your session details and configuration</p>
      </div>

      <!-- Form Card -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 sm:px-8 py-8">
          <h2 class="text-2xl font-bold text-white">Edit Session</h2>
          <p class="text-purple-100 text-sm mt-1">Update your session information</p>
        </div>

        <!-- Form Content -->
        <form @submit.prevent="updateSession" class="px-6 sm:px-8 py-8 space-y-6">
          <!-- Session Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Session Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="e.g., Advanced Java Programming"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              :disabled="submitting"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Give your session a clear, descriptive name</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              placeholder="Describe your session, learning objectives, and expectations..."
              rows="5"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              :disabled="submitting"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Provide details about your session content and goals</p>
          </div>

          <!-- Date & Time Picker using Flatpickr -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Session Date & Time <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                ref="dateTimeInput"
                type="text"
                v-model="form.dateTime"
                placeholder="Click to select date and time"
                class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                :disabled="submitting"
              />
              <svg
                class="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Click to select the date and time when your session starts</p>
          </div>

           <!-- Tags Input -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Tags <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
            </label>

            <!-- Tag Input Field -->
            <div class="flex gap-2 mb-3">
              <input
                v-model="tagInput"
                type="text"
                placeholder="Enter a tag and press Enter"
                class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                @keydown.enter="addTag"
                :disabled="submitting"
              />
              <button
                @click="addTag"
                type="button"
                class="px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                :disabled="submitting || !tagInput.trim()"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </button>
            </div>

            <!-- Tags Display -->
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(tag, index) in form.tags"
                :key="index"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-linear-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium"
              >
                <span>#{{ tag }}</span>
                <button
                  @click="removeTag(index)"
                  type="button"
                  class="hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
              <div v-if="form.tags.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic py-1">
                No tags added yet
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">Tags help categorize and organize your sessions</p>
          </div>

          <!-- Team Leads -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Team leads <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
            </label>

            <!-- Selected team leads -->
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
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </button>
              </div>
              <div v-if="selectedTeamLeads.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic py-1">
                No team leads selected
              </div>
            </div>

            <!-- Search -->
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

            <p v-if="usersLoading" class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading users…</p>
            <p v-else-if="usersError" class="mt-2 text-xs text-red-700 dark:text-red-300">Failed to load users.</p>
            <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">Type to search, then pick from suggestions (or press Enter). You can select multiple team leads.</p>
          </div>

          <!-- Alert Messages -->
          <div v-if="success" class="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <p class="text-sm font-medium text-green-800 dark:text-green-200">Session updated successfully!</p>
            </div>
          </div>

          <div v-if="error" class="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <p class="text-sm font-medium text-red-800 dark:text-red-200">Failed to update session. Please try again.</p>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span v-if="submitting" class="animate-spin">⟳</span>
              <span>{{ submitting ? 'Updating...' : 'Update Session' }}</span>
            </button>
            <button
              type="button"
              @click="resetForm"
              :disabled="submitting"
              class="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>

        <!-- Info Section -->
        <div class="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 px-6 sm:px-8 py-6">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quick Tips</h3>
          <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li class="flex items-start gap-2">
              <span class="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span>Use a clear and descriptive session name for easy identification</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span>Include learning objectives and key topics in the description</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
              <span>The session date and time helps students track and organize their work</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Session Info Card (Read-only) -->
      <div class="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div class="px-6 sm:px-8 py-6 border-b border-gray-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Current Session Information</h3>
        </div>
        <div class="px-6 sm:px-8 py-6 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- Session Name -->
            <div>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Session Name</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ form.title || 'Not set' }}</p>
            </div>

            <!-- Session Date & Time -->
            <div>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Date & Time</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ form.dateTime || 'Not set' }}
              </p>
            </div>

            <!-- Status -->
            <div>
              <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Status</p>
              <span class="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <span class="w-2 h-2 rounded-full bg-green-600"></span>
                Active
              </span>
            </div>
          </div>

          <!-- Description -->
          <div>
            <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Description</p>
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {{ form.description || 'No description provided' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/axios.js'
import { useRoute } from 'vue-router'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'

const route = useRoute()
const sessionId = route.params.id
const dateTimeInput = ref(null)
let picker = null

const form = ref({
  title: '',
  description: '',
  dateTime: '',
  tags:[]
})

const submitting = ref(false)
const success = ref(false)
const error = ref(false)
const originalForm = ref({...form.value})
const originalTeamLeads = ref([])

const fetchSession = async () => {
  try {
    const res = await api.get(`/api/sessions/${sessionId}`)
    form.value.title = res.data.title || ''
    form.value.description = res.data.description || ''
   // selectedTeamLeads.push(res.data.)
   form.value.tags.push(res.data.tags);


    // Format datetime for display
    if (res.data.date) {
      const dateObj = new Date(res.data.date)
      form.value.dateTime = dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5')
    }

    originalForm.value = {...form.value}
    console.log('Session loaded:', form.value)
  } catch (e) {
    error.value = true
    console.error('Error fetching session:', e)
  }
}

const initializeDatePicker = () => {
  if (dateTimeInput.value) {
    picker = flatpickr(dateTimeInput.value, {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      time_24hr: true,
      mode: 'single',
      minDate: 'today',
      onChange: (selectedDates) => {
        if (selectedDates.length > 0) {
          const date = selectedDates[0]
          form.value.dateTime = date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+)/, '$3-$1-$2 $4:$5')
        }
      }
    })
  }
}

const updateSession = async () => {
  // Validation
  if (!form.value.title.trim()) {
    error.value = true
    return
  }
  if (!form.value.description.trim()) {
    error.value = true
    return
  }
  if (!form.value.dateTime) {
    error.value = true
    return
  }

  submitting.value = true
  success.value = false
  error.value = false

  try {
    // Convert back to ISO format for API
    const [date, time] = form.value.dateTime.split(' ')
    const isoDateTime = `${date}T${time}:00`

    await api.put(`/api/sessions/${sessionId}`, {
      title: form.value.title,
      description: form.value.description,
      date: isoDateTime,
      teamlead_ids: selectedTeamLeads.value.map((u) => u.id).filter(Boolean)
    })
    success.value = true
    originalForm.value = {...form.value}

    // Hide success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (e) {
    error.value = true
    console.error('Error updating session:', e)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.value = {...originalForm.value}
  selectedTeamLeads.value = [...originalTeamLeads.value]
  teamLeadSearch.value = ''
  if (picker) {
    picker.setDate(form.value.dateTime)
  }
  error.value = false
  success.value = false
}

onMounted(async () => {
  await fetchSession()
  await fetchUsers()
  await fetchTeamLeads()
  // Initialize datepicker after component is mounted
  setTimeout(() => {
    initializeDatePicker()
  }, 100)
})

const tagInput = ref('')

// Add Tag
const addTag = () => {
  const tag = tagInput.value.trim()

  if (!tag) {
    return
  }

  // Check if tag already exists (case-insensitive)
  if (form.value.tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
    formError.value = 'This tag already exists'
    setTimeout(() => {
      formError.value = ''
    }, 3000)
    return
  }

  // Limit tags to reasonable number
  if (form.value.tags.length >= 10) {
    formError.value = 'Maximum 10 tags allowed'
    setTimeout(() => {
      formError.value = ''
    }, 3000)
    return
  }

  form.value.tags.push(tag)
  tagInput.value = ''
}

// Remove Tag
const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}



const allUsers = ref([])
const usersLoading = ref(false)
const usersError = ref(null)
const teamLeadSearch = ref('')
const selectedTeamLeads = ref([]) // array of user objects


const fetchUsers = async () => {
  if (usersLoading.value) return
  usersLoading.value = true
  usersError.value = null
  try {
    const res = await api.get('/api/users')
    allUsers.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    usersError.value = err
    console.error('Error loading users:', err)
  } finally {
    usersLoading.value = false
  }
}

const fetchTeamLeads = async () => {
  try {
    const res = await api.get(`/api/session/${sessionId}/members`)
    const teamLeads = (Array.isArray(res.data) ? res.data : [])
      .filter((item) => Number(item?.role) === 2 && item?.user)
      .map((item) => item.user)

    selectedTeamLeads.value = teamLeads
    originalTeamLeads.value = [...teamLeads]
  } catch (err) {
    console.error('Error loading team leads:', err)
  }
}

const filteredUsers = computed(() => {
  const q = teamLeadSearch.value.trim().toLowerCase()
  if (!q) return allUsers.value
  return allUsers.value.filter((u) => {
    const hay = `${u?.name ?? ''} ${u?.email ?? ''}`.toLowerCase()
    return hay.includes(q)
  })
})

const isSelectedTeamLead = (user) => selectedTeamLeads.value.some((u) => u?.id === user?.id)
const toggleTeamLead = (user) => {
  if (!user?.id) return
  const idx = selectedTeamLeads.value.findIndex((u) => u?.id === user?.id)
  if (idx >= 0) selectedTeamLeads.value.splice(idx, 1)
  else selectedTeamLeads.value.push(user)
}
const addTeamLeadFromSearch = () => {
  const q = teamLeadSearch.value.trim()
  if (!q) return

  const qLower = q.toLowerCase()
  const match =
    allUsers.value.find((u) => (u?.email ?? '').toLowerCase() === qLower) ||
    allUsers.value.find((u) => (u?.name ?? '').toLowerCase() === qLower) ||
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
</script>

<style scoped>
/* Smooth animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bg-white {
  animation: fadeIn 0.3s ease-out;
}

/* Input focus states */
input:focus {
  outline: none;
}

/* Dark mode adjustments for flatpickr */
:deep(.flatpickr-calendar) {
  background: rgb(30, 41, 59);
  border-color: rgb(71, 85, 105);
}

:deep(.flatpickr-calendar.dark) {
  background: rgb(30, 41, 59);
}

:deep(.flatpickr-months .flatpickr-month) {
  background: rgb(15, 23, 42);
  color: white;
}

:deep(.flatpickr-weekdays) {
  background: rgb(15, 23, 42);
  color: rgb(148, 163, 184);
}

:deep(.flatpickr-days .flatpickr-day) {
  color: rgb(71, 85, 105);
}

:deep(.flatpickr-days .flatpickr-day.today) {
  border-color: rgb(168, 85, 247);
}

:deep(.flatpickr-days .flatpickr-day.selected) {
  background: rgb(168, 85, 247);
  border-color: rgb(168, 85, 247);
}

:deep(.flatpickr-days .flatpickr-day:hover) {
  background: rgb(51, 65, 85);
  cursor: pointer;
}

:deep(.flatpickr-time input) {
  color: white;
  background: rgb(30, 41, 59);
  border-color: rgb(71, 85, 105);
}

:deep(.numInputWrapper span) {
  color: white;
}
</style>
