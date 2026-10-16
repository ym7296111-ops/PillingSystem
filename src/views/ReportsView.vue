<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">📈</div>
      <div><h1 class="text-xl font-bold">التقارير</h1><p class="text-sm text-gray-500">كشف حساب، إيصالات، خصومات، بدون إيصالات، أرصدة</p></div>
    </div>

    <div class="card p-2 flex gap-2 overflow-x-auto">
      <button v-for="tab in reportTabs" :key="tab.key" @click="activeTab = tab.key" :class="['px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap', activeTab === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">{{ tab.icon }} {{ tab.label }}</button>
    </div>

    <!-- Subscriber Statement -->
    <div v-if="activeTab === 'statement'" class="space-y-4">
      <div class="card p-5">
        <h3 class="font-bold mb-4">كشف حساب المشترك</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select v-model="statementAccount" class="input text-sm"><option value="">اختر المشترك</option><option v-for="s in subscribersStore.subscribers" :key="s.accountNumber" :value="s.accountNumber">{{ s.accountNumber }} - {{ s.name }}</option></select>
          <input v-model="statementFrom" type="date" class="input text-sm" />
          <input v-model="statementTo" type="date" class="input text-sm" />
        </div>
        <div class="mt-4 flex gap-2"><button @click="generateStatement" class="btn-primary text-sm">عرض كشف الحساب</button><button @click="exportStatement" class="btn-secondary text-sm">📤 تصدير Excel</button></div>
      </div>

      <div v-if="statementData" class="card p-6">
        <div class="flex justify-between items-start mb-6">
          <div><h4 class="font-bold text-lg">{{ statementData.subscriber?.name }}</h4><p class="text-sm text-gray-500 font-mono">{{ statementData.subscriber?.accountNumber }} - {{ statementData.subscriber?.areaCode }}</p></div>
          <div class="text-left text-sm"><p>الرصيد الافتتاحي (1/7): <span class="font-bold">{{ formatCurrency(statementData.opening) }}</span></p><p>الرصيد الحالي: <span class="font-bold" :class="statementData.current > 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatCurrency(statementData.current) }} {{ statementData.current > 0 ? '(عليه)' : statementData.current < 0 ? '(له)' : '' }}</span></p></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 class="font-bold text-sm mb-3">تفاصيل الإيصالات (المستحقات) - {{ statementData.receipts.length }}</h5>
            <div class="border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table class="w-full text-xs"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-right">التاريخ</th><th class="px-3 py-2 text-right">النوع</th><th class="px-3 py-2 text-right">المبلغ</th></tr></thead><tbody class="divide-y"><tr v-for="r in statementData.receipts" :key="r.id"><td class="px-3 py-2">{{ formatDateShort(r.date) }}</td><td class="px-3 py-2">{{ getTypeName(r.typeId) }}</td><td class="px-3 py-2 font-bold">{{ formatCurrency(r.amount) }}</td></tr></tbody></table>
            </div>
            <p class="text-sm font-bold mt-2">الإجمالي: {{ formatCurrency(statementData.totalReceipts) }}</p>
          </div>
          <div>
            <h5 class="font-bold text-sm mb-3">تفاصيل الخصومات - {{ statementData.discounts.length }}</h5>
            <div class="border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table class="w-full text-xs"><thead class="bg-gray-50"><tr><th class="px-3 py-2 text-right">الشهر</th><th class="px-3 py-2 text-right">الخصم</th><th class="px-3 py-2 text-right">الدفعة</th></tr></thead><tbody class="divide-y"><tr v-for="d in statementData.discounts" :key="d.id"><td class="px-3 py-2">{{ d.fiscalMonth }}</td><td class="px-3 py-2 font-bold text-emerald-700">{{ formatCurrency(d.discountAmount) }}</td><td class="px-3 py-2 font-mono text-[11px]">{{ d.importBatch }}</td></tr></tbody></table>
            </div>
            <p class="text-sm font-bold mt-2">الإجمالي: {{ formatCurrency(statementData.totalDiscounts) }}</p>
          </div>
        </div>

        <div class="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100 flex justify-between items-center">
          <span class="font-bold">المعادلة: افتتاحي + إيصالات - خصومات = حالي</span>
          <span class="font-bold">{{ formatCurrency(statementData.opening) }} + {{ formatCurrency(statementData.totalReceipts) }} - {{ formatCurrency(statementData.totalDiscounts) }} = {{ formatCurrency(statementData.current) }}</span>
        </div>
      </div>
    </div>

    <!-- Receipts Report -->
    <div v-if="activeTab === 'receipts'" class="space-y-4">
      <div class="card p-5">
        <h3 class="font-bold mb-4">تقرير الإيصالات التفصيلي والإجمالي</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select v-model="receiptsReport.groupBy" class="input text-sm"><option value="">بدون تجميع</option><option value="branch">تجميع حسب الفرع</option><option value="group">حسب المجموعة</option><option value="area">حسب المنطقة</option><option value="type">حسب نوع الإيصال</option></select>
          <input v-model="receiptsReport.dateFrom" type="date" class="input text-sm" />
          <input v-model="receiptsReport.dateTo" type="date" class="input text-sm" />
          <button @click="exportReceiptsReport" class="btn-secondary text-sm">📤 تصدير</button>
        </div>
      </div>

      <div v-if="receiptsReport.groupBy" class="card p-6">
        <h4 class="font-bold mb-4">مجمع حسب {{ receiptsReport.groupBy }}</h4>
        <div class="space-y-2">
          <div v-for="(group, key) in groupedReceipts" :key="key" class="flex justify-between p-3 bg-gray-50 rounded-xl"><span class="font-medium">{{ key }}</span><span class="font-bold">{{ group.count }} إيصال - {{ formatCurrency(group.total) }}</span></div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm"><thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-4 py-3 text-right">رقم الحساب</th><th class="px-4 py-3 text-right">التاريخ</th><th class="px-4 py-3 text-right">النوع</th><th class="px-4 py-3 text-right">المبلغ</th><th class="px-4 py-3 text-right">السنة المالية</th></tr></thead><tbody class="divide-y"><tr v-for="r in filteredReceiptsForReport" :key="r.id"><td class="px-4 py-3 font-mono">{{ r.accountNumber }}</td><td class="px-4 py-3">{{ formatDateShort(r.date) }}</td><td class="px-4 py-3">{{ getTypeName(r.typeId) }}</td><td class="px-4 py-3 font-bold">{{ formatCurrency(r.amount) }}</td><td class="px-4 py-3">{{ r.fiscalYear }}</td></tr></tbody></table>
        </div>
      </div>
    </div>

    <!-- Discounts Report -->
    <div v-if="activeTab === 'discounts'" class="space-y-4">
      <div class="card p-5">
        <h3 class="font-bold mb-4">تقرير الخصومات المستوردة</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select v-model="discountsReport.month" class="input text-sm"><option value="">جميع الشهور</option><option v-for="m in fiscalMonths" :key="m" :value="m">{{ m }}</option></select>
          <select v-model="discountsReport.group" class="input text-sm"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
          <button @click="exportDiscountsReport" class="btn-secondary text-sm">📤 تصدير</button>
        </div>
      </div>
      <div class="card p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-emerald-50 p-4 rounded-xl text-center"><p class="text-2xl font-bold text-emerald-700">{{ filteredDiscountsForReport.length }}</p><p class="text-xs">عدد الخصومات</p></div>
          <div class="bg-blue-50 p-4 rounded-xl text-center"><p class="text-2xl font-bold text-blue-700">{{ formatCurrency(filteredDiscountsForReport.reduce((s,d) => s + Number(d.discountAmount), 0)) }}</p><p class="text-xs">إجمالي الخصومات</p></div>
          <div class="bg-purple-50 p-4 rounded-xl text-center"><p class="text-2xl font-bold text-purple-700">{{ discountsStore.batches.length }}</p><p class="text-xs">عدد الدفعات</p></div>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50 text-xs"><tr><th class="px-3 py-2 text-right">المنطقة</th><th class="px-3 py-2 text-right">عدد الخصومات</th><th class="px-3 py-2 text-right">إجمالي الخصم</th></tr></thead><tbody class="divide-y"><tr v-for="(val, key) in discountsGroupedByArea" :key="key"><td class="px-3 py-2 font-mono">{{ key }}</td><td class="px-3 py-2">{{ val.count }}</td><td class="px-3 py-2 font-bold">{{ formatCurrency(val.total) }}</td></tr></tbody></table></div>
      </div>
    </div>

    <!-- No Receipt Report -->
    <div v-if="activeTab === 'noReceipt'" class="space-y-4">
      <div class="card p-5">
        <h3 class="font-bold mb-4">تقرير المشتركين بدون إيصالات</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select v-model="noReceiptReport.month" class="input text-sm"><option value="">اختر الشهر</option><option v-for="m in 12" :key="m" :value="m">{{ new Date(0, m-1).toLocaleDateString('ar-EG', { month: 'long' }) }}</option></select>
          <select v-model="noReceiptReport.branch" class="input text-sm"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
          <select v-model="noReceiptReport.group" class="input text-sm"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
          <button @click="exportNoReceiptReport" class="btn-secondary text-sm">📤 تصدير Excel</button>
        </div>
      </div>
      <div class="card p-6">
        <h4 class="font-bold mb-4">المشتركين بدون إيصالات في شهر {{ noReceiptReport.month ? new Date(0, noReceiptReport.month-1).toLocaleDateString('ar-EG', { month: 'long' }) : 'غير محدد' }} - {{ noReceiptSubscribers.length }} مشترك</h4>
        <div class="overflow-x-auto max-h-96"><table class="w-full text-sm"><thead class="bg-gray-50 text-xs"><tr><th class="px-3 py-2 text-right">رقم الحساب</th><th class="px-3 py-2 text-right">الاسم</th><th class="px-3 py-2 text-right">المنطقة</th><th class="px-3 py-2 text-right">الرصيد</th></tr></thead><tbody class="divide-y"><tr v-for="s in noReceiptSubscribers" :key="s.accountNumber"><td class="px-3 py-2 font-mono font-bold">{{ s.accountNumber }}</td><td class="px-3 py-2">{{ s.name }}</td><td class="px-3 py-2 font-mono">{{ s.areaCode }}</td><td class="px-3 py-2 font-bold">{{ formatCurrency(balances[s.accountNumber]) }}</td></tr></tbody></table></div>
      </div>
    </div>

    <!-- Balances Report -->
    <div v-if="activeTab === 'balances'" class="space-y-4">
      <div class="card p-5">
        <h3 class="font-bold mb-4">تقرير الأرصدة</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select v-model="balancesReport.branch" class="input text-sm"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
          <select v-model="balancesReport.status" class="input text-sm"><option value="">جميع الحالات</option><option value="positive">عليه</option><option value="negative">له</option><option value="zero">صفر</option></select>
          <div class="flex gap-2"><input v-model.number="balancesReport.min" type="number" class="input text-sm" placeholder="من مبلغ" /><input v-model.number="balancesReport.max" type="number" class="input text-sm" placeholder="إلى مبلغ" /></div>
          <button @click="exportBalancesReport" class="btn-secondary text-sm">📤 تصدير</button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50 text-xs"><tr><th class="px-4 py-3 text-right">رقم الحساب</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">افتتاحي</th><th class="px-4 py-3 text-right">إيصالات</th><th class="px-4 py-3 text-right">خصومات</th><th class="px-4 py-3 text-right">حالي</th><th class="px-4 py-3 text-right">الحالة</th></tr></thead><tbody class="divide-y"><tr v-for="s in filteredBalances" :key="s.accountNumber"><td class="px-4 py-3 font-mono font-bold">{{ s.accountNumber }}</td><td class="px-4 py-3">{{ s.name }}</td><td class="px-4 py-3">{{ formatCurrency(s.openingBalance) }}</td><td class="px-4 py-3">{{ formatCurrency(s.totalReceipts) }}</td><td class="px-4 py-3 text-emerald-700">{{ formatCurrency(s.totalDiscounts) }}</td><td class="px-4 py-3 font-bold" :class="s.current > 0 ? 'text-red-600' : s.current < 0 ? 'text-emerald-600' : ''">{{ formatCurrency(s.current) }}</td><td class="px-4 py-3"><span :class="['badge text-xs', s.current > 0 ? 'badge-danger' : s.current < 0 ? 'badge-success' : 'badge-gray']">{{ s.current > 0 ? 'عليه' : s.current < 0 ? 'له' : 'صفر' }}</span></td></tr></tbody></table></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHierarchyStore } from '@/stores/hierarchy'
