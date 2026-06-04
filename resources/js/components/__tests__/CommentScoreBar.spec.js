import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CommentScoreBar from '../CommentScoreBar.vue'

const activeUpload = {
  id: 900,
  file_path: 'https://example.test/submissions/final-project.zip',
}

const mountScoreBar = (props = {}) => mount(CommentScoreBar, {
  props: {
    activeUpload,
    scoreInputs: {
      900: 86,
    },
    savingScoreUploadId: null,
    scoreSuccessUploads: {},
    ...props,
  },
})

describe('CommentScoreBar.vue', () => {
  it('renders the score label, uploaded file name, and current score input', () => {
    const wrapper = mountScoreBar()
    const input = wrapper.find('input')
    const fileName = wrapper.find('[title="final-project.zip"]')

    expect(wrapper.text()).toContain('Score')
    expect(wrapper.text()).toContain('· final-project.zip')
    expect(wrapper.text()).toContain('/10')
    expect(fileName.exists()).toBe(true)
    expect(input.element.value).toBe('86')
    expect(input.attributes('type')).toBe('number')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('100')
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('placeholder')).toBe('—')
  })

  it('emits score input, blur save, and keydown events with the upload id', async () => {
    const wrapper = mountScoreBar()
    const input = wrapper.find('input')

    await input.setValue('92')
    await input.trigger('blur')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update-score-input')).toEqual([[900, '92']])
    expect(wrapper.emitted('save-score')).toEqual([[900]])
    expect(wrapper.emitted('score-keydown')).toHaveLength(1)
    expect(wrapper.emitted('score-keydown')[0][0]).toBeInstanceOf(KeyboardEvent)
    expect(wrapper.emitted('score-keydown')[0][1]).toBe(900)
  })

  it('disables the input and shows saving status for the active upload', () => {
    const wrapper = mountScoreBar({
      savingScoreUploadId: 900,
      scoreSuccessUploads: {
        900: true,
      },
    })
    const input = wrapper.find('input')

    expect(input.attributes('disabled')).toBeDefined()
    expect(input.attributes('aria-busy')).toBe('true')
    expect(wrapper.text()).toContain('Saving…')
    expect(wrapper.text()).not.toContain('Saved')
  })

  it('shows saved status when the active upload has a success flag', () => {
    const wrapper = mountScoreBar({
      scoreSuccessUploads: {
        900: true,
      },
    })

    expect(wrapper.text()).toContain('Saved')
    expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('input').attributes('aria-busy')).toBe('false')
  })

  it('does not show saving or saved status for other upload ids', () => {
    const wrapper = mountScoreBar({
      savingScoreUploadId: 901,
      scoreSuccessUploads: {
        901: true,
      },
    })

    expect(wrapper.text()).not.toContain('Saving…')
    expect(wrapper.text()).not.toContain('Saved')
    expect(wrapper.find('input').attributes('disabled')).toBeUndefined()
  })

  it('falls back to the raw file path when no slash-delimited name is available', () => {
    const wrapper = mountScoreBar({
      activeUpload: {
        id: 'draft-upload',
        file_path: 'submission.pdf',
      },
      scoreInputs: {
        'draft-upload': '',
      },
    })

    expect(wrapper.text()).toContain('· submission.pdf')
    expect(wrapper.find('[title="submission.pdf"]').exists()).toBe(true)
    expect(wrapper.find('input').element.value).toBe('')
  })
})
