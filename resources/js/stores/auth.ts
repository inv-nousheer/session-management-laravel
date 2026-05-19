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

    const getErrorMessage = (err: any, fallback: string) => {
        return err.response?.data?.message || err.response?.data?.error || fallback
    }

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
            error.value = getErrorMessage(err, 'Login failed')
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
            error.value = getErrorMessage(err, 'Registration failed')
            return null
        } finally {
            loading.value = false
        }
    }

    const forgotPassword = async (email: string) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/api/forgot-password', { email })

            return res.data.message
        } catch (err: any) {
            error.value = getErrorMessage(err, 'Unable to send password reset link')
            return null
        } finally {
            loading.value = false
        }
    }

    const resetPassword = async (
        email: string,
        token: string,
        password: string,
        password_confirmation: string
    ) => {
        loading.value = true
        error.value = null
        try {
            const res = await api.post('/api/reset-password', {
                email,
                token,
                password,
                password_confirmation,
            })

            return res.data.message
        } catch (err: any) {
            error.value = getErrorMessage(err, 'Unable to reset password')
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

    const clearError = () => {
        error.value = null
    }

    return {
        user,
        loading,
        error,
        login,
        logout,
        loadUserFromToken,
        loadUserFromStorage,
        register,
        forgotPassword,
        resetPassword,
        clearError,
    }
})
