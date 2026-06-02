import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import MembersPanel from '../MembersPanel.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

const sessionMembers = [
  {
    id: 1001,
    role: 1,
    uploads: [],
    user: {
      id: 7,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'user',
    },
  },
  {
    id: 1002,
    role: 2,
    uploads: [],
    user: {
      id: 8,
      name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'tl',
    },
  },
]

const availableUsers = [
  { id: 7, name: 'Ada Lovelace', email: 'ada@example.com', role: 'user' },
  { id: 8, name: 'Grace Hopper', email: 'grace@example.com', role: 'tl' },
  { id: 9, name: 'Katherine Johnson', email: 'katherine@example.com', role: 'member' },
]

const mountPanel = (props = {}) => mount(MembersPanel, {
  attachTo: document.body,
  props: {
    loading: false,
    error: false,
    users: availableUsers,
    sessionId: 42,
    ...props,
  },
})

const openAddMemberModal = async (wrapper) => {
  await wrapper.findAll('button').find((button) => button.text().includes('Add Member')).trigger('click')
  await nextTick()
}

describe('membersPanel.vue', () => {
  let originalCreateObjectURL
  let originalRevokeObjectURL

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL
    originalRevokeObjectURL = window.URL.revokeObjectURL
    window.URL.createObjectURL = vi.fn(() => 'blob:session-report')
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mocks.api.get.mockReset()
    mocks.api.post.mockReset()
    if (originalCreateObjectURL) window.URL.createObjectURL = originalCreateObjectURL
    else delete window.URL.createObjectURL
    if (originalRevokeObjectURL) window.URL.revokeObjectURL = originalRevokeObjectURL
    else delete window.URL.revokeObjectURL
    document.body.innerHTML = ''
  })

  it('fetches and renders current session members with role labels', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: sessionMembers })

    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/session/42/members')
    expect(wrapper.text()).toContain('Manage Members')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')
    expect(wrapper.text()).toContain('Role: Member')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('Role: Team lead')
    expect(wrapper.text()).toContain('2 members currently in this session.')
    expect(wrapper.findAll('button').filter((button) => button.text().includes('Download CSV report'))).toHaveLength(1)
  })

  it('renders loading, empty, and error states while fetching members', async () => {
    let resolveMembers
    mocks.api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveMembers = resolve
    }))
    const loadingWrapper = mountPanel()
    await nextTick()

    expect(loadingWrapper.text()).toContain('Loading members...')
    resolveMembers({ data: [] })
    await flushPromises()
    expect(loadingWrapper.text()).toContain('No members added yet. Click "Add Member" to get started.')
    loadingWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load members.')
  })

  it('opens the add member modal, selects a searched user, and posts selected ids', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: [sessionMembers[0]] })
      .mockResolvedValueOnce({ data: sessionMembers })
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await openAddMemberModal(wrapper)
    expect(wrapper.text()).toContain('Add Member to Session')

    const searchInput = wrapper.find('input[placeholder="Type name/email, press Enter (or paste many)"]')
    await searchInput.trigger('focus')
    await searchInput.setValue('katherine')
    await nextTick()

    expect(wrapper.text()).toContain('Katherine Johnson')
    await wrapper.findAll('button').find((button) => button.text().includes('Katherine Johnson')).trigger('click')
    await nextTick()

    await wrapper.findAll('button').find((button) => button.text().includes('Add Members')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/session/42/add-members', { user_ids: [7, 9] })
    expect(window.alert).toHaveBeenCalledWith('Members added successfully!')
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('Add Member to Session')
  })

  it('supports pasting multiple member emails into the add member search', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [] })
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()
    await openAddMemberModal(wrapper)

    const searchInput = wrapper.find('input[placeholder="Type name/email, press Enter (or paste many)"]')
    await searchInput.trigger('paste', {
      clipboardData: {
        getData: () => 'Ada Lovelace <ada@example.com>, katherine@example.com',
      },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('Katherine Johnson')

    await wrapper.findAll('button').find((button) => button.text().includes('Add Members')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/session/42/add-members', { user_ids: [7, 9] })
  })

  it('removes a member from the session', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: sessionMembers })
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Remove Member')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/session-member/delete/1001')
    expect(window.alert).toHaveBeenCalledWith('Member deleted successfully!')
    expect(wrapper.text()).toContain('1 member currently in this session.')
  })

  it('downloads a CSV report for a regular member', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: sessionMembers })
      .mockResolvedValueOnce({
        data: 'name,email\nAda Lovelace,ada@example.com',
        headers: {
          'content-disposition': 'attachment; filename="ada_report.csv"',
        },
      })
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('Download CSV report')).trigger('click')
    await flushPromises()

    expect(mocks.api.get).toHaveBeenLastCalledWith('/api/sessions/users/7/report/42', {
      responseType: 'blob',
    })
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:session-report')
  })
})
