<script setup lang="ts">
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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getQueryParam = (value: unknown) => {
  return Array.isArray(value) ? value[0] ?? '' : value?.toString() ?? ''
}

const isResetPassword = computed(() => route.name === 'reset-password')
const resetToken = computed(() => getQueryParam(route.query.token))
const displayTitle = computed(() => {
  if (isResetPassword.value) return 'Reset Password'
  return formMode.value === 'forgot' ? 'Forgot Password' : 'Welcome Back!'
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
const loginWithGoogle = () => {
  window.location.href = 'http://127.0.0.1:8000/api/auth/google'
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">

      <!-- LEFT PANEL: Visual -->
      <div class="left-panel">
        <!-- Decorative gradient overlay -->
        <div class="panel-overlay"></div>

        <!-- Logo -->
        <div class="brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="brand-name">SessionManagement</span>
        </div>

        <!-- Illustration / background image -->
        <div class="panel-image">
          <!-- Abstract session management visual using SVG -->
          <svg class="hero-svg" viewBox="0 0 480 520" xmlns="http://www.w3.org/2000/svg">
            <!-- Glow background -->
            <defs>
              <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </radialGradient>
              <filter id="blur1">
                <feGaussianBlur stdDeviation="18"/>
              </filter>
            </defs>

            <!-- Soft glows -->
            <ellipse cx="240" cy="260" rx="200" ry="180" fill="url(#glow1)" filter="url(#blur1)"/>
            <ellipse cx="320" cy="380" rx="140" ry="120" fill="url(#glow2)" filter="url(#blur1)"/>

            <!-- Central device frame -->
            <rect x="130" y="120" width="220" height="290" rx="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9"/>
            <rect x="145" y="140" width="190" height="240" rx="12" fill="#0f0e2a" opacity="0.9"/>

            <!-- Screen content lines -->
            <rect x="162" y="162" width="80" height="8" rx="4" fill="#6366f1" opacity="0.8"/>
            <rect x="162" y="180" width="120" height="5" rx="3" fill="#4f46e5" opacity="0.4"/>
            <rect x="162" y="194" width="100" height="5" rx="3" fill="#4f46e5" opacity="0.4"/>

            <!-- Session cards -->
            <rect x="162" y="218" width="155" height="36" rx="8" fill="#1e1b4b" stroke="#6366f1" stroke-width="1" opacity="0.9"/>
            <circle cx="180" cy="236" r="8" fill="#10b981" opacity="0.9"/>
            <rect x="196" y="229" width="60" height="5" rx="3" fill="#e0e7ff" opacity="0.7"/>
            <rect x="196" y="239" width="40" height="4" rx="2" fill="#818cf8" opacity="0.5"/>

            <rect x="162" y="262" width="155" height="36" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" opacity="0.7"/>
            <circle cx="180" cy="280" r="8" fill="#f59e0b" opacity="0.9"/>
            <rect x="196" y="273" width="70" height="5" rx="3" fill="#e0e7ff" opacity="0.7"/>
            <rect x="196" y="283" width="45" height="4" rx="2" fill="#818cf8" opacity="0.5"/>

            <rect x="162" y="306" width="155" height="36" rx="8" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" opacity="0.6"/>
            <circle cx="180" cy="324" r="8" fill="#6366f1" opacity="0.9"/>
            <rect x="196" y="317" width="55" height="5" rx="3" fill="#e0e7ff" opacity="0.7"/>
            <rect x="196" y="327" width="35" height="4" rx="2" fill="#818cf8" opacity="0.5"/>

            <!-- Bottom button -->
            <rect x="162" y="358" width="155" height="14" rx="7" fill="#6366f1" opacity="0.85"/>

            <!-- Floating stat card top-right -->
            <rect x="295" y="90" width="140" height="64" rx="12" fill="#1a1740" stroke="#6366f1" stroke-width="1" opacity="0.95"/>
            <text x="315" y="115" font-family="monospace" font-size="10" fill="#a5b4fc">Active Sessions</text>
            <text x="315" y="136" font-family="monospace" font-size="18" font-weight="bold" fill="#10b981">24</text>
            <text x="350" y="136" font-family="monospace" font-size="10" fill="#10b981"> +12.5%</text>

            <!-- Floating stat card bottom-left -->
            <rect x="45" y="360" width="140" height="64" rx="12" fill="#1a1740" stroke="#10b981" stroke-width="1" opacity="0.95"/>
            <text x="65" y="385" font-family="monospace" font-size="10" fill="#a5b4fc">Uptime</text>
            <text x="65" y="406" font-family="monospace" font-size="18" font-weight="bold" fill="#a5b4fc">99.9%</text>

            <!-- Connecting lines -->
            <line x1="295" y1="122" x2="350" y2="155" stroke="#6366f1" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
            <line x1="185" y1="360" x2="155" y2="394" stroke="#10b981" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
          </svg>
        </div>

        <!-- Bottom tagline -->
        <div class="panel-tagline">
          <p class="tagline-heading">Manage every session,<br>from one place.</p>
          <p class="tagline-sub">Real-time visibility. Zero blind spots.</p>
        </div>
      </div>

      <!-- RIGHT PANEL: Form -->
      <div class="right-panel">
        <div class="form-container">

          <!-- Tabs (only on login mode) -->
          <div class="form-tabs" v-if="!isResetPassword && formMode === 'login'">
            <button class="tab active">LOG IN</button>
            <a href="/register" class="tab">SIGN UP</a>
          </div>

          <h2 class="form-title">{{ displayTitle }}</h2>

          <!-- Alerts -->
          <div v-if="auth.error" class="alert alert-error">{{ auth.error }}</div>
          <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

          <!-- Reset Password Form -->
          <form v-if="isResetPassword" class="form" @submit.prevent="handleResetPassword">
            <div class="field-group">
              <label class="field-label">Email address</label>
              <div class="field-wrap">
                <input type="email" v-model="email" class="field-input" placeholder="you@example.com" required />
                <span class="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">New password</label>
              <div class="field-wrap">
                <input type="password" v-model="password" class="field-input" placeholder="Min. 8 characters" required />
                <span class="field-icon lock-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Confirm new password</label>
              <div class="field-wrap">
                <input type="password" v-model="passwordConfirmation" class="field-input" placeholder="Repeat new password" required />
                <span class="field-icon lock-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
            </div>
            <button class="submit-btn" :disabled="auth.loading" type="submit">
              {{ auth.loading ? 'Resetting…' : 'Reset Password' }}
            </button>
          </form>

          <!-- Forgot Password Form -->
          <form v-else-if="formMode === 'forgot'" class="form" @submit.prevent="handleForgotPassword">
            <p class="forgot-hint">Enter your email and we'll send you a reset link.</p>
            <div class="field-group">
              <label class="field-label">Email address</label>
              <div class="field-wrap">
                <input type="email" v-model="email" class="field-input" placeholder="you@example.com" required />
                <span class="field-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
              </div>
            </div>
            <button class="submit-btn" :disabled="auth.loading" type="submit">
              {{ auth.loading ? 'Sending…' : 'Send Reset Link' }}
            </button>
            <button type="button" class="back-link" @click="showLogin">← Back to sign in</button>
          </form>

          <!-- Login Form -->
          <form v-else class="form" @submit.prevent="handleLogin">
            <div class="field-group">
              <label class="field-label">Email (Login)</label>
              <div class="field-wrap">
                <input type="email" v-model="email" class="field-input" placeholder="you@example.com" required />
                <span class="field-icon valid-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              </div>
            </div>
            <div class="field-group">
              <label class="field-label">Password</label>
              <div class="field-wrap">
                <input type="password" v-model="password" class="field-input" placeholder="Min. 8 characters" required />
                <span class="field-icon lock-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
            </div>
            <button @click="loginWithGoogle">
                Login with Google
            </button>
            <div class="form-footer-row">
              <button type="button" class="forgot-link" @click="showForgotPassword">Forgot password?</button>
            </div>
            <button class="submit-btn" :disabled="auth.loading" type="submit">
              {{ auth.loading ? 'Signing in…' : 'Sign In' }}
            </button>
            <p class="signup-cta">
              Don't have an account?
              <a href="/register" class="signup-link">Sign up</a>
            </p>
          </form>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0a1a;
  padding: 24px;
  font-family: 'DM Sans', sans-serif;
}

.auth-card {
  display: flex;
  width: 100%;
  max-width: 980px;
  min-height: 620px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15);
}

/* ── LEFT PANEL ── */
.left-panel {
  flex: 1.1;
  position: relative;
  background: linear-gradient(155deg, #110f2e 0%, #1a1740 50%, #0f1a2e 100%);
  display: flex;
  flex-direction: column;
  padding: 32px 36px;
  overflow: hidden;
}

.panel-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 70% 30%, rgba(99,102,241,0.18) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 30% 80%, rgba(16,185,129,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99,102,241,0.4);
}

.brand-name {
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
}

.panel-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.hero-svg {
  width: 100%;
  max-width: 420px;
  height: auto;
  filter: drop-shadow(0 20px 60px rgba(99,102,241,0.3));
}

.panel-tagline {
  position: relative;
  z-index: 2;
  padding-bottom: 8px;
}

.tagline-heading {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.35;
  margin-bottom: 6px;
}

.tagline-sub {
  font-size: 13px;
  color: rgba(165,180,252,0.75);
  font-weight: 500;
}

/* ── RIGHT PANEL ── */
.right-panel {
  flex: 0.9;
  background: #0f0e24;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 44px;
}

.form-container {
  width: 100%;
  max-width: 360px;
}

/* Tabs */
.form-tabs {
  display: flex;
  background: rgba(255,255,255,0.04);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 28px;
  border: 1px solid rgba(255,255,255,0.06);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 9px 0;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.4);
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  border: none;
  background: transparent;
}

