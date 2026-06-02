<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/axios'

const route = useRoute()
const router = useRouter()

onMounted(async () => {

  try {

    const token = route.query.token

    if (!token) {
      router.push('/login')
      return
    }

    // store token
    localStorage.setItem('token', token)

    // fetch logged-in user
    const response = await api.get('api/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    // store user
    localStorage.setItem(
      'user',
      JSON.stringify(response.data)
    )

    // redirect
    router.push('/user-dashboard')

  } catch (error) {

    console.log(error)

    localStorage.removeItem('token')
    localStorage.removeItem('user')

    router.push('/login')
  }
})
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    Logging in...
  </div>
</template>
