import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  route: {
    params: { id: 42 },
    path: '/user-dashboard/session-detail/42',
  },
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}))

const buildUpload = (overrides = {}) => ({
  id: 900,
  events_assessments_id: 10,
  status: 1,
  score: 9,
  comments: [],
  assessment: {
    id: 10,
    name: 'Final Project',
    description: 'Submit the final project package',
    start_date_time: '2026-05-01T00:00:00Z',
    end_date_time: '2026-05-10T00:00:00Z',
    comments: [
      {
        id: 100,
        events_users_events_assessments_id: 900,
        comments: 'New file uploaded',
        users_id: 7,
        is_upload: true,
        created_at: '2026-05-02T10:00:00Z',
        replies: [],
      },
      {
        id: 101,
        events_users_events_assessments_id: 900,
        comments: 'Nice work on the implementation',
        users_id: 99,
        user: { name: 'Dr Mentor' },
        created_at: '2026-05-03T10:00:00Z',
        replies: [
          {
            id: 102,
            events_users_events_assessments_id: 900,
            comments: 'I will update the docs',
            users_id: 7,
            created_at: '2026-05-03T11:00:00Z',
          },
        ],
      },
      {
        id: 103,
        events_users_events_assessments_id: 901,
        comments: 'Feedback for an earlier upload',
        users_id: 99,
        created_at: '2026-05-01T11:00:00Z',
      },
    ],
  },
  ...overrides,
})

const mountPanel = async () => {
  const { default: CommentsPanelForMembers } = await import('../CommentsPanelForMembers.vue')

  return mount(CommentsPanelForMembers, {
    attachTo: document.body,
  })
}

const selectSubmission = async (wrapper, text = 'Final Project') => {
  await wrapper.findAll('button').find((button) => button.text().includes(text)).trigger('click')
  await nextTick()
}

describe('CommentsPanelForMembers.vue', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 7, name: 'Ada Lovelace' }))
    mocks.route.params = { id: 42 }
    mocks.route.path = '/user-dashboard/session-detail/42'
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mocks.api.get.mockReset()
    mocks.api.post.mockReset()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('fetches and renders the current user submissions', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [buildUpload()] })

    const wrapper = await mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/users-assessments/42/7')
    expect(wrapper.text()).toContain('My Feedback')
    expect(wrapper.text()).toContain('1 assessments')
    expect(wrapper.text()).toContain('Final Project')
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('9/10')
    expect(wrapper.text()).toContain('Select a submission to view feedback')
  })

  it('renders empty and error states from the assessment fetch', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [] })
    const emptyWrapper = await mountPanel()
    await flushPromises()

    expect(emptyWrapper.text()).toContain('No submissions yet')
    emptyWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = await mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load')
  })

  it('selects a submission and renders score, feedback, and replies', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [buildUpload()] })
    const wrapper = await mountPanel()
    await flushPromises()

    await selectSubmission(wrapper)

    expect(wrapper.text()).toContain('Submit the final project package')
    expect(wrapper.text()).toContain('Score')
    expect(wrapper.text()).toContain('9/10 · A')
    expect(wrapper.text()).toContain('Excellent work!')
    expect(wrapper.text()).toContain('Activity & Feedback')
    expect(wrapper.text()).toContain('You')
    expect(wrapper.text()).toContain('Instructor')
    expect(wrapper.text()).toContain('New file uploaded')
    expect(wrapper.text()).toContain('Nice work on the implementation')
    expect(wrapper.text()).toContain('I will update the docs')
  })

  it('groups multiple uploads for one assessment and filters comments by upload ids', async () => {
    const firstUpload = buildUpload({
      id: 900,
      score: 7,
      assessment: {
        ...buildUpload().assessment,
        comments: [
          {
            id: 100,
            events_users_events_assessments_id: 900,
            comments: 'Earlier upload feedback',
            users_id: 99,
            created_at: '2026-05-01T10:00:00Z',
          },
          {
            id: 101,
            events_users_events_assessments_id: 901,
            comments: 'Latest upload feedback',
            users_id: 99,
            created_at: '2026-05-02T10:00:00Z',
          },
          {
            id: 102,
            events_users_events_assessments_id: 999,
            comments: 'Other student feedback',
            users_id: 99,
            created_at: '2026-05-03T10:00:00Z',
          },
        ],
      },
    })
    const latestUpload = buildUpload({
      id: 901,
      score: 8,
      assessment: firstUpload.assessment,
    })
    mocks.api.get.mockResolvedValueOnce({ data: [firstUpload, latestUpload] })

    const wrapper = await mountPanel()
    await flushPromises()
    await selectSubmission(wrapper)

    expect(wrapper.text()).toContain('1 assessments')
    expect(wrapper.text()).toContain('8/10 · B')
    expect(wrapper.text()).toContain('Earlier upload feedback')
    expect(wrapper.text()).toContain('Latest upload feedback')
    expect(wrapper.text()).not.toContain('Other student feedback')
  })

  it('posts a reply to instructor feedback and refreshes the selected submission', async () => {
    const upload = buildUpload()
    mocks.api.get
      .mockResolvedValueOnce({ data: [upload] })
      .mockResolvedValueOnce({
        data: [
          buildUpload({
            assessment: {
              ...upload.assessment,
              comments: [
                ...upload.assessment.comments,
                {
                  id: 104,
                  events_users_events_assessments_id: 900,
                  comments: 'Thanks, I made the requested update',
                  users_id: 7,
                  created_at: '2026-05-04T10:00:00Z',
                },
              ],
            },
          }),
        ],
      })
    mocks.api.post.mockResolvedValueOnce({})

    const wrapper = await mountPanel()
    await flushPromises()
    await selectSubmission(wrapper)

    await wrapper.find('textarea').setValue('  Thanks, I made the requested update  ')
    await wrapper.findAll('button').find((button) => button.text().includes('Reply')).trigger('click')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/comments', {
      events_users_events_assessments_id: 900,
      events_assessments_id: 10,
      comments: 'Thanks, I made the requested update',
      users_id: 7,
      parent_id: 101,
    })
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.find('textarea').element.value).toBe('')
    expect(wrapper.text()).toContain('Thanks, I made the requested update')
  })
})
