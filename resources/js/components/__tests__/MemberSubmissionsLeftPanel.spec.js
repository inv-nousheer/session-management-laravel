import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MemberSubmissionsLeftPanel from '../MemberSubmissionsLeftPanel.vue'

const buildUpload = (overrides = {}) => ({
  id: 900,
  status: 1,
  score: 8,
  comments: [{ id: 1, comments: 'Looks good' }],
  assessment: {
    id: 10,
    name: 'Final Project',
    end_date_time: '2026-06-20T00:00:00Z',
  },
  ...overrides,
})

const mountPanel = (props = {}) => mount(MemberSubmissionsLeftPanel, {
  props: {
    assessments: [],
    selectedFeedback: null,
    loading: false,
    error: false,
    ...props,
  },
})

describe('MemberSubmissionsLeftPanel.vue', () => {
  it('renders the submissions header and empty state', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Submissions')
    expect(wrapper.text()).toContain('0 assessments')
    expect(wrapper.text()).toContain('No submissions yet')
  })

  it('renders the loading state before other content states', () => {
    const wrapper = mountPanel({
      assessments: [buildUpload()],
      loading: true,
      error: true,
    })

    expect(wrapper.text()).toContain('1 assessments')
    expect(wrapper.text()).toContain('Loading…')
    expect(wrapper.text()).not.toContain('Failed to load')
    expect(wrapper.text()).not.toContain('Final Project')
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders the error state when loading is false', () => {
    const wrapper = mountPanel({
      assessments: [buildUpload()],
      error: true,
    })

    expect(wrapper.text()).toContain('Failed to load')
    expect(wrapper.text()).not.toContain('Final Project')
    expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 24 24')
  })

  it('renders upload rows with due dates, status, score, and comment indicator', () => {
    const submittedUpload = buildUpload()
    const pendingUpload = buildUpload({
      id: 901,
      status: 0,
      score: null,
      comments: [],
      assessment: {
        id: 11,
        name: 'Peer Review',
        end_date_time: '2026-07-01',
      },
    })
    const wrapper = mountPanel({
      assessments: [submittedUpload, pendingUpload],
    })

    expect(wrapper.text()).toContain('2 assessments')
    expect(wrapper.text()).toContain('Final Project')
    expect(wrapper.text()).toContain('Due Jun 20, 2026')
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('8/10')
    expect(wrapper.text()).toContain('Peer Review')
    expect(wrapper.text()).toContain('Due Jul 1, 2026')
    expect(wrapper.text()).toContain('Pending')

    const indicators = wrapper.findAll('.w-2.h-2.rounded-full')
    expect(indicators[0].classes()).toContain('bg-blue-500')
    expect(indicators[1].classes()).toContain('bg-slate-300')
  })

  it('emits select-feedback when an upload row is clicked', async () => {
    const upload = buildUpload()
    const wrapper = mountPanel({
      assessments: [upload],
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('select-feedback')).toEqual([[upload]])
  })

  it('applies selected classes to the active feedback row', () => {
    const upload = buildUpload()
    const wrapper = mountPanel({
      assessments: [upload],
      selectedFeedback: upload,
    })

    expect(wrapper.find('button').classes()).toEqual(expect.arrayContaining([
      'bg-violet-50',
      'border-l-2',
      'border-l-violet-600',
    ]))
  })

  it('keeps expected shell and status styling classes', () => {
    const submittedWrapper = mountPanel({
      assessments: [buildUpload()],
    })
    const pendingWrapper = mountPanel({
      assessments: [buildUpload({ status: 0, comments: [] })],
    })

    expect(submittedWrapper.classes()).toEqual(expect.arrayContaining([
      'w-72',
      'shrink-0',
      'bg-slate-50',
      'dark:bg-slate-800',
      'rounded-xl',
      'border',
      'shadow-sm',
    ]))
    expect(submittedWrapper.findAll('span').find((span) => span.text() === 'Submitted').classes()).toEqual(expect.arrayContaining([
      'bg-green-100',
      'text-green-700',
    ]))
    expect(pendingWrapper.findAll('span').find((span) => span.text() === 'Pending').classes()).toEqual(expect.arrayContaining([
      'bg-amber-100',
      'text-amber-700',
    ]))
  })
})
