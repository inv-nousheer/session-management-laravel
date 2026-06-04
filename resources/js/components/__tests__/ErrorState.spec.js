import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErrorState from '../ErrorState.vue'

describe('ErrorState.vue', () => {
  it('renders the default error message', () => {
    const wrapper = mount(ErrorState)

    expect(wrapper.text()).toContain('Something went wrong.')
  })

  it('renders a custom error message', () => {
    const wrapper = mount(ErrorState, {
      props: {
        message: 'Failed to load sessions.',
      },
    })

    expect(wrapper.text()).toContain('Failed to load sessions.')
    expect(wrapper.text()).not.toContain('Something went wrong.')
  })

  it('renders the warning icon', () => {
    const wrapper = mount(ErrorState)
    const svg = wrapper.find('svg')
    const path = wrapper.find('path')

    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(path.attributes('stroke-width')).toBe('2')
    expect(path.attributes('d')).toBe('M12 9v2m0 4v2m0 4v2M12 3a9 9 0 100 18 9 9 0 000-18z')
  })

  it('keeps the expected centered error-state layout classes', () => {
    const wrapper = mount(ErrorState)
    const iconWrap = wrapper.find('.inline-block')
    const message = wrapper.find('p')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'flex',
      'items-center',
      'justify-center',
      'py-12',
    ]))
    expect(iconWrap.classes()).toEqual(expect.arrayContaining([
      'bg-red-100',
      'dark:bg-red-900',
      'rounded-full',
    ]))
    expect(message.classes()).toEqual(expect.arrayContaining([
      'text-red-600',
      'dark:text-red-200',
    ]))
  })
})
