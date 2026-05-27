import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Users from '../Users.vue'

const mocks = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('../../../services/axios', () => ({
  default: mocks.api,
}))

const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: 'user' },
]

const paginatedUsers = (data = users, overrides = {}) => ({
  data,
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: data.length ? 1 : 0,
  to: data.length,
  total: data.length,
  ...overrides,
})

const mountPanel = () => mount(Users, {
  attachTo: document.body,
})

const setField = async (wrapper, selector, value) => {
  const field = wrapper.find(selector)

  expect(field.exists()).toBe(true)
  await field.setValue(value)
}

const clickButton = async (wrapper, text) => {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))

  expect(button).toBeTruthy()
  await button.trigger('click')
  await nextTick()
}

describe('users.vue', () => {
  beforeEach(() => {
    mocks.api.get.mockReset()
    mocks.api.post.mockReset()
    mocks.api.put.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('fetches and renders users in the table', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: users })

    const wrapper = mountPanel()
    await flushPromises()

    expect(mocks.api.get).toHaveBeenCalledWith('/api/users', {
      params: { page: 1, per_page: 10 },
    })
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).toContain('Add User')
    expect(wrapper.text()).toContain('Import Users')
    expect(wrapper.text()).toContain('Download Format')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('ada@example.com')
    expect(wrapper.text()).toContain('admin')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('grace@example.com')
  })

  it('fetches the selected user page when pagination is clicked', async () => {
    mocks.api.get
      .mockResolvedValueOnce({
        data: paginatedUsers(users, {
          current_page: 1,
          last_page: 3,
          from: 1,
          to: 2,
          total: 6,
        }),
      })
      .mockResolvedValueOnce({
        data: paginatedUsers([{ id: 3, name: 'Dorothy Vaughan', email: 'dorothy@example.com', role: 'member' }], {
          current_page: 2,
          last_page: 3,
          from: 3,
          to: 3,
          total: 6,
        }),
      })

    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).toContain('Showing 1-2 of 6')

    await wrapper.findAll('button').find((button) => button.text() === '2').trigger('click')
    await flushPromises()

    expect(mocks.api.get).toHaveBeenLastCalledWith('/api/users', {
      params: { page: 2, per_page: 10 },
    })
    expect(wrapper.text()).toContain('Showing 3-3 of 6')
    expect(wrapper.text()).toContain('Dorothy Vaughan')
  })

  it('renders loading, empty, and error states', async () => {
    let resolveUsers
    mocks.api.get.mockReturnValueOnce(new Promise((resolve) => {
      resolveUsers = resolve
    }))
    const loadingWrapper = mountPanel()
    await nextTick()

    expect(loadingWrapper.text()).toContain('Loading users...')
    resolveUsers({ data: [] })
    await flushPromises()
    expect(loadingWrapper.text()).toContain('No users found.')
    loadingWrapper.unmount()

    mocks.api.get.mockRejectedValueOnce(new Error('Network error'))
    const errorWrapper = mountPanel()
    await flushPromises()

    expect(errorWrapper.text()).toContain('Failed to load users.')
  })

  it('validates the create user form before submitting', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [] })
    const wrapper = mountPanel()
    await flushPromises()

    await clickButton(wrapper, 'Add User')
    expect(wrapper.text()).toContain('Create New User')

    await clickButton(wrapper, 'Create User')

    expect(mocks.api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Name is required')
  })

  it('creates a user and refreshes the list', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: users })
    mocks.api.post.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await clickButton(wrapper, 'Add User')
    await setField(wrapper, 'input[placeholder="Enter name"]', 'Katherine Johnson')
    await setField(wrapper, 'input[placeholder="Enter email"]', 'katherine@example.com')
    await wrapper.find('select').setValue('tl')
    await setField(wrapper, 'input[placeholder="Enter password"]', 'secret123')
    await clickButton(wrapper, 'Create User')
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith('/api/users', {
      name: 'Katherine Johnson',
      email: 'katherine@example.com',
      role: 'tl',
      password: 'secret123',
    })
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('Create New User')
    expect(wrapper.text()).toContain('Ada Lovelace')
  })

  it('opens edit mode, maps legacy user role to member, and updates a user', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: users })
      .mockResolvedValueOnce({ data: users })
    mocks.api.put.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').filter((button) => button.text().includes('Edit'))[1].trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Edit User')
    expect(wrapper.find('input[placeholder="Enter name"]').element.value).toBe('Grace Hopper')
    expect(wrapper.find('input[placeholder="Enter email"]').element.value).toBe('grace@example.com')
    expect(wrapper.find('select').element.value).toBe('member')

    await setField(wrapper, 'input[placeholder="Enter name"]', 'Grace M. Hopper')
    await clickButton(wrapper, 'Save User')
    await flushPromises()

    expect(mocks.api.put).toHaveBeenCalledWith('/api/users/2', {
      name: 'Grace M. Hopper',
      email: 'grace@example.com',
      role: 'member',
    })
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('Edit User')
  })

  it('includes password when editing if a new password is entered', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: users })
      .mockResolvedValueOnce({ data: users })
    mocks.api.put.mockResolvedValueOnce({})
    const wrapper = mountPanel()
    await flushPromises()

    await wrapper.findAll('button').filter((button) => button.text().includes('Edit'))[0].trigger('click')
    await nextTick()
    await setField(wrapper, 'input[placeholder="Leave blank to keep current password"]', 'new-secret')
    await clickButton(wrapper, 'Save User')
    await flushPromises()

    expect(mocks.api.put).toHaveBeenCalledWith('/api/users/1', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'admin',
      password: 'new-secret',
    })
  })

  it('shows server validation errors when creating fails', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: [] })
    mocks.api.post.mockRejectedValueOnce({
      response: {
        data: {
          errors: {
            email: ['Email has already been taken.'],
          },
        },
      },
    })
    const wrapper = mountPanel()
    await flushPromises()

    await clickButton(wrapper, 'Add User')
    await setField(wrapper, 'input[placeholder="Enter name"]', 'Ada Lovelace')
    await setField(wrapper, 'input[placeholder="Enter email"]', 'ada@example.com')
    await setField(wrapper, 'input[placeholder="Enter password"]', 'secret123')
    await clickButton(wrapper, 'Create User')
    await flushPromises()

    expect(wrapper.text()).toContain('Email has already been taken.')
    expect(wrapper.text()).toContain('Create New User')
  })

  it('opens import modal and disables import until a CSV file is selected', async () => {
    mocks.api.get.mockResolvedValueOnce({ data: users })
    const wrapper = mountPanel()
    await flushPromises()

    await clickButton(wrapper, 'Import Users')

    expect(document.body.textContent).toContain('Import Users from CSV')
    expect(document.body.textContent).toContain('CSV columns: name, email, password, role')

    const importButton = [...document.body.querySelectorAll('button')]
      .filter((button) => button.textContent.includes('Import Users'))
      .at(-1)
    expect(importButton.disabled).toBe(true)
  })

  it('imports users from CSV and refreshes users', async () => {
    mocks.api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: users })
    mocks.api.post.mockResolvedValueOnce({ data: { imported: 2, errors: [] } })
    const wrapper = mountPanel()
    await flushPromises()

    await clickButton(wrapper, 'Import Users')
    const fileInput = document.body.querySelector('#import-users-file')
    const file = new File(['name,email,password,role'], 'users.csv', { type: 'text/csv' })
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()

    const importButton = [...document.body.querySelectorAll('button')]
      .filter((button) => button.textContent.includes('Import Users'))
      .at(-1)
    expect(importButton.disabled).toBe(false)
    importButton.click()
    await flushPromises()

    expect(mocks.api.post).toHaveBeenCalledWith(
      '/api/users/import',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    expect(mocks.api.post.mock.calls[0][1].get('file')).toBe(file)
    expect(mocks.api.get).toHaveBeenCalledTimes(2)
    expect(document.body.textContent).toContain('Imported: 2 users.')
  })
})