import { useSubscribersStore } from '@/stores/subscribers'
import { useReceiptsStore } from '@/stores/receipts'
import { useReceiptTypesStore } from '@/stores/receiptTypes'
import { useDiscountsStore } from '@/stores/discounts'
import { db } from '@/db'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import { useExport } from '@/composables/useExport'

const route = useRoute()
const hierarchyStore = useHierarchyStore()
const subscribersStore = useSubscribersStore()
const receiptsStore = useReceiptsStore()
const receiptTypesStore = useReceiptTypesStore()
const discountsStore = useDiscountsStore()
const { exportToExcel } = useExport()

const activeTab = ref('statement')
const reportTabs = [
  { key: 'statement', label: 'كشف حساب', icon: '📄' },
  { key: 'receipts', label: 'الإيصالات', icon: '🧾' },
  { key: 'discounts', label: 'الخصومات', icon: '💸' },
  { key: 'noReceipt', label: 'بدون إيصالات', icon: '⚠️' },
  { key: 'balances', label: 'الأرصدة', icon: '💰' }
]

const statementAccount = ref(route.query.account || '')
const statementFrom = ref('')
const statementTo = ref('')
const statementData = ref(null)

const receiptsReport = ref({ groupBy: '', dateFrom: '', dateTo: '' })
const discountsReport = ref({ month: '', group: '' })
const noReceiptReport = ref({ month: new Date().getMonth() + 1, branch: '', group: '' })
const balancesReport = ref({ branch: '', status: '', min: '', max: '' })

