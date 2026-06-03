<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'

const props = defineProps({
  formData: {
    type: Object,
    required: true,
  },
  formError: {
    type: String,
    default: '',
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  supportingFileLabel: {
    type: String,
    required: true,
  },
  sessionStartDate: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'close',
  'submit',
  'file-change',
  'update-field',
  'update-date-range',
])

const dateRangeInput = ref(null)
const datePickerWrap = ref(null)
let rangePicker = null

const normalizeDateString = (dateStr) => {
  if (!dateStr) return ''
  const str = String(dateStr).trim()
  if (str.includes('T')) return str.split('T')[0]
  if (str.includes(' ')) return str.split(' ')[0]
  return str.slice(0, 10)
}

const parsePickerDate = (dateStr) => {
  const normalized = normalizeDateString(dateStr)
  if (!normalized) return null
  const parsed = new Date(`${normalized}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toFormDateString = (date) => {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getDefaultPickerDates = () => {
  const start = parsePickerDate(props.formData.start_date_time)
  const end = parsePickerDate(props.formData.end_date_time)
  if (start && end) return [start, end]
  if (start) return [start]
  return null
}

const minPickerDate = computed(() => {
  const sessionDate = parsePickerDate(props.sessionStartDate)
  const assessmentStart = parsePickerDate(props.formData.start_date_time)

  if (sessionDate && assessmentStart) {
    return assessmentStart < sessionDate ? assessmentStart : sessionDate
  }
  if (sessionDate) return sessionDate
  if (props.isEditMode && assessmentStart) return assessmentStart
  return 'today'
})

const destroyDatePicker = () => {
  if (rangePicker) {
    rangePicker.destroy()
    rangePicker = null
  }
}

const initDatePicker = () => {
  // Double nextTick: teleported modal DOM may not be ready after one tick.
  nextTick(() => {
    nextTick(() => {
      if (!dateRangeInput.value) return

      destroyDatePicker()

      const defaultDates = getDefaultPickerDates()

      rangePicker = flatpickr(dateRangeInput.value, {
        mode: 'range',
        enableTime: false,
        dateFormat: 'Y-m-d',
        allowInput: false,
        clickOpens: true,
        disableMobile: true,
        minDate: minPickerDate.value,
        defaultDate: defaultDates ?? undefined,
        appendTo: datePickerWrap.value || undefined,
        onClickOutside: (selectedDates, dateStr, instance) => {
          instance.close()
        },
        onChange: (selectedDates) => {
          emit('update-date-range', {
            startDate: selectedDates[0] ? toFormDateString(selectedDates[0]) : '',
            endDate: selectedDates[1] ? toFormDateString(selectedDates[1]) : '',
          })
        },
      })

      if (defaultDates) {
        rangePicker.setDate(defaultDates, false)
      }
    })
  })
}

onMounted(initDatePicker)
onBeforeUnmount(destroyDatePicker)
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

      <!-- Dialog -->
      <div class="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700">
        <!-- Header -->
        <div class="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <h3 class="text-xl font-bold text-white">
            {{ isEditMode ? 'Edit Assessment' : 'Create Assessment' }}
          </h3>
          <p class="text-purple-100 text-sm mt-0.5">
            {{ isEditMode ? 'Update assessment details below' : 'Fill in the details for your new assessment' }}
          </p>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 space-y-5 overflow-y-auto max-h-[65vh]">
          <!-- Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Assessment Name <span class="text-red-500">*</span>
            </label>
            <input
              :value="formData.name"
              type="text"
              placeholder="e.g., Final Project Submission"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              :disabled="submitting"
              @input="emit('update-field', 'name', $event.target.value)"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Description
            </label>
            <textarea
              :value="formData.description"
              placeholder="Add any instructions or requirements..."
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
              :disabled="submitting"
              @input="emit('update-field', 'description', $event.target.value)"
            ></textarea>
          </div>

          <!-- Date Range -->
          <div class="assessment-date-picker-section">
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Assessment Date Range <span class="text-red-500">*</span>
            </label>
            <div ref="datePickerWrap" class="assessment-flatpickr-wrap">
              <input
                ref="dateRangeInput"
                type="text"
                placeholder="Select start and end date"
                readonly
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm cursor-pointer"
                :disabled="submitting"
              />
            </div>
            <p
              v-if="formData.start_date_time && formData.end_date_time"
              class="mt-2 text-sm font-medium text-purple-700 dark:text-purple-300"
            >
              Selected: {{ formData.start_date_time }} – {{ formData.end_date_time }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Click a start date, then an end date on the calendar.
            </p>
          </div>

          <!-- File Upload -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              Supporting Files
            </label>
            <label class="flex items-center gap-3 px-4 py-2.5 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group">
              <svg class="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                {{ supportingFileLabel }}
              </span>
              <input
                type="file"
                class="hidden"
                :disabled="submitting"
                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                @change="emit('file-change', $event)"
              />
            </label>
          </div>

          <!-- Error -->
          <div v-if="formError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p class="text-sm text-red-800 dark:text-red-200">{{ formError }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            @click="emit('close')"
            :disabled="submitting"
            class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="emit('submit')"
            :disabled="submitting"
            class="px-5 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="submitting" class="animate-spin inline-block">⟳</span>
            {{ isEditMode ? 'Save Changes' : 'Create Assessment' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
