<template>
  <header class="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-4">
      <button @click="$emit('toggle-mobile')" class="lg:hidden w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
        ☰
      </button>
      <div>
        <h2 class="text-xl font-bold text-gray-900">{{ currentTitle }}</h2>
        <p class="text-sm text-gray-500 hidden sm:block">{{ currentDesc }}</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search -->
      <div class="hidden md:flex relative">
        <input
          v-model="globalSearch"
          @keyup.enter="handleSearch"
          type="text"
          placeholder="بحث سريع..."
          class="w-64 pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      </div>

      <!-- Notifications -->
      <div class="relative">
        <button @click="showNotifications = !showNotifications" class="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center relative">
          <span class="text-lg">🔔</span>
          <span v-if="overdueBills > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{{ overdueBills }}</span>
        </button>
        
        <div v-if="showNotifications" class="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold">التنبيهات</h3>
            <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{{ overdueBills }} متأخرة</span>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div v-if="overdueBills === 0" class="p-8 text-center text-gray-500 text-sm">
              لا توجد تنبيهات جديدة 🎉
            </div>
            <div v-else class="p-2 space-y-1">
              <div v-for="bill in overdueBillsList.slice(0,5)" :key="bill.id" class="p-3 rounded-xl hover:bg-gray-50 flex items-start gap-3">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">⚠️</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">فاتورة متأخرة {{ bill.billNumber }}</p>
                  <p class="text-xs text-gray-500">مستحقة منذ {{ formatDate(bill.dueDate) }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="p-3 border-t border-gray-100">
            <router-link to="/bills" @click="showNotifications=false" class="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium">عرض جميع الفواتير</router-link>
          </div>
        </div>
      </div>

      <!-- Date -->
      <div class="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
        <span>📅</span>
        <span class="text-sm font-medium">{{ today }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBillsStore } from '@/stores/bills'
import { formatDateShort } from '@/utils/helpers'

defineEmits(['toggle-mobile'])

const route = useRoute()
const router = useRouter()
const billsStore = useBillsStore()

const showNotifications = ref(false)
const globalSearch = ref('')

const currentTitle = computed(() => route.meta.title || 'لوحة التحكم')
const currentDesc = computed(() => {
  const map = {
    '/': 'مرحباً بك، إليك ملخص اليوم',
    '/subscribers': 'إدارة بيانات المشتركين والعملاء',
    '/bills': 'متابعة الفواتير والمستحقات',
    '/payments': 'سجل المدفوعات والتحصيلات',
    '/reports': 'تحليلات وتقارير شاملة',
    '/settings': 'إعدادات النظام والشركة'
  }
  return map[route.path] || map[Object.keys(map).find(k => route.path.startsWith(k))] || ''
})

const overdueBills = computed(() => billsStore.stats.overdue)
const overdueBillsList = computed(() => billsStore.bills.filter(b => b.status !== 'paid' && new Date(b.dueDate) < new Date()))

const today = computed(() => new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

const handleSearch = () => {
  if (!globalSearch.value.trim()) return
  // Simple global search - go to subscribers with query
  router.push({ path: '/subscribers', query: { q: globalSearch.value } })
}

const handleClickOutside = (e) => {
  if (!e.target.closest('.relative')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const formatDate = formatDateShort
</script>
