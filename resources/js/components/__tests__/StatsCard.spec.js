import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StatsCard from '../StatsCard.vue'

const mountCard = (props = {}, slots = {}) => mount(StatsCard, {
  props: {
    title: 'Total Sessions',
    value: 12,
    ...props,
  },
  slots,
})

describe('StatsCard.vue', () => {
  it('renders title and numeric value', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Total Sessions')
    expect(wrapper.text()).toContain('12')
  })

  it('renders string values without coercing display content', () => {
    const wrapper = mountCard({
      title: 'Average Score',
      value: '8.5/10',
    })

    expect(wrapper.text()).toContain('Average Score')
    expect(wrapper.text()).toContain('8.5/10')
  })

  it('renders the icon slot inside the icon container', () => {
    const wrapper = mountCard({}, {
      icon: '<svg data-test="stats-icon" viewBox="0 0 20 20"></svg>',
    })
    const iconWrap = wrapper.findAll('.bg-linear-to-br')
      .find((element) => element.find('[data-test="stats-icon"]').exists())

    expect(wrapper.find('[data-test="stats-icon"]').exists()).toBe(true)
    expect(iconWrap.classes()).toEqual(expect.arrayContaining([
      'p-4',
      'rounded-xl',
      'shadow-lg',
    ]))
  })

  it('uses default card, decoration, and icon gradient classes', () => {
    const wrapper = mountCard()
    const gradients = wrapper.findAll('.bg-linear-to-br')
    const decoration = gradients[0]
    const icon = gradients[1]

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-slate-50',
      'border-slate-300',
    ]))
    expect(decoration.classes()).toEqual(expect.arrayContaining([
      'from-purple-500/10',
      'to-violet-500/10',
    ]))
    expect(icon.classes()).toEqual(expect.arrayContaining([
      'from-purple-500',
      'to-violet-600',
    ]))
  })

  it('applies custom card, decoration, and icon classes', () => {
    const wrapper = mountCard({
      cardClass: 'bg-emerald-50 border-emerald-200',
      decorationClass: 'from-emerald-500/10 to-teal-500/10',
      iconClass: 'from-emerald-500 to-teal-600',
    })
    const gradients = wrapper.findAll('.bg-linear-to-br')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-emerald-50',
      'border-emerald-200',
    ]))
    expect(gradients[0].classes()).toEqual(expect.arrayContaining([
      'from-emerald-500/10',
      'to-teal-500/10',
    ]))
    expect(gradients[1].classes()).toEqual(expect.arrayContaining([
      'from-emerald-500',
      'to-teal-600',
    ]))
  })

  it('keeps expected card shell and typography classes', () => {
    const wrapper = mountCard()
    const title = wrapper.findAll('p').find((element) => element.text() === 'Total Sessions')
    const value = wrapper.findAll('p').find((element) => element.text() === '12')

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'relative',
      'overflow-hidden',
      'dark:bg-slate-800',
      'rounded-2xl',
      'shadow-lg',
      'hover:shadow-xl',
      'transition-all',
      'duration-300',
      'border',
      'dark:border-slate-700',
    ]))
    expect(title.classes()).toEqual(expect.arrayContaining([
      'text-sm',
      'font-medium',
      'text-slate-600',
      'dark:text-gray-400',
    ]))
    expect(value.classes()).toEqual(expect.arrayContaining([
      'mt-2',
      'text-3xl',
      'font-bold',
      'text-slate-950',
      'dark:text-white',
    ]))
  })
})
