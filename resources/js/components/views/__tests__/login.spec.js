import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Login from '../Login.vue'

const mocks = vi.hoisted(() => ({
  auth: {
    loading: false,
    error: null,
    login: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    clearError: vi.fn(),
  },
  router: {
    push: vi.fn(),
  },
  route: {
    name: 'login',
    path: '/login',
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

const mountLogin = () => mount(Login, {
  attachTo: document.body,
})

const setField = async (wrapper, placeholder, value) => {
  await wrapper.find(`input[placeholder="${placeholder}"]`).setValue(value)
}

const submitForm = async (wrapper) => {
  await wrapper.find('form').trigger('submit.prevent')
  await flushPromises()
}

describe('login.vue', () => {
  beforeEach(() => {
    mocks.auth.loading = false
    mocks.auth.error = null
    mocks.auth.login.mockReset()
    mocks.auth.forgotPassword.mockReset()
    mocks.auth.resetPassword.mockReset()
    mocks.auth.clearError.mockReset()
    mocks.router.push.mockReset()
    mocks.route.name = 'login'
    mocks.route.path = '/login'
    mocks.route.query = {}
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('renders the login form and signs an admin into the dashboard', async () => {
    mocks.auth.login.mockResolvedValueOnce({ id: 1, role: 'admin' })
    const wrapper = mountLogin()

    expect(wrapper.text()).toContain('Welcome Back!')
    expect(wrapper.text()).toContain('Forgot password?')
    expect(wrapper.text()).toContain("Don't have an account?")
    expect(wrapper.text()).toContain('LOG IN')
    expect(wrapper.text()).toContain('SIGN UP')
    expect(wrapper.text()).toContain('Login with Google')

    await setField(wrapper, 'you@example.com', 'admin@example.com')
    await setField(wrapper, 'Min. 8 characters', 'secret123')
    await submitForm(wrapper)

    expect(mocks.auth.login).toHaveBeenCalledWith('admin@example.com', 'secret123')
    expect(mocks.router.push).toHaveBeenCalledWith('/dashboard')
  })

  it('routes non-admin users to the user dashboard after login', async () => {
    mocks.auth.login.mockResolvedValueOnce({ id: 2, role: 'user' })
    const wrapper = mountLogin()

    await setField(wrapper, 'you@example.com', 'student@example.com')
    await setField(wrapper, 'Min. 8 characters', 'secret123')
    await submitForm(wrapper)

    expect(mocks.auth.login).toHaveBeenCalledWith('student@example.com', 'secret123')
    expect(mocks.router.push).toHaveBeenCalledWith('/user-dashboard')
  })

  it('renders the google login button without making it a form submit button', () => {
    const wrapper = mountLogin()
    const googleButton = wrapper.find('button.google-login-btn')

    expect(googleButton.exists()).toBe(true)
    expect(googleButton.attributes('type')).toBe('button')
    expect(googleButton.text()).toContain('Login with Google')
  })

  it('does not redirect when login fails and shows store errors', async () => {
    mocks.auth.error = 'Invalid credentials'
    mocks.auth.login.mockResolvedValueOnce(null)
    const wrapper = mountLogin()

    expect(wrapper.text()).toContain('Invalid credentials')

    await setField(wrapper, 'you@example.com', 'student@example.com')
    await setField(wrapper, 'Min. 8 characters', 'wrong-password')
    await submitForm(wrapper)

    expect(mocks.auth.login).toHaveBeenCalledWith('student@example.com', 'wrong-password')
    expect(mocks.router.push).not.toHaveBeenCalled()
  })

  it('switches to forgot password mode and sends a reset link', async () => {
    mocks.auth.forgotPassword.mockResolvedValueOnce('Password reset link sent')
    const wrapper = mountLogin()

    await wrapper.findAll('button').find((button) => button.text().includes('Forgot password?')).trigger('click')
    await nextTick()

    expect(mocks.auth.clearError).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Forgot Password')
    expect(wrapper.text()).toContain("Enter your email and we'll send you a reset link.")

    await setField(wrapper, 'you@example.com', 'student@example.com')
    await submitForm(wrapper)

    expect(mocks.auth.forgotPassword).toHaveBeenCalledWith('student@example.com')
    expect(wrapper.text()).toContain('Password reset link sent')
  })

  it('returns from forgot password mode back to sign in', async () => {
    const wrapper = mountLogin()

    await wrapper.findAll('button').find((button) => button.text().includes('Forgot password?')).trigger('click')
    await nextTick()
    await wrapper.findAll('button').find((button) => button.text().includes('Back to sign in')).trigger('click')
    await nextTick()

    expect(mocks.auth.clearError).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Welcome Back!')
    expect(wrapper.find('input[placeholder="Min. 8 characters"]').exists()).toBe(true)
  })

  it('renders reset password mode from the route query and resets the password', async () => {
    mocks.route.name = 'reset-password'
    mocks.route.path = '/reset-password'
    mocks.route.query = {
      email: 'student@example.com',
      token: 'reset-token',
    }
    mocks.auth.resetPassword.mockResolvedValueOnce('Password reset successfully')
    const wrapper = mountLogin()

    expect(wrapper.text()).toContain('Reset Password')
    expect(wrapper.find('input[placeholder="you@example.com"]').element.value).toBe('student@example.com')

    await setField(wrapper, 'Min. 8 characters', 'new-secret')
    await setField(wrapper, 'Repeat new password', 'new-secret')
    await submitForm(wrapper)

    expect(mocks.auth.resetPassword).toHaveBeenCalledWith(
      'student@example.com',
      'reset-token',
      'new-secret',
      'new-secret',
    )
    expect(mocks.router.push).toHaveBeenCalledWith('/login')
    expect(wrapper.text()).toContain('Password reset successfully')
    expect(wrapper.find('input[placeholder="Min. 8 characters"]').element.value).toBe('')
    expect(wrapper.find('input[placeholder="Repeat new password"]').element.value).toBe('')
  })
})
