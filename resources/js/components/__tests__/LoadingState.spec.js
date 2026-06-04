import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LoadingState from '../LoadingState.vue'

describe('LoadingState.vue', () => {
  it('renders the default loading message', () => {
    const wrapper = mount(LoadingState)

    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders a custom loading message', () => {
    const wrapper = mount(LoadingState, {
      props: {
        message: 'Loading sessions...',
      },
    })

    expect(wrapper.text()).toContain('Loading sessions...')
    expect(wrapper.text()).not.toContain('Loading...')
  })

  it('renders the animated spinner', () => {
    const wrapper = mount(LoadingState)
    const spinner = wrapper.find('.animate-spin')

    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toEqual(expect.arrayContaining([
      'inline-block',
      'animate-spin',
      'rounded-full',
      'h-12',
      'w-12',
      'border-b-2',
      'border-purple-600',
    ]))
  })

  it('keeps the expected centered loading-state layout classes', () => {
    const wrapper = mount(LoadingState)
    const message = wrapper.find('p')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'flex',
      'items-center',
      'justify-center',
      'py-12',
    ]))
    expect(message.classes()).toEqual(expect.arrayContaining([
      'mt-4',
      'text-gray-600',
      'dark:text-gray-400',
    ]))
  })
})
