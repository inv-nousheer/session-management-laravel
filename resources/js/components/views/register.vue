<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const role = 'user' // Default to 'user' role for registration, can be modified as needed



const handleRegister = async () => {
  const registeredUser = await auth.register(name.value, email.value, password.value, role,confirmPassword.value)
  if (registeredUser ) {
    router.push(`/user-dashboard`)
  }
}
</script>

<template>

    <div class="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
      style="background-image: url('/background-img.avif')">

  <div class="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-8 border border-white/20">
    <h2 class="text-3xl font-extrabold text-white mb-6 text-center tracking-wide">Sign up</h2>
      <div v-if="auth.error" class="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
        {{ auth.error }}
      </div>

    <form class="space-y-5" >

    <div>
        <input type="text" v-model="name"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Full name" required />
      </div>

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
       <div>
        <input type="password" v-model="confirmPassword"
          class="w-full px-4 py-3 bg-white/20 text-white border border-white/30 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-white/70"
          placeholder="Confirm Password" required />
      </div>

      <button @click="handleRegister"
        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all"  :disabled="auth.loading"
        type="submit">
        {{ auth.loading ? 'Creating account...' : 'Create account' }}
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-white">
      Already have an account?
      <a  class="text-purple-400 hover:underline font-medium" href="/login">Sign in</a>
    </div>
  </div>
</div>
</template>
