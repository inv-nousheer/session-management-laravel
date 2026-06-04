import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardTable from '../DashboardTable.vue'

const columns = [
  { key: 'name', label: 'Name', type: 'primary' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'date', label: 'Date' },
  { key: 'owner', label: 'Owner', value: 'Current User' },
]

const rows = [
  {
    id: 1,
    name: 'Intro to Vue',
    status: 'Active',
    date: '2026-06-10',
  },
  {
    id: 2,
    name: 'Advanced Laravel',
    status: 'Draft',
    date: '2026-06-12',
  },
]

const mountTable = (props = {}, slots = {}) => mount(DashboardTable, {
  props: {
    title: 'Recent Sessions',
    rows,
    columns,
    iconClass: 'from-pink-500 to-rose-600',
    ...props,
  },
  slots,
})

describe('DashboardTable.vue', () => {
  it('renders the title and icon slot with the provided icon classes', () => {
    const wrapper = mountTable({}, {
      icon: '<svg data-test="table-icon" viewBox="0 0 20 20"></svg>',
    })
    const iconWrap = wrapper.find('.bg-linear-to-br')

    expect(wrapper.text()).toContain('Recent Sessions')
    expect(wrapper.find('[data-test="table-icon"]').exists()).toBe(true)
    expect(iconWrap.classes()).toEqual(expect.arrayContaining([
      'from-pink-500',
      'to-rose-600',
    ]))
  })

  it('uses the default icon gradient when no iconClass is provided', () => {
    const wrapper = mount(DashboardTable, {
      props: {
        title: 'Recent Assessments',
        rows,
        columns,
      },
    })

    expect(wrapper.find('.bg-linear-to-br').classes()).toEqual(expect.arrayContaining([
      'from-purple-500',
      'to-violet-600',
    ]))
  })

  it('renders column headers from column labels', () => {
    const wrapper = mountTable()
    const headers = wrapper.findAll('th').map((header) => header.text())

    expect(headers).toEqual(['Name', 'Status', 'Date', 'Owner'])
  })

  it('renders primary, badge, default, and static-value cells', () => {
    const wrapper = mountTable()

    expect(wrapper.find('p.font-semibold').text()).toBe('Intro to Vue')
    expect(wrapper.find('span.rounded-full').text()).toBe('Active')
    expect(wrapper.text()).toContain('2026-06-10')
    expect(wrapper.text()).toContain('2026-06-12')
    expect(wrapper.text()).toContain('Current User')
    expect(wrapper.text()).not.toContain('undefined')
  })

  it('renders one table row for each supplied row', () => {
    const wrapper = mountTable()
    const bodyRows = wrapper.findAll('tbody tr')

    expect(bodyRows).toHaveLength(2)
    expect(bodyRows[0].text()).toContain('Intro to Vue')
    expect(bodyRows[1].text()).toContain('Advanced Laravel')
  })

  it('renders an empty tbody when there are no rows', () => {
    const wrapper = mountTable({
      rows: [],
    })

    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    expect(wrapper.findAll('th')).toHaveLength(columns.length)
  })

  it('keeps expected table shell and row styling classes', () => {
    const wrapper = mountTable()

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-slate-50',
      'dark:bg-slate-800',
      'rounded-2xl',
      'shadow-lg',
      'overflow-hidden',
      'border',
    ]))
    expect(wrapper.find('tbody tr').classes()).toEqual(expect.arrayContaining([
      'hover:bg-slate-100',
      'dark:hover:bg-slate-700/50',
      'transition-colors',
    ]))
  })
})
