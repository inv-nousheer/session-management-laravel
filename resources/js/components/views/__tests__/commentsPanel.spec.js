import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  api: {
    post: vi.fn(),
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

const buildAssessment = (overrides = {}) => ({
  id: 10,
  name: 'Final Review',
  comments: [
    {
      id: 100,
      events_users_events_assessments_id: 900,
      comments: 'New file uploaded',
      users_id: 7,
      is_upload: true,
      created_at: '2026-05-01T10:00:00Z',
      replies: [],
    },
    {
      id: 101,
      events_users_events_assessments_id: 900,
      comments: 'Looks solid overall',
      users_id: 99,
      user: { name: 'Dr Mentor' },
      created_at: '2026-05-01T11:00:00Z',
      replies: [
        {
          id: 102,
          events_users_events_assessments_id: 900,
          comments: 'Thank you for the feedback',
          users_id: 7,
          created_at: '2026-05-01T12:00:00Z',
        },
      ],
    },
    {
      id: 103,
      events_users_events_assessments_id: 900,
      comments: 'Project link submitted',
      users_id: 7,
      created_at: '2026-05-01T12:30:00Z',
      replies: [],
    },
  ],
  project_uploads: [{ id: 900 }],
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
            file_path: 'https://example.test/submissions/final-project.zip',
            score: 86,
            status: 1,
          },
        ],
      },
    ],
  },
  ...overrides,
})

const mountPanel = async (props = {}) => {
  const { default: CommentsPanel } = await import('../CommentsPanel.vue')

  return mount(CommentsPanel, {
    attachTo: document.body,
    props: {
      assessments: [],
      fetchAssessments: vi.fn(),
      ...props,
    },
  })
}

const selectSubmittedMember = async (wrapper) => {
  await wrapper.findAll('button').find((button) => button.text().includes('Final Review')).trigger('click')
  await nextTick()
  await wrapper.findAll('button').find((button) => button.text().includes('Ada Lovelace')).trigger('click')
  await nextTick()
}

describe('commentsPanel.vue', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 55 }))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mocks.api.post.mockReset()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('renders an empty state when there are no assessments', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.text()).toContain('Reviews & Scoring')
    expect(wrapper.text()).toContain('0 total')
    expect(wrapper.text()).toContain('No assessments found')
    expect(wrapper.text()).toContain('Select a student to review')
  })

  it('selects an assessment and renders only the selected member feedback thread', async () => {
    const wrapper = await mountPanel({ assessments: [buildAssessment()] })

    expect(wrapper.text()).toContain('Final Review')
    expect(wrapper.text()).toContain('1 submission(s)')

    await selectSubmittedMember(wrapper)

    expect(wrapper.text()).toContain('Feedback Thread')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('final-project.zip')
    expect(wrapper.text()).toContain('Student')
    expect(wrapper.text()).toContain('Instructor')
    expect(wrapper.text()).toContain('New file uploaded')
    expect(wrapper.text()).toContain('Looks solid overall')
    expect(wrapper.text()).toContain('Project link submitted')
    expect(wrapper.text()).toContain('Thank you for the feedback')
  })

  it('submits instructor feedback for the active upload and refreshes assessments', async () => {
    mocks.api.post.mockResolvedValueOnce({})
    const fetchAssessments = vi.fn()
    const wrapper = await mountPanel({
      assessments: [buildAssessment()],
      fetchAssessments,
    })

    await selectSubmittedMember(wrapper)
    await wrapper.find('textarea').setValue('  Please polish the README  ')
    await wrapper.findAll('button').find((button) => button.text().includes('Send')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/comments', {
      events_users_events_assessments_id: 900,
      events_assessments_id: 10,
      comments: 'Please polish the README',
      users_id: 55,
      parent_id: 101,
    })
    expect(fetchAssessments).toHaveBeenCalledTimes(1)
    expect(wrapper.find('textarea').element.value).toBe('')
  })

  it('focuses the newly submitted feedback bubble after refreshing assessments', async () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {})
    mocks.api.post.mockResolvedValueOnce({ data: { id: 104 } })

    const assessment = buildAssessment()
    const refreshedAssessment = buildAssessment({
      comments: [
        assessment.comments[0],
        {
          ...assessment.comments[1],
          replies: [
            ...assessment.comments[1].replies,
            {
              id: 104,
              events_users_events_assessments_id: 900,
              comments: 'Please polish the README',
              users_id: 55,
              user: { name: 'Dr Mentor' },
              created_at: '2026-05-01T13:00:00Z',
            },
          ],
        },
        assessment.comments[2],
      ],
    })
    let wrapper
    const fetchAssessments = vi.fn(async () => {
      await wrapper.setProps({ assessments: [refreshedAssessment] })
    })
    wrapper = await mountPanel({
      assessments: [assessment],
      fetchAssessments,
    })

    await selectSubmittedMember(wrapper)
    await wrapper.find('textarea').setValue('Please polish the README')
    await wrapper.findAll('button').find((button) => button.text().includes('Send')).trigger('click')
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-comment-id="104"]').exists()).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('saves a valid score for the latest upload', async () => {
    mocks.api.post.mockResolvedValueOnce({})
    const fetchAssessments = vi.fn()
    const wrapper = await mountPanel({
      assessments: [buildAssessment()],
      fetchAssessments,
    })

    await selectSubmittedMember(wrapper)
    const input = wrapper.find('input[type="number"]')
    await input.setValue('92')
    await input.trigger('blur')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/project-uploads/900/score', { score: 92 })
    expect(fetchAssessments).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Saved')
  })

  it('opens submitted files through download and URL actions', async () => {
    const wrapper = await mountPanel({ assessments: [buildAssessment()] })

    await selectSubmittedMember(wrapper)
    await wrapper.findAll('button').find((button) => button.text().includes('Download')).trigger('click')
    await wrapper.find('a').trigger('click')

    expect(window.open).toHaveBeenCalledWith('/api/download/900', '_blank')
    expect(window.open).toHaveBeenCalledWith('https://example.test/submissions/final-project.zip', '_blank')
  })
})
