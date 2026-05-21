import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UploadsPanel from '../uploadsPanel.vue'

const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
]

const mountPanel = (props = {}) => mount(UploadsPanel, {
  props: {
    selectedUsers: [],
    loading: false,
    error: false,
    ...props,
  },
})

describe('uploadsPanel.vue', () => {
  it('renders the project uploads heading and table structure', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Project Uploads')
    expect(wrapper.text()).toContain('View and manage uploaded project files.')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('Actions')
    expect(wrapper.text()).toContain('Showing 21-30 of 100')
  })

  it('renders a loading state', () => {
    const wrapper = mountPanel({ loading: true })

    expect(wrapper.text()).toContain('Loading users...')
    expect(wrapper.text()).not.toContain('No users found.')
  })

  it('renders an error state', () => {
    const wrapper = mountPanel({ error: true })

    expect(wrapper.text()).toContain('Failed to load users.')
    expect(wrapper.text()).not.toContain('No users found.')
  })

  it('renders an empty state when there are no selected users', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('No users found.')
  })

  it('renders selected users in the upload table', () => {
    const wrapper = mountPanel({ selectedUsers: users })
    const rows = wrapper.findAll('tbody tr')

    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('grace@example.com')
    expect(rows).toHaveLength(2)
  })

  it('prioritizes loading over error and empty states', () => {
    const wrapper = mountPanel({
      selectedUsers: [],
      loading: true,
      error: true,
    })

    expect(wrapper.text()).toContain('Loading users...')
    expect(wrapper.text()).not.toContain('Failed to load users.')
    expect(wrapper.text()).not.toContain('No users found.')
  })
})
