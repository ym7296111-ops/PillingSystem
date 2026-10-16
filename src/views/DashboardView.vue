<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Welcome Banner -->
    <div class="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 rounded-3xl p-8 text-white relative overflow-hidden">
      <div class="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 translate-y-32"></div>
      <div class="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold mb-2">مرحباً بعودتك! 👋</h1>
          <p class="text-white/80 text-sm md:text-base max-w-xl leading-relaxed">
            إليك نظرة شاملة على أداء النظام اليوم. لديك {{ billsStore.stats.overdue }} فواتير متأخرة تحتاج متابعة و {{ subscribersStore.stats.pending }} مشتركين قيد الانتظار.
          </p>
          <div class="flex gap-3 mt-6">
            <router-link to="/bills" class="bg-white text-primary-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition">عرض الفواتير المتأخرة</router-link>
            <router-link to="/subscribers" class="bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/30 transition backdrop-blur">إضافة مشترك</router-link>
          </div>
        </div>
        <div class="hidden md:flex gap-4">
          <div class="bg-white/10 backdrop-blur rounded-2xl p-4 text-center min-w-[110px]">
            <p class="text-2xl font-bold">{{ subscribersStore.stats.total }}</p>
            <p class="text-xs text-white/70">إجمالي المشتركين</p>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-2xl p-4 text-center min-w-[110px]">
            <p class="text-2xl font-bold">{{ formatCurrency(billsStore.stats.totalAmount).split(' ')[0] }}</p>
            <p class="text-xs text-white/70">إجمالي الفواتير</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard
        title="إجمالي المشتركين"
        :value="subscribersStore.stats.total"
        :subtitle="`${subscribersStore.stats.active} نشط، ${subscribersStore.stats.inactive} غير نشط`"
        icon="👥"
        icon-bg="bg-blue-100"
        :progress="(subscribersStore.stats.active / (subscribersStore.stats.total || 1)) * 100"
        progress-color="bg-blue-600"
      />
      <StatCard
        title="إجمالي الفواتير"
        :value="billsStore.stats.total"
        :subtitle="`${formatCurrency(billsStore.stats.totalAmount)}`"
        icon="🧾"
        icon-bg="bg-amber-100"
        change="+12%"
        change-label="عن الشهر الماضي"
        change-type="positive"
      />
      <StatCard
        title="المبالغ المحصلة"
        :value="formatCurrency(billsStore.stats.paidAmount)"
        :subtitle="`${billsStore.stats.paid} فاتورة مدفوعة`"
        icon="💰"
        icon-bg="bg-emerald-100"
        :progress="(billsStore.stats.paid / (billsStore.stats.total || 1)) * 100"
        progress-color="bg-emerald-600"
      />
      <StatCard
        title="المبالغ المستحقة"
        :value="formatCurrency(billsStore.stats.unpaidAmount)"
        :subtitle="`${billsStore.stats.overdue} متأخرة`"
        icon="⚠️"
        icon-bg="bg-red-100"
        change-type="negative"
        :change="billsStore.stats.overdue > 0 ? `${billsStore.stats.overdue} متأخرة` : ''"
        change-label=""
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Revenue Chart -->
      <div class="lg:col-span-2">
        <RevenueChart :data="revenueChartData" />
      </div>

      <!-- Status Distributions -->
      <div class="space-y-6">
        <StatusChart
          title="حالة المشتركين"
          subtitle="توزيع المشتركين حسب الحالة"
          :labels="subscriberStatusLabels"
          :values="subscriberStatusValues"
          :colors="['#10b981','#6b7280','#ef4444','#f59e0b']"
          :legend="subscriberLegend"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Bills -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-gray-900">أحدث الفواتير</h3>
          <router-link to="/bills" class="text-sm text-primary-600 hover:text-primary-700 font-medium">عرض الكل ←</router-link>
        </div>
        <div v-if="recentBills.length === 0" class="text-center py-8 text-gray-400 text-sm">
          لا توجد فواتير حديثة
        </div>
        <div v-else class="space-y-3">
          <div v-for="bill in recentBills" :key="bill.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition group">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">🧾</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ bill.billNumber }}</p>
              <p class="text-xs text-gray-500">{{ getSubscriberName(bill.subscriberId) }} • {{ formatDateShort(bill.issueDate) }}</p>
            </div>
            <div class="text-left">
              <p class="font-bold text-sm">{{ formatCurrency(bill.totalAmount) }}</p>
              <span :class="['badge text-[10px]', getBillStatusColor(bill.status)]">{{ getBillStatusLabel(bill.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Subscribers & Activities -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="font-bold text-gray-900">أحدث المشتركين</h3>
          <router-link to="/subscribers" class="text-sm text-primary-600 hover:text-primary-700 font-medium">عرض الكل ←</router-link>
        </div>
        <div v-if="recentSubscribers.length === 0" class="text-center py-8 text-gray-400 text-sm">
          لا يوجد مشتركين بعد
        </div>
        <div v-else class="space-y-3">
          <div v-for="sub in recentSubscribers" :key="sub.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
            <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
              {{ sub.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ sub.name }}</p>
              <p class="text-xs text-gray-500">{{ sub.phone }} • {{ sub.area }}</p>
            </div>
            <span :class="['badge text-[10px]', getSubscriberStatusColor(sub.status)]">{{ getSubscriberStatusLabel(sub.status) }}</span>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100">
          <h4 class="font-bold text-sm mb-3">النشاط الأخير</h4>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div v-for="act in recentActivities" :key="act.id" class="flex gap-3 text-xs">
              <span class="text-gray-400 whitespace-nowrap">{{ formatTime(act.createdAt) }}</span>
              <span class="text-gray-600 truncate">{{ act.description }}</span>
            </div>
            <div v-if="recentActivities.length === 0" class="text-xs text-gray-400">لا يوجد نشاط</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card p-6">
      <h3 class="font-bold mb-4">إجراءات سريعة</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <router-link to="/subscribers" class="p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition text-center group">
          <div class="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">👤➕</div>
          <p class="text-sm font-medium">إضافة مشترك</p>
        </router-link>
        <router-link to="/bills" class="p-4 rounded-xl border border-gray-200 hover:border-amber-200 hover:bg-amber-50 transition text-center group">
          <div class="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">🧾➕</div>
          <p class="text-sm font-medium">إنشاء فاتورة</p>
        </router-link>
        <button @click="exportAll" class="p-4 rounded-xl border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 transition text-center group">
          <div class="w-10 h-10 mx-auto mb-2 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">📤</div>
          <p class="text-sm font-medium">تصدير البيانات</p>
        </button>
        <router-link to="/reports" class="p-4 rounded-xl border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition text-center group">
          <div class="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition">📊</div>
          <p class="text-sm font-medium">عرض التقارير</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSubscribersStore } from '@/stores/subscribers'
import { useBillsStore } from '@/stores/bills'
import { usePaymentsStore } from '@/stores/payments'
import { useSettingsStore } from '@/stores/settings'
import { db } from '@/db'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import { SUBSCRIBER_STATUS, BILL_STATUS, MONTHS_AR } from '@/utils/constants'
import StatCard from '@/components/dashboard/StatCard.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import StatusChart from '@/components/dashboard/StatusChart.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()

const recentActivities = ref([])

onMounted(async () => {
  await Promise.all([
    subscribersStore.fetchSubscribers(),
    billsStore.fetchBills(),
    paymentsStore.fetchPayments(),
    settingsStore.fetchSettings()
  ])
  recentActivities.value = await db.activities.orderBy('createdAt').reverse().limit(10).toArray()
})

const recentBills = computed(() => [...billsStore.bills].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5))
const recentSubscribers = computed(() => [...subscribersStore.subscribers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5))

const getSubscriberName = (id) => subscribersStore.subscribers.find(s => s.id === id)?.name || 'غير معروف'
const getBillStatusLabel = (status) => BILL_STATUS.find(s => s.value === status)?.label || status
const getBillStatusColor = (status) => BILL_STATUS.find(s => s.value === status)?.color || 'badge-gray'
const getSubscriberStatusLabel = (status) => SUBSCRIBER_STATUS.find(s => s.value === status)?.label || status
const getSubscriberStatusColor = (status) => SUBSCRIBER_STATUS.find(s => s.value === status)?.color || 'badge-gray'

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

const subscriberStatusLabels = computed(() => SUBSCRIBER_STATUS.map(s => s.label))
const subscriberStatusValues = computed(() => SUBSCRIBER_STATUS.map(s => subscribersStore.subscribers.filter(sub => sub.status === s.value).length))
const subscriberLegend = computed(() => SUBSCRIBER_STATUS.map((s, idx) => ({
  label: s.label,
  value: subscriberStatusValues.value[idx],
  color: ['#10b981','#6b7280','#ef4444','#f59e0b'][idx]
})))

const revenueChartData = computed(() => {
  const months = []
  const paid = []
  const unpaid = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(MONTHS_AR[d.getMonth()])
    const monthBills = billsStore.bills.filter(b => {
      const bd = new Date(b.issueDate)
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
    })
    paid.push(monthBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + Number(b.totalAmount), 0))
    unpaid.push(monthBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + Number(b.totalAmount), 0))
  }
  return { months, paid, unpaid }
})

const exportAll = async () => {
  try {
    const data = await settingsStore.exportDatabase()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('تم تصدير النسخة الاحتياطية بنجاح')
  } catch (e) {
    toast.error('فشل التصدير')
  }
}
</script>