const balances = ref({})
const balancesDetailed = ref([])

const fiscalMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

onMounted(async () => {
  await Promise.all([hierarchyStore.fetchAll(), subscribersStore.fetchSubscribers(), receiptsStore.fetchReceipts(), receiptTypesStore.fetchTypes(), discountsStore.fetchDiscounts()])
  await loadBalances()
  if (statementAccount.value) generateStatement()
})

const loadBalances = async () => {
  const subs = await db.subscribers.toArray()
  const receipts = await db.receipts.toArray()
  const discounts = await db.discounts.toArray()
  const map = {}
  const detailed = []
  subs.forEach(s => {
    const rList = receipts.filter(r => r.accountNumber === s.accountNumber)
    const dList = discounts.filter(d => d.accountNumber === s.accountNumber)
    const rTotal = rList.reduce((sum, r) => sum + Number(r.amount), 0)
    const dTotal = dList.reduce((sum, d) => sum + Number(d.discountAmount), 0)
    const current = Number(s.openingBalance) + rTotal - dTotal
    map[s.accountNumber] = current
    detailed.push({ ...s, totalReceipts: rTotal, totalDiscounts: dTotal, current })
  })
  balances.value = map
  balancesDetailed.value = detailed
}

const getTypeName = (id) => receiptTypesStore.types.find(t => t.id === id)?.name || '-'

