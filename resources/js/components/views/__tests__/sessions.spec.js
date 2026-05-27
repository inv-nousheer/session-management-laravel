import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Sessions from '../Sessions.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  router: {
    push: vi.fn(),
  },
  route: {
    path: '/user-dashboard/sessions',
    params: {},
  },
  flatpickr: vi.fn(() => ({
    destroy: vi.fn(),
  })),
}))

vi.mock('../../../services/axios', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
  useRoute: () => mocks.route,
}))

vi.mock('flatpickr', () => ({
  default: mocks.flatpickr,
}))

const baseSessions = [
  {
    id: 10,
    title: 'Vue Basics',
    description: 'Intro to Vue',
    created_by: 7,
    date: '2026-05-01T10:00:00Z',
    tags: 'frontend, vue',
    session_members: [
      {
        users_id: 8,
        user: { id: 8, name: 'Grace Hopper', email: 'grace@example.com' },
      },
    ],
  },
  {
    id: 11,
    title: 'Laravel APIs',
    description: 'Build API endpoints',
    created_by: 9,
    date: '2026-05-02T10:00:00Z',
    tags: ['backend'],
    session_members: [
      {
        users_id: 9,
        user: { id: 9, name: 'Katherine Johnson', email: 'katherine@example.com' },
      },
    ],
  },
]

const users = [
  { id: 8, name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 9, name: 'Katherine Johnson', email: 'katherine@example.com' },
]

const tags = ['frontend', 'backend', 'testing']

