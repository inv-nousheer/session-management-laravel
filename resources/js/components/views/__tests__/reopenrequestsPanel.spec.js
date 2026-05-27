import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ReopenRequestsPanel from '../ReopenrequestsPanel.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
  route: {
    params: { id: 42 },
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}))

const buildRequest = (overrides = {}) => ({
  id: 100,
  status: 0,
  created_at: '2026-05-01 10:00:00',
  assessmemnt: {
    name: 'Final Project',
  },
  session_member: {
    user: {
      name: 'Ada Lovelace',
    },
    session: {
      created_by: 7,
    },
  },
  ...overrides,
})

const mountPanel = () => mount(ReopenRequestsPanel, {
  attachTo: document.body,
})

describe('reopenrequestsPanel.vue', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Instructor' }))
    mocks.route.params = { id: 42 }
    mocks.api.get.mockReset()
    mocks.api.patch.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('fetches and renders reopen requests with status labels', async () => {
    mocks.api.get.mockResolvedValueOnce({
      data: [
        buildRequest(),
        buildRequest({
          id: 101,
          status: 1,
          created_at: '2026-05-02 10:00:00',
          assessmemnt: { name: 'Demo Review' },
          session_member: {
            user: { name: 'Grace Hopper' },
            session: { created_by: 7 },
          },
        }),
        buildRequest({
          id: 102,
          status: 2,
          created_at: '2026-05-03 10:00:00',
          assessmemnt: { name: 'Code Review' },
          session_member: {
            user: { name: 'Katherine Johnson' },
            session: { created_by: 7 },
          },
        }),
      ],
    })

    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/42/reopen-requests')
    expect(wrapper.text()).toContain('Reopen Requests')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('Final Project')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('Demo Review')
    expect(wrapper.text()).toContain('Approved')
    expect(wrapper.text()).toContain('Katherine Johnson')
    expect(wrapper.text()).toContain('Code Review')
    expect(wrapper.text()).toContain('Rejected')
  })

  it('renders loading, empty, and error states', async () => {
    let resolveRequests
    mocks.api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveRequests = resolve
    }))
    const loadingWrapper = mountPanel()
    await nextTick()

    expect(loadingWrapper.text()).toContain('Loading reopen requests...')
    resolveRequests({ data: [] })
    await flushPromises()
    expect(loadingWrapper.text()).toContain('No reopen requests found.')
    loadingWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load reopen requests.')
  })

  it('shows approve and reject actions only to the session creator for pending requests', async () => {
    mocks.api.get.mockResolvedValueOnce({
      data: [
        buildRequest({ status: 0 }),
        buildRequest({ id: 101, status: 1 }),
      ],
    })
    const creatorWrapper = mountPanel()
    await flushPromises()

    expect(creatorWrapper.text()).toContain('Approve')
    expect(creatorWrapper.text()).toContain('Reject')
    expect(creatorWrapper.findAll('button').filter((button) => button.text().includes('Approve'))).toHaveLength(1)
    creatorWrapper.unmount()

    localStorage.setItem('user', JSON.stringify({ id: 99, name: 'Other User' }))
    mocks.api.get.mockResolvedValueOnce({
      data: [buildRequest({ status: 0 })],
    })
    const nonCreatorWrapper = mountPanel()
    await flushPromises()

    expect(nonCreatorWrapper.text()).not.toContain('Approve')
    expect(nonCreatorWrapper.text()).not.toContain('Reject')
  })

  it('approves a pending request and refreshes the list', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: [buildRequest({ id: 100, status: 0 })] })
      .mockResolvedValueOnce({ data: [buildRequest({ id: 100, status: 1 })] })
    mocks.api.patch.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Approve')).trigger('click')
    await flushPromises()

    expect(mocks.api.patch).toHaveBeenCalledWith('/api/reopen-requests/100', { status: 1 })
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Approved')
    expect(wrapper.findAll('button').filter((button) => button.text().includes('Approve'))).toHaveLength(0)
  })

  it('rejects a pending request and alerts when the update fails', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [buildRequest({ id: 100, status: 0 })] })
    mocks.api.patch.mockRejectedValueOnce(new Error('Update failed'))
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Reject')).trigger('click')
    await flushPromises()

    expect(mocks.api.patch).toHaveBeenCalledWith('/api/reopen-requests/100', { status: 2 })
    expect(window.alert).toHaveBeenCalledWith('Failed to update request')
    expect(mocks.api.get).toHaveBeenCalledTimes(1)
  })
})
