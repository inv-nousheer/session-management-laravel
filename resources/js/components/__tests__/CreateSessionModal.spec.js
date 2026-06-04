import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CreateSessionModal from '../CreateSessionModal.vue'

const mocks = vi.hoisted(() => ({
  picker: {
    destroy: vi.fn(),
  },
  flatpickr: vi.fn(),
}))

vi.mock('flatpickr', () => ({
  default: mocks.flatpickr,
}))

enableAutoUnmount(afterEach)

const baseFormData = {
  name: 'Intro to Vue',
  dateTime: '2026-06-10 14:30',
  description: 'Learn Vue fundamentals',
  tags: ['frontend', 'vue'],
}

const users = [
  { id: 7, name: 'Ada Lovelace', email: 'ada@example.test' },
  { id: 8, name: 'Grace Hopper', email: 'grace@example.test' },
]

const mountModal = (props = {}) => mount(CreateSessionModal, {
  attachTo: document.body,
  props: {
    formData: { ...baseFormData },
    tagInput: '',
    tagSuggestions: [],
    existingTagsLoading: false,
    existingTagsError: null,
    teamLeadSearch: '',
    selectedTeamLeads: [],
    filteredUsers: users,
    usersLoading: false,
    usersError: null,
    formError: '',
    submitting: false,
    ...props,
  },
})

const waitForDatePicker = async () => {
  await nextTick()
  await flushPromises()
  await vi.waitFor(() => {
    expect(mocks.flatpickr).toHaveBeenCalled()
  })
}

const findButton = (wrapper, text) => {
  const button = wrapper.findAll('button')
    .find((candidate) => candidate.text().includes(text))

  expect(button).toBeTruthy()

  return button
}

