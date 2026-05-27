import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import UsersList from '../UsersList.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

const sessionGroups = [
  {
    session: {
      id: 10,
      title: 'Vue Workshop',
      date: '2026-05-01T10:00:00Z',
    },
    members: [
      {
        id: 1001,
        users_id: 8,
        role: 1,
        user: { id: 8, name: 'Ada Lovelace', email: 'ada@example.com' },
      },
      {
        id: 1002,
        users_id: 9,
        role: 2,
        user: { id: 9, name: 'Grace Hopper', email: 'grace@example.com' },
      },
    ],
  },
  {
    session: {
      id: 11,
      title: 'Laravel APIs',
      date: '2026-05-02T10:00:00Z',
    },
    members: [
      {
        id: 1003,
        users_id: 10,
        role: 1,
        user: { id: 10, name: 'Katherine Johnson', email: 'katherine@example.com' },
      },
    ],
  },
]

const assessmentsBySession = {
  10: [
    { id: 200, name: 'Final Project' },
    { id: 201, name: 'Demo Review' },
  ],
  11: [
    { id: 300, name: 'API Review' },
  ],
}

const scoresBySelection = {
  '10-200': { scores: { 1001: 88, 1002: 95 } },
  '10-201': { scores: { 1001: 91 } },
  '11-300': { scores: { 1003: 77 } },
}

const setFetchResponses = ({
  groups = sessionGroups,
  assessments = assessmentsBySession,
  scores = scoresBySelection,
} = {}) => {
  mocks.api.get.mockImplementation((url, config) => {
    if (url === '/api/sessions/user/7/as-team-lead/members') {
      return Promise.resolve({ data: groups })
    }

    const assessmentMatch = url.match(/^\/api\/sessions\/(\d+)\/assessments$/)
    if (assessmentMatch) {
      return Promise.resolve({ data: assessments[assessmentMatch[1]] || [] })
    }

    const scoreMatch = url.match(/^\/api\/sessions\/(\d+)\/assessments\/(\d+)\/member-scores$/)
    if (scoreMatch) {
      return Promise.resolve({ data: scores[`${scoreMatch[1]}-${scoreMatch[2]}`] || { scores: {} } })
    }

    const reportMatch = url.match(/^\/api\/sessions\/users\/(\d+)\/report$/)
    if (reportMatch) {
      return Promise.resolve({
        data: 'name,email\nAda Lovelace,ada@example.com',
        headers: {
          'content-disposition': 'attachment; filename="member_report.csv"',
        },
        config,
      })
    }

    return Promise.reject(new Error(`Unhandled GET ${url}`))
  })
}

const mountPanel = (user = { id: 7, role: 'tl', name: 'Team Lead' }) => {
  localStorage.setItem('user', JSON.stringify(user))

  return mount(UsersList, {
    attachTo: document.body,
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
      },
    },
  })
}

describe('usersList.vue', () => {
  let originalCreateObjectURL
  let originalRevokeObjectURL

  beforeEach(() => {
    mocks.api.get.mockReset()
    localStorage.clear()
    originalCreateObjectURL = window.URL.createObjectURL
    originalRevokeObjectURL = window.URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:member-report')
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    if (originalCreateObjectURL) window.URL.createObjectURL = originalCreateObjectURL
    else delete window.URL.createObjectURL
    if (originalRevokeObjectURL) window.URL.revokeObjectURL = originalRevokeObjectURL
    else delete window.URL.revokeObjectURL
    document.body.innerHTML = ''
  })

  it('fetches team-lead sessions, assessments, scores, and renders members', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/user/7/as-team-lead/members')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/10/assessments')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/10/assessments/200/member-scores')
    expect(wrapper.text()).toContain('Session members')
    expect(wrapper.text()).toContain('Vue Workshop')
    expect(wrapper.text()).toContain('Laravel APIs')
    expect(wrapper.text()).toContain('Final Project')
    expect(wrapper.text()).toContain('Demo Review')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')
    expect(wrapper.text()).toContain('Member')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('Team lead')
    expect(wrapper.text()).toContain('88')
    expect(wrapper.text()).toContain('95')
  })

  it('renders loading, empty, and error states', async () => {
    let resolveGroups
    mocks.api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveGroups = resolve
    }))
    const loadingWrapper = mountPanel()
    await nextTick()

    expect(loadingWrapper.text()).toContain('Loading sessions and members…')
    resolveGroups({ data: [] })
    await flushPromises()
    expect(loadingWrapper.text()).toContain('No sessions found where you are a team lead')
    loadingWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load data. Please try again.')
  })

  it('shows a warning when opened by a non-team-lead account', async () => {
    setFetchResponses()
    const wrapper = mountPanel({ id: 7, role: 'member', name: 'Member User' })
    await flushPromises()

    expect(wrapper.text()).toContain('This view is intended for team lead accounts.')
  })

  it('requires a signed-in user before loading sessions', async () => {
    localStorage.clear()
    const wrapper = mount(UsersList, {
      attachTo: document.body,
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
        },
      },
    })
    await flushPromises()

    expect(mocks.api.get).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Failed to load data. Please try again.')
  })

  it('filters the member table by selected member', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('#tl-member-filter').setValue('8')
    await nextTick()

    const tableText = wrapper.find('tbody').text()
    expect(tableText).toContain('Ada Lovelace')
    expect(tableText).not.toContain('Grace Hopper')
  })

  it('switches sessions and fetches assessments and scores for the new session', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('#tl-session-filter').setValue(11)
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/11/assessments')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/11/assessments/300/member-scores')
    expect(wrapper.text()).toContain('Katherine Johnson')
    expect(wrapper.text()).toContain('katherine@example.com')
    expect(wrapper.text()).toContain('API Review')
    expect(wrapper.text()).toContain('77')
    expect(wrapper.text()).not.toContain('Ada Lovelace')
  })

  it('switches assessments and updates displayed scores', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.find('#tl-assessment-filter').setValue(201)
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/10/assessments/201/member-scores')
    expect(wrapper.text()).toContain('91')
    expect(wrapper.text()).not.toContain('95')
  })

  it('downloads a member CSV report', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Download CSV')).trigger('click')
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/users/8/report', {
      responseType: 'blob',
    })
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:member-report')
  })
})
