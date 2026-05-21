import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SessionDetail from '../session-detail.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
  },
  route: {
    params: { id: 42 },
  },
  router: {
    push: vi.fn(),
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}))

vi.mock('@/components/views/membersPanel.vue', () => ({
  default: {
    name: 'MembersPanel',
    props: ['selectedUsers', 'loading', 'error', 'users', 'sessionId'],
    template: '<div data-test="members-panel">Members Panel {{ sessionId }} {{ users.length }}</div>',
  },
}), { virtual: true })

vi.mock('@/components/views/uploadsPanel.vue', () => ({
  default: {
    name: 'UploadsPanel',
    template: '<div data-test="uploads-panel">Uploads Panel</div>',
  },
}), { virtual: true })

vi.mock('@/components/views/assessmentsPanel.vue', () => ({
  default: {
    name: 'AssessmentsPanel',
    props: ['assessments', 'activePanel', 'sessionDetails'],
    emits: ['fetchAssessments'],
    template: `
      <div data-test="assessments-panel">
        Assessments Panel {{ activePanel }} {{ assessments.length }}
        <button type="button" @click="$emit('fetchAssessments')">Refresh Assessments</button>
      </div>
    `,
  },
}), { virtual: true })

vi.mock('@/components/views/commentsPanel.vue', () => ({
  default: {
    name: 'CommentsPanel',
    emits: ['fetchAssessments'],
    template: '<div data-test="comments-panel">Instructor Comments Panel</div>',
  },
}), { virtual: true })

vi.mock('@/components/views/CommentsPanelForMembers.vue', () => ({
  default: {
    name: 'CommentsPanelForMembers',
    template: '<div data-test="member-comments-panel">Member Comments Panel</div>',
  },
}), { virtual: true })

vi.mock('@/components/views/session-settings.vue', () => ({
  default: {
    name: 'SessionSettings',
    template: '<div data-test="session-settings">Session Settings Panel</div>',
  },
}), { virtual: true })

vi.mock('@/components/views/reopenrequestsPanel.vue', () => ({
  default: {
    name: 'ReopenrequestsPanel',
    template: '<div data-test="reopen-requests-panel">Reopen Requests Panel</div>',
  },
}), { virtual: true })

const sessionDetails = (overrides = {}) => ({
  id: 42,
  title: 'Laravel Workshop',
  description: 'Build a session management app',
  created_by: 7,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-02T00:00:00Z',
  ...overrides,
})

const users = [
  { id: 7, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 8, name: 'Grace Hopper', email: 'grace@example.com' },
]

const members = [
  {
    id: 100,
    role: 1,
    uploads: [],
    user: { id: 8, name: 'Grace Hopper', email: 'grace@example.com' },
  },
]

const assessments = [
  { id: 200, name: 'Final Project' },
]

const setFetchResponses = ({
  session = sessionDetails(),
  seminarUsers = users,
  sessionMembers = members,
  sessionAssessments = assessments,
} = {}) => {
  mocks.api.get.mockImplementation((url) => {
    if (url === '/api/sessions/42') return Promise.resolve({ data: session })
    if (url === '/api/seminar-users/42') return Promise.resolve({ data: seminarUsers })
    if (url === '/api/session/42/members') return Promise.resolve({ data: sessionMembers })
    if (url === '/api/sessions-assessments/42') return Promise.resolve({ data: sessionAssessments })
    return Promise.reject(new Error(`Unhandled GET ${url}`))
  })
}

const mountPanel = (user = { id: 7, role: 'admin', name: 'Admin User' }) => {
  localStorage.setItem('user', JSON.stringify(user))

  return mount(SessionDetail, {
    attachTo: document.body,
    global: {
      stubs: {
        MembersPanel: {
          props: ['selectedUsers', 'loading', 'error', 'users', 'sessionId'],
          template: '<div data-test="members-panel">Members Panel {{ sessionId }} {{ users.length }}</div>',
        },
        UploadsPanel: {
          template: '<div data-test="uploads-panel">Uploads Panel</div>',
        },
        AssessmentsPanel: {
          props: ['assessments', 'activePanel', 'sessionDetails'],
          emits: ['fetchAssessments'],
          template: `
            <div data-test="assessments-panel">
              Assessments Panel {{ activePanel }} {{ assessments.length }}
              <button type="button" @click="$emit('fetchAssessments')">Refresh Assessments</button>
            </div>
          `,
        },
        CommentsPanel: {
          emits: ['fetchAssessments'],
          template: '<div data-test="comments-panel">Instructor Comments Panel</div>',
        },
        CommentsPanelForMembers: {
          template: '<div data-test="member-comments-panel">Member Comments Panel</div>',
        },
        SessionSettings: {
          template: '<div data-test="session-settings">Session Settings Panel</div>',
        },
        ReopenrequestsPanel: {
          template: '<div data-test="reopen-requests-panel">Reopen Requests Panel</div>',
        },
      },
    },
  })
}