const setFetchResponses = ({
  sessions = baseSessions,
  usersData = users,
  tagsData = tags,
} = {}) => {
  mocks.api.get.mockImplementation((url, config) => {
    if (url === '/api/sessions/user/7') return Promise.resolve({ data: sessions })
    if (url === '/api/sessions/user/99') return Promise.resolve({ data: sessions })
    if (url === '/api/users') return Promise.resolve({ data: usersData })
    if (url === '/api/sessions/tags') return Promise.resolve({ data: tagsData })
    if (url === '/api/sessions/10/report') {
      return Promise.resolve({
        data: 'title\nVue Basics',
        headers: { 'content-disposition': 'attachment; filename="vue_report.csv"' },
        config,
      })
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`))
  })
}

const mountPanel = (user = { id: 7, role: 'user', name: 'Ada Lovelace' }) => {
  localStorage.setItem('user', JSON.stringify(user))

  return mount(Sessions, {
    attachTo: document.body,
    global: {
      mocks: {
        $router: mocks.router,
      },
    },
  })
}

const openCreateModal = async (wrapper) => {
  await wrapper.findAll('button').find((button) => button.text().includes('Add Session')).trigger('click')
  await nextTick()
  await flushPromises()
}

const chooseDate = async (wrapper, dateStr = '2026-06-01 09:15') => {
  for (let i = 0; i < 3 && mocks.flatpickr.mock.calls.length === 0; i += 1) {
    await nextTick()
    await flushPromises()
  }
  const options = mocks.flatpickr.mock.calls.at(-1)?.[1]
  if (options) {
    options.onChange([], dateStr)
  } else {
    wrapper.vm.formData.dateTime = dateStr
  }
  await nextTick()
}

describe('sessions.vue', () => {
  let originalCreateObjectURL
  let originalRevokeObjectURL

  beforeEach(() => {
    mocks.api.get.mockReset()
    mocks.api.post.mockReset()
    mocks.router.push.mockReset()
    mocks.route.path = '/user-dashboard/sessions'
    mocks.route.params = {}
    mocks.flatpickr.mockClear()
    localStorage.clear()
    originalCreateObjectURL = window.URL.createObjectURL
    originalRevokeObjectURL = window.URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:session-report')
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
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

  it('fetches and renders sessions for the current user', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/user/7')
    expect(wrapper.text()).toContain('Sessions')
    expect(wrapper.text()).toContain('Showing 2 of 2')
    expect(wrapper.text()).toContain('Vue Basics')
    expect(wrapper.text()).toContain('Intro to Vue')
    expect(wrapper.text()).toContain('#frontend')
    expect(wrapper.text()).toContain('#vue')
    expect(wrapper.text()).toContain('Laravel APIs')
    expect(wrapper.text()).toContain('#backend')
  })

  it('renders loading, empty, and error states', async () => {
    let resolveSessions
    mocks.api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveSessions = resolve
    }))
    const loadingWrapper = mountPanel()
    await nextTick()

    expect(loadingWrapper.text()).toContain('Loading sessions...')
    resolveSessions({ data: [] })
    await flushPromises()
    expect(loadingWrapper.text()).toContain('No sessions found. Create one to get started!')
    loadingWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load sessions.')
  })

  it('hides create action for admins', async () => {
    setFetchResponses()
    const wrapper = mountPanel({ id: 7, role: 'admin', name: 'Admin User' })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Add Session')
  })

  it('filters sessions by member and tag and clears filters', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Grace Hopper')).trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Showing 1 of 2')
    expect(wrapper.text()).toContain('Vue Basics')
    expect(wrapper.text()).not.toContain('Laravel APIs')

    await wrapper.findAll('button').find((button) => button.text().includes('#backend')).trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('No sessions match your filters')

    await wrapper.findAll('button').find((button) => button.text().includes('Clear filters')).trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Showing 2 of 2')
    expect(wrapper.text()).toContain('Laravel APIs')
  })

  it('opens the create modal, adds a tag and team lead, and creates a session', async () => {
    setFetchResponses()
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await openCreateModal(wrapper)
    expect(mocks.api.get).toHaveBeenCalledWith('/api/users')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/tags')
    expect(wrapper.text()).toContain('Create New Session')

    await chooseDate(wrapper)
    await wrapper.find('input[placeholder="e.g., Introduction to Web Development"]').setValue('Testing Workshop')
    await wrapper.find('textarea[placeholder="Enter session description, learning objectives, and key topics..."]').setValue('Learn component testing')
    await wrapper.find('input[placeholder="Enter a tag and press Enter"]').setValue('testing')
    await wrapper.findAll('button').find((button) => button.attributes('type') === 'button' && button.html().includes('M12 4v16m8-8H4')).trigger('click')
    await wrapper.find('input[placeholder="Search users by name or email..."]').setValue('grace@example.com')
    await wrapper.find('input[placeholder="Search users by name or email..."]').trigger('change')
    await nextTick()

    await wrapper.findAll('button').find((button) => button.text().includes('Create Session')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/sessions', {
      title: 'Testing Workshop',
      description: 'Learn component testing',
      created_by: 7,
      date: '2026-06-01T09:15:00',
      tags: ['testing'],
      teamlead_ids: [8],
    })
    expect(mocks.api.get.mock.calls.filter(([url]) => url === '/api/sessions/user/7')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Create New Session')
  })

  it('validates required fields before creating a session', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()
    await openCreateModal(wrapper)

    await wrapper.findAll('button').find((button) => button.text().includes('Create Session')).trigger('click')
    await nextTick()

    expect(mocks.api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Session name is required')
  })

  it('navigates to edit and view session detail routes', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Edit')).trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/session-detail/10')

    await wrapper.findAll('button').find((button) => button.text().includes('View')).trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/session-detail/11')
  })

  it('uses team-lead detail route when viewing sessions through a user dashboard route', async () => {
    mocks.route.path = '/user-dashboard/users/sessions/99'
    mocks.route.params = { id: 99 }
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/user/99')
    await wrapper.findAll('button').find((button) => button.text().includes('View')).trigger('click')

    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/tl-session-detail/11/99')
  })

  it('duplicates a session, refreshes the list, and opens the duplicated session', async () => {
    setFetchResponses()
    mocks.api.post.mockResolvedValueOnce({ data: { session: { id: 77 } } })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Duplicate')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/sessions/10/duplicate', { created_by: 7 })
    expect(mocks.api.get.mock.calls.filter(([url]) => url === '/api/sessions/user/7')).toHaveLength(2)
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/session-detail/77')
  })

  it('downloads a session CSV report', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Download CSV')).trigger('click')
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/10/report', { responseType: 'blob' })
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:session-report')
  })
})
