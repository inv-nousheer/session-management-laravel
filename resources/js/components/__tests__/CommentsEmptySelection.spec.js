import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentsEmptySelection from '../CommentsEmptySelection.vue'

describe('CommentsEmptySelection.vue', () => {
  it('renders the empty selection guidance', () => {
    const wrapper = mount(CommentsEmptySelection)

    expect(wrapper.text()).toContain('Select a student to review')
    expect(wrapper.text()).toContain('Choose an assessment and student from the left panel')
  })

  it('renders the user placeholder icon', () => {
    const wrapper = mount(CommentsEmptySelection)
    const svg = wrapper.find('svg')
    const path = wrapper.find('path')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(path.attributes('stroke-width')).toBe('1.5')
    expect(path.attributes('d')).toBe('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z')
  })

  it('keeps the expected centered empty-state layout classes', () => {
    const wrapper = mount(CommentsEmptySelection)

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-slate-50',
      'rounded-xl',
      'border',
      'h-full',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'text-center',
      'dark:bg-slate-800',
    ]))
  })
})
