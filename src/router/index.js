import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/PillingSystem/'),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: 'لوحة التحكم', icon: '📊' }
    },
    {
      path: '/subscribers',
      name: 'subscribers',
      component: () => import('@/views/SubscribersView.vue'),
      meta: { title: 'المشتركين', icon: '👥' }
    },
    {
      path: '/subscribers/:id',
      name: 'subscriber-details',
      component: () => import('@/views/SubscriberDetailsView.vue'),
      meta: { title: 'تفاصيل المشترك', icon: '👤', hideFromNav: true }
    },
    {
      path: '/bills',
      name: 'bills',
      component: () => import('@/views/BillsView.vue'),
      meta: { title: 'الفواتير', icon: '🧾' }
    },
    {
      path: '/payments',
      name: 'payments',
      component: () => import('@/views/PaymentsView.vue'),
      meta: { title: 'المدفوعات', icon: '💳' }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { title: 'التقارير', icon: '📈' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: 'الإعدادات', icon: '⚙️' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'نظام المشتركين'} - نظام الإدارة العامة لحسابات المشتركين`
  next()
})

export default router
