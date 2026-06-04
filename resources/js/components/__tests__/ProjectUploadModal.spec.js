import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ProjectUploadModal from '../ProjectUploadModal.vue'

enableAutoUnmount(afterEach)

const baseFormData = {
  file_path: null,
  submission_link: '',
  notes: '',
}

const mountModal = (props = {}) => mount(ProjectUploadModal, {
  attachTo: document.body,
  props: {
    uploadSubmissionType: 'file',
    formData: { ...baseFormData },
    canSubmitUpload: false,
    submitting: false,
    isUploading: false,
    uploadProgress: 0,
    ...props,
  },
})

const findBodyElement = (selector) => {
  const element = document.body.querySelector(selector)

  expect(element).toBeTruthy()

  return element
}

const findBodyButton = (text) => {
  const button = [...document.body.querySelectorAll('button')]
    .find((element) => element.textContent.trim() === text)

  expect(button).toBeTruthy()

  return button
}

const findBodyButtonContaining = (text) => {
  const button = [...document.body.querySelectorAll('button')]
    .find((element) => element.textContent.trim().includes(text))

  expect(button).toBeTruthy()

  return button
}

const updateBodyField = async (selector, value) => {
  const field = findBodyElement(selector)

  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('ProjectUploadModal.vue', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the file upload mode by default', () => {
    mountModal({
      formData: {
        ...baseFormData,
        file_path: { name: 'final-project.zip' },
      },
      canSubmitUpload: true,
    })

    expect(document.body.textContent).toContain('Submit Assessment')
    expect(document.body.textContent).toContain('Upload a ZIP file or paste a project link')
    expect(document.body.textContent).toContain('ZIP File')
    expect(document.body.textContent).toContain('Drop your ZIP file here')
    expect(document.body.textContent).toContain('or click to browse')
    expect(document.body.textContent).toContain('final-project.zip')
    expect(findBodyElement('input[type="file"]').getAttribute('accept')).toBe('.zip,.tar,.tar.gz')
    expect(findBodyButton('File').className).toContain('bg-white')
  })

  it('emits switch-submission-type when mode buttons are clicked', async () => {
    const wrapper = mountModal()

    findBodyButton('Link').click()
    await nextTick()
    findBodyButton('File').click()
    await nextTick()

    expect(wrapper.emitted('switch-submission-type')).toEqual([['link'], ['file']])
  })

  it('emits file-change when a file is selected', async () => {
    const wrapper = mountModal()
    const fileInput = findBodyElement('input[type="file"]')
    const file = new File(['project'], 'submission.zip', { type: 'application/zip' })

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    expect(wrapper.emitted('file-change')).toHaveLength(1)
    expect(wrapper.emitted('file-change')[0][0].target.files[0]).toBe(file)
  })

  it('renders link mode validation and success states', () => {
    mountModal({
      uploadSubmissionType: 'link',
      formData: {
        ...baseFormData,
        submission_link: 'github.com/example/project',
      },
      canSubmitUpload: false,
    })

    expect(document.body.textContent).toContain('Project Link')
    expect(document.body.textContent).toContain('Enter a valid URL starting with http:// or https://')
    expect(findBodyElement('input[type="url"]').value).toBe('github.com/example/project')
    expect(findBodyButton('Link').className).toContain('bg-white')

    document.body.innerHTML = ''

    mountModal({
      uploadSubmissionType: 'link',
      formData: {
        ...baseFormData,
        submission_link: 'https://github.com/example/project',
      },
      canSubmitUpload: true,
    })

    expect(document.body.textContent).toContain('https://github.com/example/project')
    expect(document.body.textContent).not.toContain('Enter a valid URL starting with http:// or https://')
  })

  it('emits field updates for project links and notes', async () => {
    const wrapper = mountModal({
      uploadSubmissionType: 'link',
    })

    await updateBodyField('input[type="url"]', 'https://github.com/example/project')
    await updateBodyField('textarea', 'Repository submission')

    expect(wrapper.emitted('update-field')).toEqual([
      ['submission_link', 'https://github.com/example/project'],
      ['notes', 'Repository submission'],
    ])
  })

  it('emits close and submit actions from modal controls', async () => {
    const wrapper = mountModal({
      canSubmitUpload: true,
    })

    findBodyElement('.bg-black\\/60').click()
    await nextTick()
    findBodyButton('Cancel').click()
    await nextTick()
    findBodyButton('Submit').click()
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('disables submit when upload content is not valid', () => {
    mountModal({
      canSubmitUpload: false,
    })

    expect(findBodyButton('Submit').disabled).toBe(true)
  })

  it('renders upload progress and disables upload controls while uploading', () => {
    mountModal({
      isUploading: true,
      uploadProgress: 67,
    })

    const progressBar = findBodyElement('.from-purple-500.to-indigo-600')

    expect(document.body.textContent).toContain('Uploading...')
    expect(document.body.textContent).toContain('67%')
    expect(progressBar.getAttribute('style')).toContain('width: 67%')
    expect(findBodyElement('input[type="file"]').disabled).toBe(true)
    expect(findBodyElement('textarea').disabled).toBe(true)
    expect(findBodyButton('File').disabled).toBe(true)
    expect(findBodyButton('Link').disabled).toBe(true)
  })

  it('disables form controls while submitting and shows progress text on submit button', () => {
    mountModal({
      uploadSubmissionType: 'link',
      formData: {
        ...baseFormData,
        submission_link: 'https://github.com/example/project',
      },
      canSubmitUpload: true,
      submitting: true,
    })

    expect(findBodyElement('input[type="url"]').disabled).toBe(true)
    expect(findBodyElement('textarea').disabled).toBe(true)
    expect(findBodyButton('File').disabled).toBe(true)
    expect(findBodyButton('Link').disabled).toBe(true)
    expect(findBodyButton('Cancel').disabled).toBe(true)
    expect(findBodyButtonContaining('Submit').disabled).toBe(true)
    expect(document.body.textContent).toContain('⟳')
  })
})
