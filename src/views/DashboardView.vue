<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Welcome -->
    <div class="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 rounded-3xl p-8 text-white relative overflow-hidden">
      <div class="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 translate-y-32"></div>
      <div class="relative">
        <h1 class="text-2xl md:text-3xl font-bold mb-2">نظام الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات</h1>
        <p class="text-sm text-white/70">Subscriber Accounts Management System</p>
        <p class="text-white/80 text-sm md:text-base max-w-3xl leading-relaxed mt-3">مرحباً بك في النظام المتكامل لإدارة الهيكلية التنظيمية (قطاع ← فرع ← مجموعة ← منطقة)، الإيصالات، الخصومات المستوردة، وحساب الأرصدة وفق السنة المالية (1 يوليو - 30 يونيو)</p>
        <div class="flex flex-wrap gap-3 mt-6">
          <router-link to="/hierarchy" class="bg-white text-primary-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">إدارة الهيكلية</router-link>
          <router-link to="/receipts" class="bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/30 transition backdrop-blur">إضافة إيصال</router-link>
        </div>
      </div>
    </div>

    <!-- Financial Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard title="إجمالي الإيصالات هذا الشهر" :value="thisMonthReceiptsCount" :subtitle="formatCurrency(thisMonthReceiptsAmount)" icon="🧾" icon-bg="bg-blue-100" />
      <StatCard title="إجمالي الخصومات المستوردة" :value="thisMonthDiscountsCount" :subtitle="formatCurrency(thisMonthDiscountsAmount)" icon="💸" icon-bg="bg-emerald-100" />
      <StatCard title="مشتركين برصيد سالب (له)" :value="negativeBalanceCount" subtitle="أرصدة دائنة" icon="📉" icon-bg="bg-amber-100" />
      <StatCard title="عدد المشتركين النشطين" :value="subscribersStore.subscribers.length" :subtitle="`${hierarchyStore.sectors.length} قطاع، ${hierarchyStore.branches.length} فرع`" icon="👥" icon-bg="bg-purple-100" />
    </div>

    <!-- Critical Alerts - مهم جداً -->
    <div class="card p-6 border-red-200">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">🚨</div>
        <div><h3 class="font-bold text-gray-900">التنبيهات الحرجة - Critical Alerts</h3><p class="text-sm text-gray-500">تنبيهات ذكية تحتاج متابعة فورية</p></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="border border-red-200 bg-red-50 rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-2"><span class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span><span class="text-sm font-bold text-red-800">🔴 بدون إيصالات هذا الشهر</span></div>
          <p class="text-2xl font-bold text-red-700">{{ noReceiptThisMonth.length }}</p>
          <p class="text-xs text-red-600 mt-1">مشترك لم يُصدر له إيصالات في {{ currentMonthName }}</p>
          <div class="flex gap-2 mt-3"><button @click="showAlertDetails('noReceiptThisMonth')" class="btn-secondary text-xs flex-1">عرض التفاصيل</button><button @click="exportNoReceipt('thisMonth')" class="btn-ghost text-xs">📤 تصدير</button></div>
        </div>
        <div class="border border-amber-200 bg-amber-50 rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-2"><span class="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span><span class="text-sm font-bold text-amber-800">🟡 بدون إيصالات في يونيو</span></div>
          <p class="text-2xl font-bold text-amber-700">{{ noReceiptJune.length }}</p>
          <p class="text-xs text-amber-600 mt-1">آخر شهر في السنة المالية - حرج</p>
          <div class="flex gap-2 mt-3"><button @click="showAlertDetails('noReceiptJune')" class="btn-secondary text-xs flex-1">عرض التفاصيل</button><button @click="exportNoReceipt('june')" class="btn-ghost text-xs">📤 تصدير</button></div>
        </div>
        <div class="border border-orange-200 bg-orange-50 rounded-2xl p-5">
          <div class="flex items-center gap-2 mb-2"><span class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span><span class="text-sm font-bold text-orange-800">🟠 أرصدة سالبة كبيرة</span></div>
          <p class="text-2xl font-bold text-orange-700">{{ largeNegativeBalances.length }}</p>
          <p class="text-xs text-orange-600 mt-1">رصيد سالب يتجاوز {{ formatCurrency(1000) }}</p>
          <div class="flex gap-2 mt-3"><button @click="showAlertDetails('largeNegative')" class="btn-secondary text-xs flex-1">عرض التفاصيل</button><button @click="exportLargeNegative" class="btn-ghost text-xs">📤 تصدير</button></div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2"><RevenueChart :data="revenueChartData" /></div>
      <div class="card p-6">
        <h3 class="font-bold mb-4">الفروع الأكثر نشاطاً</h3>
        <div class="h-64"><canvas ref="branchChart"></canvas></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4"><h3 class="font-bold">آخر الإيصالات (10)</h3><router-link to="/receipts" class="text-sm text-primary-600">عرض الكل ←</router-link></div>
        <div v-if="recentReceipts.length === 0" class="text-center py-8 text-gray-400 text-sm">لا توجد إيصالات</div>
        <div v-else class="space-y-2">
          <div v-for="r in recentReceipts" :key="r.id" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
            <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-xs">🧾</div>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium truncate">{{ r.accountNumber }} - {{ getSubscriberName(r.accountNumber) }}</p><p class="text-xs text-gray-500">{{ formatDateShort(r.date) }} • {{ getTypeName(r.typeId) }}</p></div>
            <p class="font-bold text-sm">{{ formatCurrency(r.amount) }}</p>
          </div>
        </div>
      </div>
      <div class="card p-6">
        <h3 class="font-bold mb-4">ملخص الهيكلية</h3>
        <div class="space-y-3">
          <div class="flex justify-between p-3 bg-gray-50 rounded-xl"><span class="text-sm">القطاعات</span><span class="font-bold">{{ hierarchyStore.sectors.length }}</span></div>
          <div class="flex justify-between p-3 bg-blue-50 rounded-xl"><span class="text-sm">الفروع (كود رقمين)</span><span class="font-bold">{{ hierarchyStore.branches.length }} / 99</span></div>
          <div class="flex justify-between p-3 bg-purple-50 rounded-xl"><span class="text-sm">المجموعات (1-8 لكل فرع)</span><span class="font-bold">{{ hierarchyStore.groups.length }}</span></div>
          <div class="flex justify-between p-3 bg-emerald-50 rounded-xl"><span class="text-sm">المناطق (7 أرقام)</span><span class="font-bold">{{ hierarchyStore.areas.length }}</span></div>
          <div class="flex justify-between p-3 bg-amber-50 rounded-xl"><span class="text-sm">المشتركين (9 أرقام)</span><span class="font-bold">{{ subscribersStore.subscribers.length }}</span></div>
        </div>
        <div class="mt-4 p-3 bg-primary-50 rounded-xl text-xs text-primary-700">السنة المالية الحالية: {{ fiscalYear.label }} ({{ fiscalYear.start }} إلى {{ fiscalYear.end }})</div>
      </div>
    </div>

    <!-- Alert Details Modal -->
    <div v-if="showAlertModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showAlertModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-fadeIn flex flex-col">
        <div class="p-6 border-b flex items-center justify-between"><h3 class="font-bold">{{ alertModalTitle }}</h3><button @click="showAlertModal = false" class="w-8 h-8 rounded-lg hover:bg-gray-100">✕</button></div>
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="alertDetails.length === 0" class="text-center py-8 text-gray-400">لا توجد بيانات</div>
          <div v-else class="space-y-2">
            <div v-for="item in alertDetails" :key="item.accountNumber" class="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div><p class="font-mono font-bold text-sm">{{ item.accountNumber }}</p><p class="text-xs text-gray-600">{{ item.name }} - {{ item.areaCode }}</p></div>
              <div class="text-left"><p class="text-xs font-bold" :class="item.balance > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(item.balance) }}</p><p class="text-[11px] text-gray-500">{{ item.balance > 0 ? 'عليه' : item.balance < 0 ? 'له' : 'صفر' }}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHierarchyStore } from '@/stores/hierarchy'
