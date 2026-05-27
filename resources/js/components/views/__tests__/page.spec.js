import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Page from '../Page.vue'

const mocks = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
  },
  route: {
    path: '/dashboard',
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
  useRoute: () => mocks.route,
}))

const mountPage = (user = { id: 1, name: 'Admin User', role: 'admin' }) => {
  localStorage.setItem('user', JSON.stringify(user))

  return mount(Page, {
    attachTo: document.body,
    global: {
      stubs: {
        RouterView: { template: '<main data-test="router-view">Route content</main>' },
      },
    },
  })
}

const getVisibleButtonByText = (wrapper, text) => wrapper
  .findAll('button')
  .find((button) => button.text().trim() === text)

const getVisibleButtonsByText = (wrapper, text) => wrapper
  .findAll('button')
  .filter((button) => button.text().trim() === text)

describe('page.vue', () => {
  beforeEach(() => {
    mocks.router.push.mockReset()
    mocks.route.path = '/dashboard'
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.body.innerHTML = ''
  })

  it('renders admin navigation and user identity from local storage', () => {
    const wrapper = mountPage({ id: 1, name: 'Ada Admin', role: 'admin' })

    expect(wrapper.text()).toContain('Session Management')
    expect(wrapper.text()).toContain('Logged in as')
    expect(wrapper.text()).toContain('Ada Admin')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('Route content')
    expect(getVisibleButtonsByText(wrapper, 'Dashboard')).toHaveLength(1)
    expect(getVisibleButtonsByText(wrapper, 'Users')).toHaveLength(1)
    expect(getVisibleButtonsByText(wrapper, 'Sessions')).toHaveLength(1)
  })

  it('navigates admin sidebar links to dashboard, users, and sessions routes', async () => {
    const wrapper = mountPage({ id: 1, name: 'Ada Admin', role: 'admin' })

    await getVisibleButtonByText(wrapper, 'Dashboard').trigger('click')
    await getVisibleButtonByText(wrapper, 'Users').trigger('click')
    await getVisibleButtonByText(wrapper, 'Sessions').trigger('click')

    expect(mocks.router.push).toHaveBeenNthCalledWith(1, '/dashboard')
    expect(mocks.router.push).toHaveBeenNthCalledWith(2, '/dashboard/users')
    expect(mocks.router.push).toHaveBeenNthCalledWith(3, '/dashboard/sessions')
  })

  it('hides Users navigation for regular members and uses user dashboard routes', async () => {
    mocks.route.path = '/user-dashboard'
    const wrapper = mountPage({ id: 2, name: 'Member User', role: 'user' })

    expect(wrapper.text()).toContain('Member User')
    expect(wrapper.text()).toContain('User')
    expect(getVisibleButtonsByText(wrapper, 'Dashboard')).toHaveLength(1)
    expect(getVisibleButtonsByText(wrapper, 'Users')).toHaveLength(0)
    expect(getVisibleButtonsByText(wrapper, 'Sessions')).toHaveLength(1)

    await getVisibleButtonByText(wrapper, 'Dashboard').trigger('click')
    await getVisibleButtonByText(wrapper, 'Sessions').trigger('click')

    expect(mocks.router.push).toHaveBeenNthCalledWith(1, '/user-dashboard')
    expect(mocks.router.push).toHaveBeenNthCalledWith(2, '/user-dashboard/sessions')
  })

  it('shows TL role label and routes Users to the user dashboard users page', async () => {
    mocks.route.path = '/user-dashboard/users'
    const wrapper = mountPage({ id: 3, name: 'Team Lead', role: 'tl' })

    expect(wrapper.text()).toContain('Team Lead')
    expect(getVisibleButtonsByText(wrapper, 'Users')).toHaveLength(1)

    await getVisibleButtonByText(wrapper, 'Users').trigger('click')

    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard/users')
  })

  it('initializes and toggles dark mode preference', async () => {
    localStorage.setItem('theme', 'dark')
    const wrapper = mountPage({ id: 1, name: 'Ada Admin', role: 'admin' })
    await nextTick()

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const themeToggle = wrapper.find('button[aria-label="Switch to light mode"]')
    await themeToggle.trigger('click')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('opens mobile navigation and closes it after selecting a mobile link', async () => {
    const wrapper = mountPage({ id: 1, name: 'Ada Admin', role: 'admin' })

    await wrapper.find('button[aria-label="Open menu"]').trigger('click')
    await nextTick()

    expect(wrapper.find('.fixed.inset-0.z-30').exists()).toBe(true)
    expect(getVisibleButtonsByText(wrapper, 'Dashboard')).toHaveLength(2)

    await getVisibleButtonsByText(wrapper, 'Sessions')[1].trigger('click')
    await nextTick()

    expect(mocks.router.push).toHaveBeenCalledWith('/dashboard/sessions')
    expect(wrapper.find('.fixed.inset-0.z-30').exists()).toBe(false)
  })

  it('opens the profile menu and closes it when clicking outside', async () => {
    const wrapper = mountPage({ id: 1, name: 'Ada Admin', role: 'admin' })

    await wrapper.find('button[aria-label="Account menu"]').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Signed in as')
    expect(wrapper.text()).toContain('Edit Profile')
    expect(wrapper.text()).toContain('Logout')

    document.body.click()
    await nextTick()

    expect(wrapper.text()).not.toContain('Edit Profile')
    expect(wrapper.text()).not.toContain('Logout')
  })
})
