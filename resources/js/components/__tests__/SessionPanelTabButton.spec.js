import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SessionPanelTabButton from '../SessionPanelTabButton.vue'

const panel = {
  id: 'members',
  label: 'Members',
  icon: 'M10 2a8 8 0 100 16 8 8 0 000-16z',
}

const mountTab = (props = {}) => mount(SessionPanelTabButton, {
  props: {
    panel,
    active: false,
    ...props,
  },
})

describe('SessionPanelTabButton.vue', () => {
  it('renders a tab button with label and icon', () => {
    const wrapper = mountTab()
    const svg = wrapper.find('svg')
    const path = wrapper.find('path')

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Members')
    expect(svg.attributes('viewBox')).toBe('0 0 20 20')
    expect(path.attributes('d')).toBe(panel.icon)
    expect(path.attributes('fill-rule')).toBe('evenodd')
    expect(path.attributes('clip-rule')).toBe('evenodd')
  })

  it('emits select with the panel id when clicked', async () => {
    const wrapper = mountTab()

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['members']])
  })

  it('renders active tab text, icon classes, and underline', () => {
    const wrapper = mountTab({
      active: true,
    })
    const svg = wrapper.find('svg')
    const underline = wrapper.find('.absolute.bottom-0')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'text-purple-600',
      'dark:text-purple-400',
    ]))
    expect(svg.classes()).toEqual(expect.arrayContaining([
      'text-purple-600',
      'dark:text-purple-400',
    ]))
    expect(underline.exists()).toBe(true)
    expect(underline.classes()).toEqual(expect.arrayContaining([
      'h-1',
      'bg-linear-to-r',
      'from-purple-600',
      'to-purple-400',
    ]))
  })

  it('renders inactive tab classes without underline', () => {
    const wrapper = mountTab()
    const svg = wrapper.find('svg')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'text-gray-600',
      'hover:text-gray-900',
      'dark:text-gray-400',
      'dark:hover:text-gray-200',
    ]))
    expect(svg.classes()).toEqual(expect.arrayContaining([
      'text-gray-500',
      'dark:text-gray-500',
      'group-hover:text-purple-600',
      'dark:group-hover:text-purple-400',
    ]))
    expect(wrapper.find('.absolute.bottom-0').exists()).toBe(false)
  })

  it('keeps expected base layout and focus classes', () => {
    const wrapper = mountTab()

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'group',
      'relative',
      'flex',
      'items-center',
      'gap-2.5',
      'px-4',
      'py-3',
      'text-sm',
      'font-medium',
      'transition-all',
      'duration-200',
      'whitespace-nowrap',
      'outline-none',
      'focus:ring-purple-500',
    ]))
  })
})
