import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/subscriber-management-system/'),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'لوحة التحكم', icon: '📊' } },
    { path: '/hierarchy', name: 'hierarchy', component: () => import('@/views/HierarchyView.vue'), meta: { title: 'إدارة الهيكلية', icon: '🏗️' } },
    { path: '/subscribers', name: 'subscribers', component: () => import('@/views/SubscribersView.vue'), meta: { title: 'المشتركين', icon: '👥' } },
    { path: '/receipts', name: 'receipts', component: () => import('@/views/ReceiptsView.vue'), meta: { title: 'الإيصالات', icon: '🧾' } },
    { path: '/discounts', name: 'discounts', component: () => import('@/views/DiscountsView.vue'), meta: { title: 'الخصومات المستوردة', icon: '💸' } },
    { path: '/query', name: 'query', component: () => import('@/views/QueryView.vue'), meta: { title: 'الاستعلام المرن', icon: '🔍' } },
    { path: '/reports', name: 'reports', component: () => import('@/views/ReportsView.vue'), meta: { title: 'التقارير', icon: '📈' } },
    { path: '/print-report', name: 'print-report', component: () => import('@/views/PrintReportView.vue'), meta: { title: 'التقرير المطبوع', icon: '🖨️' } },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: 'الضبط العام', icon: '⚙️' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'لوحة التحكم'} - نظام الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات`
  next()
})

export default router
