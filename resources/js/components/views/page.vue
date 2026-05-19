<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ─── Parse localStorage ONCE ──────────────────────────────────────────────
const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const role        = currentUser?.role  ?? null
const user_name   = currentUser?.name  ?? ''

const router = useRouter()
const route  = useRoute()

// ─── UI state ─────────────────────────────────────────────────────────────
const isSideMenuOpen  = ref(false)
const dark            = ref(false)
const profileMenuOpen = ref(false)
const profileMenuRef  = ref(null)

// ─── Active nav item — single computed, no duplicate useRoute() ───────────
const activeElement = computed(() => {
  const p = route.path
  if (role === 'admin') {
    if (p.startsWith('/dashboard/sessions')) return 'session'
    if (p.startsWith('/dashboard/users'))    return 'users'
    if (p.startsWith('/dashboard'))          return 'dashboard'
  } else {
    if (p.startsWith('/user-dashboard/session')) return 'session'
    if (p.startsWith('/user-dashboard/users'))   return 'users'
    if (p.startsWith('/user-dashboard'))         return 'dashboard'
  }
  return ''
})

const displayName = computed(() => user_name || 'User')
const userInitials = computed(() =>
  displayName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U'
)
const roleLabel = computed(() => {
  if (!role) return 'Team Member'
  return role === 'tl'
    ? 'Team Lead'
    : role.charAt(0).toUpperCase() + role.slice(1)
})

// ─── Theme ────────────────────────────────────────────────────────────────
const applyTheme = (isDark) => {
  dark.value = isDark
  document.documentElement.classList.toggle('dark', isDark)
}

const toggleTheme = () => {
  const next = !dark.value
  applyTheme(next)
  localStorage.setItem('theme', next ? 'dark' : 'light')
}

// ─── Profile menu ─────────────────────────────────────────────────────────
const toggleProfileMenu  = () => { profileMenuOpen.value = !profileMenuOpen.value }
const closeProfileMenu   = () => { profileMenuOpen.value = false }

