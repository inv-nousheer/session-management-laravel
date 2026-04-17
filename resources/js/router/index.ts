import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/views/login.vue'
import page from '../components/views/page.vue'
import Session from '../components/views/sessions.vue'
import Register from '../components/views/register.vue'
import sessionDetail from '../components/views/session-detail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    // { path: '/user-login', name: 'user-login', component: Login, meta: {  guestOnly: true, role: 'user' } },
    { path: '/login', name: 'login', component: Login, meta: {  guestOnly: true, role: 'admin' } },
    // { path: '/user-dashboard', name: 'user-dashboard', component: page, meta: {   requiresAuth: true, role: 'user' } },
    { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
    { path: '/sessions/:id', name: 'sessionDetail', component: sessionDetail, meta: { requiresAuth: true, role: 'admin'  } },

    // { path: '/student', name: 'student-login', component: Login, meta: { role: 'student', guestOnly: true } },
    // { path: '/teacher', name: 'teacher-login', component: Login, meta: { role: 'teacher', guestOnly: true } },

    {
      path: '/dashboard',
      name: 'page',
      component: page,
      meta: { requiresAuth: true, role: 'admin' }
    },


  ]
})

router.beforeEach((to, _, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  }
  else {
        next()
  }
})


export default router