import { useSubscribersStore } from '@/stores/subscribers'
import { useReceiptsStore } from '@/stores/receipts'
import { useDiscountsStore } from '@/stores/discounts'
import { useReceiptTypesStore } from '@/stores/receiptTypes'
import { db, getCurrentFiscalYear } from '@/db'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import StatCard from '@/components/dashboard/StatCard.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import { useExport } from '@/composables/useExport'

const hierarchyStore = useHierarchyStore()
const subscribersStore = useSubscribersStore()
const receiptsStore = useReceiptsStore()
const discountsStore = useDiscountsStore()
const receiptTypesStore = useReceiptTypesStore()
const { exportToExcel } = useExport()

const fiscalYear = getCurrentFiscalYear()
const branchChart = ref(null)
let branchChartInstance = null

const balances = ref({})
const showAlertModal = ref(false)
const alertModalTitle = ref('')
const alertDetails = ref([])
const currentAlertType = ref('')

const currentMonthName = new Date().toLocaleDateString('ar-EG', { month: 'long' })

onMounted(async () => {
  await Promise.all([hierarchyStore.fetchAll(), subscribersStore.fetchSubscribers(), receiptsStore.fetchReceipts(), discountsStore.fetchDiscounts(), receiptTypesStore.fetchTypes()])
  await loadBalances()
  renderBranchChart()
})

