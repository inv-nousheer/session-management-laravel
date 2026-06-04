import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentReplyInput from '../CommentReplyInput.vue'

const mountInput = (props = {}) => mount(CommentReplyInput, {
  props: {
    replyText: '',
    canSubmit: false,
    submitting: false,
    parentCommentId: null,
    ...props,
  },
})

describe('CommentReplyInput.vue', () => {
  it('renders the default textarea and submit button state', () => {
    const wrapper = mountInput({
      replyText: 'Draft feedback',
    })

    expect(wrapper.find('textarea').element.value).toBe('Draft feedback')
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Write feedback…')
    expect(wrapper.find('textarea').attributes('rows')).toBe('2')
    expect(wrapper.find('button').text()).toBe('Send')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('renders custom placeholder, label, and button classes', () => {
    const wrapper = mountInput({
      placeholder: 'Reply to feedback',
      submitLabel: 'Reply',
      buttonClass: 'px-5 py-3 text-sm',
      canSubmit: true,
    })
    const buttonClasses = wrapper.find('button').classes()

    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Reply to feedback')
    expect(wrapper.find('button').text()).toBe('Reply')
    expect(buttonClasses).toEqual(expect.arrayContaining(['px-5', 'py-3', 'text-sm']))
  })

  it('emits update-reply when the textarea changes', async () => {
    const wrapper = mountInput()

    await wrapper.find('textarea').setValue('Please polish the README')

    expect(wrapper.emitted('update-reply')).toEqual([['Please polish the README']])
  })

  it('emits submit-reply with the parent comment id on button click', async () => {
    const wrapper = mountInput({
      canSubmit: true,
      parentCommentId: 101,
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('submit-reply')).toEqual([[101]])
  })

  it('emits submit-reply with null when there is no parent comment id', async () => {
    const wrapper = mountInput({
      canSubmit: true,
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('submit-reply')).toEqual([[null]])
  })

  it('submits on Enter only when submission is allowed', async () => {
    const enabledWrapper = mountInput({
      canSubmit: true,
      parentCommentId: 'parent-1',
    })
    const disabledWrapper = mountInput({
      canSubmit: false,
      parentCommentId: 'parent-1',
    })

    await enabledWrapper.find('textarea').trigger('keydown.enter')
    await disabledWrapper.find('textarea').trigger('keydown.enter')

    expect(enabledWrapper.emitted('submit-reply')).toEqual([['parent-1']])
    expect(disabledWrapper.emitted('submit-reply')).toBeUndefined()
  })

  it('disables the textarea and shows progress text while submitting', () => {
    const wrapper = mountInput({
      canSubmit: true,
      submitting: true,
    })

    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').text()).toBe('…')
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })
})
