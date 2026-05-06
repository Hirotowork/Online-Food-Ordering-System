import {createRouter, createWebHistory} from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Manager',
      component: () => import('@/views/Manager.vue'),
      redirect: '/tables',
      children: [
        { path: 'home', redirect: '/tables' },
        { path: 'admin', name: 'Admin', component: () => import('@/views/manager/Admin.vue')},
        { path: 'person', name: 'Person', component: () => import('@/views/manager/Person.vue')},
        { path: 'user', name: 'User', component: () => import('@/views/manager/User.vue')},
        { path: 'tables', name: 'Tables', component: () => import('@/views/manager/Tables.vue')},
        { path: 'order', redirect: '/foods' },
        { path: 'foods', name: 'Foods', component: () => import('@/views/manager/Foods.vue')},
        { path: 'orderManager', name: 'OrderManager', component: () => import('@/views/manager/OrderManager.vue')},
      ]
    },
    { path: '/login', name: 'Login', component: () => import('@/views/Login.vue')},
    { path: '/register', redirect: '/login' },
  ]
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('canteen-user') || '{}')
  const isAdmin = user && user.role === 'ADMIN'

  if (to.path === '/login') {
    if (isAdmin) {
      next('/')
      return
    }
    next()
    return
  }

  if (!isAdmin) {
    localStorage.removeItem('canteen-user')
    next('/login')
    return
  }

  next()
})

export default router
