import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SessionListFilters from '../SessionListFilters.vue'

const members = [
  { id: 7, name: 'Ada Lovelace', email: 'ada@example.test' },
  { id: 8, name: 'Grace Hopper', email: 'grace@example.test' },
]

const mountFilters = (props = {}) => mount(SessionListFilters, {
  props: {
    memberSearch: '',
    members,
    filteredMembers: null,
    selectedMemberIds: [],
    tags: ['Vue', 'Laravel'],
    selectedTags: [],
    hasActiveFilters: false,
    ...props,
  },
})

describe('SessionListFilters.vue', () => {
  it('renders member and tag filter sections', () => {
    const wrapper = mountFilters()

    expect(wrapper.text()).toContain('Members')
    expect(wrapper.text()).toContain('Session includes any selected member')
    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.text()).toContain('Any selected tag matches')
    expect(wrapper.find('input').attributes('placeholder')).toBe('Search members...')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.test')
    expect(wrapper.text()).toContain('#Vue')
    expect(wrapper.text()).toContain('#Laravel')
  })

  it('emits member search updates', async () => {
    const wrapper = mountFilters()

    await wrapper.find('input').setValue('ada')

    expect(wrapper.emitted('update:memberSearch')).toEqual([['ada']])
  })

  it('emits member and tag toggle events', async () => {
    const wrapper = mountFilters()

    await wrapper.findAll('button').find((button) => button.text().includes('Ada Lovelace')).trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === '#Laravel').trigger('click')

    expect(wrapper.emitted('toggle-member')).toEqual([[members[0]]])
    expect(wrapper.emitted('toggle-tag')).toEqual([['Laravel']])
  })

  it('uses filteredMembers when provided instead of all members', () => {
    const wrapper = mountFilters({
      filteredMembers: [members[1]],
    })

    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).not.toContain('Ada Lovelace')
  })

  it('applies selected styles for selected members and case-insensitive selected tags', () => {
    const wrapper = mountFilters({
      selectedMemberIds: [7],
      selectedTags: ['vue'],
    })
    const selectedMember = wrapper.findAll('button')
      .find((button) => button.text().includes('Ada Lovelace'))
    const unselectedMember = wrapper.findAll('button')
      .find((button) => button.text().includes('Grace Hopper'))
    const selectedTag = wrapper.findAll('button')
      .find((button) => button.text() === '#Vue')
    const unselectedTag = wrapper.findAll('button')
      .find((button) => button.text() === '#Laravel')

    expect(selectedMember.classes()).toEqual(expect.arrayContaining([
      'bg-purple-600',
      'text-white',
      'border-purple-600',
    ]))
    expect(unselectedMember.classes()).toContain('bg-gray-100')
    expect(selectedTag.classes()).toEqual(expect.arrayContaining([
      'bg-indigo-600',
      'text-white',
      'border-indigo-600',
    ]))
    expect(unselectedTag.classes()).toContain('bg-indigo-50')
  })

  it('renders empty member and tag states', () => {
    const wrapper = mountFilters({
      members: [],
      tags: [],
    })

    expect(wrapper.text()).toContain('No members loaded on sessions yet. Open a session and add members, then refresh.')
    expect(wrapper.text()).toContain('No tags on any session yet.')
  })

  it('renders and emits the clear action only when filters are active', async () => {
    const inactiveWrapper = mountFilters()
    const activeWrapper = mountFilters({
      hasActiveFilters: true,
    })

    expect(inactiveWrapper.text()).not.toContain('Clear filters')

    await activeWrapper.findAll('button')
      .find((button) => button.text() === 'Clear filters')
      .trigger('click')

    expect(activeWrapper.emitted('clear')).toHaveLength(1)
  })

  it('keeps expected filter container classes', () => {
    const wrapper = mountFilters()

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'mb-6',
      'rounded-xl',
      'border',
      'border-gray-200',
      'dark:border-gray-700',
      'bg-gray-200',
      'dark:bg-gray-800/80',
      'shadow-sm',
    ]))
  })
})