const loadBalances = async () => {
  const subs = await db.subscribers.toArray()
  const receipts = await db.receipts.toArray()
  const discounts = await db.discounts.toArray()
  const map = {}
  subs.forEach(s => {
    const rTotal = receipts.filter(r => r.accountNumber === s.accountNumber).reduce((sum, r) => sum + Number(r.amount), 0)
    const dTotal = discounts.filter(d => d.accountNumber === s.accountNumber).reduce((sum, d) => sum + Number(d.discountAmount), 0)
    map[s.accountNumber] = Number(s.openingBalance) + rTotal - dTotal
  })
  balances.value = map
}

const thisMonthReceipts = computed(() => {
  const now = new Date()
  return receiptsStore.receipts.filter(r => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
})
const thisMonthReceiptsCount = computed(() => thisMonthReceipts.value.length)
const thisMonthReceiptsAmount = computed(() => thisMonthReceipts.value.reduce((s, r) => s + Number(r.amount), 0))

const thisMonthDiscounts = computed(() => {
  const now = new Date()
  const monthName = now.toLocaleDateString('ar-EG', { month: 'long' })
  return discountsStore.discounts.filter(d => d.fiscalMonth?.includes(monthName))
})
const thisMonthDiscountsCount = computed(() => thisMonthDiscounts.value.length)
const thisMonthDiscountsAmount = computed(() => thisMonthDiscounts.value.reduce((s, d) => s + Number(d.discountAmount), 0))

const negativeBalanceCount = computed(() => Object.values(balances.value).filter(b => b < 0).length)

const noReceiptThisMonth = computed(() => {
  const now = new Date()
  const thisMonthReceiptAccounts = new Set(thisMonthReceipts.value.map(r => r.accountNumber))
  return subscribersStore.subscribers.filter(s => !thisMonthReceiptAccounts.has(s.accountNumber)).map(s => ({ ...s, balance: balances.value[s.accountNumber] || 0 }))
})

const noReceiptJune = computed(() => {
  const juneReceipts = receiptsStore.receipts.filter(r => { const d = new Date(r.date); return d.getMonth() === 5 })
  const juneAccounts = new Set(juneReceipts.map(r => r.accountNumber))
  return subscribersStore.subscribers.filter(s => !juneAccounts.has(s.accountNumber)).map(s => ({ ...s, balance: balances.value[s.accountNumber] || 0 }))
})

const largeNegativeBalances = computed(() => {
  return subscribersStore.subscribers.filter(s => (balances.value[s.accountNumber] || 0) < -1000).map(s => ({ ...s, balance: balances.value[s.accountNumber] }))
})

const recentReceipts = computed(() => [...receiptsStore.receipts].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,10))

