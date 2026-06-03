<script setup>
import SessionButton from './SessionButton.vue'
defineProps({
  members: {
    type: Array,
    required: true,
  },
  downloadingUserId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['download-report', 'remove-member'])

/** Session membership (events_users.role): 1 = member, 2 = team lead */
const sessionMemberRoleLabel = (user) => {
  const role = user.session_member_role
  if (role === 2 || role === '2') return 'Team lead'
  return 'Member'
}

/** App user.role when session row not present (e.g. pick list) */
const userAccountRoleLabel = (user) => {
  const key = (user.role || '').toLowerCase()
  const map = { admin: 'Admin', member: 'Member', tl: 'TL', user: 'Member' }
  return map[key] || (user.role ? String(user.role) : '')
}

const roleLabelForMember = (user) => {
  if (user.session_member_role !== undefined && user.session_member_role !== null) {
    return sessionMemberRoleLabel(user)
  }
  return userAccountRoleLabel(user) || '—'
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="user in members"
      :key="user.id"
      class="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 p-6"
    >
      <!-- Header accent -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-600 to-purple-400"></div>

      <!-- Member Info -->
      <div class="mb-4">
        <div class="w-12 h-12 bg-linear-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mb-3">
          {{ user.name.charAt(0).toUpperCase() }}
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {{ user.name }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
          {{ user.email }}
        </p>
        <p class="mt-2">
          <span
            class="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:text-purple-200"
          >
            Role: {{ roleLabelForMember(user) }}
          </span>
        </p>
      </div>

      <!-- Action Buttons -->
      <div v-if="user.session_member_role != '2'" class="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 w-full">
        <!-- <button
          type="button"
          @click="emit('download-report', user)"
          :disabled="downloadingUserId === user.id"
          class="w-full mb-2 px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ downloadingUserId === user.id ? 'Downloading...' : 'Download CSV report' }}
        </button> -->

        <SessionButton variant="primary" @click="emit('download-report', user)" :disabled="downloadingUserId === user.id" >
          {{ downloadingUserId === user.id ? 'Downloading...' : 'Download CSV report' }}
        </SessionButton>
        <SessionButton variant="danger" @click="emit('remove-member', user.pivot_id)" >
          Remove Member
        </SessionButton>
      </div>
    </div>
  </div>
</template>
