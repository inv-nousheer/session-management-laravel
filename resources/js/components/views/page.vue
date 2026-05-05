<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import api from '../../services/axios.js'

import Dashboard from './dashboard.vue'
import User from './users.vue'

// state
const isSideMenuOpen = ref(false)
const dark = ref(false)
const profileMenuOpen = ref(false)

// router
const route = useRoute()
console.log('Current route:', route.name)

// computed
const role = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : null



// methods
const toggleSideMenu = () => {
  isSideMenuOpen.value = !isSideMenuOpen.value
}



onMounted(() => {
  const root = document.documentElement
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldUseDarkTheme = savedTheme ? savedTheme === 'dark' : prefersDark

  dark.value = shouldUseDarkTheme
  root.classList.toggle('dark', shouldUseDarkTheme)
})

const toggleTheme = () => {
  const root = document.documentElement
  const isDarkMode = root.classList.contains('dark')
  const nextThemeIsDark = !isDarkMode

  dark.value = nextThemeIsDark
  root.classList.toggle('dark', nextThemeIsDark)
  localStorage.setItem('theme', nextThemeIsDark ? 'dark' : 'light')
}

const toggleProfileMenu = () => {
  profileMenuOpen.value = !profileMenuOpen.value
}

const closeProfileMenu = () => {
  profileMenuOpen.value = false
}

const logout = async () => {
  try {
   const token = localStorage.getItem('token')

    await api.post('/api/logout', {}, {
    headers: {
        Authorization: `Bearer ${token}`
    }
    })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'


  } catch (error) {
    console.error('Logout failed:', error)
  }
}




const Route = useRoute()

const activeElement = computed(() => {
  return Route.path.startsWith('/user-dashboard/session') ? 'session' : Route.path.startsWith('/user-dashboard/users') ? 'users' :  Route.path.startsWith('/user-dashboard') ? 'dashboard' : '';
})
const adminActiveElement = computed(() => {
    return Route.path.startsWith('/dashboard/sessions') ? 'session' :  Route.path.startsWith('/dashboard/users') ? 'users' : Route.path.startsWith('/dashboard') ? 'dashboard' : '';
})
console.log('activeElement',activeElement)
console.log('adminactiveelement',adminActiveElement)
const router = useRouter()

const goToSessions = () => {
  if (role === 'admin') {
    router.push('/dashboard/sessions')
  } else {
    router.push('/user-dashboard/sessions')
  }
}

const goToUsers = () => {
    if(role == 'tl'){
         router.push('/user-dashboard/users')
    }else{
        router.push('/dashboard/users')
    }
}


const user_name = JSON.parse(localStorage.getItem('user'))?.name

</script>
<template>
 <div
      class="flex min-h-screen bg-white-900 dark:bg-gray-900"
      :class="{ 'overflow-hidden': isSideMenuOpen }"
    >
      <!-- Desktop sidebar -->
      <aside
        class="z-20 hidden w-64 overflow-y-auto bg-purple-200 dark:bg-gray-800 md:block flex-shrink-0"
      >
        <div class="py-4 text-gray-500 dark:text-gray-400">
          <a
            class="ml-6 text-lg font-bold text-gray-800 dark:text-gray-200"
            href="#"
          >
            Session Management
          </a>
          <ul class="mt-6">
            <li  class="relative px-6 py-3">
              <span  v-if="adminActiveElement === 'dashboard' || activeElement==='dashboard'"
                class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg"
                aria-hidden="true"
              ></span>
                <a

                    v-if="role === 'admin'"
                    class="inline-flex items-center w-full text-sm font-semibold text-gray-800 transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
                    @click="$router.push('/dashboard')"
                    href=""
                    >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  ></path>
                </svg>
                <span class="ml-4">Dashboard</span>
                </a>

                <a
                    v-else
                    :class="[
                    'inline-flex items-center w-full text-sm font-semibold transition-colors duration-150',
                    activeElement === 'dashboard'
                      ? 'text-gray-600 dark:text-white'
                      : 'text-gray-800 dark:text-gray-100 hover:text-gray-800 dark:hover:text-gray-200'
                    ]"
                     @click="$router.push('/user-dashboard')"
                    >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  ></path>
                </svg>
                <span class="ml-4">Dashboard</span>
                </a>


            </li>
            <li v-if="role==='admin' || role==='tl'" class="relative px-6 py-3">
                 <span v-if="adminActiveElement==='users' || activeElement==='users'"
                class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg "
                aria-hidden="true"
              ></span>
              <a
                class="inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-gray-800 dark:hover:text-gray-200 dark:text-gray-100"
               @click="goToUsers"
              >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  ></path>
                </svg>
                <span class="ml-4">Users</span>
              </a>
            </li>
            <li class="relative px-6 py-3">
                 <span v-if="activeElement === 'session' || adminActiveElement==='session'"
                class="absolute inset-y-0 left-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg"
                aria-hidden="true"
              ></span>
              <button
              :class="[
                    'inline-flex items-center w-full text-sm font-semibold transition-colors duration-150',
                    activeElement === 'dashboard'
                      ? 'text-gray-600 dark:text-white'
                      : 'text-gray-800 dark:text-gray-100 hover:text-gray-800 dark:hover:text-gray-200'
                    ]" @click="goToSessions"
              >
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
                <span class="ml-4">Sessions</span>
            </button>
            </li>
          </ul>

        </div>
      </aside>



      <div class="flex flex-col flex-1 w-full">
        <header class="z-10 py-4 bg-purple-200 shadow-md dark:bg-gray-800">
          <div
            class="container flex items-center justify-between h-full px-6 mx-auto text-purple-600 dark:text-purple-300"
          >
            <!-- Mobile hamburger -->
            <button
              class="p-1 mr-5 -ml-1 rounded-md md:hidden focus:outline-none focus:shadow-outline-purple"
              @click="toggleSideMenu"
              aria-label="Menu"
            >
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
            <!-- Search input -->
            <div class="flex justify-center flex-1 lg:mr-32">
              <div
                class="relative w-full max-w-xl mr-6 focus-within:text-purple-500"
              >


              </div>
            </div>
            <ul class="flex items-center flex-shrink-0 space-x-6">
              <!-- Theme toggler -->
              <li class="flex">
                <button
                  class="rounded-md focus:outline-none focus:shadow-outline-purple"
                  @click="toggleTheme"
                  aria-label="Toggle color mode"
                >
                  <template v-if="!dark">
                    <svg
                      class="w-5 h-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                      ></path>
                    </svg>
                  </template>
                  <template v-if="dark">
                    <svg
                      class="w-5 h-5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                  </template>
                </button>
              </li>

              <!-- Profile menu -->
              <li class="relative">
                <button
                  class="align-middle rounded-full focus:shadow-outline-purple focus:outline-none"
                  @click="toggleProfileMenu"
                  @keydown.escape="closeProfileMenu"
                  aria-label="Account"
                  aria-haspopup="true"
                >
                  <img
                    class="object-cover w-8 h-8 rounded-full"
                    src="https://images.unsplash.com/photo-1502378735452-bc7d86632805?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&s=aa3a807e1bbdfd4364d1f449eaa96d82"
                    alt=""
                    aria-hidden="true"
                  />
                </button>
                <div v-if="profileMenuOpen" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                    <p class="px-2 text-sm text-white">{{ user_name }} </p>
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Edit Profile</a>
                  <a href="#" @click="logout" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Logout</a>
                </div>
              </li>
            </ul>
          </div>
        </header>

         <router-view />

      </div>
    </div>
</template>
