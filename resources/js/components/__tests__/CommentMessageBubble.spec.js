import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentMessageBubble from '../CommentMessageBubble.vue'

const comment = {
  id: 100,
  comments: 'Looks solid overall',
}

const upload = {
  id: 900,
  file_path: 'https://example.test/submissions/final-project.zip',
}

const mountBubble = (props = {}) => mount(CommentMessageBubble, {
  props: {
    comment,
    isStudent: true,
    authorLabel: 'Student',
    formattedDate: 'May 1, 2026, 10:00 AM',
    upload: null,
    isUploadComment: false,
    isFileUrlComment: false,
    ...props,
  },
})

describe('CommentMessageBubble.vue', () => {
  it('renders student comment content with student styling', () => {
    const wrapper = mountBubble()

    expect(wrapper.text()).toContain('Student')
    expect(wrapper.text()).toContain('May 1, 2026, 10:00 AM')
    expect(wrapper.text()).toContain('Looks solid overall')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-indigo-50',
      'border-indigo-200',
      'rounded-tl-sm',
    ]))
  })

  it('renders instructor comment content with instructor styling', () => {
    const wrapper = mountBubble({
      isStudent: false,
      authorLabel: 'Instructor',
      formattedDate: 'May 1, 2026, 11:00 AM',
      comment: {
        id: 101,
        comments: 'Please revise the README',
      },
    })

    expect(wrapper.text()).toContain('Instructor')
    expect(wrapper.text()).toContain('May 1, 2026, 11:00 AM')
    expect(wrapper.text()).toContain('Please revise the README')
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      'bg-violet-50',
      'border-violet-200',
      'rounded-tr-sm',
    ]))
  })

  it('emits a download event for upload comments with an upload', async () => {
    const wrapper = mountBubble({
      comment: {
        id: 102,
        comments: 'New file uploaded',
      },
      upload,
      isUploadComment: true,
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Download')
    expect(wrapper.emitted('download-file')).toEqual([[900]])
  })

  it('emits an open-url event for project link comments', async () => {
    const wrapper = mountBubble({
      comment: {
        id: 103,
        comments: 'Project link submitted',
      },
      upload,
      isFileUrlComment: true,
    })

    const link = wrapper.find('a')
    await link.trigger('click')

    expect(link.text()).toBe('click here')
    expect(link.attributes('target')).toBe('_blank')
    expect(wrapper.emitted('open-url')).toEqual([[900]])
  })

  it('emits open-url with undefined when a project link has no upload', async () => {
    const wrapper = mountBubble({
      comment: {
        id: 104,
        comments: 'Project link submitted',
      },
      isFileUrlComment: true,
    })

    await wrapper.find('a').trigger('click')

    expect(wrapper.emitted('open-url')).toEqual([[undefined]])
  })

  it('does not render action controls when the required flags or upload are missing', () => {
    const regularWrapper = mountBubble()
    const missingUploadWrapper = mountBubble({
      isUploadComment: true,
    })

    expect(regularWrapper.find('button').exists()).toBe(false)
    expect(regularWrapper.find('a').exists()).toBe(false)
    expect(missingUploadWrapper.find('button').exists()).toBe(false)
    expect(missingUploadWrapper.find('a').exists()).toBe(false)
  })
})
