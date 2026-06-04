import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageSubheading from '../PageSubheading.vue'

describe('PageSubheading.vue', () => {
  it('renders default slot content when provided', () => {
    const wrapper = mount(PageSubheading, {
      props: {
        showing: 2,
        total: 10,
        hasFilters: true,
      },
      slots: {
        default: 'Manage and track assessment submissions',
      },
    })

    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.text()).toBe('Manage and track assessment submissions')
    expect(wrapper.text()).not.toContain('Showing 2 of 10')
    expect(wrapper.text()).not.toContain('(filters active)')
  })

  it('renders generated showing and total text when no slot is provided', () => {
    const wrapper = mount(PageSubheading, {
      props: {
        showing: 3,
        total: 12,
      },
    })

    expect(wrapper.text()).toBe('Showing 3 of 12')
  })

  it('renders the active filters label when filters are active', () => {
    const wrapper = mount(PageSubheading, {
      props: {
        showing: 4,
        total: 20,
        hasFilters: true,
      },
    })

    expect(wrapper.text()).toBe('Showing 4 of 20 (filters active)')
    expect(wrapper.find('span').text()).toBe('(filters active)')
  })

  it('renders dynamic slot markup', () => {
    const wrapper = mount(PageSubheading, {
      slots: {
        default: '<span data-test="subtitle">Review submissions</span>',
      },
    })

    expect(wrapper.find('[data-test="subtitle"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Review submissions')
  })

  it('keeps the expected subheading typography and theme classes', () => {
    const wrapper = mount(PageSubheading, {
      props: {
        showing: 1,
        total: 5,
      },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'mt-1',
      'text-sm',
      'text-gray-500',
      'dark:text-gray-400',
    ]))
  })
})
