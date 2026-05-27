import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Register from '../Register.vue'

const mocks = vi.hoisted(() => ({
  auth: {
    loading: false,
    error: null,
    register: vi.fn(),
  },
  router: {
    push: vi.fn(),
  },
  route: {
    name: 'register',
    path: '/register',
    query: {},
  },
}))

vi.mock('../../../stores/auth', () => ({
  useAuthStore: () => mocks.auth,
}))

vi.mock('vue-router', () => ({
  useRouter: () => mocks.router,
  useRoute: () => mocks.route,
}))

const mountRegister = () => mount(Register, {
  attachTo: document.body,
})

const setField = async (wrapper, placeholder, value) => {
  await wrapper.find(`input[placeholder="${placeholder}"]`).setValue(value)
}

const clickCreateAccount = async (wrapper) => {
  await wrapper.findAll('button').find((button) => button.text().includes('Sign Up')).trigger('click')
  await flushPromises()
}

describe('register.vue', () => {
  beforeEach(() => {
    mocks.auth.loading = false
    mocks.auth.error = null
    mocks.auth.register.mockReset()
    mocks.router.push.mockReset()
    mocks.route.name = 'register'
    mocks.route.path = '/register'
    mocks.route.query = {}
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('renders the registration form and sign-in link', () => {
    const wrapper = mountRegister()

    expect(wrapper.text()).toContain('Create Account')
    expect(wrapper.text()).toContain('LOG IN')
    expect(wrapper.text()).toContain('SIGN UP')
    expect(wrapper.find('input[placeholder="Alex Johnson"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="you@example.com"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Min. 8 characters"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="Repeat your password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Already have an account?')
    expect(wrapper.findAll('a[href="/login"]').map((link) => link.text())).toEqual(['LOG IN', 'Sign in'])
  })

  it('registers a new user with the default user role and redirects to the dashboard', async () => {
    mocks.auth.register.mockResolvedValueOnce({ id: 7, role: 'user' })
    const wrapper = mountRegister()

    await setField(wrapper, 'Alex Johnson', 'Ada Lovelace')
    await setField(wrapper, 'you@example.com', 'ada@example.com')
    await setField(wrapper, 'Min. 8 characters', 'secret123')
    await setField(wrapper, 'Repeat your password', 'secret123')
    await clickCreateAccount(wrapper)

    expect(mocks.auth.register).toHaveBeenCalledWith(
      'Ada Lovelace',
      'ada@example.com',
      'secret123',
      'user',
      'secret123',
    )
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard')
  })

  it('does not redirect when registration fails and displays auth errors', async () => {
    mocks.auth.error = 'Email has already been taken'
    mocks.auth.register.mockResolvedValueOnce(null)
    const wrapper = mountRegister()

    expect(wrapper.text()).toContain('Email has already been taken')

    await setField(wrapper, 'Alex Johnson', 'Ada Lovelace')
    await setField(wrapper, 'you@example.com', 'ada@example.com')
    await setField(wrapper, 'Min. 8 characters', 'secret123')
    await setField(wrapper, 'Repeat your password', 'secret456')
    await clickCreateAccount(wrapper)

    expect(mocks.auth.register).toHaveBeenCalledWith(
      'Ada Lovelace',
      'ada@example.com',
      'secret123',
      'user',
      'secret456',
    )
    expect(mocks.router.push).not.toHaveBeenCalled()
  })

  it('disables the submit button and shows loading text while creating an account', () => {
    mocks.auth.loading = true
    const wrapper = mountRegister()
    const button = wrapper.find('button[type="submit"]')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Creating account…')
  })
})
