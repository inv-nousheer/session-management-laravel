<script setup>
defineProps({
  selectedUsers: {
    type: Array,
    required: true,
  },
  filteredUsers: {
    type: Array,
    required: true,
  },
  searchTerm: {
    type: String,
    required: true,
  },
  showUserSuggestions: {
    type: Boolean,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'close',
  'submit',
  'remove-draft-user',
  'add-selected-user',
  'update:searchTerm',
  'update:showUserSuggestions',
  'search-blur',
  'search-keydown',
  'search-paste',
])

const selectUser = (user) => {
  emit('add-selected-user', user)
  emit('update:searchTerm', '')
  emit('update:showUserSuggestions', true)
}
</script>

<template>
  <div class="fixed inset-0 z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-black/50 transition-opacity z-40" @click="emit('close')"></div>
    <!-- Modal content container -->
    <div class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-lg border border-gray-200 dark:border-gray-700"
      >
        <!-- Modal Header -->
        <div class="bg-linear-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-white" id="modal-title">
            Add Member to Session
          </h3>
          <button @click="emit('close')" class="text-white/80 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-6 space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Search Members
            </label>
            <div class="relative">
              <div
                class="w-full min-h-[48px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all flex flex-wrap items-center gap-2"
              >
                <span
                  v-for="user in selectedUsers"
                  :key="user.id"
                  class="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-2.5 py-1 text-xs font-medium"
                >
                  <span class="truncate max-w-[180px]">{{ user.name }}</span>
                  <button
                    type="button"
                    @click="emit('remove-draft-user', user.id)"
                    class="rounded-full hover:bg-purple-200/70 dark:hover:bg-purple-800/60 p-0.5"
                    :disabled="submitting"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>

                <input
                  :value="searchTerm"
                  type="text"
                  placeholder="Type name/email, press Enter (or paste many)"
                  class="flex-1 min-w-[180px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                  :disabled="submitting"
                  @input="emit('update:searchTerm', $event.target.value)"
                  @focus="emit('update:showUserSuggestions', true)"
                  @blur="emit('search-blur')"
                  @keydown="emit('search-keydown', $event)"
                  @paste="emit('search-paste', $event)"
                />
              </div>

              <!-- Suggestion tooltip -->
              <div
                v-if="showUserSuggestions && searchTerm.trim()"
                class="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
              >
                <button
                  v-for="user in filteredUsers"
                  :key="user.id"
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @mousedown.prevent
                  @click="selectUser(user)"
                >
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ user.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.email }}</p>
                </button>
                <p
                  v-if="filteredUsers.length === 0"
                  class="px-3 py-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  No users match your search.
                </p>
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tip: paste multiple names/emails separated by comma or new line.
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200 dark:border-gray-700">
          <button
            @click="emit('close')"
            :disabled="submitting"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          <button
            @click="emit('submit')"
            :disabled="submitting || selectedUsers.length === 0"
            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            {{ submitting ? 'Adding...' : 'Add Members' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
