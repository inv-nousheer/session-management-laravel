import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptySessionsState from '../EmptySessionsState.vue'

describe('EmptySessionsState.vue', () => {
  it('renders the default empty sessions message', () => {
    const wrapper = mount(EmptySessionsState)

    expect(wrapper.text()).toContain('No sessions found. Create one to get started!')
  })

  it('renders a custom empty state message', () => {
    const wrapper = mount(EmptySessionsState, {
      props: {
        message: 'No members found for this session.',
      },
    })

    expect(wrapper.text()).toContain('No members found for this session.')
    expect(wrapper.text()).not.toContain('No sessions found. Create one to get started!')
  })

  it('renders the empty box icon', () => {
    const wrapper = mount(EmptySessionsState)
    const svg = wrapper.find('svg')
    const path = wrapper.find('path')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(path.attributes('stroke-width')).toBe('2')
    expect(path.attributes('d')).toBe('M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4')
  })

  it('keeps the expected centered empty-state layout classes', () => {
    const wrapper = mount(EmptySessionsState)
    const iconWrap = wrapper.find('.inline-block')
    const message = wrapper.find('p')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'flex',
      'items-center',
      'justify-center',
      'py-12',
    ]))
    expect(iconWrap.classes()).toEqual(expect.arrayContaining([
      'bg-gray-100',
      'dark:bg-gray-700',
      'rounded-full',
    ]))
    expect(message.classes()).toEqual(expect.arrayContaining([
      'text-gray-600',
      'dark:text-gray-400',
    ]))
  })
})
