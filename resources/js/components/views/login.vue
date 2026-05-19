
<script  setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const successMessage = ref('')
const formMode = ref<'login' | 'forgot'>('login')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const getQueryParam = (value: unknown) => {
  return Array.isArray(value) ? value[0] ?? '' : value?.toString() ?? ''
}

const isResetPassword = computed(() => route.name === 'reset-password')
const resetToken = computed(() => getQueryParam(route.query.token))
const displayTitle = computed(() => {
  if (isResetPassword.value) return 'Reset password'
  return formMode.value === 'forgot' ? 'Forgot password' : 'Welcome back'
})

const handleLogin = async () => {
  const loggedInUser = await auth.login(email.value, password.value)
  if (!loggedInUser) return

  if (loggedInUser.role === 'admin') {
    router.push(`/dashboard`)
  } else {
    router.push(`/user-dashboard`)
  }
}

const handleForgotPassword = async () => {
  const message = await auth.forgotPassword(email.value)
  if (!message) return

  successMessage.value = message
}

const handleResetPassword = async () => {
  const message = await auth.resetPassword(email.value, resetToken.value, password.value, passwordConfirmation.value)
  if (!message) return

  successMessage.value = message
  password.value = ''
  passwordConfirmation.value = ''
  formMode.value = 'login'
  await router.push('/login')
}

if (isResetPassword.value) {
  email.value = getQueryParam(route.query.email)
}

const showForgotPassword = () => {
  auth.clearError()
  successMessage.value = ''
  formMode.value = 'forgot'
}

const showLogin = () => {
  auth.clearError()
  successMessage.value = ''
  formMode.value = 'login'
}

</script>

<template>


  <div class="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
     style="background-image: url('/background-img.avif')">

  <div class="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-8 border border-white/20">
    <h2 class="text-3xl font-extrabold text-white mb-6 text-center tracking-wide">{{ displayTitle }}</h2>
      <div v-if="auth.error" class="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
        {{ auth.error }}
      </div>
      <div v-if="successMessage" class="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
        {{ successMessage }}
      </div>

    <form v-if="isResetPassword" class="space-y-5" @submit.prevent="handleResetPassword">

      <div>
        <input type="email" v-model="email"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Email address" required />
      </div>

      <div>
        <input type="password" v-model="password"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="New password" required />
      </div>

      <div>
        <input type="password" v-model="passwordConfirmation"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Confirm new password" required />
      </div>

      <button
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"  :disabled="auth.loading"
        type="submit">
        {{ auth.loading ? 'Resetting password...' : 'Reset password' }}
      </button>
    </form>

    <form v-else-if="formMode === 'forgot'" class="space-y-5" @submit.prevent="handleForgotPassword">

      <p class="text-sm text-white/80">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <div>
        <input type="email" v-model="email"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Email address" required />
      </div>

      <button
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"  :disabled="auth.loading"
        type="submit">
        {{ auth.loading ? 'Sending link...' : 'Send reset link' }}
      </button>
    </form>

    <form v-else class="space-y-5" @submit.prevent="handleLogin">

      <div>
        <input type="email" v-model="email"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Email address" required />
      </div>

      <div>
        <input type="password" v-model="password"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Password" required />
      </div>

      <button
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"  :disabled="auth.loading"
        type="submit">
        {{ auth.loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <div v-if="!isResetPassword" class="mt-4 text-center text-sm text-white">
      <button v-if="formMode === 'login'" type="button" class="text-purple-400 hover:underline font-medium" @click="showForgotPassword">
        Forgot password?
      </button>
      <button v-else type="button" class="text-purple-400 hover:underline font-medium" @click="showLogin">
        Back to sign in
      </button>
    </div>

    <div class="mt-6 text-center text-sm text-white">
      Need an account?
      <a  class="text-purple-400 hover:underline font-medium" href="/register">Sign up</a>
    </div>
  </div>
</div>
</template>