const generateStatement = async () => {
  if (!statementAccount.value) return
  const sub = subscribersStore.subscribers.find(s => s.accountNumber === statementAccount.value)
  if (!sub) return
  let receipts = receiptsStore.receipts.filter(r => r.accountNumber === statementAccount.value)
  let discounts = discountsStore.discounts.filter(d => d.accountNumber === statementAccount.value)
  if (statementFrom.value) receipts = receipts.filter(r => new Date(r.date) >= new Date(statementFrom.value))
  if (statementTo.value) receipts = receipts.filter(r => new Date(r.date) <= new Date(statementTo.value))
  const totalReceipts = receipts.reduce((s, r) => s + Number(r.amount), 0)
  const totalDiscounts = discounts.reduce((s, d) => s + Number(d.discountAmount), 0)
  const opening = Number(sub.openingBalance)
  const current = opening + totalReceipts - totalDiscounts
  statementData.value = { subscriber: sub, opening, totalReceipts, totalDiscounts, current, receipts, discounts }
}

const exportStatement = () => {
  if (!statementData.value) return
  const data = [
    { 'البيان': 'الرصيد الافتتاحي', 'المبلغ': statementData.value.opening },
    ...statementData.value.receipts.map(r => ({ 'البيان': `إيصال ${getTypeName(r.typeId)} - ${formatDateShort(r.date)}`, 'المبلغ': r.amount })),
    ...statementData.value.discounts.map(d => ({ 'البيان': `خصم ${d.fiscalMonth}`, 'المبلغ': -d.discountAmount })),
    { 'البيان': 'الرصيد الحالي', 'المبلغ': statementData.value.current }
  ]
  exportToExcel(data, `كشف-حساب-${statementAccount.value}`, 'كشف حساب')
}

const filteredReceiptsForReport = computed(() => {
  let result = [...receiptsStore.receipts]
  if (receiptsReport.value.dateFrom) result = result.filter(r => new Date(r.date) >= new Date(receiptsReport.value.dateFrom))
  if (receiptsReport.value.dateTo) result = result.filter(r => new Date(r.date) <= new Date(receiptsReport.value.dateTo))
  return result
})

const groupedReceipts = computed(() => {
  if (!receiptsReport.value.groupBy) return {}
  const groups = {}
  filteredReceiptsForReport.value.forEach(r => {
    let key = 'غير معروف'
    if (receiptsReport.value.groupBy === 'branch') key = `فرع ${r.accountNumber.substring(0,2)}`
    if (receiptsReport.value.groupBy === 'type') key = getTypeName(r.typeId)
    if (receiptsReport.value.groupBy === 'area') { const sub = subscribersStore.subscribers.find(s => s.accountNumber === r.accountNumber); key = sub?.areaCode || 'غير معروف' }
    if (receiptsReport.value.groupBy === 'group') { const sub = subscribersStore.subscribers.find(s => s.accountNumber === r.accountNumber); key = sub?.areaCode ? `مجموعة ${sub.areaCode.charAt(0)}` : 'غير معروف' }
    if (!groups[key]) groups[key] = { count: 0, total: 0 }
    groups[key].count++
    groups[key].total += Number(r.amount)
  })
  return groups
})

