<script setup>
import { ref, reactive } from 'vue'
import { Bar } from 'vue-chartjs'
import { Pie } from 'vue-chartjs'
import StatsCard from '../StatsCard.vue'
import DashboardTable from '../DashboardTable.vue'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  ArcElement, BarElement, CategoryScale, LinearScale
} from 'chart.js'
import { onMounted } from 'vue'

const props = defineProps({
  allData: {
    type: Boolean,
    default: false
  }
})

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)
const dashboardDetails = ref({
  total_sessions: 0,
  total_assessments: 0,
  pending_assessments: 0,
  completed_assessments: 0,
  recentSessions:[],
  recentAssessments:[]
})
const chartKey = ref(0)
const pieChartKey = ref(0)
const currentUserId = JSON.parse(localStorage.getItem('user') || 'null')?.id ?? null

const dashboardData = async () => {
  try {
    const endpoint = props.allData
      ? '/api/dashboard-data'
      : `/api/dashboard-data?user_id=${encodeURIComponent(currentUserId)}`

    if (!props.allData && !currentUserId) throw new Error('Missing current user id')

    const response = await fetch(endpoint)
    if (!response.ok) throw new Error('Failed to fetch dashboard data')

    const data = await response.json()

    // update dashboard
    dashboardDetails.value = data

    chartDatapie.datasets[0].data = [
      data.completed_assessments || 0,
      data.pending_assessments || 0
    ]
    // Force Pie chart to re-render
    chartDatapie.datasets = [
      {
        backgroundColor: ['#667eea', '#f5576c'],
        data: [data.completed_assessments || 0, data.pending_assessments || 0]
      }
    ]
    pieChartKey.value++

    const raw = data.sessions_per_month || []

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const fullData = Array(12).fill(0)

    raw.forEach(item => {
      fullData[item.month - 1] = item.count
    })

    chartData.labels = [...months]
    chartData.datasets = [{
      label: 'Sessions',
      backgroundColor: '#667eea',
      data: [...fullData]
    }]
    chartKey.value++ // Force Bar chart to re-render
    console.log(fullData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }
}

onMounted(() => {
  dashboardData()
})

const chartData = reactive({
  labels: [],
  datasets: [
    {
      label: 'Sessions',
      backgroundColor: '#667eea',
      data: []
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true }
  }
}

const chartDatapie = reactive({
  labels: ['completed', 'pending'],
  datasets: [
    {
      backgroundColor: ['#667eea', '#f5576c'],
      data: [0, 0]
    }
  ]
})

const chartOptionspie = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  }
}

const sessionColumns = [
  { label: 'Name', key: 'title', type: 'primary' },
  { label: 'Description', key: 'description' },
  { label: 'Status', key: 'status', type: 'badge', value: 'Approved' },
  { label: 'Date', key: 'date' }
]

const assessmentColumns = [
  { label: 'Name', key: 'name', type: 'primary' },
  { label: 'Description', key: 'description' },
  { label: 'Start Date', key: 'start_date_time' },
  { label: 'End Date', key: 'end_date_time' }
]
</script>

<template>
  <main class="min-h-screen overflow-y-auto bg-slate-100 dark:bg-slate-900/20">
    <div class="container px-6 py-8  max-w-8xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
          Dashboard
        </h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-gray-400">
          Overview of your session metrics
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sessions"
          :value="dashboardDetails.total_sessions"
          card-class="bg-slate-50 border-slate-300"
          decoration-class="from-purple-500/10 to-violet-500/10"
          icon-class="from-purple-500 to-violet-600"
        >
          <template #icon>
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
            </svg>
          </template>
        </StatsCard>

        <StatsCard
          title="Total Assessments"
          :value="dashboardDetails.total_assessments"
          card-class="bg-rose-50/70 border-rose-200"
          decoration-class="from-pink-500/10 to-rose-500/10"
          icon-class="from-pink-500 to-rose-600"
        >
          <template #icon>
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </StatsCard>

        <StatsCard
          title="Pending"
          :value="dashboardDetails.pending_assessments"
          card-class="bg-sky-50/70 border-sky-200"
          decoration-class="from-blue-500/10 to-cyan-500/10"
          icon-class="from-blue-500 to-cyan-600"
        >
          <template #icon>
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </StatsCard>

        <StatsCard
          title="Completed"
          :value="dashboardDetails.completed_assessments"
          card-class="bg-emerald-50/70 border-emerald-200"
          decoration-class="from-green-500/10 to-emerald-500/10"
          icon-class="from-green-500 to-emerald-600"
        >
          <template #icon>
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </StatsCard>
      </div>

      <!-- Charts Grid -->
      <div class="grid gap-6 mb-8 lg:grid-cols-3">
        <!-- Bar Chart - Takes 2 columns -->
        <div class="lg:col-span-2 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-300 dark:border-slate-700">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Sessions Overview
            </h3>
          </div>
          <div class="h-80">
            <Bar :data="chartData" :options="chartOptions" :key="chartKey" />
          </div>
        </div>

        <!-- Pie Chart - Takes 1 column -->
        <div class="bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-300 dark:border-slate-700">
          <div class="flex items-center gap-3 mb-6">
            <div class="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Distribution
            </h3>
          </div>
          <div class="h-80 flex items-center justify-center">
            <Pie :data="chartDatapie" :options="chartOptionspie" :key="pieChartKey" />
          </div>
        </div>
      </div>

      <!-- Tables Grid -->
      <div class="grid gap-6 lg:grid-cols-2">
        <DashboardTable
          title="Recent Sessions"
          :rows="dashboardDetails.recentSessions"
          :columns="sessionColumns"
          icon-class="from-purple-500 to-violet-600"
        >
          <template #icon>
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </DashboardTable>

        <DashboardTable
          title="Recent Assessments"
          :rows="dashboardDetails.recentAssessments"
          :columns="assessmentColumns"
          icon-class="from-pink-500 to-rose-600"
        >
          <template #icon>
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </DashboardTable>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* Additional custom styles for smooth animations */
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

.grid > * {
  animation: fadeIn 0.5s ease-out;
}
</style>
