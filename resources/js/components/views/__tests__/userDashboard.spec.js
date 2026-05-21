import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import UserDashboard from '../userDashboard.vue'

const mocks = vi.hoisted(() => ({
  chartRegister: vi.fn(),
}))

vi.mock('vue-chartjs', () => ({
  Bar: {
    name: 'Bar',
    props: ['data', 'options'],
    template: '<div data-test="bar-chart">{{ data.datasets[0].data.join(",") }}</div>',
  },
  Pie: {
    name: 'Pie',
    props: ['data', 'options'],
    template: '<div data-test="pie-chart">{{ data.datasets[0].data.join(",") }}</div>',
  },
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: mocks.chartRegister,
  },
  Title: {},
  Tooltip: {},
  Legend: {},
  ArcElement: {},
  BarElement: {},
  CategoryScale: {},
  LinearScale: {},
}))

const dashboardPayload = (overrides = {}) => ({
  total_sessions: 4,
  total_assessments: 9,
  pending_assessments: 3,
  completed_assessments: 6,
  sessions_per_month: [
    { month: 1, count: 2 },
    { month: 5, count: 4 },
  ],
  recentSessions: [
    {
      id: 10,
      title: 'Vue Basics',
      description: 'Intro to Vue',
      date: '2026-05-01',
    },
  ],
  recentAssessments: [
    {
      id: 20,
      name: 'Final Project',
      description: 'Build an app',
      start_date_time: '2026-05-02',
      end_date_time: '2026-05-10',
    },
  ],
  ...overrides,
})

const mockFetch = (payload, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(payload),
  })
}

const mountDashboard = (props = {}) => mount(UserDashboard, {
  attachTo: document.body,
  props,
})

describe('userDashboard.vue', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Ada Lovelace' }))
    mocks.chartRegister.mockClear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    delete global.fetch
    document.body.innerHTML = ''
  })

  it('registers chart elements and renders default dashboard content', async () => {
    mockFetch(dashboardPayload())

    const wrapper = mountDashboard()
    await flushPromises()

    expect(mocks.chartRegister).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledWith('/api/dashboard-data?user_id=7')
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.text()).toContain('Overview of your session metrics')
    expect(wrapper.text()).toContain('Total Sessions')
    expect(wrapper.text()).toContain('Total Assessments')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).toContain('Vue Basics')
    expect(wrapper.text()).toContain('Intro to Vue')
    expect(wrapper.text()).toContain('Final Project')
    expect(wrapper.text()).toContain('Build an app')
  })

  it('updates stat cards and chart data from the dashboard response', async () => {
    mockFetch(dashboardPayload({
      total_sessions: 12,
      total_assessments: 20,
      pending_assessments: 8,
      completed_assessments: 12,
      sessions_per_month: [
        { month: 2, count: 5 },
        { month: 12, count: 7 },
      ],
    }))

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('20')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.find('[data-test="pie-chart"]').text()).toBe('12,8')
    expect(wrapper.find('[data-test="bar-chart"]').text()).toBe('0,5,0,0,0,0,0,0,0,0,0,7')
  })

  it('uses the all-data endpoint when allData is true', async () => {
    mockFetch(dashboardPayload())

    mountDashboard({ allData: true })
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith('/api/dashboard-data')
  })

  it('renders zero defaults when response fields are missing', async () => {
    mockFetch({
      recentSessions: [],
      recentAssessments: [],
      sessions_per_month: [],
    })

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.find('[data-test="pie-chart"]').text()).toBe('0,0')
    expect(wrapper.find('[data-test="bar-chart"]').text()).toBe('0,0,0,0,0,0,0,0,0,0,0,0')
    expect(wrapper.text()).toContain('Recent Sessions')
    expect(wrapper.text()).toContain('Recent Assessments')
  })

  it('logs an error when the dashboard request fails', async () => {
    mockFetch({}, false)

    const wrapper = mountDashboard()
    await flushPromises()

    expect(console.error).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error))
    expect(wrapper.text()).toContain('Total Sessions')
    expect(wrapper.find('[data-test="pie-chart"]').text()).toBe('0,0')
  })

  it('does not fetch user-specific dashboard data without a current user id', async () => {
    localStorage.clear()
    mockFetch(dashboardPayload())

    mountDashboard()
    await flushPromises()

    expect(fetch).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error))
  })
})
