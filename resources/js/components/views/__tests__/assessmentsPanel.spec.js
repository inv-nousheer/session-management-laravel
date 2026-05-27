import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AssessmentsPanel from '../AssessmentsPanel.vue'

const mocks = vi.hoisted(() => ({
  api: {
    delete: vi.fn(),
    post: vi.fn(),
  },
  route: {
    params: { id: 42 },
    path: '/session-detail/42',
  },
  flatpickr: vi.fn(() => ({
    destroy: vi.fn(),
    setDate: vi.fn(),
  })),
}))

vi.mock('../../../services/axios.js', () => ({
  default: mocks.api,
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
}))

vi.mock('flatpickr', () => ({
  default: mocks.flatpickr,
}))

const baseAssessment = (overrides = {}) => ({
  id: 10,
  events_id: 42,
  name: 'Capstone Project',
  description: 'Build and submit the final project',
  start_date_time: '2099-01-01',
  end_date_time: '2099-01-10',
  supporting_files: null,
  reopen_requests: [],
  session: {
    created_by: 99,
    session_members: [
      {
        id: 501,
        users_id: 7,
        project_uploads: [],
      },
    ],
  },
  ...overrides,
})

const mountPanel = (props = {}) => mount(AssessmentsPanel, {
  attachTo: document.body,
  props: {
    assessments: [],
    loading: false,
    error: false,
    fetchAssessments: vi.fn(),
    activePanel: 'assessments',
    sessionDetails: { date: '2099-01-01' },
    ...props,
  },
})

const clickBodyButton = async (text) => {
  const buttons = [...document.body.querySelectorAll('button')]
    .filter((element) => element.textContent.trim().includes(text))
  const button = buttons.at(-1)

  expect(button).toBeTruthy()
  button.click()
  await nextTick()
}

const updateBodyField = async (selector, value) => {
  const field = document.body.querySelector(selector)

  expect(field).toBeTruthy()
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('assessmentsPanel.vue', () => {
  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify({ id: 7 }))
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mocks.api.delete.mockReset()
    mocks.api.post.mockReset()
    mocks.flatpickr.mockClear()
    localStorage.clear()
    document.body.innerHTML = ''
  })

  it('renders loading, error, and empty states from props', () => {
    const loadingWrapper = mountPanel({ loading: true })
    expect(loadingWrapper.text()).toContain('Loading assessments...')

    loadingWrapper.unmount()
    const errorWrapper = mountPanel({ error: true })
    expect(errorWrapper.text()).toContain('Failed to load assessments. Please try again.')

    errorWrapper.unmount()
    const emptyWrapper = mountPanel()
    expect(emptyWrapper.text()).toContain('No assessments yet')
    expect(emptyWrapper.text()).toContain('Create your first assessment to get started')
  })

  it('renders assessment details and the user submission score', () => {
    const assessment = baseAssessment({
      session: {
        created_by: 99,
        session_members: [
          {
            id: 501,
            users_id: 7,
            project_uploads: [
              {
                id: 1,
                events_assessments_id: 10,
                score: 88,
                created_at: '2099-01-02T00:00:00Z',
              },
            ],
          },
        ],
      },
    })

    const wrapper = mountPanel({ assessments: [assessment] })

    expect(wrapper.text()).toContain('Capstone Project')
    expect(wrapper.text()).toContain('Build and submit the final project')
    expect(wrapper.text()).toContain('Active')
    expect(wrapper.text()).toContain('Score')
    expect(wrapper.text()).toContain('88')
    expect(wrapper.text()).toContain('Already Submitted')
  })

  it('opens the supporting file download when clicked', async () => {
    const wrapper = mountPanel({
      assessments: [baseAssessment({ supporting_files: 'public/uploads/brief.pdf' })],
    })

    await wrapper.findAll('button')
      .find((button) => button.text().includes('Download supporting files'))
      .trigger('click')

    expect(window.open).toHaveBeenCalledWith('/api/assessments/10/supporting-file', '_blank')
  })

  it('opens the create modal and posts a new assessment', async () => {
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()

    await wrapper.find('button').trigger('click')
    await nextTick()
    await nextTick()

    expect(document.body.textContent).toContain('Create Assessment')
    await updateBodyField('input[placeholder="e.g., Final Project Submission"]', 'Final Demo')
    await updateBodyField('textarea[placeholder="Add any instructions or requirements..."]', 'Record a walkthrough')
    await clickBodyButton('Create Assessment')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith(
      '/api/assessments',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    const payload = mocks.api.post.mock.calls[0][1]
    expect(payload.get('name')).toBe('Final Demo')
    expect(payload.get('description')).toBe('Record a walkthrough')
    expect(payload.get('events_id')).toBe('42')
    expect(wrapper.emitted('fetchAssessments')).toHaveLength(1)
  })

  it('opens the edit modal and posts updates to the selected assessment', async () => {
    mocks.api.post.mockResolvedValueOnce({})
    const assessment = baseAssessment({
      session: {
        created_by: 7,
        session_members: [{ id: 501, users_id: 7, project_uploads: [] }],
      },
    })
    const wrapper = mountPanel({ assessments: [assessment] })

    await wrapper.findAll('button').find((button) => button.text().includes('Edit')).trigger('click')
    await nextTick()
    await nextTick()

    expect(document.body.textContent).toContain('Edit Assessment')
    await updateBodyField('input[placeholder="e.g., Final Project Submission"]', 'Updated Capstone')
    await clickBodyButton('Save Changes')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith(
      '/api/assessments/10',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )

    const payload = mocks.api.post.mock.calls[0][1]
    expect(payload.get('name')).toBe('Updated Capstone')
    expect(payload.get('events_id')).toBeNull()
    expect(payload.get('_method')).toBe('PUT')
    expect(wrapper.emitted('fetchAssessments')).toHaveLength(1)
  })

  it('confirms before deleting an assessment and refreshes the list', async () => {
    mocks.api.delete.mockResolvedValueOnce({})
    const assessment = baseAssessment({
      session: {
        created_by: 7,
        session_members: [{ id: 501, users_id: 7, project_uploads: [] }],
      },
    })
    const wrapper = mountPanel({ assessments: [assessment] })

    await wrapper.findAll('button').find((button) => button.text().includes('Delete')).trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this assessment? This action cannot be undone.')
    expect(mocks.api.delete).toHaveBeenCalledWith('/api/assessments/10')
    expect(wrapper.emitted('fetchAssessments')).toHaveLength(1)
  })

  it('submits a project link upload for an active assessment', async () => {
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel({ assessments: [baseAssessment()] })

    await wrapper.findAll('button').find((button) => button.text().includes('Upload')).trigger('click')
    await nextTick()
    await clickBodyButton('Link')
    await updateBodyField('input[placeholder="https://github.com/username/project or https://drive.google.com/..."]', 'https://github.com/example/project')
    await updateBodyField('textarea[placeholder="Add notes about your submission..."]', 'Repository submission')
    await clickBodyButton('Submit')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/project-uploads', {
      user_id: 7,
      events_id: 42,
      assessment_id: 10,
      submission_link: 'https://github.com/example/project',
      notes: 'Repository submission',
    })
    expect(window.alert).toHaveBeenCalledWith('Link submitted successfully')
    expect(wrapper.emitted('fetchAssessments')).toHaveLength(1)
  })
})
