<script setup>
defineProps({
  uploadSubmissionType: {
    type: String,
    required: true,
  },
  formData: {
    type: Object,
    required: true,
  },
  canSubmitUpload: {
    type: Boolean,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  uploadProgress: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits([
  'close',
  'submit',
  'switch-submission-type',
  'file-change',
  'update-field',
])
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

      <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg z-50 border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div class="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <h3 class="text-xl font-bold text-white">Submit Assessment</h3>
          <p class="text-purple-100 text-sm mt-0.5">Upload a ZIP file or paste a project link</p>
        </div>

        <div class="p-6 space-y-5">
          <div class="flex rounded-xl bg-gray-100 dark:bg-slate-700/60 p-1 gap-1">
            <button
              type="button"
              @click="emit('switch-submission-type', 'file')"
              :disabled="isUploading || submitting"
              :class="[
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
                uploadSubmissionType === 'file'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              File
            </button>
            <button
              type="button"
              @click="emit('switch-submission-type', 'link')"
              :disabled="isUploading || submitting"
              :class="[
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all',
                uploadSubmissionType === 'link'
                  ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link
            </button>
          </div>

          <div v-if="uploadSubmissionType === 'file'">
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">ZIP File <span class="text-red-500">*</span></label>
            <div class="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all cursor-pointer" :class="{ 'opacity-50 pointer-events-none': isUploading }">
              <input
                type="file"
                accept=".zip,.tar,.tar.gz"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                :disabled="isUploading"
                @change="emit('file-change', $event)"
              />
              <div class="text-center pointer-events-none">
                <svg class="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Drop your ZIP file here</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">or click to browse</p>
              </div>
            </div>
            <p v-if="formData.file_path && !isUploading" class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="truncate">{{ formData.file_path.name }}</span>
            </p>
          </div>

          <div v-else>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Project Link <span class="text-red-500">*</span></label>
            <input
              :value="formData.submission_link"
              type="url"
              placeholder="https://github.com/username/project or https://drive.google.com/..."
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              :disabled="submitting"
              @input="emit('update-field', 'submission_link', $event.target.value)"
            />
            <p v-if="formData.submission_link && !canSubmitUpload" class="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Enter a valid URL starting with http:// or https://
            </p>
            <p v-else-if="canSubmitUpload" class="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="truncate">{{ formData.submission_link }}</span>
            </p>
          </div>

          <!-- Upload Progress Bar -->
          <div v-if="isUploading" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading...</span>
              <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div class="bg-linear-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Notes (Optional)</label>
            <textarea
              :value="formData.notes"
              class="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none text-sm"
              rows="3"
              placeholder="Add notes about your submission..."
              :disabled="isUploading || submitting"
              @input="emit('update-field', 'notes', $event.target.value)"
            ></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button @click="emit('close')" :disabled="submitting" class="px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button @click="emit('submit')" :disabled="submitting || !canSubmitUpload" class="px-5 py-2.5 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <span v-if="submitting" class="animate-spin inline-block">⟳</span>
            Submit
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
