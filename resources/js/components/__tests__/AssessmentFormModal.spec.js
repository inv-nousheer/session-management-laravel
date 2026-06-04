import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AssessmentFormModal from '../AssessmentFormModal.vue'

const mocks = vi.hoisted(() => ({
  picker: {
    destroy: vi.fn(),
    setDate: vi.fn(),
  },
  flatpickr: vi.fn(),
}))

vi.mock('flatpickr', () => ({
  default: mocks.flatpickr,
}))

const baseFormData = {
  name: 'Final Project',
  description: 'Submit your completed project',
  start_date_time: '2026-06-10',
  end_date_time: '2026-06-20',
}

const mountModal = (props = {}) => mount(AssessmentFormModal, {
  attachTo: document.body,
  props: {
    formData: { ...baseFormData },
    formError: '',
    submitting: false,
    isEditMode: false,
    supportingFileLabel: 'Choose PDF or PowerPoint file',
    sessionStartDate: '2026-06-01',
    ...props,
  },
})

const waitForDatePicker = async () => {
  await nextTick()
  await nextTick()
}

const findBodyElement = (selector) => {
  const element = document.body.querySelector(selector)

  expect(element).toBeTruthy()

  return element
}

const findBodyButton = (text) => {
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

const clickBodyElement = async (element) => {
  element.click()
  await nextTick()
}

describe('AssessmentFormModal.vue', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mocks.flatpickr.mockReset()
    mocks.picker.destroy.mockReset()
    mocks.picker.setDate.mockReset()
    document.body.innerHTML = ''
  })

  it('renders create mode fields, selected date range, file label, and errors', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      formError: 'Name is required',
    })
    await waitForDatePicker()

    expect(document.body.textContent).toContain('Create Assessment')
    expect(document.body.textContent).toContain('Fill in the details for your new assessment')
    expect(findBodyElement('input[placeholder="e.g., Final Project Submission"]').value).toBe('Final Project')
    expect(findBodyElement('textarea').value).toBe('Submit your completed project')
    expect(document.body.textContent).toContain('Selected: 2026-06-10 – 2026-06-20')
    expect(document.body.textContent).toContain('Choose PDF or PowerPoint file')
    expect(document.body.textContent).toContain('Name is required')
  })

  it('renders edit mode copy and submit button label', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      isEditMode: true,
    })
    await waitForDatePicker()

    expect(document.body.textContent).toContain('Edit Assessment')
    expect(document.body.textContent).toContain('Update assessment details below')
    expect(findBodyButton('Save Changes')).toBeTruthy()
  })

  it('emits parent-managed field, file, close, and submit events', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal()
    await waitForDatePicker()

    await updateBodyField('input[placeholder="e.g., Final Project Submission"]', 'Updated Project')
    await updateBodyField('textarea', 'Updated instructions')

    const fileInput = findBodyElement('input[type="file"]')
    const file = new File(['slides'], 'brief.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    await clickBodyElement(findBodyElement('.bg-black\\/60'))
    await clickBodyElement(findBodyButton('Cancel'))
    await clickBodyElement(findBodyButton('Create Assessment'))

    expect(wrapper.emitted('update-field')).toEqual([
      ['name', 'Updated Project'],
      ['description', 'Updated instructions'],
    ])
    expect(wrapper.emitted('file-change')).toHaveLength(1)
    expect(wrapper.emitted('file-change')[0][0].target.files[0]).toBe(file)
    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('submit')).toHaveLength(1)
  })

  it('initializes flatpickr with date range options and emits selected ranges', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal()
    await waitForDatePicker()

    expect(mocks.flatpickr).toHaveBeenCalledTimes(1)
    const [input, options] = mocks.flatpickr.mock.calls[0]

    expect(input).toBe(findBodyElement('input[readonly]'))
    expect(options.mode).toBe('range')
    expect(options.dateFormat).toBe('Y-m-d')
    expect(options.minDate).toEqual(new Date('2026-06-01T12:00:00'))
    expect(options.defaultDate).toEqual([
      new Date('2026-06-10T12:00:00'),
      new Date('2026-06-20T12:00:00'),
    ])
    expect(mocks.picker.setDate).toHaveBeenCalledWith(options.defaultDate, false)

    options.onChange([
      new Date('2026-06-12T12:00:00'),
      new Date('2026-06-25T12:00:00'),
    ])

    expect(wrapper.emitted('update-date-range')).toEqual([[
      {
        startDate: '2026-06-12',
        endDate: '2026-06-25',
      },
    ]])
  })

  it('keeps an existing edit start date selectable when it is before the session start date', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    mountModal({
      isEditMode: true,
      formData: {
        ...baseFormData,
        start_date_time: '2026-05-20T09:00:00Z',
        end_date_time: '2026-06-20 17:00:00',
      },
      sessionStartDate: '2026-06-01',
    })
    await waitForDatePicker()

    const options = mocks.flatpickr.mock.calls[0][1]

    expect(options.minDate).toEqual(new Date('2026-05-20T12:00:00'))
    expect(options.defaultDate).toEqual([
      new Date('2026-05-20T12:00:00'),
      new Date('2026-06-20T12:00:00'),
    ])
  })

  it('disables form controls while submitting and destroys flatpickr on unmount', async () => {
    mocks.flatpickr.mockReturnValue(mocks.picker)
    const wrapper = mountModal({
      submitting: true,
    })
    await waitForDatePicker()

    expect(findBodyElement('input[placeholder="e.g., Final Project Submission"]').disabled).toBe(true)
    expect(findBodyElement('textarea').disabled).toBe(true)
    expect(findBodyElement('input[readonly]').disabled).toBe(true)
    expect(findBodyElement('input[type="file"]').disabled).toBe(true)
    expect(findBodyButton('Cancel').disabled).toBe(true)
    expect(findBodyButton('Create Assessment').disabled).toBe(true)
    expect(document.body.textContent).toContain('⟳')

    wrapper.unmount()

    expect(mocks.picker.destroy).toHaveBeenCalledTimes(1)
  })
})