const exportReceiptsReport = () => {
  const data = filteredReceiptsForReport.value.map(r => ({ 'رقم الحساب': r.accountNumber, 'التاريخ': formatDateShort(r.date), 'النوع': getTypeName(r.typeId), 'المبلغ': r.amount, 'السنة المالية': r.fiscalYear }))
  exportToExcel(data, `تقرير-الإيصالات-${new Date().toISOString().split('T')[0]}`, 'إيصالات')
}

const filteredDiscountsForReport = computed(() => {
  let result = [...discountsStore.discounts]
  if (discountsReport.value.month) result = result.filter(d => d.fiscalMonth?.includes(discountsReport.value.month))
  if (discountsReport.value.group) result = result.filter(d => d.areaCode?.startsWith(discountsReport.value.group))
  return result
})

const discountsGroupedByArea = computed(() => {
  const groups = {}
  filteredDiscountsForReport.value.forEach(d => {
    if (!groups[d.areaCode]) groups[d.areaCode] = { count: 0, total: 0 }
    groups[d.areaCode].count++
    groups[d.areaCode].total += Number(d.discountAmount)
  })
  return groups
})

const exportDiscountsReport = () => {
  const data = filteredDiscountsForReport.value.map(d => ({ 'المنطقة': d.areaCode, 'رقم الحساب': d.accountNumber, 'الخصم': d.discountAmount, 'المتبقي': d.remainingAmount, 'الإجمالي': d.invoiceTotal, 'الشهر': d.fiscalMonth, 'الدفعة': d.importBatch }))
  exportToExcel(data, `تقرير-الخصومات-${new Date().toISOString().split('T')[0]}`, 'خصومات')
}

const noReceiptSubscribers = computed(() => {
  if (!noReceiptReport.value.month) return []
  const month = Number(noReceiptReport.value.month)
  const receiptsInMonth = receiptsStore.receipts.filter(r => new Date(r.date).getMonth() + 1 === month)
  const accountsWithReceipt = new Set(receiptsInMonth.map(r => r.accountNumber))
  let result = subscribersStore.subscribers.filter(s => !accountsWithReceipt.has(s.accountNumber))
  if (noReceiptReport.value.branch) result = result.filter(s => s.accountNumber.startsWith(noReceiptReport.value.branch))
  if (noReceiptReport.value.group) result = result.filter(s => s.areaCode?.startsWith(noReceiptReport.value.group))
  return result
})

const exportNoReceiptReport = () => {
  const data = noReceiptSubscribers.value.map(s => ({ 'رقم الحساب': s.accountNumber, 'الاسم': s.name, 'المنطقة': s.areaCode, 'الرصيد': balances.value[s.accountNumber] }))
  exportToExcel(data, `بدون-إيصالات-شهر-${noReceiptReport.value.month}`, 'بدون إيصالات')
}

const filteredBalances = computed(() => {
  let result = [...balancesDetailed.value]
  if (balancesReport.value.branch) result = result.filter(s => s.accountNumber.startsWith(balancesReport.value.branch))
  if (balancesReport.value.status) {
    result = result.filter(s => {
      if (balancesReport.value.status === 'positive') return s.current > 0
      if (balancesReport.value.status === 'negative') return s.current < 0
      if (balancesReport.value.status === 'zero') return s.current === 0
      return true
    })
  }
  if (balancesReport.value.min !== '') result = result.filter(s => s.current >= Number(balancesReport.value.min))
  if (balancesReport.value.max !== '') result = result.filter(s => s.current <= Number(balancesReport.value.max))
  return result
})

const exportBalancesReport = () => {
  const data = filteredBalances.value.map(s => ({ 'رقم الحساب': s.accountNumber, 'الاسم': s.name, 'المنطقة': s.areaCode, 'افتتاحي': s.openingBalance, 'إيصالات': s.totalReceipts, 'خصومات': s.totalDiscounts, 'حالي': s.current, 'الحالة': s.current > 0 ? 'عليه' : s.current < 0 ? 'له' : 'صفر' }))
  exportToExcel(data, `تقرير-الأرصدة-${new Date().toISOString().split('T')[0]}`, 'أرصدة')
}
</script>
