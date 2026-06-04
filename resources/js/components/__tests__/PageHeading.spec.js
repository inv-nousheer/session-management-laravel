import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageHeading from '../PageHeading.vue'

describe('PageHeading.vue', () => {
  it('renders slot content inside an h2 heading', () => {
    const wrapper = mount(PageHeading, {
      slots: {
        default: 'Sessions',
      },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.text()).toBe('Sessions')
  })

  it('renders dynamic slot markup', () => {
    const wrapper = mount(PageHeading, {
      slots: {
        default: '<span data-test="title">Assessments</span>',
      },
    })

    expect(wrapper.find('[data-test="title"]').exists()).toBe(true)
    expect(wrapper.text()).toBe('Assessments')
  })

  it('keeps the expected heading typography and theme classes', () => {
    const wrapper = mount(PageHeading, {
      slots: {
        default: 'Manage Members',
      },
    })

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'text-2xl',
      'font-semibold',
      'text-gray-700',
      'dark:text-gray-200',
    ]))
  })
})
