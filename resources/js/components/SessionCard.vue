<script setup>
import FilterPillButton from './FilterPillButton.vue'
import SessionButton from './SessionButton.vue'

defineProps({
  session: {
    type: Object,
    required: true,
  },
  currentUserId: {
    type: [Number, String],
    default: null,
  },
  downloadingReportId: {
    type: [Number, String],
    default: null,
  },
  duplicatingId: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['edit', 'view', 'download', 'duplicate'])

const formatDate = (date) => new Date(date).toLocaleDateString()
</script>

<template>
  <div class="group relative bg-gray-200 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600">
    <div class="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>

    <div class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
        {{ session.title }}
      </h3>

      <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
        {{ session.description || 'No description provided' }}
      </p>

      <div v-if="session._tags.length" class="flex flex-wrap gap-1.5 mb-4">
        <FilterPillButton
          v-for="tag in session._tags"
          :key="tag"
          variant="tag"
        >
          #{{ tag }}
        </FilterPillButton>
      </div>

      <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-5 pb-5 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ formatDate(session.date) }}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <SessionButton
          v-if="session.created_by === currentUserId"
          variant="cardPrimary"
          @click="$emit('edit', session.id)"
        >
          Edit
        </SessionButton>
       <SessionButton
          v-else
          variant="cardPrimary"
          @click="$emit('view', session.id)"
        >
          View
       </SessionButton>
        <SessionButton
          type="button"
          :disabled="downloadingReportId === session.id"
          variant="success"
          @click="$emit('download', session)"
        >
          {{ downloadingReportId === session.id ? 'Downloading...' : 'Download CSV' }}
        </SessionButton>
        <SessionButton
          type="button"
          :disabled="duplicatingId === session.id"
          variant="secondary"
          @click="$emit('duplicate', session.id)"
        >
          {{ duplicatingId === session.id ? 'Duplicating...' : 'Duplicate' }}
        </SessionButton>
      </div>
    </div>
  </div>
</template>
