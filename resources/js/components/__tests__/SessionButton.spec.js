import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SessionButton from '../SessionButton.vue'

const mountButton = (props = {}, slots = { default: 'Create Session' }, attrs = {}) => mount(SessionButton, {
  props,
  slots,
  attrs,
})

describe('SessionButton.vue', () => {
  it('renders as a button with default type and slot content', () => {
    const wrapper = mountButton()

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Create Session')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'text-sm',
      'font-medium',
      'rounded-lg',
      'transition-colors',
      'focus:outline-none',
    ]))
  })

  it('uses the provided button type', () => {
    const wrapper = mountButton({
      type: 'submit',
    })

    expect(wrapper.attributes('type')).toBe('submit')
  })

  it('renders the primary variant classes by default', () => {
    const wrapper = mountButton()

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'px-4',
      'py-2',
      'bg-gradient-to-r',
      'from-purple-600',
      'to-indigo-600',
      'text-white',
      'shadow-lg',
      'hover:shadow-xl',
      'shrink-0',
    ]))
  })

  it('renders the cardPrimary variant classes', () => {
    const wrapper = mountButton({
      variant: 'cardPrimary',
    }, { default: 'View Details' })

    expect(wrapper.text()).toBe('View Details')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'flex-1',
      'px-4',
      'py-2.5',
      'bg-gradient-to-r',
      'from-purple-600',
      'to-indigo-600',
      'text-white',
    ]))
  })

  it('renders success and secondary variant classes', () => {
    const successWrapper = mountButton({
      variant: 'success',
    }, { default: 'Save' })
    const secondaryWrapper = mountButton({
      variant: 'secondary',
    }, { default: 'Cancel' })

    expect(successWrapper.classes()).toEqual(expect.arrayContaining([
      'bg-emerald-600',
      'hover:bg-emerald-700',
      'focus:ring-emerald-500',
      'disabled:opacity-50',
    ]))
    expect(secondaryWrapper.classes()).toEqual(expect.arrayContaining([
      'text-gray-700',
      'bg-gray-100',
      'hover:bg-gray-200',
      'dark:bg-gray-700',
      'dark:text-gray-200',
      'disabled:cursor-not-allowed',
    ]))
  })

  it('renders the danger variant used by member removal actions', () => {
    const wrapper = mountButton({
      variant: 'danger',
    }, { default: 'Remove' })

    expect(wrapper.text()).toBe('Remove')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'w-full',
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'from-red-500',
      'to-red-700',
      'hover:from-red-600',
      'hover:to-red-800',
    ]))
  })

  it('passes through disabled attributes and native click listeners', async () => {
    const onClick = vi.fn()
    const disabledWrapper = mountButton({}, { default: 'Downloading' }, { disabled: true })
    const clickableWrapper = mountButton({}, { default: 'Add Member' }, { onClick })

    await clickableWrapper.trigger('click')

    expect(disabledWrapper.attributes('disabled')).toBeDefined()
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