const getSubscriberName = (acc) => subscribersStore.subscribers.find(s => s.accountNumber === acc)?.name || 'غير معروف'
const getTypeName = (id) => receiptTypesStore.types.find(t => t.id === id)?.name || '-'

const revenueChartData = computed(() => {
  const months = ['يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل','مايو','يونيو']
  const monthNumbers = [7,8,9,10,11,12,1,2,3,4,5,6]
  const receipts = monthNumbers.map(m => {
    return receiptsStore.receipts.filter(r => new Date(r.date).getMonth() + 1 === m).reduce((s, r) => s + Number(r.amount), 0)
  })
  const discounts = monthNumbers.map(m => {
    // Approximate: discounts don't have exact date, use fiscalMonth
    return 0 // Simplified
  })
  return { months, receipts, discounts }
})

const renderBranchChart = () => {
  if (!branchChart.value) return
  if (branchChartInstance) branchChartInstance.destroy()
  const branchData = hierarchyStore.branches.map(b => {
    const count = receiptsStore.receipts.filter(r => r.accountNumber.startsWith(b.code)).length
    return { name: b.name, count }
  }).sort((a,b) => b.count - a.count).slice(0,5)

  branchChartInstance = new Chart(branchChart.value, {
    type: 'bar',
    data: { labels: branchData.map(b => b.name), datasets: [{ label: 'إيصالات', data: branchData.map(b => b.count), backgroundColor: '#8b5cf6', borderRadius: 8 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { rtl: true, titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } } }, scales: { x: { beginAtZero: true, ticks: { font: { family: 'Cairo' } } }, y: { ticks: { font: { family: 'Cairo' } } } } }
  })
}

watch(() => receiptsStore.receipts.length, renderBranchChart)

const showAlertDetails = (type) => {
  currentAlertType.value = type
  if (type === 'noReceiptThisMonth') { alertModalTitle.value = `بدون إيصالات في ${currentMonthName} - ${noReceiptThisMonth.value.length} مشترك`; alertDetails.value = noReceiptThisMonth.value }
  if (type === 'noReceiptJune') { alertModalTitle.value = `بدون إيصالات في يونيو (آخر السنة المالية) - ${noReceiptJune.value.length} مشترك`; alertDetails.value = noReceiptJune.value }
  if (type === 'largeNegative') { alertModalTitle.value = `أرصدة سالبة كبيرة - ${largeNegativeBalances.value.length} مشترك`; alertDetails.value = largeNegativeBalances.value }
  showAlertModal.value = true
}

const exportNoReceipt = (type) => {
  const data = type === 'thisMonth' ? noReceiptThisMonth.value : noReceiptJune.value
  const exportData = data.map(s => ({ 'رقم الحساب': s.accountNumber, 'الاسم': s.name, 'المنطقة': s.areaCode, 'الرصيد': s.balance, 'الحالة': s.balance > 0 ? 'عليه' : s.balance < 0 ? 'له' : 'صفر' }))
  exportToExcel(exportData, `بدون-إيصالات-${type}-${new Date().toISOString().split('T')[0]}`, 'تنبيه')
}

const exportLargeNegative = () => {
  const exportData = largeNegativeBalances.value.map(s => ({ 'رقم الحساب': s.accountNumber, 'الاسم': s.name, 'الرصيد': s.balance }))
  exportToExcel(exportData, `أرصدة-سالبة-كبيرة-${new Date().toISOString().split('T')[0]}`, 'تنبيه')
}
</script>
