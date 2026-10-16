<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">📈</div>
      <div>
        <h1 class="text-xl font-bold">التقارير والتحليلات</h1>
        <p class="text-sm text-gray-500">تحليل شامل لأداء النظام والإيرادات</p>
      </div>
    </div>

    <!-- Date Range -->
    <div class="card p-4 flex flex-wrap gap-3 items-center">
      <span class="text-sm font-medium">الفترة:</span>
      <select v-model="period" class="input text-sm w-auto">
        <option value="6m">آخر 6 أشهر</option>
        <option value="12m">آخر 12 شهر</option>
        <option value="thisYear">هذا العام</option>
        <option value="all">كل الفترات</option>
      </select>
      <div class="mr-auto flex gap-2">
        <button @click="exportReport" class="btn-secondary text-sm">📤 تصدير التقرير</button>
        <button @click="printReport" class="btn-ghost text-sm">🖨️ طباعة</button>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-5">
        <p class="text-xs text-gray-500">إجمالي الإيرادات المحتملة</p>
        <p class="text-2xl font-bold mt-1">{{ formatCurrency(totalPotential) }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ billsStore.bills.length }} فاتورة</p>
      </div>
      <div class="card p-5 border-emerald-100">
        <p class="text-xs text-emerald-600">الإيرادات المحصلة</p>
        <p class="text-2xl font-bold text-emerald-700 mt-1">{{ formatCurrency(totalCollected) }}</p>
        <p class="text-xs text-emerald-600 mt-2">{{ collectionRate }}% معدل التحصيل</p>
      </div>
      <div class="card p-5 border-red-100">
        <p class="text-xs text-red-600">المستحقات المتأخرة</p>
        <p class="text-2xl font-bold text-red-700 mt-1">{{ formatCurrency(totalOverdue) }}</p>
        <p class="text-xs text-red-500 mt-2">{{ overdueCount }} فاتورة</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500">متوسط قيمة الفاتورة</p>
        <p class="text-2xl font-bold mt-1">{{ formatCurrency(avgBill) }}</p>
        <p class="text-xs text-gray-400 mt-2">لكل مشترك {{ formatCurrency(avgPerSubscriber) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RevenueChart :data="revenueData" />
      
      <div class="card p-6">
        <h3 class="font-bold mb-1">توزيع طرق الدفع</h3>
        <p class="text-sm text-gray-500 mb-6">تحليل طرق الدفع المستخدمة</p>
        <div class="h-64">
          <canvas ref="paymentMethodChart"></canvas>
        </div>
        <div class="mt-6 space-y-2">
          <div v-for="item in paymentMethodLegend" :key="item.label" class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" :style="{ background: item.color }"></span>
              <span>{{ item.label }}</span>
            </div>
            <span class="font-bold">{{ item.count }} ({{ item.percent }}%)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <StatusChart title="حالة الفواتير" subtitle="توزيع الفواتير حسب الحالة" :labels="billStatusLabels" :values="billStatusValues" :colors="['#10b981','#ef4444','#f59e0b','#6b7280']" :legend="billStatusLegend" />
      <StatusChart title="أنواع الاشتراكات" subtitle="توزيع المشتركين حسب النوع" :labels="typeLabels" :values="typeValues" :colors="['#3b82f6','#8b5cf6','#f97316','#10b981']" :legend="typeLegend" />
      <StatusChart title="توزيع المناطق" subtitle="أكثر المناطق اشتراكاً" :labels="areaLabels.slice(0,4)" :values="areaValues.slice(0,4)" :colors="['#06b6d4','#3b82f6','#8b5cf6','#ec4899']" :legend="areaLegend.slice(0,4)" />
    </div>

    <!-- Top Subscribers -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6">
        <h3 class="font-bold mb-4">أكثر المشتركين إنفاقاً</h3>
        <div class="space-y-3">
          <div v-for="(item, idx) in topSpenders" :key="item.id" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
            <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">{{ idx+1 }}</span>
            <div class="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700">{{ item.name.charAt(0) }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ item.name }}</p>
              <p class="text-xs text-gray-500">{{ item.billsCount }} فاتورة</p>
            </div>
            <p class="font-bold text-sm">{{ formatCurrency(item.total) }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="font-bold mb-4">الفواتير المتأخرة - تحتاج متابعة</h3>
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="bill in overdueBills.slice(0,8)" :key="bill.id" class="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">⚠️</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ getSubscriberName(bill.subscriberId) }}</p>
              <p class="text-xs text-gray-600">{{ bill.billNumber }} • متأخرة {{ daysOverdue(bill.dueDate) }} يوم</p>
            </div>
            <p class="font-bold text-sm text-red-700">{{ formatCurrency(bill.totalAmount) }}</p>
          </div>
          <div v-if="overdueBills.length === 0" class="text-center py-8 text-gray-400 text-sm">لا توجد فواتير متأخرة 🎉</div>
        </div>
      </div>
    </div>

    <!-- Monthly Table -->
    <div class="card p-6">
      <h3 class="font-bold mb-4">التقرير الشهري التفصيلي</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-right">الشهر</th>
              <th class="px-4 py-3 text-right">عدد الفواتير</th>
              <th class="px-4 py-3 text-right">إجمالي المبلغ</th>
              <th class="px-4 py-3 text-right">المحصل</th>
              <th class="px-4 py-3 text-right">المستحق</th>
              <th class="px-4 py-3 text-right">معدل التحصيل</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="row in monthlyReport" :key="row.month" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ row.month }}</td>
              <td class="px-4 py-3">{{ row.count }}</td>
              <td class="px-4 py-3 font-bold">{{ formatCurrency(row.total) }}</td>
              <td class="px-4 py-3 text-emerald-700 font-medium">{{ formatCurrency(row.collected) }}</td>
              <td class="px-4 py-3 text-red-600">{{ formatCurrency(row.total - row.collected) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500" :style="{ width: row.rate + '%' }"></div>
                  </div>
                  <span class="text-xs">{{ row.rate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSubscribersStore } from '@/stores/subscribers'
import { useBillsStore } from '@/stores/bills'
import { usePaymentsStore } from '@/stores/payments'
import { formatCurrency } from '@/utils/helpers'
import { MONTHS_AR, BILL_STATUS, SUBSCRIPTION_TYPES, PAYMENT_METHODS } from '@/utils/constants'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'
import StatusChart from '@/components/dashboard/StatusChart.vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()

const period = ref('6m')
const paymentMethodChart = ref(null)
let pmChartInstance = null

onMounted(async () => {
  await Promise.all([
    subscribersStore.fetchSubscribers(),
    billsStore.fetchBills(),
    paymentsStore.fetchPayments()
  ])
  renderPaymentMethodChart()
})

watch(() => paymentsStore.payments.length, renderPaymentMethodChart)

const totalPotential = computed(() => billsStore.bills.reduce((s, b) => s + Number(b.totalAmount), 0))
const totalCollected = computed(() => paymentsStore.payments.reduce((s, p) => s + Number(p.amount), 0))
const overdueBills = computed(() => billsStore.bills.filter(b => b.status !== 'paid' && new Date(b.dueDate) < new Date()))
const totalOverdue = computed(() => overdueBills.value.reduce((s, b) => s + Number(b.totalAmount), 0))
const overdueCount = computed(() => overdueBills.value.length)
const collectionRate = computed(() => totalPotential.value ? Math.round((totalCollected.value / totalPotential.value) * 100) : 0)
const avgBill = computed(() => billsStore.bills.length ? totalPotential.value / billsStore.bills.length : 0)
const avgPerSubscriber = computed(() => subscribersStore.subscribers.length ? totalPotential.value / subscribersStore.subscribers.length : 0)

const revenueData = computed(() => {
  const months = []
  const paid = []
  const unpaid = []
  const now = new Date()
  const count = period.value === '12m' ? 12 : period.value === 'thisYear' ? now.getMonth() + 1 : 6
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(MONTHS_AR[d.getMonth()])
    const monthBills = billsStore.bills.filter(b => {
      const bd = new Date(b.issueDate)
      return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear()
    })
    const monthPayments = paymentsStore.payments.filter(p => {
      const pd = new Date(p.paymentDate)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
    })
    paid.push(monthPayments.reduce((s, p) => s + Number(p.amount), 0))
    unpaid.push(monthBills.reduce((s, b) => s + Number(b.totalAmount), 0) - monthPayments.reduce((s, p) => s + Number(p.amount), 0))
  }
  return { months, paid, unpaid: unpaid.map(v => Math.max(0, v)) }
})

const billStatusLabels = computed(() => BILL_STATUS.map(s => s.label))
const billStatusValues = computed(() => {
  const overdue = overdueCount.value
  return BILL_STATUS.map(s => {
    if (s.value === 'overdue') return overdue
    return billsStore.bills.filter(b => b.status === s.value && !(s.value !== 'paid' && new Date(b.dueDate) < new Date())).length
  })
})
const billStatusLegend = computed(() => BILL_STATUS.map((s, i) => ({ label: s.label, value: billStatusValues.value[i], color: ['#10b981','#ef4444','#f59e0b','#6b7280'][i] })))

const typeLabels = computed(() => SUBSCRIPTION_TYPES.map(t => t.label))
const typeValues = computed(() => SUBSCRIPTION_TYPES.map(t => subscribersStore.subscribers.filter(s => s.subscriptionType === t.value).length))
const typeLegend = computed(() => SUBSCRIPTION_TYPES.map((t, i) => ({ label: t.label, value: typeValues.value[i], color: ['#3b82f6','#8b5cf6','#f97316','#10b981'][i] })))

const areaGroups = computed(() => {
  const map = {}
  subscribersStore.subscribers.forEach(s => {
    map[s.area] = (map[s.area] || 0) + 1
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})
const areaLabels = computed(() => areaGroups.value.map(([k]) => k))
const areaValues = computed(() => areaGroups.value.map(([, v]) => v))
const areaLegend = computed(() => areaGroups.value.map(([k, v], i) => ({ label: k, value: v, color: ['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f59e0b'][i % 5] })))

const paymentMethodLegend = computed(() => {
  const map = {}
  paymentsStore.payments.forEach(p => {
    map[p.method] = (map[p.method] || 0) + 1
  })
  const total = paymentsStore.payments.length || 1
  return Object.entries(map).map(([k, v], i) => ({
    label: PAYMENT_METHODS.find(m => m.value === k)?.label || k,
    count: v,
    percent: Math.round((v / total) * 100),
    color: ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444'][i % 5]
  }))
})

const topSpenders = computed(() => {
  const map = {}
  billsStore.bills.forEach(b => {
    if (!map[b.subscriberId]) map[b.subscriberId] = { total: 0, count: 0 }
    map[b.subscriberId].total += Number(b.totalAmount)
    map[b.subscriberId].count += 1
  })
  return Object.entries(map).map(([id, data]) => {
    const sub = subscribersStore.subscribers.find(s => s.id === Number(id))
    return { id, name: sub?.name || 'غير معروف', total: data.total, billsCount: data.count }
  }).sort((a, b) => b.total - a.total).slice(0, 5)
})

const monthlyReport = computed(() => {
  const monthsMap = {}
  billsStore.bills.forEach(b => {
    const d = new Date(b.issueDate)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthsMap[key]) monthsMap[key] = { month: `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`, count: 0, total: 0, collected: 0, date: d }
    monthsMap[key].count += 1
    monthsMap[key].total += Number(b.totalAmount)
  })
  paymentsStore.payments.forEach(p => {
    const d = new Date(p.paymentDate)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthsMap[key]) monthsMap[key].collected += Number(p.amount)
  })
  return Object.values(monthsMap).sort((a, b) => b.date - a.date).map(r => ({
    ...r,
    rate: r.total ? Math.round((r.collected / r.total) * 100) : 0
  }))
})

const getSubscriberName = (id) => subscribersStore.subscribers.find(s => s.id === id)?.name || 'غير معروف'
const daysOverdue = (dueDate) => Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24))

const renderPaymentMethodChart = () => {
  if (!paymentMethodChart.value) return
  if (pmChartInstance) pmChartInstance.destroy()
  const labels = paymentMethodLegend.value.map(l => l.label)
  const values = paymentMethodLegend.value.map(l => l.count)
  const colors = paymentMethodLegend.value.map(l => l.color)
  pmChartInstance = new Chart(paymentMethodChart.value, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false }, tooltip: { rtl: true, backgroundColor: '#1f2937', titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' } } }
    }
  })
}

const exportReport = () => {
  // simple CSV export
  const csv = monthlyReport.value.map(r => `${r.month},${r.count},${r.total},${r.collected},${r.total - r.collected},${r.rate}%`).join('\n')
  const header = 'الشهر,عدد الفواتير,الإجمالي,المحصل,المستحق,معدل التحصيل\n'
  const blob = new Blob(['\ufeff' + header + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `تقرير-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

const printReport = () => window.print()
</script>
