<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">💳</div>
        <div>
          <h1 class="text-xl font-bold">سجل المدفوعات</h1>
          <p class="text-sm text-gray-500">{{ filtered.length }} عملية • {{ formatCurrency(stats.totalAmount) }}</p>
        </div>
      </div>
      <button @click="handleExport" class="btn-secondary text-sm">📤 تصدير</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-4"><p class="text-xs text-gray-500">إجمالي العمليات</p><p class="text-xl font-bold">{{ stats.total }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">إجمالي المحصل</p><p class="text-xl font-bold text-emerald-700">{{ formatCurrency(stats.totalAmount) }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">هذا الشهر</p><p class="text-xl font-bold">{{ stats.thisMonthCount }}</p><p class="text-xs text-gray-400">{{ formatCurrency(stats.thisMonthAmount) }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">متوسط الدفعة</p><p class="text-xl font-bold">{{ formatCurrency(stats.totalAmount / (stats.total || 1)) }}</p></div>
    </div>

    <div class="card p-4">
      <div class="flex gap-3">
        <div class="flex-1">
          <SearchInput v-model="paymentsStore.searchQuery" placeholder="بحث بالمرجع أو الملاحظات..." />
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div v-if="paymentsStore.loading" class="p-12 text-center"><div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div></div>
      <div v-else-if="paginated.length === 0">
        <EmptyState icon="💳" title="لا توجد مدفوعات" description="لم يتم تسجيل أي مدفوعات بعد." />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-right">التاريخ</th>
              <th class="px-4 py-3 text-right">المشترك</th>
              <th class="px-4 py-3 text-right">الفاتورة</th>
              <th class="px-4 py-3 text-right">المبلغ</th>
              <th class="px-4 py-3 text-right">الطريقة</th>
              <th class="px-4 py-3 text-right">المرجع</th>
              <th class="px-4 py-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="pay in paginated" :key="pay.id" class="hover:bg-gray-50 text-sm">
              <td class="px-4 py-3">{{ formatDateShort(pay.paymentDate) }}</td>
              <td class="px-4 py-3 font-medium">{{ getSubscriberName(pay.subscriberId) }}</td>
              <td class="px-4 py-3 font-mono text-xs">{{ getBillNumber(pay.billId) }}</td>
              <td class="px-4 py-3 font-bold text-emerald-700">{{ formatCurrency(pay.amount) }}</td>
              <td class="px-4 py-3"><span class="badge bg-gray-100 text-gray-700 text-xs">{{ getMethodLabel(pay.method) }}</span></td>
              <td class="px-4 py-3 text-xs">{{ pay.reference || '-' }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="confirmDelete(pay)" class="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center mx-auto">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length > perPage" class="p-4 border-t">
        <Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" />
      </div>
    </div>

    <ConfirmModal :show="showDelete" title="حذف الدفعة" :message="`هل أنت متأكد من حذف دفعة ${selected?.amount}؟ سيتم إعادة حساب حالة الفاتورة.`" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSubscribersStore } from '@/stores/subscribers'
import { useBillsStore } from '@/stores/bills'
import { usePaymentsStore } from '@/stores/payments'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import { PAYMENT_METHODS } from '@/utils/constants'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()
const { exportToExcel } = useExport()

const currentPage = ref(1)
const perPage = ref(15)
const showDelete = ref(false)
const selected = ref(null)

onMounted(async () => {
  await Promise.all([
    subscribersStore.fetchSubscribers(),
    billsStore.fetchBills(),
    paymentsStore.fetchPayments()
  ])
})

const filtered = computed(() => paymentsStore.filteredPayments)
const stats = computed(() => paymentsStore.stats)

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

watch(() => filtered.value.length, () => currentPage.value = 1)

const getSubscriberName = (id) => subscribersStore.subscribers.find(s => s.id === id)?.name || 'غير معروف'
const getBillNumber = (id) => billsStore.bills.find(b => b.id === id)?.billNumber || id
const getMethodLabel = (v) => PAYMENT_METHODS.find(m => m.value === v)?.label || v

const confirmDelete = (pay) => {
  selected.value = pay
  showDelete.value = true
}

const handleDelete = async () => {
  try {
    await paymentsStore.deletePayment(selected.value.id)
    await billsStore.fetchBills()
    toast.success('تم حذف الدفعة')
    showDelete.value = false
  } catch {
    toast.error('فشل الحذف')
  }
}

const handleExport = () => {
  const data = filtered.value.map(p => ({
    'التاريخ': formatDateShort(p.paymentDate),
    'المشترك': getSubscriberName(p.subscriberId),
    'الفاتورة': getBillNumber(p.billId),
    'المبلغ': p.amount,
    'الطريقة': getMethodLabel(p.method),
    'المرجع': p.reference,
    'ملاحظات': p.notes
  }))
  if (exportToExcel(data, `المدفوعات-${new Date().toISOString().split('T')[0]}`, 'المدفوعات')) {
    toast.success('تم التصدير')
  }
}
</script>
