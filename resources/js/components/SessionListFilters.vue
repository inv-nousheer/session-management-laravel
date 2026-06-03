<script setup>
import FilterPillButton from './FilterPillButton.vue'

const props = defineProps({
  memberSearch: {
    type: String,
    default: '',
  },
  members: {
    type: Array,
    default: () => [],
  },
  filteredMembers: {
    type: Array,
    default: null,
  },
  selectedMemberIds: {
    type: Array,
    default: () => [],
  },
  tags: {
    type: Array,
    default: () => [],
  },
  selectedTags: {
    type: Array,
    default: () => [],
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:memberSearch', 'toggle-member', 'toggle-tag', 'clear'])

const isMemberSelected = (id) => props.selectedMemberIds.includes(id)

const isTagSelected = (tag) =>
  props.selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase())
</script>

<template>
  <div class="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/80 p-4 sm:p-5 shadow-sm">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="flex-1 min-w-0 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Members</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">Session includes any selected member</span>
        </div>
        <input
          :value="memberSearch"
          type="text"
          placeholder="Search members..."
          class="w-full max-w-md px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          @input="emit('update:memberSearch', $event.target.value)"
        />
        <div
          v-if="members.length === 0"
          class="text-xs text-gray-500 dark:text-gray-400 italic"
        >
          No members loaded on sessions yet. Open a session and add members, then refresh.
        </div>
        <div v-else class="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
          <FilterPillButton
            v-for="member in filteredMembers || members"
            :key="member.id"
            :selected="isMemberSelected(member.id)"
            @click="emit('toggle-member', member)"
          >
            <span>{{ member.name }}</span>
            <span v-if="member.email" class="opacity-80 font-normal truncate max-w-[140px]">{{ member.email }}</span>
          </FilterPillButton>
        </div>
      </div>

      <div class="flex-1 min-w-0 space-y-3 sm:border-l sm:border-gray-200 sm:dark:border-gray-700 sm:pl-5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">Tags</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">Any selected tag matches</span>
        </div>
        <div v-if="tags.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic">
          No tags on any session yet.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <FilterPillButton
            v-for="tag in tags"
            :key="tag"
            variant="tag"
            :selected="isTagSelected(tag)"
            @click="emit('toggle-tag', tag)"
          >
            #{{ tag }}
          </FilterPillButton>
        </div>
      </div>
    </div>

    <div v-if="hasActiveFilters" class="mt-4 flex justify-end">
      <button
        type="button"
        class="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
        @click="emit('clear')"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
