import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BackButton from '../BackButton.vue'

describe('BackButton.vue', () => {
  it('renders an accessible button for returning to sessions', () => {
    const wrapper = mount(BackButton)
    const button = wrapper.find('button')

    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Back to sessions')
  })

  it('renders a decorative back arrow icon', () => {
    const wrapper = mount(BackButton)
    const svg = wrapper.find('svg')
    const path = wrapper.find('path')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(path.attributes('d')).toBe('M15 19l-7-7 7-7')
  })

  it('keeps the expected layout and theme classes', () => {
    const wrapper = mount(BackButton)
    const classes = wrapper.find('button').classes()

    expect(classes).toEqual(expect.arrayContaining([
      'inline-flex',
      'shrink-0',
      'items-center',
      'rounded-xl',
      'dark:bg-gray-800',
      'dark:hover:bg-gray-700',
    ]))
  })

  it('allows parent components to listen for native click events', async () => {
    const onClick = vi.fn()
    const wrapper = mount(BackButton, {
      attrs: {
        onClick,
      },
    })

    await wrapper.find('button').trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
