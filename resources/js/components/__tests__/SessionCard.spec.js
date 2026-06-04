import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SessionCard from '../SessionCard.vue'

const session = {
  id: 42,
  title: 'Intro to Web Development',
  description: 'Build your first full-stack project',
  date: '2026-06-10T12:00:00',
  created_by: 7,
  _tags: ['vue', 'laravel'],
}

const mountCard = (props = {}) => mount(SessionCard, {
  props: {
    session,
    currentUserId: 7,
    downloadingReportId: null,
    duplicatingId: null,
    ...props,
  },
})

describe('SessionCard.vue', () => {
  it('renders session title, description, date, and tags', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Intro to Web Development')
    expect(wrapper.text()).toContain('Build your first full-stack project')
    expect(wrapper.text()).toContain(new Date(session.date).toLocaleDateString())
    expect(wrapper.text()).toContain('#vue')
    expect(wrapper.text()).toContain('#laravel')
  })

  it('renders a fallback description and no tag pills when data is missing', () => {
    const wrapper = mountCard({
      session: {
        ...session,
        description: '',
        _tags: [],
      },
    })

    expect(wrapper.text()).toContain('No description provided')
    expect(wrapper.text()).not.toContain('#vue')
  })

  it('shows Edit for sessions created by the current user and emits edit', async () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Edit')
    expect(wrapper.text()).not.toContain('View')

    await wrapper.findAll('button').find((button) => button.text() === 'Edit').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([[42]])
  })

  it('shows View for sessions not created by the current user and emits view', async () => {
    const wrapper = mountCard({
      currentUserId: 99,
    })

    expect(wrapper.text()).toContain('View')
    expect(wrapper.text()).not.toContain('Edit')

    await wrapper.findAll('button').find((button) => button.text() === 'View').trigger('click')

    expect(wrapper.emitted('view')).toEqual([[42]])
  })

  it('emits download and duplicate actions', async () => {
    const wrapper = mountCard()

    await wrapper.findAll('button').find((button) => button.text() === 'Download CSV').trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Duplicate').trigger('click')

    expect(wrapper.emitted('download')).toEqual([[session]])
    expect(wrapper.emitted('duplicate')).toEqual([[42]])
  })

  it('renders busy states for download and duplicate actions', () => {
    const wrapper = mountCard({
      downloadingReportId: 42,
      duplicatingId: 42,
    })
    const downloadButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Downloading...')
    const duplicateButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Duplicating...')

    expect(downloadButton.attributes('disabled')).toBeDefined()
    expect(duplicateButton.attributes('disabled')).toBeDefined()
  })

  it('keeps expected card and child button styling classes', () => {
    const wrapper = mountCard()
    const editButton = wrapper.findAll('button').find((button) => button.text() === 'Edit')
    const downloadButton = wrapper.findAll('button').find((button) => button.text() === 'Download CSV')
    const duplicateButton = wrapper.findAll('button').find((button) => button.text() === 'Duplicate')
    const tagButton = wrapper.findAll('button').find((button) => button.text() === '#vue')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'group',
      'relative',
      'bg-gray-200',
      'dark:bg-gray-800',
      'rounded-xl',
      'shadow-md',
      'hover:shadow-xl',
    ]))
    expect(editButton.classes()).toContain('flex-1')
    expect(downloadButton.classes()).toContain('bg-emerald-600')
    expect(duplicateButton.classes()).toContain('bg-gray-100')
    expect(tagButton.classes()).toEqual(expect.arrayContaining([
      'bg-indigo-50',
      'text-indigo-800',
      'rounded-full',
    ]))
  })
})
