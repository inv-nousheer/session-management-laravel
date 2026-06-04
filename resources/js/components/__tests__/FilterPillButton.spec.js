import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FilterPillButton from '../FilterPillButton.vue'

const mountPill = (props = {}, slots = { default: 'All Members' }) => mount(FilterPillButton, {
  props,
  slots,
})

describe('FilterPillButton.vue', () => {
  it('renders as a button by default with slot content', () => {
    const wrapper = mountPill()

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('All Members')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'px-3',
      'py-1.5',
      'rounded-full',
      'text-xs',
      'font-medium',
      'border',
      'transition-colors',
    ]))
  })

  it('renders the selected member variant classes', () => {
    const wrapper = mountPill({
      selected: true,
      variant: 'member',
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'inline-flex',
      'items-center',
      'gap-1.5',
      'bg-purple-600',
      'text-white',
      'border-purple-600',
    ]))
  })

  it('renders the unselected member variant classes', () => {
    const wrapper = mountPill({
      selected: false,
      variant: 'member',
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'inline-flex',
      'items-center',
      'gap-1.5',
      'bg-gray-100',
      'dark:bg-gray-700',
      'text-gray-700',
      'dark:text-gray-200',
      'hover:border-purple-400',
    ]))
  })

  it('renders tag variant selected and unselected styles', () => {
    const selectedWrapper = mountPill({
      selected: true,
      variant: 'tag',
    }, { default: '#vue' })
    const unselectedWrapper = mountPill({
      selected: false,
      variant: 'tag',
    }, { default: '#laravel' })

    expect(selectedWrapper.text()).toBe('#vue')
    expect(selectedWrapper.classes()).toEqual(expect.arrayContaining([
      'bg-indigo-600',
      'text-white',
      'border-indigo-600',
    ]))
    expect(unselectedWrapper.text()).toBe('#laravel')
    expect(unselectedWrapper.classes()).toEqual(expect.arrayContaining([
      'bg-indigo-50',
      'dark:bg-indigo-900/30',
      'text-indigo-800',
      'dark:text-indigo-200',
      'border-indigo-200',
      'hover:border-indigo-400',
    ]))
  })

  it('renders card tags as a non-interactive span without button type', () => {
    const wrapper = mountPill({
      as: 'span',
      variant: 'cardTag',
    }, { default: '#frontend' })

    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.attributes('type')).toBeUndefined()
    expect(wrapper.text()).toBe('#frontend')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'inline-block',
      'px-2',
      'py-0.5',
      'rounded-md',
      'bg-indigo-50',
      'dark:bg-indigo-900/40',
      'text-indigo-700',
      'dark:text-indigo-300',
      'border-transparent',
    ]))
  })

  it('allows parent components to listen for native click events', async () => {
    const onClick = vi.fn()
    const wrapper = mountPill({
      onClick,
    })

    await wrapper.trigger('click')

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