.tab.active {
  background: #6366f1;
  color: #fff;
  box-shadow: 0 2px 12px rgba(99,102,241,0.4);
}

/* Title */
.form-title {
  font-family: 'sans-serif';
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 24px;
  letter-spacing: -0.01em;
}

/* Alerts */
.alert {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 18px;
  font-weight: 500;
}
.alert-error {
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.3);
  color: #fca5a5;
}
.alert-success {
  background: rgba(16,185,129,0.12);
  border: 1px solid rgba(16,185,129,0.3);
  color: #6ee7b7;
}

/* Form */
.form { display: flex; flex-direction: column; gap: 18px; }

.field-group { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: rgba(165,180,252,0.7);
  text-transform: uppercase;
}

.field-wrap {
  position: relative;
}

.field-input {
  width: 100%;
  padding: 13px 42px 13px 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  outline: none;
}

.field-input::placeholder { color: rgba(255,255,255,0.3); }

.field-input:focus {
  border-color: #6366f1;
  background: rgba(99,102,241,0.07);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
}

.field-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
}

.valid-icon { color: #10b981; }
.lock-icon { color: rgba(165,180,252,0.5); }

/* Footer row */
.form-footer-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -6px;
}

.forgot-link {
  background: none;
  border: none;
  color: rgba(165,180,252,0.7);
  font-size: 13px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  transition: color 0.2s;
  padding: 0;
}
.forgot-link:hover { color: #a5b4fc; }

/* Submit button */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(16,185,129,0.35);
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  box-shadow: 0 6px 28px rgba(16,185,129,0.5);
  transform: translateY(-1px);
}
.submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* Sign up CTA */
.signup-cta {
  text-align: center;
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  margin-top: 4px;
}
.signup-link {
  color: #818cf8;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.signup-link:hover { color: #a5b4fc; }

/* Back link */
.back-link {
  background: none;
  border: none;
  color: #818cf8;
  font-size: 13px;
  cursor: pointer;
  font-family:sans-serif;
  font-weight: 600;
  text-align: center;
  transition: color 0.2s;
  padding: 0;
}
.back-link:hover { color: #a5b4fc; }

.forgot-hint {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  line-height: 1.6;
  margin-top: -6px;
}

/* ── RESPONSIVE ── */
@media (max-width: 700px) {
  .auth-card { flex-direction: column; min-height: unset; }
  .left-panel { padding: 28px 24px 20px; min-height: 220px; }
  .panel-image { display: none; }
  .right-panel { padding: 32px 24px; }
  .tagline-heading { font-size: 18px; }
}
</style>
