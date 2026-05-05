import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/views/login.vue'
import page from '../components/views/page.vue'
import Session from '../components/views/sessions.vue'
import Register from '../components/views/register.vue'
import sessionDetail from '../components/views/session-detail.vue'
import Dashboard from '../components/views/dashboard.vue'
import UserDashboard from '../components/views/userDashboard.vue'
import Users from '../components/views/users.vue'
import UsersList from '../components/views/usersList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    // { path: '/user-login', name: 'user-login', component: Login, meta: {  guestOnly: true, role: 'user' } },
    { path: '/login', name: 'login', component: Login, meta: {  guestOnly: true, role: 'admin' } },
    { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
    { path: '/session-detail/:id', name: 'sessionDetail', component: page, meta: { requiresAuth: true, role: 'admin'  } },




    {path: '/user-dashboard',
        component: page,   // 👈 layout
        children: [
        {path: '', component: UserDashboard},
        { path: 'sessions', component: Session },
        {path:'session-detail/:id', component:sessionDetail},
        { path: 'users', component: UsersList },
        { path: 'users/sessions/:id', component: Session },
        // { path: 'assessments', component: Assessments }
        ],
        meta: {   requiresAuth: true, role: 'user' }
    },
    {path: '/dashboard',
        component: page,   // 👈 layout
        children: [
        {path: '', component: Dashboard},
        { path: 'users', component: Users },
        {path:'sessions', component:Session}
        // { path: 'users', component: Users },
        // { path: 'assessments', component: Assessments }
        ],
        meta: {   requiresAuth: true, role: 'admin' }
    }


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
