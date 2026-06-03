<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  tagInput: {
    type: String,
    default: '',
  },
  tagSuggestions: {
    type: Array,
    default: () => [],
  },
  existingTagsLoading: {
    type: Boolean,
    default: false,
  },
  existingTagsError: {
    type: [Object, String],
    default: null,
  },
  teamLeadSearch: {
    type: String,
    default: '',
  },
  selectedTeamLeads: {
    type: Array,
    default: () => [],
  },
  filteredUsers: {
    type: Array,
    default: () => [],
  },
  usersLoading: {
    type: Boolean,
    default: false,
  },
  usersError: {
    type: [Object, String],
    default: null,
  },
  formError: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'add-tag',
  'add-tag-suggestion',
  'add-team-lead-search',
  'close',
  'remove-tag',
  'remove-team-lead',
  'submit',
  'update-field',
  'update:tagInput',
  'update:teamLeadSearch',
])

const dateTimeInput = ref(null)
let picker = null

const initializeDatePicker = async () => {
  if (!dateTimeInput.value) return
  if (picker) {
    picker.destroy()
    picker = null
  }

  const [{ default: flatpickr }] = await Promise.all([
    import('flatpickr'),
    import('flatpickr/dist/flatpickr.min.css'),
  ])

  picker = flatpickr(dateTimeInput.value, {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    time_24hr: true,
    minDate: 'today',
    clickOpens: true,
    allowInput: false,
    disableMobile: true,
    defaultDate: props.formData.dateTime || null,
    onChange: (_dates, dateStr) => {
      emit('update-field', 'dateTime', dateStr)
    },
  })
}

onMounted(async () => {
  await nextTick()
  initializeDatePicker()
})

onBeforeUnmount(() => {
  if (picker) {
    picker.destroy()
    picker = null
  }
})
</script>

<template>
  <div
    class="fixed inset-0 z-40"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
      @click="emit('close')"
    ></div>

    <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl text-left shadow-2xl transform transition-all w-full max-w-2xl border border-gray-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 sm:px-8 py-6">
          <h3 class="text-2xl font-bold text-white" id="modal-title">Create New Session</h3>
          <p class="text-purple-100 text-sm mt-1">Set up a new session with details and tags</p>
        </div>

        <div class="create-session-scrollbar px-6 sm:px-8 py-6 space-y-6 overflow-y-auto">
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Session Name <span class="text-red-500">*</span>
            </label>
            <input
              :value="formData.name"
              type="text"
              placeholder="e.g., Introduction to Web Development"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              :disabled="submitting"
              @input="emit('update-field', 'name', $event.target.value)"
            />
          </div>

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

          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
            <textarea
              :value="formData.description"
              placeholder="Enter session description, learning objectives, and key topics..."
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              :disabled="submitting"
              @input="emit('update-field', 'description', $event.target.value)"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Tags <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
            </label>
            <div class="flex gap-2 mb-3">
              <input
                :value="tagInput"
                type="text"
                placeholder="Enter a tag and press Enter"
                class="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                :disabled="submitting"
                @input="emit('update:tagInput', $event.target.value)"
                @keydown.enter.prevent="emit('add-tag')"
              />
              <button
                type="button"
                class="px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                :disabled="submitting || !tagInput.trim()"
                @click="emit('add-tag')"
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
                  class="px-3 py-1.5 rounded-full text-xs font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 hover:border-indigo-400 transition-colors"
                  @click="emit('add-tag-suggestion', tag)"
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
                  class="hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
                  @click="emit('remove-tag', index)"
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

          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Team leads <span class="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional)</span>
            </label>

            <div class="flex flex-wrap gap-2 mb-3">
              <div
                v-for="user in selectedTeamLeads"
                :key="user.id"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm font-medium border border-emerald-200 dark:border-emerald-800"
              >
                <span>{{ user.name }}<span v-if="user.email" class="text-xs font-normal opacity-80"> ({{ user.email }})</span></span>
                <button
                  type="button"
                  class="hover:text-emerald-950 dark:hover:text-emerald-100 transition-colors"
                  :disabled="submitting"
                  @click="emit('remove-team-lead', user.id)"
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
              :value="teamLeadSearch"
              type="text"
              placeholder="Search users by name or email..."
              list="teamlead-users"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              :disabled="submitting"
              @input="emit('update:teamLeadSearch', $event.target.value)"
              @change="emit('add-team-lead-search')"
              @keydown.enter.prevent="emit('add-team-lead-search')"
            />
            <datalist id="teamlead-users">
              <option
                v-for="user in filteredUsers"
                :key="user.id"
                :value="user.email || user.name"
                :label="user.name"
              />
            </datalist>

            <p v-if="usersLoading" class="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading users...</p>
            <p v-else-if="usersError" class="mt-2 text-xs text-red-700 dark:text-red-300">Failed to load users.</p>
            <p v-else class="mt-2 text-xs text-gray-500 dark:text-gray-400">Type to search, then pick from suggestions (or press Enter). You can select multiple team leads.</p>
          </div>

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

        <div class="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 px-6 sm:px-8 py-4 sm:flex sm:flex-row-reverse gap-3">
          <button
            :disabled="submitting"
            class="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-base font-semibold text-white hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            @click="emit('submit')"
          >
            <span v-if="submitting" class="animate-spin">⟳</span>
            {{ submitting ? 'Creating...' : 'Create Session' }}
          </button>
          <button
            :disabled="submitting"
            class="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-slate-600 shadow-sm px-6 py-3 bg-white dark:bg-slate-800 text-base font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            @click="emit('close')"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.flatpickr-calendar) { background: rgb(30, 41, 59); border-color: rgb(71, 85, 105); }
:deep(.flatpickr-calendar.dark) { background: rgb(30, 41, 59); }
:deep(.flatpickr-months .flatpickr-month) { background: rgb(15, 23, 42); color: white; }
:deep(.flatpickr-weekdays) { background: rgb(15, 23, 42); color: rgb(148, 163, 184); }
:deep(.flatpickr-days .flatpickr-day) { color: rgb(71, 85, 105); }
:deep(.flatpickr-days .flatpickr-day.today) { border-color: rgb(168, 85, 247); }
:deep(.flatpickr-days .flatpickr-day.selected) { background: rgb(168, 85, 247); border-color: rgb(168, 85, 247); }
:deep(.flatpickr-days .flatpickr-day:hover) { background: rgb(51, 65, 85); cursor: pointer; }
:deep(.flatpickr-time input) { color: white; background: rgb(30, 41, 59); border-color: rgb(71, 85, 105); }
:deep(.numInputWrapper span) { color: white; }
:deep(.flatpickr-input::placeholder) { color: rgb(148, 163, 184); }

.create-session-scrollbar::-webkit-scrollbar { width: 5px; }
.create-session-scrollbar::-webkit-scrollbar-track { background: transparent; }
.create-session-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .create-session-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
</style>
