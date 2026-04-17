import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/axios'

export const useAuthStore = defineStore('auth', () => {
    type AuthUser = {
        id: number
        name: string
        email: string
        role: string
        [key: string]: unknown
    }

    const user = ref<AuthUser | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const login = async (email: string, password: string) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/api/login', { email, password})

            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            user.value = res.data.user

            return res.data.user  // 👈 return user so we can read role
        } catch (err: any) {
            error.value = err.response?.data?.error || 'Login failed'
            return null
        } finally {
            loading.value = false
        }
    }

    const register = async (name: string, email: string, password: string, role: string, password_confirmation: string) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/api/register', { name, email, password, role, password_confirmation })

            localStorage.setItem('token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            user.value = res.data.user

            return res.data.user  // 👈 return user so we can read role
        } catch (err: any) {
            error.value = err.response?.data?.error || 'Registration failed'
            return null
        } finally {
            loading.value = false
        }
    }

    // load user on app start
    const loadUserFromStorage = () => {
        const stored = localStorage.getItem('user')
        if (stored) user.value = JSON.parse(stored)
    }

    const logout = () => {
        JSON.parse(localStorage.getItem('user') || 'null')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }
    const loadUserFromToken = () => {
        const token = localStorage.getItem('token')
        // optionally call /api/user to refresh user data on page reload
    }

    return { user, loading, error, login, logout, loadUserFromToken, loadUserFromStorage, register }
})