describe('CreateSessionModal.vue', () => {
  afterEach(() => {
    mocks.flatpickr.mockReset()
    mocks.picker.destroy.mockReset()
    document.body.innerHTML = ''
  })

  it('renders the session form with existing values, tags, team leads, and errors', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      selectedTeamLeads: [users[0]],
      formError: 'Session name is required',
    })
    await waitForDatePicker()

    expect(wrapper.attributes('role')).toBe('dialog')
    expect(wrapper.attributes('aria-modal')).toBe('true')
    expect(wrapper.text()).toContain('Create New Session')
    expect(wrapper.text()).toContain('Set up a new session with details and tags')
    expect(wrapper.find('input[placeholder="e.g., Introduction to Web Development"]').element.value).toBe('Intro to Vue')
    expect(wrapper.find('textarea').element.value).toBe('Learn Vue fundamentals')
    expect(wrapper.text()).toContain('#frontend')
    expect(wrapper.text()).toContain('#vue')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('(ada@example.test)')
    expect(wrapper.text()).toContain('Session name is required')
  })

  it('initializes flatpickr and emits date updates from the picker', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal()
    await waitForDatePicker()

    expect(mocks.flatpickr).toHaveBeenCalled()
    const [input, options] = mocks.flatpickr.mock.calls.at(-1)

    expect(input).toBe(wrapper.find('input[placeholder="Click to select date and time"]').element)
    expect(options.enableTime).toBe(true)
    expect(options.dateFormat).toBe('Y-m-d H:i')
    expect(options.time_24hr).toBe(true)
    expect(options.minDate).toBe('today')
    expect(options.defaultDate).toBe('2026-06-10 14:30')

    options.onChange([], '2026-06-12 09:15')

    expect(wrapper.emitted('update-field')).toEqual([['dateTime', '2026-06-12 09:15']])
  })

  it('emits parent-managed field updates, close, and submit actions', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal()
    await waitForDatePicker()

    await wrapper.find('input[placeholder="e.g., Introduction to Web Development"]').setValue('Advanced Laravel')
    await wrapper.find('textarea').setValue('Build a production-ready app')
    await wrapper.find('.bg-black\\/50').trigger('click')
    await findButton(wrapper, 'Cancel').trigger('click')
    await findButton(wrapper, 'Create Session').trigger('click')

    expect(wrapper.emitted('update-field')).toEqual([
      ['name', 'Advanced Laravel'],
      ['description', 'Build a production-ready app'],
    ])
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('emits tag input, add, suggestion, and remove events', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      tagInput: 'backend',
      tagSuggestions: ['laravel', 'php'],
    })
    await waitForDatePicker()

    const tagInput = wrapper.find('input[placeholder="Enter a tag and press Enter"]')
    await tagInput.setValue('api')
    await tagInput.trigger('keydown.enter')
    await wrapper.findAll('button')
      .find((button) => button.text() === '')
      .trigger('click')
    await findButton(wrapper, '#laravel').trigger('click')
    await wrapper.findAll('button')
      .filter((button) => button.text() === '')
      .at(1)
      .trigger('click')

    expect(wrapper.text()).toContain('Suggestions')
    expect(wrapper.emitted('update:tagInput')).toEqual([['api']])
    expect(wrapper.emitted('add-tag')).toHaveLength(2)
    expect(wrapper.emitted('add-tag-suggestion')).toEqual([['laravel']])
    expect(wrapper.emitted('remove-tag')).toEqual([[0]])
  })

  it('renders tag loading and error states', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const loadingWrapper = mountModal({
      existingTagsLoading: true,
    })
    await waitForDatePicker()

    expect(loadingWrapper.text()).toContain('Loading existing tags...')
    loadingWrapper.unmount()

    mocks.flatpickr.mockReturnValue(mocks.picker)
    const errorWrapper = mountModal({
      formData: { ...baseFormData, tags: [] },
      tagInput: 'missing',
      existingTagsError: 'Network error',
    })
    await waitForDatePicker()

    expect(errorWrapper.text()).toContain('Unable to load existing tags.')
    expect(errorWrapper.text()).toContain('No tags added yet')
  })

  it('emits team lead search, add, and remove events', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      selectedTeamLeads: [users[0]],
      teamLeadSearch: 'grace@example.test',
    })
    await waitForDatePicker()

    const teamLeadInput = wrapper.find('input[placeholder="Search users by name or email..."]')
    await teamLeadInput.setValue('grace')
    await teamLeadInput.trigger('change')
    await teamLeadInput.trigger('keydown.enter')
    await wrapper.findAll('button')
      .filter((button) => button.text() === '')
      .at(-1)
      .trigger('click')

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(2)
    expect(options[0].attributes('value')).toBe('ada@example.test')
    expect(options[0].attributes('label')).toBe('Ada Lovelace')
    expect(wrapper.emitted('update:teamLeadSearch')).toEqual([['grace']])
    expect(wrapper.emitted('add-team-lead-search')).toHaveLength(3)
    expect(wrapper.emitted('remove-team-lead')).toEqual([[7]])
  })

  it('renders team lead loading, error, and empty selected states', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const loadingWrapper = mountModal({
      formData: { ...baseFormData, tags: [] },
      usersLoading: true,
    })
    await waitForDatePicker()

    expect(loadingWrapper.text()).toContain('No team leads selected')
    expect(loadingWrapper.text()).toContain('Loading users...')
    loadingWrapper.unmount()

    mocks.flatpickr.mockReturnValue(mocks.picker)
    const errorWrapper = mountModal({
      usersError: 'Network error',
    })
    await waitForDatePicker()

    expect(errorWrapper.text()).toContain('Failed to load users.')
  })

  it('disables controls while submitting and destroys flatpickr on unmount', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      submitting: true,
      tagInput: 'backend',
      selectedTeamLeads: [users[0]],
    })
    await waitForDatePicker()

    expect(wrapper.find('input[placeholder="e.g., Introduction to Web Development"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[placeholder="Click to select date and time"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[placeholder="Enter a tag and press Enter"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[placeholder="Search users by name or email..."]').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'Creating...').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'Cancel').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('⟳')

    const destroyCount = mocks.picker.destroy.mock.calls.length
    wrapper.unmount()

    expect(mocks.picker.destroy).toHaveBeenCalledTimes(destroyCount + 1)
  })
})
