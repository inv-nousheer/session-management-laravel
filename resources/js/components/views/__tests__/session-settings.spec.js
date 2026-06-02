import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SessionSettings from '../SessionSettings.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
  route: {
    params: { id: 42 },
  },
  flatpickr: vi.fn(() => ({
    setDate: vi.fn(),
  })),
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}))

vi.mock('flatpickr', () => ({
  default: mocks.flatpickr,
}))

const session = {
  id: 42,
  title: 'Advanced Vue Workshop',
  description: 'Learn Vue testing and composition API patterns',
  date: '2026-05-10T14:30:00Z',
  tags: 'vue',
}

const users = [
  { id: 7, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 8, name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 9, name: 'Katherine Johnson', email: 'katherine@example.com' },
]

const members = [
  {
    id: 100,
    role: 2,
    user: users[1],
  },
  {
    id: 101,
    role: 1,
    user: users[2],
  },
]

const setFetchResponses = ({
  sessionData = session,
  usersData = users,
  membersData = members,
} = {}) => {
  mocks.api.get.mockImplementation((url) => {
    if (url === '/api/sessions/42') return Promise.resolve({ data: sessionData })
    if (url === '/api/users') return Promise.resolve({ data: usersData })
    if (url === '/api/session/42/members') return Promise.resolve({ data: membersData })
    return Promise.reject(new Error(`Unhandled GET ${url}`))
  })
}

const mountPanel = () => mount(SessionSettings, {
  attachTo: document.body,
})

const setField = async (wrapper, selector, value) => {
  const field = wrapper.find(selector)

  expect(field.exists()).toBe(true)
  await field.setValue(value)
}

describe('session-settings.vue', () => {
  beforeEach(() => {
    mocks.route.params = { id: 42 }
    mocks.api.get.mockReset()
    mocks.api.put.mockReset()
    mocks.flatpickr.mockClear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('fetches and renders the session, users, and existing team leads', async () => {
    setFetchResponses()

    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/sessions/42')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/users')
    expect(mocks.api.get).toHaveBeenCalledWith('/api/session/42/members')
    expect(wrapper.text()).toContain('Session Settings')
    expect(wrapper.find('input[placeholder="e.g., Advanced Java Programming"]').element.value).toBe('Advanced Vue Workshop')
    expect(wrapper.find('textarea[placeholder="Describe your session, learning objectives, and expectations..."]').element.value)
      .toBe('Learn Vue testing and composition API patterns')
    expect(wrapper.text()).toContain('#vue')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('grace@example.com')
    expect(wrapper.text()).not.toContain('No team leads selected')
  })

  it('initializes the date picker after mounting', async () => {
    vi.useFakeTimers()
    setFetchResponses()

    mountPanel()
    await flushPromises()
    vi.advanceTimersByTime(100)

    expect(mocks.flatpickr).toHaveBeenCalledWith(
      expect.any(HTMLInputElement),
      expect.objectContaining({
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
      }),
    )
    vi.useRealTimers()
  })

  it('adds and removes tags', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await setField(wrapper, 'input[placeholder="Enter a tag and press Enter"]', 'testing')
    await wrapper.findAll('button').find((button) => button.attributes('type') === 'button' && button.text().trim() === '').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('#vue')
    expect(wrapper.text()).toContain('#testing')

    const removeButtons = wrapper.findAll('button[type="button"]').filter((button) => button.html().includes('fill-rule="evenodd"'))
    await removeButtons[0].trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('#vue')
    expect(wrapper.text()).toContain('#testing')
  })

  it('selects and removes team leads from the user search', async () => {
    setFetchResponses({ membersData: [] })
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).toContain('No team leads selected')

    await setField(wrapper, 'input[placeholder="Search users by name or email..."]', 'ada@example.com')
    await wrapper.find('input[placeholder="Search users by name or email..."]').trigger('change')
    await nextTick()

    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')

    const teamLeadRemoveButton = wrapper.findAll('button[type="button"]')
      .find((button) => button.html().includes('emerald') || button.element.closest('.bg-emerald-50'))
    await teamLeadRemoveButton.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('No team leads selected')
  })

  it('updates the session with edited values and selected team leads', async () => {
    setFetchResponses({ membersData: [] })
    mocks.api.put.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await setField(wrapper, 'input[placeholder="e.g., Advanced Java Programming"]', 'Updated Vue Workshop')
    await setField(wrapper, 'textarea[placeholder="Describe your session, learning objectives, and expectations..."]', 'Updated workshop description')
    await setField(wrapper, 'input[placeholder="Click to select date and time"]', '2026-06-01 09:15')
    await setField(wrapper, 'input[placeholder="Search users by name or email..."]', 'ada@example.com')
    await wrapper.find('input[placeholder="Search users by name or email..."]').trigger('change')
    await nextTick()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mocks.api.put).toHaveBeenCalledWith('/api/sessions/42', {
      title: 'Updated Vue Workshop',
      description: 'Updated workshop description',
      date: '2026-06-01T09:15:00',
      teamlead_ids: [7],
      tags: ['vue'],
    })
    expect(wrapper.text()).toContain('Session updated successfully!')
  })

  it('validates required fields before updating', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await setField(wrapper, 'input[placeholder="e.g., Advanced Java Programming"]', '')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mocks.api.put).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Failed to update session. Please try again.')
  })

  it('resets edited fields and selected team leads to the original values', async () => {
    setFetchResponses()
    const wrapper = mountPanel()
    await flushPromises()

    await setField(wrapper, 'input[placeholder="e.g., Advanced Java Programming"]', 'Changed title')
    await setField(wrapper, 'input[placeholder="Search users by name or email..."]', 'ada@example.com')
    await wrapper.find('input[placeholder="Search users by name or email..."]').trigger('change')
    await nextTick()
    expect(wrapper.text()).toContain('Ada Lovelace')

    await wrapper.findAll('button').find((button) => button.text().includes('Reset')).trigger('click')
    await nextTick()

    expect(wrapper.find('input[placeholder="e.g., Advanced Java Programming"]').element.value).toBe('Advanced Vue Workshop')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).not.toContain('Ada Lovelace')
  })
})
