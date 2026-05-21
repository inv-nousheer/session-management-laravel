<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const email = ref('')
const password = ref('')
const name = ref('')
const confirmPassword = ref('')
const router = useRouter()
const auth = useAuthStore()
const role = 'user'

const handleRegister = async () => {
  const registeredUser = await auth.register(name.value, email.value, password.value, role, confirmPassword.value)
  if (registeredUser) {
    router.push(`/user-dashboard`)
  }
}
</script>

<template>
  <!-- Google Fonts -->
  <component :is="'link'" rel="preconnect" href="https://fonts.googleapis.com" />
  <component :is="'link'" rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <component :is="'link'" href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet" />

  <div class="min-h-screen flex items-center justify-center bg-[#0b0a1a] p-6" style="font-family: 'DM Sans', sans-serif;">
    <div class="w-full max-w-[960px] min-h-[620px] flex rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(99,102,241,0.15)]">

      <!-- ── LEFT PANEL ── -->
      <div class="relative flex-[1.1] flex flex-col p-8 overflow-hidden"
           style="background: linear-gradient(155deg, #110f2e 0%, #1a1740 50%, #0f1a2e 100%);">

        <!-- Glow overlay -->
        <div class="absolute inset-0 pointer-events-none"
             style="background: radial-gradient(ellipse 60% 50% at 70% 30%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(16,185,129,0.12) 0%, transparent 70%);"></div>

        <!-- Brand -->
        <div class="relative z-10 flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-[10px] flex items-center justify-center shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
               style="background: linear-gradient(135deg, #6366f1, #4f46e5);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="text-white text-lg font-bold tracking-wide" style="font-family: 'Syne', sans-serif;">SessionManagement</span>
        </div>

        <!-- SVG Illustration -->
        <div class="relative z-10 flex-1 flex items-center justify-center">
          <svg class="w-full max-w-[400px] drop-shadow-[0_20px_60px_rgba(99,102,241,0.3)]" viewBox="0 0 480 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#6366f1" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
              </radialGradient>
              <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </radialGradient>
              <filter id="bf"><feGaussianBlur stdDeviation="18"/></filter>
            </defs>
            <ellipse cx="240" cy="250" rx="200" ry="180" fill="url(#rg1)" filter="url(#bf)"/>
            <ellipse cx="320" cy="370" rx="140" ry="120" fill="url(#rg2)" filter="url(#bf)"/>

            <!-- Central card -->
            <rect x="110" y="80" width="260" height="330" rx="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.92"/>
            <rect x="126" y="100" width="228" height="290" rx="12" fill="#0f0e2a" opacity="0.95"/>

            <!-- Header -->
            <rect x="144" y="120" width="90" height="9" rx="4" fill="#6366f1" opacity="0.85"/>
            <rect x="144" y="138" width="140" height="5" rx="3" fill="#4f46e5" opacity="0.4"/>

            <!-- User row 1 -->
            <rect x="144" y="162" width="192" height="40" rx="9" fill="#1e1b4b" stroke="#6366f1" stroke-width="1" opacity="0.9"/>
            <circle cx="164" cy="182" r="10" fill="#10b981" opacity="0.9"/>
            <rect x="182" y="175" width="72" height="6" rx="3" fill="#e0e7ff" opacity="0.75"/>
            <rect x="182" y="187" width="48" height="4" rx="2" fill="#818cf8" opacity="0.5"/>
            <rect x="308" y="178" width="20" height="8" rx="4" fill="#10b981" opacity="0.7"/>

            <!-- User row 2 -->
            <rect x="144" y="210" width="192" height="40" rx="9" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" opacity="0.75"/>
            <circle cx="164" cy="230" r="10" fill="#f59e0b" opacity="0.9"/>
            <rect x="182" y="223" width="84" height="6" rx="3" fill="#e0e7ff" opacity="0.75"/>
            <rect x="182" y="235" width="56" height="4" rx="2" fill="#818cf8" opacity="0.5"/>
            <rect x="308" y="226" width="20" height="8" rx="4" fill="#f59e0b" opacity="0.7"/>

            <!-- User row 3 -->
            <rect x="144" y="258" width="192" height="40" rx="9" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" opacity="0.65"/>
            <circle cx="164" cy="278" r="10" fill="#6366f1" opacity="0.9"/>
            <rect x="182" y="271" width="66" height="6" rx="3" fill="#e0e7ff" opacity="0.75"/>
            <rect x="182" y="283" width="44" height="4" rx="2" fill="#818cf8" opacity="0.5"/>
            <rect x="308" y="274" width="20" height="8" rx="4" fill="#6366f1" opacity="0.7"/>

            <!-- User row 4 -->
            <rect x="144" y="306" width="192" height="40" rx="9" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1" opacity="0.55"/>
            <circle cx="164" cy="326" r="10" fill="#ec4899" opacity="0.9"/>
            <rect x="182" y="319" width="78" height="6" rx="3" fill="#e0e7ff" opacity="0.75"/>
            <rect x="182" y="331" width="50" height="4" rx="2" fill="#818cf8" opacity="0.5"/>
            <rect x="308" y="322" width="20" height="8" rx="4" fill="#ec4899" opacity="0.7"/>

            <!-- CTA button -->
            <rect x="144" y="360" width="192" height="16" rx="8" fill="#6366f1" opacity="0.85"/>

            <!-- Floating card top-right -->
            <rect x="310" y="55" width="148" height="68" rx="12" fill="#1a1740" stroke="#6366f1" stroke-width="1" opacity="0.95"/>
            <text x="328" y="80" font-family="monospace" font-size="10" fill="#a5b4fc">New Users</text>
            <text x="328" y="103" font-family="monospace" font-size="20" font-weight="bold" fill="#10b981">+128</text>
            <text x="376" y="103" font-family="monospace" font-size="10" fill="#10b981"> today</text>

            <!-- Floating card bottom-left -->
            <rect x="22" y="350" width="130" height="68" rx="12" fill="#1a1740" stroke="#10b981" stroke-width="1" opacity="0.95"/>
            <text x="40" y="375" font-family="monospace" font-size="10" fill="#a5b4fc">Sessions</text>
            <text x="40" y="398" font-family="monospace" font-size="20" font-weight="bold" fill="#a5b4fc">2.4k</text>

            <!-- Dashed connectors -->
            <line x1="310" y1="89" x2="370" y2="100" stroke="#6366f1" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
            <line x1="152" y1="360" x2="130" y2="384" stroke="#10b981" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
          </svg>
        </div>

        <!-- Tagline -->
        <div class="relative z-10 pb-2">
          <p class="text-white text-[22px] font-bold leading-snug mb-1.5" style="font-family: 'Syne', sans-serif;">
            Join our team<br>to get started.
          </p>
          <p class="text-[13px] font-medium" style="color: rgba(165,180,252,0.75);">Set up your account in under a minute.</p>
        </div>
      </div>

      <!-- ── RIGHT PANEL ── -->
      <div class="flex-[0.9] bg-[#0f0e24] flex items-center justify-center px-11 py-12">
        <div class="w-full max-w-[360px]">

          <!-- Tabs -->
          <div class="flex bg-white/[0.04] border border-white/[0.06] rounded-[10px] p-1 mb-7">
            <a href="/login"
               class="flex-1 text-center py-2.5 text-[11px] font-bold tracking-widest rounded-[7px] text-white/40 no-underline transition-all hover:text-white/60"
               style="font-family: 'Syne', sans-serif;">
              LOG IN
            </a>
            <button
              class="flex-1 text-center py-2.5 text-[11px] font-bold tracking-widest rounded-[7px] text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)] border-none cursor-pointer transition-all"
              style="font-family: 'Syne', sans-serif; background: #6366f1;">
              SIGN UP
            </button>
          </div>

          <!-- Title -->
          <h2 class="text-[32px] font-extrabold text-white mb-6 tracking-tight" style="font-family: 'sans-serif';">
            Create Account
          </h2>

          <!-- Error alert -->
          <div v-if="auth.error"
               class="mb-5 px-3.5 py-3 rounded-[10px] text-[13px] font-medium"
               style="background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;">
            {{ auth.error }}
          </div>

          <!-- Form -->
          <form class="flex flex-col gap-[18px]" @submit.prevent="handleRegister">

            <!-- Full Name -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-[0.05em] uppercase" style="color: rgba(165,180,252,0.7);">Full Name</label>
              <div class="relative">
                <input type="text" v-model="name" placeholder="Alex Johnson" required
                  class="w-full px-4 py-3.5 pr-11 rounded-[10px] text-white text-sm outline-none transition-all"
                  style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: 'DM Sans', sans-serif;"
                  @focus="($event.target as HTMLInputElement).style.cssText += '; border-color: #6366f1; background: rgba(99,102,241,0.07); box-shadow: 0 0 0 3px rgba(99,102,241,0.18);'"
                  @blur="($event.target as HTMLInputElement).style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);'"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center" style="color: rgba(255,255,255,0.3);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
              </div>
            </div>

            <!-- Email -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-[0.05em] uppercase" style="color: rgba(165,180,252,0.7);">Email (Login)</label>
              <div class="relative">
                <input type="email" v-model="email" placeholder="you@example.com" required
                  class="w-full px-4 py-3.5 pr-11 rounded-[10px] text-white text-sm outline-none transition-all"
                  style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: 'DM Sans', sans-serif;"
                  @focus="($event.target as HTMLInputElement).style.cssText += '; border-color: #6366f1; background: rgba(99,102,241,0.07); box-shadow: 0 0 0 3px rgba(99,102,241,0.18);'"
                  @blur="($event.target as HTMLInputElement).style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);'"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center" style="color: #10b981;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              </div>
            </div>

            <!-- Password -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-[0.05em] uppercase" style="color: rgba(165,180,252,0.7);">Password — must contain 8 characters or more</label>
              <div class="relative">
                <input type="password" v-model="password" placeholder="Min. 8 characters" required
                  class="w-full px-4 py-3.5 pr-11 rounded-[10px] text-white text-sm outline-none transition-all"
                  style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: 'DM Sans', sans-serif;"
                  @focus="($event.target as HTMLInputElement).style.cssText += '; border-color: #6366f1; background: rgba(99,102,241,0.07); box-shadow: 0 0 0 3px rgba(99,102,241,0.18);'"
                  @blur="($event.target as HTMLInputElement).style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);'"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center" style="color: rgba(165,180,252,0.5);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-semibold tracking-[0.05em] uppercase" style="color: rgba(165,180,252,0.7);">Confirm Password</label>
              <div class="relative">
                <input type="password" v-model="confirmPassword" placeholder="Repeat your password" required
                  class="w-full px-4 py-3.5 pr-11 rounded-[10px] text-white text-sm outline-none transition-all"
                  style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-family: 'DM Sans', sans-serif;"
                  @focus="($event.target as HTMLInputElement).style.cssText += '; border-color: #6366f1; background: rgba(99,102,241,0.07); box-shadow: 0 0 0 3px rgba(99,102,241,0.18);'"
                  @blur="($event.target as HTMLInputElement).style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);'"
                />
                <span class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center" style="color: rgba(165,180,252,0.5);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
              </div>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="auth.loading"
              class="w-full py-3.5 rounded-[10px] text-white text-[15px] font-bold tracking-wide border-none cursor-pointer mt-1 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
              style="font-family: 'Syne', sans-serif; background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 20px rgba(16,185,129,0.35);"
              @mouseover="!auth.loading && (($event.target as HTMLButtonElement).style.cssText += '; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(16,185,129,0.5);')"
              @mouseleave="($event.target as HTMLButtonElement).style.transform = ''; ($event.target as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(16,185,129,0.35)'"
            >
              {{ auth.loading ? 'Creating account…' : 'Sign Up' }}
            </button>

            <!-- Sign in link -->
            <p class="text-center text-[13px] mt-1" style="color: rgba(255,255,255,0.45);">
              Already have an account?
              <a href="/login" class="font-semibold no-underline transition-colors hover:opacity-80" style="color: #818cf8;">Sign in</a>
            </p>

          </form>
        </div>
      </div>

    </div>
  </div>
</template>