const handleOutsideClick = (e) => {
  if (!profileMenuOpen.value) return
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target)) {
    closeProfileMenu()
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
  const saved      = localStorage.getItem('theme')
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(saved ? saved === 'dark' : preferDark)
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

// ─── Navigation helpers ───────────────────────────────────────────────────
const toggleSideMenu = () => { isSideMenuOpen.value = !isSideMenuOpen.value }

const goToDashboard = () =>
  router.push(role === 'admin' ? '/dashboard' : '/user-dashboard')

const goToSessions = () =>
  router.push(role === 'admin' ? '/dashboard/sessions' : '/user-dashboard/sessions')

const goToUsers = () =>
  router.push(role === 'tl' ? '/user-dashboard/users' : '/dashboard/users')

// ─── Logout ───────────────────────────────────────────────────────────────
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// ─── Nav items config — drives both desktop sidebar & mobile menu ─────────
const navItems = computed(() => [
  {
    key:     'dashboard',
    label:   'Dashboard',
    action:  goToDashboard,
    always:  true,
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    key:    'users',
    label:  'Users',
    action: goToUsers,
    always: role === 'admin' || role === 'tl',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    key:    'session',
    label:  'Sessions',
    action: goToSessions,
    always: true,
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
])

const visibleNavItems = computed(() => navItems.value.filter((n) => n.always))
</script>

<template>
  <div
    class="flex min-h-screen bg-slate-50 dark:bg-slate-950"
    :class="{ 'overflow-hidden': isSideMenuOpen }"
  >
    <!-- ── Desktop sidebar ──────────────────────────────────────────────── -->
    <aside
      class="z-20 hidden w-64 shrink-0 overflow-y-auto border-r border-violet-200/70 bg-linear-to-b from-violet-50 via-indigo-50/90 to-slate-50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 md:flex md:min-h-screen md:flex-col"
    >
      <div class="flex min-h-full flex-1 flex-col py-4 text-slate-600 dark:text-slate-400">
        <a
          class="ml-6 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          href="#"
        >
          Session Management
        </a>

        <ul class="mt-6">
          <li
            v-for="item in visibleNavItems"
            :key="item.key"
            class="relative px-6 py-3"
          >
            <!-- Active indicator bar -->
            <span
              v-if="activeElement === item.key"
              class="absolute inset-y-0 left-0 w-1 rounded-tr-lg rounded-br-lg bg-violet-600 dark:bg-violet-400"
              aria-hidden="true"
            ></span>

            <button
              :class="[
                'inline-flex items-center w-full text-sm font-semibold transition-colors duration-150',
                activeElement === item.key
                  ? 'text-violet-800 dark:text-white'
                  : 'text-slate-800 dark:text-slate-100 hover:text-violet-800 dark:hover:text-white',
              ]"
              @click="item.action"
            >
              <svg
                class="w-5 h-5 shrink-0"
                aria-hidden="true"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path :d="item.icon" />
              </svg>
              <span class="ml-4">{{ item.label }}</span>
            </button>
          </li>
        </ul>

        <div class="mt-auto px-4 pt-6">
          <div class="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-3 shadow-lg shadow-violet-100/70 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-200/70 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-slate-950/40 dark:hover:shadow-indigo-950/50">
            <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-indigo-500 to-fuchsia-500"></div>
            <div class="flex items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/30 ring-2 ring-white/80 dark:from-violet-500 dark:to-indigo-500 dark:ring-slate-800">
                {{ userInitials }}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  Logged in as
                </p>
                <p class="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {{ displayName }}
                </p>
                <div class="mt-1 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  {{ roleLabel }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ── Mobile overlay sidebar ──────────────────────────────────────── -->
    <Transition name="overlay">
      <div
        v-if="isSideMenuOpen"
        class="fixed inset-0 z-30 flex md:hidden"
        @click.self="toggleSideMenu"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- Drawer -->
        <aside class="relative z-10 flex min-h-full w-64 flex-col overflow-y-auto border-r border-violet-200/70 bg-linear-to-b from-violet-50 via-indigo-50/90 to-slate-50 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
          <div class="flex min-h-full flex-1 flex-col py-4">
            <div class="flex items-center justify-between px-6 mb-4">
              <span class="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Session Management
              </span>
              <button
                @click="toggleSideMenu"
                class="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul>
              <li
                v-for="item in visibleNavItems"
                :key="item.key"
                class="relative px-6 py-3"
              >
                <span
                  v-if="activeElement === item.key"
                  class="absolute inset-y-0 left-0 w-1 rounded-tr-lg rounded-br-lg bg-violet-600 dark:bg-violet-400"
                  aria-hidden="true"
                ></span>
                <button
                  :class="[
                    'inline-flex items-center w-full text-sm font-semibold transition-colors duration-150',
                    activeElement === item.key
                      ? 'text-violet-800 dark:text-white'
                      : 'text-slate-800 dark:text-slate-100 hover:text-violet-800 dark:hover:text-white',
                  ]"
                  @click="() => { item.action(); toggleSideMenu() }"
                >
                  <svg
                    class="w-5 h-5 shrink-0"
                    aria-hidden="true"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path :d="item.icon" />
                  </svg>
                  <span class="ml-4">{{ item.label }}</span>
                </button>
              </li>
            </ul>

            <div class="mt-auto px-4 pt-6">
              <div class="relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-3 shadow-lg shadow-violet-100/70 backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-slate-950/40">
                <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-indigo-500 to-fuchsia-500"></div>
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/30 ring-2 ring-white/80 dark:from-violet-500 dark:to-indigo-500 dark:ring-slate-800">
                    {{ userInitials }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-medium uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                      Logged in as
                    </p>
                    <p class="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {{ displayName }}
                    </p>
                    <div class="mt-1 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                      {{ roleLabel }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Transition>

    <!-- ── Main content area ──────────────────────────────────────────── -->
    <div class="flex flex-col flex-1 w-full min-w-0">

      <!-- Header -->
      <header class="z-10 border-b border-slate-200/90 bg-white/90 py-4 shadow-sm backdrop-blur-md dark:border-indigo-950/80 dark:bg-indigo-950/95 dark:shadow-indigo-950/20">
        <div class="container mx-auto flex h-full items-center justify-between px-6 text-slate-700 dark:text-indigo-100">

          <!-- Mobile hamburger -->
          <button
            class="-ml-1 mr-5 rounded-md p-1 text-slate-700 hover:bg-slate-100 focus:outline-none dark:text-indigo-100 dark:hover:bg-indigo-900/50 md:hidden"
            @click="toggleSideMenu"
            aria-label="Open menu"
          >
            <svg class="h-6 w-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <ul class="flex shrink-0 items-center space-x-6">

            <!-- Theme toggle -->
            <li class="flex">
              <button
                class="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none dark:text-indigo-200 dark:hover:bg-indigo-900/60"
                @click="toggleTheme"
                :aria-label="dark ? 'Switch to light mode' : 'Switch to dark mode'"
              >
                <!-- Moon (shown in light mode) -->
                <svg v-if="!dark" class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <!-- Sun (shown in dark mode) -->
                <svg v-else class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </li>

            <!-- Profile menu -->
            <li ref="profileMenuRef" class="relative">
              <button
                class="align-middle rounded-full ring-2 ring-transparent transition-shadow focus:outline-none focus:ring-violet-400/40 dark:focus:ring-violet-500/30"
                @click="toggleProfileMenu"
                @keydown.escape="closeProfileMenu"
                aria-label="Account menu"
                aria-haspopup="true"
                :aria-expanded="profileMenuOpen"
              >
                <img
                  class="object-cover w-8 h-8 rounded-full"
                  src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                  alt="User avatar"
                  width="32"
                  height="32"
                  loading="lazy"
                />
              </button>

              <Transition name="dropdown">
                <div
                  v-if="profileMenuOpen"
                  class="absolute right-0 mt-3 w-64 z-20 overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 shadow-xl backdrop-blur-sm"
                >
                  <div class="px-4 py-3 bg-linear-to-r from-purple-600 to-indigo-600">
                    <p class="text-xs uppercase tracking-wider text-purple-100">Signed in as</p>
                    <p class="text-sm font-semibold text-white truncate">{{ user_name }}</p>
                  </div>
                  <div class="p-2">
                    <button
                      type="button"
                      @click="closeProfileMenu"
                      class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      @click="logout"
                      class="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </Transition>
            </li>

          </ul>
        </div>
      </header>

      <!-- Page content -->
      <router-view />
    </div>
  </div>
</template>

<style scoped>
/* Mobile sidebar slide-in */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Profile dropdown */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
