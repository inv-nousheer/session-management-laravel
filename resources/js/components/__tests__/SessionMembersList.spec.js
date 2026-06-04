import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SessionMembersList from '../SessionMembersList.vue'

const members = [
  {
    id: 7,
    pivot_id: 501,
    name: 'Ada Lovelace',
    email: 'ada@example.test',
    session_member_role: 1,
  },
  {
    id: 8,
    pivot_id: 502,
    name: 'Grace Hopper',
    email: 'grace@example.test',
    session_member_role: 2,
  },
]

const mountList = (props = {}) => mount(SessionMembersList, {
  props: {
    members,
    downloadingUserId: null,
    ...props,
  },
})

describe('SessionMembersList.vue', () => {
  it('renders member cards with initials, names, emails, and session role labels', () => {
    const wrapper = mountList()

    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.test')
    expect(wrapper.text()).toContain('Role: Member')
    expect(wrapper.text()).toContain('G')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('grace@example.test')
    expect(wrapper.text()).toContain('Role: Team lead')
  })

  it('maps app account roles when session member role is not present', () => {
    const wrapper = mountList({
      members: [
        { id: 1, pivot_id: 101, name: 'Admin User', email: 'admin@example.test', role: 'admin' },
        { id: 2, pivot_id: 102, name: 'Lead User', email: 'lead@example.test', role: 'tl' },
        { id: 3, pivot_id: 103, name: 'Mystery User', email: 'mystery@example.test', role: '' },
      ],
    })

    expect(wrapper.text()).toContain('Role: Admin')
    expect(wrapper.text()).toContain('Role: TL')
    expect(wrapper.text()).toContain('Role: —')
  })

  it('renders action buttons for regular members and emits actions', async () => {
    const wrapper = mountList()

    await wrapper.findAll('button')
      .find((button) => button.text() === 'Download CSV report')
      .trigger('click')
    await wrapper.findAll('button')
      .find((button) => button.text() === 'Remove Member')
      .trigger('click')

    expect(wrapper.emitted('download-report')).toEqual([[members[0]]])
    expect(wrapper.emitted('remove-member')).toEqual([[501]])
  })

  it('does not render action buttons for team leads', () => {
    const wrapper = mountList()
    const teamLeadCard = wrapper.findAll('.group')
      .find((card) => card.text().includes('Grace Hopper'))

    expect(teamLeadCard.text()).toContain('Role: Team lead')
    expect(teamLeadCard.text()).not.toContain('Download CSV report')
    expect(teamLeadCard.text()).not.toContain('Remove Member')
  })

  it('disables the active download button while a report is downloading', () => {
    const wrapper = mountList({
      downloadingUserId: 7,
    })
    const downloadButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Downloading...')

    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.attributes('disabled')).toBeDefined()
  })

  it('renders an empty grid when there are no members', () => {
    const wrapper = mountList({
      members: [],
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'gap-4',
    ]))
    expect(wrapper.findAll('.group')).toHaveLength(0)
  })

  it('keeps expected card and action button styling classes', () => {
    const wrapper = mountList()
    const card = wrapper.find('.group')
    const downloadButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Download CSV report')
    const removeButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Remove Member')

    expect(card.classes()).toEqual(expect.arrayContaining([
      'relative',
      'bg-white',
      'dark:bg-gray-800',
      'rounded-xl',
      'shadow-md',
      'hover:shadow-lg',
      'p-6',
    ]))
    expect(downloadButton.classes()).toEqual(expect.arrayContaining([
      'from-purple-600',
      'to-indigo-600',
      'text-white',
    ]))
    expect(removeButton.classes()).toEqual(expect.arrayContaining([
      'from-red-500',
      'to-red-700',
      'text-white',
    ]))
  })
})
