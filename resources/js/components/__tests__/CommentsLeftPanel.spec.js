import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentsLeftPanel from '../CommentsLeftPanel.vue'

const buildAssessment = (overrides = {}) => ({
  id: 10,
  name: 'Final Review',
  session: {
    session_members: [
      {
        id: 501,
        users_id: 7,
        user: { id: 7, name: 'Ada Lovelace' },
        project_uploads: [
          {
            id: 900,
            events_assessments_id: 10,
            score: 86,
            status: 1,
          },
        ],
      },
      {
        id: 502,
        users_id: 8,
        user: { id: 8, name: 'Grace Hopper' },
        project_uploads: [
          {
            id: 901,
            events_assessments_id: 99,
            score: 72,
            status: 1,
          },
        ],
      },
      {
        id: 503,
        users_id: 9,
        user: { id: 9, name: 'Linus Torvalds' },
        project_uploads: [],
      },
    ],
  },
  ...overrides,
})

const mountPanel = (props = {}) => mount(CommentsLeftPanel, {
  props: {
    assessments: [],
    selectedAssessment: null,
    selectedMember: null,
    ...props,
  },
})

describe('CommentsLeftPanel.vue', () => {
  it('renders assessment totals and empty state when no assessments exist', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Assessments')
    expect(wrapper.text()).toContain('0 total')
    expect(wrapper.text()).toContain('No assessments found')
  })

  it('renders assessment rows with submission counts', () => {
    const assessment = buildAssessment()
    const emptyAssessment = buildAssessment({
      id: 11,
      name: 'Peer Review',
      session: {
        session_members: [],
      },
    })
    const wrapper = mountPanel({
      assessments: [assessment, emptyAssessment],
    })

    expect(wrapper.text()).toContain('2 total')
    expect(wrapper.text()).toContain('Final Review')
    expect(wrapper.text()).toContain('1 submission(s)')
    expect(wrapper.text()).toContain('Peer Review')
    expect(wrapper.text()).toContain('0 submission(s)')
  })

  it('emits the selected assessment when an assessment row is clicked', async () => {
    const assessment = buildAssessment()
    const wrapper = mountPanel({
      assessments: [assessment],
    })

    await wrapper.findAll('button')
      .find((button) => button.text().includes('Final Review'))
      .trigger('click')

    expect(wrapper.emitted('select-assessment')).toEqual([[assessment]])
  })

  it('renders only submitted members for the selected assessment', () => {
    const assessment = buildAssessment()
    const wrapper = mountPanel({
      assessments: [assessment],
      selectedAssessment: assessment,
    })

    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('AL')
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('86/10')
    expect(wrapper.text()).not.toContain('Grace Hopper')
    expect(wrapper.text()).not.toContain('Linus Torvalds')
  })

  it('emits the selected member when a submitted member row is clicked', async () => {
    const assessment = buildAssessment()
    const member = assessment.session.session_members[0]
    const wrapper = mountPanel({
      assessments: [assessment],
      selectedAssessment: assessment,
    })

    await wrapper.findAll('button')
      .find((button) => button.text().includes('Ada Lovelace'))
      .trigger('click')

    expect(wrapper.emitted('select-member')).toEqual([[member]])
  })

  it('shows no-submissions copy when the selected assessment has no submitted members', () => {
    const assessment = buildAssessment({
      session: {
        session_members: [
          {
            id: 501,
            users_id: 7,
            user: { id: 7, name: 'Ada Lovelace' },
            project_uploads: [],
          },
        ],
      },
    })
    const wrapper = mountPanel({
      assessments: [assessment],
      selectedAssessment: assessment,
    })

    expect(wrapper.text()).toContain('No submissions yet')
    expect(wrapper.text()).not.toContain('Ada Lovelace')
  })

  it('applies active classes to the selected assessment and selected member', () => {
    const assessment = buildAssessment()
    const selectedMember = assessment.session.session_members[0]
    const wrapper = mountPanel({
      assessments: [assessment],
      selectedAssessment: assessment,
      selectedMember,
    })

    const assessmentButton = wrapper.findAll('button')
      .find((button) => button.text().includes('Final Review'))
    const memberButton = wrapper.findAll('button')
      .find((button) => button.text().includes('Ada Lovelace'))

    expect(assessmentButton.classes()).toEqual(expect.arrayContaining([
      'bg-violet-50',
      'border-l-2',
      'border-l-violet-600',
    ]))
    expect(memberButton.classes()).toContain('bg-gray-200')
  })
})
