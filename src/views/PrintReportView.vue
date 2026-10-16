<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center justify-between no-print">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-white">🖨️</div>
        <div><h1 class="text-xl font-bold">التقرير الأساسي للطباعة</h1><p class="text-sm text-gray-500">تقرير احترافي بهيدر وفوتر - 5 أعمدة - RTL</p></div>
      </div>
      <div class="flex gap-2">
        <button @click="generateReport" class="btn-primary text-sm">🔄 تحديث التقرير</button>
        <button @click="printReport" class="btn-secondary text-sm">🖨️ طباعة</button>
        <button @click="exportPDF" class="btn-secondary text-sm">📄 PDF</button>
      </div>
    </div>

    <div class="card p-5 no-print">
      <h3 class="font-bold mb-4">إعدادات التقرير</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select v-model="filters.branch" class="input text-sm"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
        <select v-model="filters.group" class="input text-sm"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
        <input v-model="filters.dateFrom" type="date" class="input text-sm" />
        <input v-model="filters.dateTo" type="date" class="input text-sm" />
      </div>
    </div>

    <!-- Print Report -->
    <div id="print-report" class="bg-white rounded-2xl shadow-soft border border-gray-200 overflow-hidden">
      <!-- Header -->
      <div class="p-8 border-b-2 border-gray-800">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-4">
            <div v-if="settingsStore.settings.logo" class="w-20 h-20 border rounded-xl overflow-hidden"><img :src="settingsStore.settings.logo" class="w-full h-full object-contain" /></div>
            <div v-else class="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">🏢</div>
            <div>
              <h1 class="text-xl font-bold">{{ settingsStore.settings.sectorName || 'قطاع الخدمات العامة' }}</h1>
              <h2 class="text-lg font-semibold text-gray-700">{{ settingsStore.settings.managementName || 'الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات' }}</h2>
              <p class="text-xs text-gray-500 mt-1">Subscriber Accounts Management System</p>
            </div>
          </div>
          <div class="text-left text-xs">
            <p>تاريخ الطباعة: {{ printDate }}</p>
            <p>الوقت: {{ printTime }}</p>
            <p v-if="filters.dateFrom || filters.dateTo">الفترة: {{ filters.dateFrom || '...' }} إلى {{ filters.dateTo || '...' }}</p>
            <p>السنة المالية: {{ fiscalYear.label }}</p>
          </div>
        </div>
        <div class="mt-6 text-center">
          <h3 class="text-lg font-bold border-2 border-gray-800 inline-block px-8 py-2 rounded-xl">التقرير المالي الأساسي - ملخص الإيصالات والخصومات والأرصدة</h3>
        </div>
      </div>

      <!-- Body - 5 Columns -->
      <div class="p-8">
        <table class="w-full border-collapse border border-gray-800 text-sm">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-800 px-4 py-3 text-center font-bold">نوع الإيصال</th>
              <th class="border border-gray-800 px-4 py-3 text-center font-bold">رصيد أول المدة</th>
              <th class="border border-gray-800 px-4 py-3 text-center font-bold">مجموع إيصالات جديدة</th>
              <th class="border border-gray-800 px-4 py-3 text-center font-bold">مجموع خصم</th>
              <th class="border border-gray-800 px-4 py-3 text-center font-bold">رصيد آخر المدة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in reportRows" :key="row.typeId" class="hover:bg-gray-50">
              <td class="border border-gray-800 px-4 py-3 text-center">{{ row.typeName }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono">{{ formatCurrency(row.opening) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono font-bold">{{ formatCurrency(row.newReceipts) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono text-emerald-700">{{ formatCurrency(row.totalDiscounts) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono font-bold" :class="row.closing > 0 ? 'text-red-700' : 'text-emerald-700'">{{ formatCurrency(row.closing) }}</td>
            </tr>
            <tr v-if="reportRows.length === 0">
              <td colspan="5" class="border border-gray-800 px-4 py-8 text-center text-gray-500">لا توجد بيانات</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-800 text-white font-bold">
              <td class="border border-gray-800 px-4 py-3 text-center">الإجمالي</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono">{{ formatCurrency(totals.opening) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono">{{ formatCurrency(totals.newReceipts) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono">{{ formatCurrency(totals.discounts) }}</td>
              <td class="border border-gray-800 px-4 py-3 text-center font-mono">{{ formatCurrency(totals.closing) }}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div class="border-2 border-gray-800 rounded-xl p-4 text-center">
            <p class="text-xs text-gray-600">إجمالي المشتركين</p>
            <p class="text-xl font-bold">{{ subscribersStore.subscribers.length }}</p>
          </div>
          <div class="border-2 border-gray-800 rounded-xl p-4 text-center">
            <p class="text-xs text-gray-600">إجمالي الإيصالات</p>
            <p class="text-xl font-bold">{{ receiptsStore.receipts.length }} - {{ formatCurrency(receiptsStore.receipts.reduce((s,r) => s + Number(r.amount), 0)) }}</p>
          </div>
          <div class="border-2 border-gray-800 rounded-xl p-4 text-center">
            <p class="text-xs text-gray-600">إجمالي الخصومات</p>
            <p class="text-xl font-bold">{{ discountsStore.discounts.length }} - {{ formatCurrency(discountsStore.discounts.reduce((s,d) => s + Number(d.discountAmount), 0)) }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t-2 border-gray-800 bg-gray-50 flex justify-between items-center text-xs">
        <div>
          <p>نظام الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات</p>
          <p>Subscriber Accounts Management System - V1.0.0</p>
        </div>
        <div class="text-center">
          <p>ترقيم الصفحات: صفحة 1 من 1</p>
          <p class="font-mono">{{ printDate }} - {{ printTime }}</p>
        </div>
        <div class="text-left">
          <p>إجمالي رصيد أول المدة: {{ formatCurrency(totals.opening) }}</p>
          <p>إجمالي رصيد آخر المدة: {{ formatCurrency(totals.closing) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHierarchyStore } from '@/stores/hierarchy'
import { useSubscribersStore } from '@/stores/subscribers'
import { useReceiptsStore } from '@/stores/receipts'
import { useReceiptTypesStore } from '@/stores/receiptTypes'
import { useDiscountsStore } from '@/stores/discounts'
import { useSettingsStore } from '@/stores/settings'
import { db, getCurrentFiscalYear } from '@/db'
import { formatCurrency } from '@/utils/helpers'
import { useExport } from '@/composables/useExport'

const hierarchyStore = useHierarchyStore()
const subscribersStore = useSubscribersStore()
const receiptsStore = useReceiptsStore()
const receiptTypesStore = useReceiptTypesStore()
const discountsStore = useDiscountsStore()
const settingsStore = useSettingsStore()
const { exportToPDF } = useExport()

const filters = ref({ branch: '', group: '', dateFrom: '', dateTo: '' })
const reportRows = ref([])
const totals = ref({ opening: 0, newReceipts: 0, discounts: 0, closing: 0 })

const fiscalYear = getCurrentFiscalYear()
const printDate = new Date().toLocaleDateString('ar-EG')
const printTime = new Date().toLocaleTimeString('ar-EG')

onMounted(async () => {
  await Promise.all([hierarchyStore.fetchAll(), subscribersStore.fetchSubscribers(), receiptsStore.fetchReceipts(), receiptTypesStore.fetchTypes(), discountsStore.fetchDiscounts(), settingsStore.fetchSettings()])
  await generateReport()
})

const generateReport = async () => {
  const subs = subscribersStore.subscribers
  let filteredSubs = [...subs]
  if (filters.value.branch) filteredSubs = filteredSubs.filter(s => s.accountNumber.startsWith(filters.value.branch))
  if (filters.value.group) filteredSubs = filteredSubs.filter(s => s.areaCode.startsWith(filters.value.group))

  const receipts = receiptsStore.receipts.filter(r => {
    if (filters.value.dateFrom && new Date(r.date) < new Date(filters.value.dateFrom)) return false
    if (filters.value.dateTo && new Date(r.date) > new Date(filters.value.dateTo)) return false
    return filteredSubs.some(s => s.accountNumber === r.accountNumber)
  })

  const discounts = discountsStore.discounts.filter(d => filteredSubs.some(s => s.accountNumber === d.accountNumber))

  const openingTotal = filteredSubs.reduce((sum, s) => sum + Number(s.openingBalance), 0)

  // Group by receipt type
  const typeMap = {}
  receiptTypesStore.types.forEach(t => {
    typeMap[t.id] = { typeId: t.id, typeName: t.name, opening: 0, newReceipts: 0, totalDiscounts: 0, closing: 0 }
  })

  // Distribute opening proportionally? Simplified: opening total divided by types? Actually opening is total, but for report we show opening per type? 
  // Better: opening is total opening, newReceipts per type, discounts total distributed, closing = opening + receipts - discounts
  // For this report, we want 5 columns per receipt type

  const receiptsByType = {}
  receipts.forEach(r => {
    if (!receiptsByType[r.typeId]) receiptsByType[r.typeId] = 0
    receiptsByType[r.typeId] += Number(r.amount)
  })

  const totalDiscounts = discounts.reduce((sum, d) => sum + Number(d.discountAmount), 0)

  const rows = receiptTypesStore.types.map(t => {
    const newReceipts = receiptsByType[t.id] || 0
    // For opening and discounts, distribute proportionally or show totals? 
    // According to spec: 5 columns: نوع الإيصال, رصيد أول المدة, مجموع إيصالات جديدة, مجموع خصم, رصيد آخر المدة
    // Opening is per type? We can calculate opening for subscribers who have this type? Simplified: show opening as 0 per type, but totals row shows full opening
    // Better: opening per type = 0, closing = newReceipts - (discounts proportional)
    // Let's implement: opening per type = 0, but we can show opening total only in footer. For each type, closing = newReceipts - (discounts * (newReceipts / totalReceipts))
    const totalReceipts = receipts.reduce((s, r) => s + Number(r.amount), 0) || 1
    const discountShare = totalDiscounts * (newReceipts / totalReceipts)
    return {
      typeId: t.id,
      typeName: t.name,
      opening: 0,
      newReceipts,
      totalDiscounts: discountShare,
      closing: newReceipts - discountShare
    }
  })

  // Add a row for opening balance as separate? But spec says 5 columns, first is type. We can add an extra summary in totals
  reportRows.value = rows
  totals.value = {
    opening: openingTotal,
    newReceipts: receipts.reduce((s, r) => s + Number(r.amount), 0),
    discounts: totalDiscounts,
    closing: openingTotal + receipts.reduce((s, r) => s + Number(r.amount), 0) - totalDiscounts
  }
}

const printReport = () => window.print()

const exportPDF = async () => {
  await exportToPDF('print-report', `التقرير-الأساسي-${new Date().toISOString().split('T')[0]}`)
}
</script>

<style>
@media print {
  body * { visibility: hidden; }
  #print-report, #print-report * { visibility: visible; }
  #print-report { position: absolute; left: 0; top: 0; width: 100%; }
}
</style>
