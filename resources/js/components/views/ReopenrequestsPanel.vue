<script setup>
import api from '../../services/axios.js'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const userId = JSON.parse(localStorage.getItem('user'))?.id

const loading = ref(false)
const error = ref(false)
const reopenRequests = ref([])

const isSessionCreator = computed(() => {
  const first = reopenRequests.value?.[0]
  return !!first?.session_member?.session?.created_by && first.session_member.session.created_by === userId
})

const fetchReopenRequests = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/api/sessions/${route.params.id}/reopen-requests`)
    reopenRequests.value = res.data
  } catch (e) {
    error.value = true
    console.error('Failed to fetch reopen requests', e)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (requestId, status) => {
  try {
    await api.patch(`/api/reopen-requests/${requestId}`, { status })
    await fetchReopenRequests()
  } catch (e) {
    console.error('Failed to update reopen request status', e)
    alert('Failed to update request')
  }
}

const statusLabel = (s) => {
  if (s === 1) return 'Approved'
  if (s === 2) return 'Rejected'
  return 'Pending'
}

onMounted(() => {
  fetchReopenRequests()
})
</script>
<template>
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Reopen Requests</h2>
  </div>

  <div class="w-full overflow-hidden rounded-lg shadow-xs">
    <div class="w-full overflow-x-auto">
      <table class="w-full whitespace-no-wrap">
        <thead>
          <tr
            class="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b dark:border-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
          >
            <th class="px-4 py-3">Student</th>
            <th class="px-4 py-3">Assessment</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Requested at</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y dark:divide-gray-700 dark:bg-gray-800">
          <tr v-if="loading">
            <td colspan="5" class="px-4 py-3 text-center">Loading reopen requests...</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="5" class="px-4 py-3 text-center text-red-600">Failed to load reopen requests.</td>
          </tr>
          <tr v-else-if="reopenRequests.length === 0">
            <td colspan="5" class="px-4 py-3 text-center">No reopen requests found.</td>
          </tr>
          <tr
            v-else
            v-for="req in reopenRequests"
            :key="req.id"
            class="text-gray-700 dark:text-gray-400"
          >
            <td class="px-4 py-3 text-sm">
              {{ req.session_member?.user?.name || '—' }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ req.assessmemnt?.name || '—' }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ statusLabel(req.status) }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ req.created_at }}
            </td>
            <td class="px-4 py-3 text-sm">
              <div v-if="isSessionCreator" class="flex gap-2">
                <button
                  v-if="req.status === 0"
                  @click="updateStatus(req.id, 1)"
                  class="px-3 py-1 text-xs font-medium leading-5 text-white transition-colors duration-150 bg-green-600 border border-transparent rounded-lg active:bg-green-600 hover:bg-green-700 focus:outline-none focus:shadow-outline-purple"
                >
                  Approve
                </button>
                <button
                  v-if="req.status === 0"
                  @click="updateStatus(req.id, 2)"
                  class="px-3 py-1 text-xs font-medium leading-5 text-white transition-colors duration-150 bg-red-600 border border-transparent rounded-lg active:bg-red-600 hover:bg-red-700 focus:outline-none focus:shadow-outline-purple"
                >
                  Reject
                </button>
                <span v-if="req.status !== 0" class="text-xs text-gray-500">—</span>
              </div>
              <span v-else class="text-xs text-gray-500">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
