import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentsRightPanel from '../CommentsRightPanel.vue'

const selectedAssessment = {
  id: 10,
  name: 'Final Review',
}

const selectedMember = {
  id: 501,
  users_id: 7,
  user: {
    id: 7,
    name: 'Ada Lovelace',
  },
}

const activeUpload = {
  id: 900,
  events_assessments_id: 10,
  file_path: 'https://example.test/submissions/final-project.zip',
  score: 86,
  status: 1,
}

const comments = [
  {
    id: 100,
    events_users_events_assessments_id: 900,
    comments: 'New file uploaded',
    users_id: 7,
    is_upload: true,
    created_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 101,
    events_users_events_assessments_id: 900,
    comments: 'Looks solid overall',
    users_id: 55,
    user: { name: 'Dr Mentor' },
    created_at: '2026-05-01T11:00:00Z',
  },
  {
    id: 102,
    events_users_events_assessments_id: 900,
    comments: 'Project link submitted',
    users_id: 7,
    file_url: 'https://example.test/project',
    created_at: '2026-05-01T12:00:00Z',
  },
]

const mountPanel = (props = {}) => mount(CommentsRightPanel, {
  props: {
    selectedAssessment,
    selectedMember,
    memberUploads: [activeUpload],
    selectedMemberComments: comments,
    activeUploadForReply: activeUpload,
    instructorComment: comments[1],
    scoreInputs: {
      900: 86,
    },
    replyText: '',
    submitting: false,
    savingScoreUploadId: null,
    scoreSuccessUploads: {},
    ...props,
  },
})

describe('CommentsRightPanel.vue', () => {
  it('renders the empty selection state when no member is selected', () => {
    const wrapper = mountPanel({
      selectedMember: null,
      selectedMemberComments: [],
      activeUploadForReply: null,
    })

    expect(wrapper.text()).toContain('Select a student to review')
    expect(wrapper.text()).toContain('Choose an assessment and student from the left panel')
    expect(wrapper.text()).not.toContain('Feedback Thread')
  })

  it('renders the selected member header, score bar, and feedback thread', () => {
    const wrapper = mountPanel()

    expect(wrapper.text()).toContain('Feedback Thread')
    expect(wrapper.text()).toContain('Ada Lovelace • Final Review')
    expect(wrapper.text()).toContain('Score')
    expect(wrapper.text()).toContain('final-project.zip')
    expect(wrapper.text()).toContain('Student')
    expect(wrapper.text()).toContain('Instructor')
    expect(wrapper.text()).toContain('New file uploaded')
    expect(wrapper.text()).toContain('Looks solid overall')
    expect(wrapper.text()).toContain('Project link submitted')
    expect(wrapper.text()).toContain('Download')
    expect(wrapper.find('a').text()).toBe('click here')
  })

  it('renders the no-feedback state while keeping the reply input visible', () => {
    const wrapper = mountPanel({
      selectedMemberComments: [],
    })

    expect(wrapper.text()).toContain('No feedback yet')
    expect(wrapper.text()).toContain('Write a comment below')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button').text()).toBe('Send')
  })

  it('forwards score input, save, and keydown events from the score bar', async () => {
    const wrapper = mountPanel()
    const input = wrapper.find('input[type="number"]')

    await input.setValue('92')
    await input.trigger('blur')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update-score-input')).toEqual([[900, '92']])
    expect(wrapper.emitted('save-score')).toEqual([[900]])
    expect(wrapper.emitted('score-keydown')).toHaveLength(1)
    expect(wrapper.emitted('score-keydown')[0][0]).toBeInstanceOf(KeyboardEvent)
    expect(wrapper.emitted('score-keydown')[0][1]).toBe(900)
  })

  it('forwards download and project-link actions from message bubbles', async () => {
    const wrapper = mountPanel()

    await wrapper.findAll('button')
      .find((button) => button.text() === 'Download')
      .trigger('click')
    await wrapper.find('a').trigger('click')

    expect(wrapper.emitted('download-file')).toEqual([[900]])
    expect(wrapper.emitted('open-url')).toEqual([[900]])
  })

  it('forwards reply text and submit events when reply submission is allowed', async () => {
    const wrapper = mountPanel({
      replyText: ' Please polish the README ',
    })
    const textarea = wrapper.find('textarea')
    const sendButton = wrapper.findAll('button').find((button) => button.text() === 'Send')

    await textarea.setValue('Looks ready now')
    await textarea.trigger('keydown.enter')
    await sendButton.trigger('click')

    expect(sendButton.attributes('disabled')).toBeUndefined()
    expect(wrapper.emitted('update-reply')).toEqual([['Looks ready now']])
    expect(wrapper.emitted('submit-reply')).toEqual([[101], [101]])
  })

  it('disables reply submission when there is no active upload or while submitting', () => {
    const noUploadWrapper = mountPanel({
      activeUploadForReply: null,
      replyText: 'Ready to send',
    })
    const submittingWrapper = mountPanel({
      replyText: 'Ready to send',
      submitting: true,
    })

    expect(noUploadWrapper.text()).not.toContain('Score')
    expect(noUploadWrapper.findAll('button').find((button) => button.text() === 'Send').attributes('disabled')).toBeDefined()
    expect(submittingWrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(submittingWrapper.findAll('button').find((button) => button.text() === '…').attributes('disabled')).toBeDefined()
  })
})