describe('session-detail.vue', () => {
  beforeEach(() => {
    mocks.route.params = { id: 42 }
    mocks.router.push.mockReset()
    mocks.api.get.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('fetches session data and shows creator navigation with members active by default', async () => {
    setFetchResponses()

    const wrapper = mountPanel({ id: 7, role: 'admin', name: 'Admin User' })
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/42')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/seminar-users/42')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/session/42/members')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions-assessments/42')
    expect(wrapper.text()).toContain('Laravel Workshop')
    expect(wrapper.text()).toContain('Build a session management app')
    expect(wrapper.text()).toContain('Manage Members')
    expect(wrapper.text()).toContain('Assessments')
    expect(wrapper.text()).toContain('Comments')
    expect(wrapper.text()).toContain('Session Settings')
    expect(wrapper.text()).toContain('Assessment Reopen Requests')
    expect(wrapper.text()).not.toContain('Project Uploads')
    expect(wrapper.find('[data-test="members-panel"]').exists()).toBe(true)
  })

  it('shows member navigation and opens uploads by default for non-creators', async () => {
    setFetchResponses({
      session: sessionDetails({ created_by: 7 }),
    })

    const wrapper = mountPanel({ id: 8, role: 'user', name: 'Member User' })
    await flushPromises()

    expect(wrapper.text()).toContain('Project Uploads')
    expect(wrapper.text()).toContain('Comments')
    expect(wrapper.text()).not.toContain('Manage Members')
    expect(wrapper.text()).not.toContain('Session Settings')
    expect(wrapper.find('[data-test="assessments-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Assessments Panel uploads 1')
  })

  it('routes the back button to the correct sessions list for admin and regular users', async () => {
    setFetchResponses()
    const adminWrapper = mountPanel({ id: 7, role: 'admin', name: 'Admin User' })
    await flushPromises()

    await adminWrapper.find('button[aria-label="Back to sessions"]').trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith('/dashboard/sessions')
    adminWrapper.unmount()

    mocks.router.push.mockReset()
    setFetchResponses({
      session: sessionDetails({ created_by: 7 }),
    })
    const userWrapper = mountPanel({ id: 8, role: 'user', name: 'Member User' })
    await flushPromises()

    await userWrapper.find('button[aria-label="Back to sessions"]').trigger('click')
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/sessions')
  })

  it('switches creator tabs to assessments, comments, settings, and reopen requests panels', async () => {
    setFetchResponses()
    const wrapper = mountPanel({ id: 7, role: 'admin', name: 'Admin User' })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Assessments')).trigger('click')
    await nextTick()
    expect(wrapper.find('[data-test="assessments-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Assessments Panel assessments 1')

    await wrapper.findAll('button').find((button) => button.text().includes('Comments')).trigger('click')
    await nextTick()
    expect(wrapper.find('[data-test="comments-panel"]').exists()).toBe(true)

    await wrapper.findAll('button').find((button) => button.text().includes('Session Settings')).trigger('click')
    await nextTick()
    expect(wrapper.find('[data-test="session-settings"]').exists()).toBe(true)

    await wrapper.findAll('button').find((button) => button.text().includes('Assessment Reopen Requests')).trigger('click')
    await nextTick()
    expect(wrapper.find('[data-test="reopen-requests-panel"]').exists()).toBe(true)
  })

  it('shows the member comments panel when a non-creator opens comments', async () => {
    setFetchResponses({
      session: sessionDetails({ created_by: 7 }),
    })
    const wrapper = mountPanel({ id: 8, role: 'user', name: 'Member User' })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Comments')).trigger('click')
    await nextTick()

    expect(wrapper.find('[data-test="member-comments-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="comments-panel"]').exists()).toBe(false)
  })

  it('refreshes assessments when the assessments child emits fetchAssessments', async () => {
    setFetchResponses()
    const wrapper = mountPanel({ id: 7, role: 'admin', name: 'Admin User' })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Assessments')).trigger('click')
    await nextTick()
    await wrapper.findAll('button').find((button) => button.text().includes('Refresh Assessments')).trigger('click')
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions-assessments/42')
    expect(mocks.api.get.mock.calls.filter(([url]) => url === '/api/sessions-assessments/42')).toHaveLength(2)
  })
})
