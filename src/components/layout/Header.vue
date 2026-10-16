<template>
  <header class="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <button @click="$emit('toggle-mobile')" class="lg:hidden w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">☰</button>
      <div>
        <h2 class="text-lg font-bold text-gray-900">{{ currentTitle }}</h2>
        <p class="text-xs text-gray-500 hidden sm:block">{{ currentDesc }}</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="hidden lg:flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-xl border border-primary-100">
        <span class="text-xs">📅</span>
        <span class="text-xs font-medium">السنة المالية: {{ fiscalYear.label }}</span>
        <span class="text-[10px] text-gray-500">({{ fiscalYear.start }} إلى {{ fiscalYear.end }})</span>
      </div>
      <div class="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
        <span>📅</span><span class="text-sm font-medium">{{ today }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getCurrentFiscalYear } from '@/db'

defineEmits(['toggle-mobile'])
const route = useRoute()
const fiscalYear = getCurrentFiscalYear()

const currentTitle = computed(() => route.meta.title || 'لوحة التحكم')
const currentDesc = computed(() => {
  const map = {
    '/': 'نظام الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات',
    '/hierarchy': 'إدارة الهيكلية التنظيمية: قطاع ← فرع ← مجموعة ← منطقة',
    '/subscribers': 'إدارة المشتركين - رقم الحساب 9 أرقام وفق المعادلة',
    '/receipts': 'إدارة الإيصالات - القلب النابض للنظام (بدون ضريبة)',
    '/discounts': 'الخصومات المستوردة من ملف Excel خارجي',
    '/query': 'استعلام مرن مع فلاتر شاملة وتأثير تلقائي على الرصيد',
    '/reports': 'تقارير متنوعة: كشف حساب، إيصالات، خصومات، أرصدة',
    '/print-report': 'التقرير المطبوع الاحترافي بهيدر وفوتر',
    '/settings': 'الضبط العام - لوجو، اسم القطاع والإدارة'
  }
  return map[route.path] || ''
})

const today = computed(() => new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
</script>
