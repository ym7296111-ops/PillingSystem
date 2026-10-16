<template>
  <aside :class="['fixed inset-y-0 right-0 z-40 bg-white border-l border-gray-200 transition-all duration-300 flex flex-col', isCollapsed ? 'w-20' : 'w-72', 'lg:translate-x-0', mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0']">
    <div class="h-20 px-6 flex items-center justify-between border-b border-gray-100">
      <div v-if="!isCollapsed" class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">ن</div>
        <div class="flex-1 min-w-0">
          <h1 class="font-bold text-gray-900 leading-tight text-sm">نظام الإدارة العامة</h1>
          <p class="text-[11px] text-gray-500 leading-tight">حسابات المشتركين - الإيصالات والخصومات</p>
          <p class="text-[10px] text-gray-400">Subscriber Accounts Management</p>
        </div>
      </div>
      <div v-else class="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto">ن</div>
      <button @click="$emit('toggle-collapse')" class="hidden lg:flex w-8 h-8 rounded-lg hover:bg-gray-100 items-center justify-center text-gray-500">{{ isCollapsed ? '◀' : '▶' }}</button>
    </div>

    <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
      <router-link v-for="item in navItems" :key="item.path" :to="item.path" :class="['flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200', isActive(item.path) ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900']" @click="$emit('close-mobile')">
        <span class="text-xl w-6 text-center">{{ item.icon }}</span>
        <span v-if="!isCollapsed" class="flex-1">{{ item.title }}</span>
        <span v-if="!isCollapsed && item.badge" class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{{ item.badge }}</span>
      </router-link>
    </nav>

    <div class="p-4 border-t border-gray-100 space-y-3">
      <div v-if="!isCollapsed" class="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-4 text-white">
        <div class="flex items-center gap-2 mb-2"><span>💾</span><span class="text-xs font-medium">قاعدة البيانات محلية</span></div>
        <p class="text-[11px] text-white/80 leading-relaxed">IndexedDB - بدون Backend - يعمل Offline</p>
        <div class="mt-2 text-[10px] text-white/60">السنة المالية: {{ fiscalYear.label }}</div>
      </div>
      <div :class="['flex items-center gap-3 p-3 rounded-xl bg-gray-50', isCollapsed ? 'justify-center' : '']">
        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">👤</div>
        <div v-if="!isCollapsed" class="flex-1 min-w-0"><p class="text-sm font-medium truncate">المدير العام</p><p class="text-xs text-gray-500">نظام الإدارة العامة</p></div>
      </div>
    </div>
  </aside>
  <div v-if="mobileOpen" @click="$emit('close-mobile')" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"></div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getCurrentFiscalYear } from '@/db'

defineProps({ isCollapsed: Boolean, mobileOpen: Boolean })
defineEmits(['toggle-collapse','close-mobile'])

const route = useRoute()
const fiscalYear = getCurrentFiscalYear()

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const navItems = computed(() => [
  { path: '/', title: 'لوحة التحكم', icon: '📊' },
  { path: '/hierarchy', title: 'إدارة الهيكلية', icon: '🏗️' },
  { path: '/subscribers', title: 'المشتركين', icon: '👥' },
  { path: '/receipts', title: 'الإيصالات', icon: '🧾' },
  { path: '/discounts', title: 'الخصومات المستوردة', icon: '💸' },
  { path: '/query', title: 'الاستعلام المرن', icon: '🔍' },
  { path: '/reports', title: 'التقارير', icon: '📈' },
  { path: '/print-report', title: 'التقرير المطبوع', icon: '🖨️' },
  { path: '/settings', title: 'الضبط العام', icon: '⚙️' }
])
</script>
