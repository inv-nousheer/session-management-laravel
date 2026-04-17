<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const user = localStorage.getItem('user')

const role: string = user ? JSON.parse(user).role ?? '' : ''


const handleLogin = async () => {
  const loggedInUser = await auth.login(email.value, password.value)
  if (loggedInUser) {
    router.push(`/dashboard`)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm w-full max-w-sm p-8">

      <div class="w-9 h-9 bg-indigo-600 rounded-lg mb-6"></div>

      <!-- Dynamic title based on role -->
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">
        Welcome back
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-7">Sign in to your account to continue</p>

      <!-- Error message -->
      <div v-if="auth.error" class="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
        {{ auth.error }}
      </div>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Email address</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            class="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label class="text-sm text-gray-600 dark:text-gray-400">Password</label>
            <a href="#" class="text-sm text-indigo-600 hover:text-indigo-500">Forgot password?</a>
          </div>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-7">Need an account? <a href="/register" class="text-indigo-600 hover:text-indigo-500">Sign up</a></p>

      </div>

      <button
        @click="handleLogin"
        :disabled="auth.loading"
        class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-medium rounded-lg transition"
      >
        {{ auth.loading ? 'Signing in...' : 'Sign in' }}
      </button>

    </div>
  </div>
</template>
