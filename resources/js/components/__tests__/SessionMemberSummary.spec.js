import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SessionMemberSummary from '../SessionMemberSummary.vue'

const mountSummary = (count) => mount(SessionMemberSummary, {
  props: {
    count,
  },
})

describe('SessionMemberSummary.vue', () => {
  it('renders singular member text for one member', () => {
    const wrapper = mountSummary(1)

    expect(wrapper.text()).toBe('1 member currently in this session.')
  })

  it('renders plural member text for multiple members', () => {
    const wrapper = mountSummary(3)

    expect(wrapper.text()).toBe('3 members currently in this session.')
  })

  it('renders plural member text for zero members', () => {
    const wrapper = mountSummary(0)

    expect(wrapper.text()).toBe('0 members currently in this session.')
  })

  it('highlights the member count', () => {
    const wrapper = mountSummary(5)
    const count = wrapper.find('span')

    expect(count.text()).toBe('5')
    expect(count.classes()).toContain('font-semibold')
  })

  it('keeps expected summary container and text classes', () => {
    const wrapper = mountSummary(2)
    const message = wrapper.find('p')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'mt-8',
      'p-4',
      'bg-blue-50',
      'dark:bg-blue-900/20',
      'border',
      'border-blue-200',
      'dark:border-blue-800',
      'rounded-lg',
    ]))
    expect(message.classes()).toEqual(expect.arrayContaining([
      'text-sm',
      'text-blue-900',
      'dark:text-blue-200',
    ]))
  })
})
