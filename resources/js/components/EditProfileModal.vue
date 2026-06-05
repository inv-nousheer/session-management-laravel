<script setup>
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
})

const emit = defineEmits(['close', 'submit', 'update-field'])
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>

      <form
        class="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        @submit.prevent="emit('submit')"
      >
        <div class="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5">
          <h3 class="text-xl font-bold text-white">Edit Profile</h3>
          <p class="mt-0.5 text-sm text-purple-100">
            Update your account details below.
          </p>
        </div>

        <div class="space-y-5 px-6 py-6">
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              :value="formData.name"
              type="text"
              autocomplete="name"
              class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Your name"
              :disabled="submitting"
              @input="emit('update-field', 'name', $event.target.value)"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              :value="formData.email"
              type="email"
              autocomplete="email"
              class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              placeholder="you@example.com"
              :disabled="submitting"
              @input="emit('update-field', 'email', $event.target.value)"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
              New Password
            </label>
            <input
              :value="formData.password"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Leave blank to keep current password"
              :disabled="submitting"
              @input="emit('update-field', 'password', $event.target.value)"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 6 characters.
            </p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-gray-900 dark:text-white">
              Confirm New Password
            </label>
            <input
              :value="formData.password_confirmation"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-all placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-purple-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-500"
              placeholder="Repeat new password"
              :disabled="submitting"
              @input="emit('update-field', 'password_confirmation', $event.target.value)"
            />
          </div>

          <div
            v-if="formError"
            class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
          >
            <p class="text-sm text-red-800 dark:text-red-200">{{ formError }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-700/50">
          <button
            type="button"
            class="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            :disabled="submitting"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="submitting"
          >
            <span v-if="submitting" class="inline-block animate-spin">⟳</span>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </Teleport>
</template>
