import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/views/Login.vue'
import page from '../components/views/Page.vue'
import Session from '../components/views/Sessions.vue'
import Register from '../components/views/Register.vue'
import sessionDetail from '../components/views/SessionDetail.vue'
import Dashboard from '../components/views/Dashboard.vue'
import UserDashboard from '../components/views/UserDashboard.vue'
import Users from '../components/views/Users.vue'
import UsersList from '../components/views/UsersList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    // { path: '/user-login', name: 'user-login', component: Login, meta: {  guestOnly: true, role: 'user' } },
    { path: '/login', name: 'login', component: Login, meta: {  guestOnly: true, role: 'admin' } },
    { path: '/reset-password', name: 'reset-password', component: Login, meta: { guestOnly: true } },
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
        { path: 'tl-session-detail/:id/:user_id', component: sessionDetail },
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
    },
    {
    path: '/auth-success',
    component: () => import('../components/views/AuthSuccess.vue'),
    }


  ]
})

router.beforeEach((to, _) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }
  return true;
})


export default router
