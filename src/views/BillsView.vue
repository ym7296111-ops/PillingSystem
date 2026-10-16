<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">🧾</div>
        <div>
          <h1 class="text-xl font-bold">إدارة الفواتير</h1>
          <p class="text-sm text-gray-500">{{ filtered.length }} فاتورة • {{ formatCurrency(stats.totalAmount) }} إجمالي</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="handleExport" class="btn-secondary text-sm">📤 تصدير</button>
        <button @click="openAdd" class="btn-primary text-sm">➕ إنشاء فاتورة</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="card p-4">
        <p class="text-xs text-gray-500">الكل</p>
        <p class="text-xl font-bold">{{ stats.total }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ formatCurrency(stats.totalAmount) }}</p>
      </div>
      <div class="card p-4 border-emerald-100">
        <p class="text-xs text-emerald-600">مدفوعة</p>
        <p class="text-xl font-bold text-emerald-700">{{ stats.paid }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ formatCurrency(stats.paidAmount) }}</p>
      </div>
      <div class="card p-4 border-red-100">
        <p class="text-xs text-red-600">غير مدفوعة</p>
        <p class="text-xl font-bold text-red-700">{{ stats.unpaid }}</p>
        <p class="text-xs text-gray-400">+ {{ stats.partial }} جزئية</p>
      </div>
      <div class="card p-4 border-red-200 bg-red-50/50">
        <p class="text-xs text-red-600">متأخرة</p>
        <p class="text-xl font-bold text-red-700">{{ stats.overdue }}</p>
        <p class="text-xs text-red-400 mt-1">تحتاج متابعة</p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500">مستحقة</p>
        <p class="text-xl font-bold">{{ formatCurrency(stats.unpaidAmount).split(' ')[0] }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ currency }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SearchInput v-model="billsStore.searchQuery" placeholder="بحث برقم الفاتورة أو الوصف..." />
        <select v-model="billsStore.statusFilter" class="input text-sm">
          <option value="">جميع الحالات</option>
          <option value="paid">مدفوعة</option>
          <option value="unpaid">غير مدفوعة</option>
          <option value="partial">مدفوعة جزئياً</option>
          <option value="overdue">متأخرة</option>
        </select>
        <input v-model="billsStore.dateFilter" type="date" class="input text-sm" />
        <button @click="clearFilters" class="btn-ghost text-sm">مسح الفلاتر</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="billsStore.loading" class="p-12 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
      </div>
      <div v-else-if="paginated.length === 0">
        <EmptyState icon="🧾" title="لا توجد فواتير" description="لم يتم العثور على فواتير مطابقة." >
          <button @click="openAdd" class="btn-primary mt-4">إنشاء أول فاتورة</button>
        </EmptyState>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr class="text-xs text-gray-500 text-right">
              <th class="px-4 py-3">رقم الفاتورة</th>
              <th class="px-4 py-3">المشترك</th>
              <th class="px-4 py-3">المبلغ</th>
              <th class="px-4 py-3">تاريخ الإصدار</th>
              <th class="px-4 py-3">الاستحقاق</th>
              <th class="px-4 py-3">الحالة</th>
              <th class="px-4 py-3 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="bill in paginated" :key="bill.id" class="hover:bg-gray-50 transition group">
              <td class="px-4 py-3">
                <p class="font-mono text-sm font-bold">{{ bill.billNumber }}</p>
                <p class="text-xs text-gray-500 truncate max-w-[150px]">{{ bill.description }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium">{{ getSubscriberName(bill.subscriberId) }}</p>
                <p class="text-xs text-gray-500">{{ getSubscriberPhone(bill.subscriberId) }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="font-bold text-sm">{{ formatCurrency(bill.totalAmount) }}</p>
                <p v-if="bill.discount" class="text-xs text-emerald-600">خصم {{ formatCurrency(bill.discount) }}</p>
              </td>
              <td class="px-4 py-3 text-sm">{{ formatDateShort(bill.issueDate) }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="{ 'text-red-600 font-medium': isOverdue(bill) }">{{ formatDateShort(bill.dueDate) }}</span>
                <span v-if="isOverdue(bill)" class="block text-[10px] text-red-500">متأخرة</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['badge text-xs', getStatusColor(bill)]">{{ getStatusLabel(bill) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  <button @click="openPay(bill)" v-if="bill.status !== 'paid'" class="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-xs" title="دفع">💰</button>
                  <button @click="printInvoice(bill)" class="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-xs" title="طباعة">🖨️</button>
                  <button @click="openEdit(bill)" class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-xs" title="تعديل">✏️</button>
                  <button @click="confirmDelete(bill)" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-xs" title="حذف">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length > perPage" class="p-4 border-t">
        <Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" />
      </div>
    </div>

    <!-- Modals -->
    <BillForm v-if="showForm" :bill="selectedBill" :subscribers="subscribersStore.subscribers" :currency="settingsStore.settings.currency" :tax-rate="Number(settingsStore.settings.taxRate)" :loading="saving" @close="showForm = false" @save="handleSave" />

    <ConfirmModal :show="showDelete" title="حذف الفاتورة" :message="`هل أنت متأكد من حذف الفاتورة ${selectedBill?.billNumber}؟`" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />

    <!-- Payment Modal -->
    <div v-if="showPay" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPay = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <h3 class="font-bold text-lg mb-1">تسجيل دفعة</h3>
        <p class="text-sm text-gray-500 mb-6">فاتورة {{ selectedBill?.billNumber }} - {{ formatCurrency(selectedBill?.totalAmount) }}</p>
        
        <div class="space-y-4">
          <div>
            <label class="label">المبلغ المدفوع *</label>
            <input v-model.number="paymentForm.amount" type="number" step="0.01" :max="selectedBill?.totalAmount" class="input" required />
            <p class="text-xs text-gray-500 mt-1">المتبقي: {{ formatCurrency((selectedBill?.totalAmount || 0) - paidAmount) }}</p>
          </div>
          <div>
            <label class="label">طريقة الدفع</label>
            <select v-model="paymentForm.method" class="input">
              <option v-for="m in paymentMethods" :key="m.value" :value="m.value">{{ m.icon }} {{ m.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">رقم المرجع</label>
            <input v-model="paymentForm.reference" type="text" class="input" placeholder="اختياري" />
          </div>
          <div>
            <label class="label">تاريخ الدفع</label>
            <input v-model="paymentForm.paymentDate" type="date" class="input" />
          </div>
          <div>
            <label class="label">ملاحظات</label>
            <input v-model="paymentForm.notes" type="text" class="input" placeholder="..." />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showPay = false" class="btn-secondary flex-1">إلغاء</button>
          <button @click="handlePay" class="btn-success flex-1">تأكيد الدفع</button>
        </div>
      </div>
    </div>

    <!-- Invoice Print Area -->
    <div id="invoice-print" class="hidden">
      <div v-if="selectedBill" class="p-8 bg-white text-black" style="width: 210mm; min-height: 297mm;">
        <div class="text-center border-b pb-6 mb-6">
          <h1 class="text-2xl font-bold">{{ settingsStore.settings.companyName }}</h1>
          <p class="text-sm mt-2">{{ settingsStore.settings.companyAddress }} - {{ settingsStore.settings.companyPhone }}</p>
        </div>
        <h2 class="text-xl font-bold text-center mb-6">فاتورة</h2>
        <div class="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p><strong>رقم الفاتورة:</strong> {{ selectedBill.billNumber }}</p>
            <p><strong>تاريخ الإصدار:</strong> {{ formatDateShort(selectedBill.issueDate) }}</p>
            <p><strong>الاستحقاق:</strong> {{ formatDateShort(selectedBill.dueDate) }}</p>
          </div>
          <div>
            <p><strong>المشترك:</strong> {{ getSubscriberName(selectedBill.subscriberId) }}</p>
            <p><strong>الهاتف:</strong> {{ getSubscriberPhone(selectedBill.subscriberId) }}</p>
          </div>
        </div>
        <table class="w-full border">
          <tr class="bg-gray-100"><th class="border p-2">البيان</th><th class="border p-2">المبلغ</th></tr>
          <tr><td class="border p-2">{{ selectedBill.description }}</td><td class="border p-2">{{ formatCurrency(selectedBill.amount) }}</td></tr>
          <tr><td class="border p-2">الخصم</td><td class="border p-2">{{ formatCurrency(selectedBill.discount) }}</td></tr>
          <tr><td class="border p-2">الضريبة</td><td class="border p-2">{{ formatCurrency(selectedBill.tax) }}</td></tr>
          <tr class="font-bold"><td class="border p-2">الإجمالي</td><td class="border p-2">{{ formatCurrency(selectedBill.totalAmount) }}</td></tr>
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
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import { PAYMENT_METHODS, BILL_STATUS } from '@/utils/constants'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BillForm from '@/components/bills/BillForm.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()
const { exportToExcel, generateInvoicePDF } = useExport()

const paymentMethods = PAYMENT_METHODS

const showForm = ref(false)
const showDelete = ref(false)
const showPay = ref(false)
const selectedBill = ref(null)
const saving = ref(false)
const currentPage = ref(1)
const perPage = ref(12)

const paymentForm = ref({
  amount: 0,
  method: 'cash',
  reference: '',
  paymentDate: new Date().toISOString().split('T')[0],
  notes: ''
})

onMounted(async () => {
  await Promise.all([
    subscribersStore.fetchSubscribers(),
    billsStore.fetchBills(),
    paymentsStore.fetchPayments(),
    settingsStore.fetchSettings()
  ])
})

const filtered = computed(() => billsStore.filteredBills)
const stats = computed(() => billsStore.stats)
const currency = computed(() => settingsStore.settings.currency || 'ج.م')

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

watch(() => filtered.value.length, () => currentPage.value = 1)

const getSubscriberName = (id) => subscribersStore.subscribers.find(s => s.id === id)?.name || 'غير معروف'
const getSubscriberPhone = (id) => subscribersStore.subscribers.find(s => s.id === id)?.phone || ''

const getStatusLabel = (bill) => {
  if (bill.status !== 'paid' && new Date(bill.dueDate) < new Date()) return 'متأخرة'
  return BILL_STATUS.find(s => s.value === bill.status)?.label || bill.status
}

const getStatusColor = (bill) => {
  if (bill.status !== 'paid' && new Date(bill.dueDate) < new Date()) return 'bg-red-100 text-red-800 border border-red-200'
  return BILL_STATUS.find(s => s.value === bill.status)?.color || 'badge-gray'
}

const isOverdue = (bill) => bill.status !== 'paid' && new Date(bill.dueDate) < new Date()

const paidAmount = computed(() => {
  if (!selectedBill.value) return 0
  return paymentsStore.getPaymentsByBill(selectedBill.value.id).reduce((sum, p) => sum + Number(p.amount), 0)
})

const clearFilters = () => {
  billsStore.searchQuery = ''
  billsStore.statusFilter = ''
  billsStore.dateFilter = ''
}

const openAdd = () => {
  selectedBill.value = null
  showForm.value = true
}

const openEdit = (bill) => {
  selectedBill.value = bill
  showForm.value = true
}

const confirmDelete = (bill) => {
  selectedBill.value = bill
  showDelete.value = true
}

const openPay = (bill) => {
  selectedBill.value = bill
  const remaining = bill.totalAmount - paymentsStore.getPaymentsByBill(bill.id).reduce((s, p) => s + Number(p.amount), 0)
  paymentForm.value = {
    amount: remaining,
    method: 'cash',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  }
  showPay.value = true
}

const handleSave = async (data) => {
  saving.value = true
  try {
    if (selectedBill.value) {
      await billsStore.updateBill(selectedBill.value.id, data)
      toast.success('تم تحديث الفاتورة')
    } else {
      await billsStore.addBill(data)
      toast.success('تم إنشاء الفاتورة')
    }
    showForm.value = false
  } catch (e) {
    toast.error('فشل حفظ الفاتورة')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  try {
    await billsStore.deleteBill(selectedBill.value.id)
    toast.success('تم حذف الفاتورة')
    showDelete.value = false
  } catch (e) {
    toast.error('فشل الحذف')
  }
}

const handlePay = async () => {
  try {
    await paymentsStore.addPayment({
      billId: selectedBill.value.id,
      subscriberId: selectedBill.value.subscriberId,
      amount: paymentForm.value.amount,
      method: paymentForm.value.method,
      reference: paymentForm.value.reference,
      paymentDate: paymentForm.value.paymentDate,
      notes: paymentForm.value.notes
    })
    await billsStore.fetchBills()
    toast.success('تم تسجيل الدفعة بنجاح')
    showPay.value = false
  } catch (e) {
    toast.error('فشل تسجيل الدفعة')
  }
}

const handleExport = () => {
  const data = filtered.value.map(b => ({
    'رقم الفاتورة': b.billNumber,
    'المشترك': getSubscriberName(b.subscriberId),
    'المبلغ': b.amount,
    'الخصم': b.discount,
    'الضريبة': b.tax,
    'الإجمالي': b.totalAmount,
    'تاريخ الإصدار': formatDateShort(b.issueDate),
    'الاستحقاق': formatDateShort(b.dueDate),
    'الحالة': getStatusLabel(b),
    'الوصف': b.description
  }))
  if (exportToExcel(data, `الفواتير-${new Date().toISOString().split('T')[0]}`, 'الفواتير')) {
    toast.success('تم التصدير')
  }
}

const printInvoice = (bill) => {
  selectedBill.value = bill
  const subscriber = subscribersStore.subscribers.find(s => s.id === bill.subscriberId)
  generateInvoicePDF(bill, subscriber, settingsStore.settings)
  toast.success('جاري تحميل الفاتورة PDF')
}
</script>
