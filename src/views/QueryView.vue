<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">🔍</div>
      <div><h1 class="text-xl font-bold">الاستعلام المرن</h1><p class="text-sm text-gray-500">فلاتر شاملة - فرز - تجميع - تصدير - تعديل/حذف مع تأثير تلقائي على الرصيد</p></div>
    </div>

    <!-- Filters -->
    <div class="card p-6">
      <h3 class="font-bold mb-4">الفلاتر</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label class="label text-xs">الفرع</label>
          <select v-model="filters.branch" class="input text-sm" @change="filters.group = ''; filters.area = ''"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
        </div>
        <div>
          <label class="label text-xs">المجموعة</label>
          <select v-model="filters.group" class="input text-sm" @change="filters.area = ''"><option value="">جميع المجموعات</option><option v-for="g in filteredGroups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
        </div>
        <div>
          <label class="label text-xs">المنطقة</label>
          <select v-model="filters.area" class="input text-sm"><option value="">جميع المناطق</option><option v-for="a in filteredAreas" :key="a.id" :value="a.code">{{ a.code }} - {{ a.name }}</option></select>
        </div>
        <div>
          <label class="label text-xs">رقم الحساب / اسم المشترك</label>
          <input v-model="filters.search" type="text" class="input text-sm" placeholder="بحث..." />
        </div>
        <div>
          <label class="label text-xs">من تاريخ</label>
          <input v-model="filters.dateFrom" type="date" class="input text-sm" />
        </div>
        <div>
          <label class="label text-xs">إلى تاريخ</label>
          <input v-model="filters.dateTo" type="date" class="input text-sm" />
        </div>
        <div>
          <label class="label text-xs">نوع الإيصال</label>
          <select v-model="filters.typeId" class="input text-sm"><option value="">جميع الأنواع</option><option v-for="t in receiptTypesStore.types" :key="t.id" :value="t.id">{{ t.name }}</option></select>
        </div>
        <div>
          <label class="label text-xs">نطاق المبلغ</label>
          <div class="flex gap-2"><input v-model.number="filters.amountFrom" type="number" class="input text-sm" placeholder="من" /><input v-model.number="filters.amountTo" type="number" class="input text-sm" placeholder="إلى" /></div>
        </div>
        <div>
          <label class="label text-xs">حالة الرصيد</label>
          <select v-model="filters.balanceStatus" class="input text-sm"><option value="">الكل</option><option value="positive">عليه (مدين)</option><option value="negative">له (دائن)</option><option value="zero">صفر</option></select>
        </div>
        <div class="flex items-end gap-2">
          <button @click="clearFilters" class="btn-secondary text-sm flex-1">مسح</button>
          <button @click="exportResults" class="btn-primary text-sm flex-1">📤 تصدير</button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="card overflow-hidden">
      <div class="p-4 border-b flex items-center justify-between">
        <h3 class="font-bold">النتائج ({{ sortedResults.length }})</h3>
        <div class="flex gap-2 items-center">
          <span class="text-xs text-gray-500">ترتيب حسب:</span>
          <select v-model="sortBy" class="input text-xs w-auto"><option value="date">التاريخ</option><option value="amount">المبلغ</option><option value="accountNumber">رقم الحساب</option></select>
          <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs">{{ sortOrder === 'asc' ? '↑' : '↓' }}</button>
        </div>
      </div>

      <div v-if="sortedResults.length === 0" class="p-12 text-center text-gray-400 text-sm">لا توجد نتائج مطابقة للفلاتر</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b text-xs text-gray-500">
            <tr><th class="px-4 py-3 text-right">رقم الحساب</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">التاريخ</th><th class="px-4 py-3 text-right">النوع</th><th class="px-4 py-3 text-right">المبلغ</th><th class="px-4 py-3 text-right">الرصيد الحالي</th><th class="px-4 py-3 text-center">إجراءات</th></tr>
          </thead>
          <tbody class="divide-y text-sm">
            <tr v-for="receipt in paginated" :key="receipt.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-bold">{{ receipt.accountNumber }}</td>
              <td class="px-4 py-3">{{ getSubscriberName(receipt.accountNumber) }}</td>
              <td class="px-4 py-3">{{ formatDateShort(receipt.date) }}</td>
              <td class="px-4 py-3"><span class="badge bg-blue-100 text-blue-800 text-xs">{{ getTypeName(receipt.typeId) }}</span></td>
              <td class="px-4 py-3 font-bold">{{ formatCurrency(receipt.amount) }}</td>
              <td class="px-4 py-3 font-bold" :class="getBalanceColor(balances[receipt.accountNumber])">{{ formatCurrency(balances[receipt.accountNumber]) }}</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit(receipt)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete(receipt)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="sortedResults.length > perPage" class="p-4 border-t"><Pagination :current-page="currentPage" :total="sortedResults.length" :per-page="perPage" @update:page="currentPage = $event" /></div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showEdit = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <h3 class="font-bold mb-4">تعديل إيصال - سيؤثر على الرصيد تلقائياً</h3>
        <div class="space-y-4">
          <div><label class="label">التاريخ</label><input v-model="editForm.date" type="date" class="input" /></div>
          <div><label class="label">التصنيف</label><select v-model="editForm.typeId" class="input"><option v-for="t in receiptTypesStore.types" :key="t.id" :value="t.id">{{ t.name }}</option></select></div>
          <div><label class="label">المبلغ</label><input v-model.number="editForm.amount" type="number" step="0.01" class="input" /></div>
          <div><label class="label">رقم الإيصال</label><input v-model="editForm.receiptNumber" type="text" class="input" /></div>
        </div>
        <div class="flex gap-3 mt-6"><button @click="showEdit = false" class="btn-secondary flex-1">إلغاء</button><button @click="handleUpdate" class="btn-primary flex-1">حفظ - إعادة حساب الرصيد</button></div>
      </div>
    </div>

    <ConfirmModal :show="showDelete" title="حذف الإيصال" message="سيتم إعادة حساب الرصيد تلقائياً (Cascade Effect)" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useHierarchyStore } from '@/stores/hierarchy'
import { useSubscribersStore } from '@/stores/subscribers'
import { useReceiptsStore } from '@/stores/receipts'
import { useReceiptTypesStore } from '@/stores/receiptTypes'
import { db } from '@/db'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const hierarchyStore = useHierarchyStore()
const subscribersStore = useSubscribersStore()
const receiptsStore = useReceiptsStore()
const receiptTypesStore = useReceiptTypesStore()
const { exportToExcel } = useExport()

const filters = ref({ branch: '', group: '', area: '', search: '', dateFrom: '', dateTo: '', typeId: '', amountFrom: '', amountTo: '', balanceStatus: '' })
const sortBy = ref('date')
const sortOrder = ref('desc')
const currentPage = ref(1)
const perPage = ref(20)
const showEdit = ref(false)
const showDelete = ref(false)
const selected = ref(null)
const editForm = ref({ date: '', typeId: '', amount: 0, receiptNumber: '' })
const balances = ref({})

const filteredGroups = computed(() => {
  if (!filters.value.branch) return hierarchyStore.groups
  const branch = hierarchyStore.branches.find(b => b.code === filters.value.branch)
  if (!branch) return []
  return hierarchyStore.groups.filter(g => g.branchId === branch.id)
})

const filteredAreas = computed(() => {
  if (!filters.value.group) {
    if (!filters.value.branch) return hierarchyStore.areas
    const branch = hierarchyStore.branches.find(b => b.code === filters.value.branch)
    if (!branch) return []
    const groupIds = hierarchyStore.groups.filter(g => g.branchId === branch.id).map(g => g.id)
    return hierarchyStore.areas.filter(a => groupIds.includes(a.groupId))
  }
  const group = hierarchyStore.groups.find(g => g.code === Number(filters.value.group))
  if (!group) return []
  return hierarchyStore.areas.filter(a => a.groupId === group.id)
})

const filteredResults = computed(() => {
  let result = [...receiptsStore.receipts]

  if (filters.value.branch) result = result.filter(r => r.accountNumber.startsWith(filters.value.branch))
  if (filters.value.group) result = result.filter(r => {
    const area = hierarchyStore.areas.find(a => a.code === subscribersStore.subscribers.find(s => s.accountNumber === r.accountNumber)?.areaCode)
    return area?.code.startsWith(filters.value.group)
  })
  if (filters.value.area) result = result.filter(r => {
    const sub = subscribersStore.subscribers.find(s => s.accountNumber === r.accountNumber)
    return sub?.areaCode === filters.value.area
  })
  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(r => r.accountNumber.includes(q) || getSubscriberName(r.accountNumber).toLowerCase().includes(q))
  }
  if (filters.value.dateFrom) result = result.filter(r => new Date(r.date) >= new Date(filters.value.dateFrom))
  if (filters.value.dateTo) result = result.filter(r => new Date(r.date) <= new Date(filters.value.dateTo))
  if (filters.value.typeId) result = result.filter(r => r.typeId === Number(filters.value.typeId))
  if (filters.value.amountFrom) result = result.filter(r => Number(r.amount) >= Number(filters.value.amountFrom))
  if (filters.value.amountTo) result = result.filter(r => Number(r.amount) <= Number(filters.value.amountTo))
  if (filters.value.balanceStatus) {
    result = result.filter(r => {
      const bal = balances.value[r.accountNumber] || 0
      if (filters.value.balanceStatus === 'positive') return bal > 0
      if (filters.value.balanceStatus === 'negative') return bal < 0
      if (filters.value.balanceStatus === 'zero') return bal === 0
      return true
    })
  }
  return result
})

const sortedResults = computed(() => {
  const sorted = [...filteredResults.value]
  sorted.sort((a, b) => {
    let valA, valB
    if (sortBy.value === 'date') { valA = new Date(a.date); valB = new Date(b.date) }
    else if (sortBy.value === 'amount') { valA = Number(a.amount); valB = Number(b.amount) }
    else if (sortBy.value === 'accountNumber') { valA = a.accountNumber; valB = b.accountNumber }
    else { valA = a[sortBy.value]; valB = b[sortBy.value] }
    if (sortOrder.value === 'asc') return valA > valB ? 1 : -1
    return valA < valB ? 1 : -1
  })
  return sorted
})

const paginated = computed(() => { const start = (currentPage.value - 1) * perPage.value; return sortedResults.value.slice(start, start + perPage.value) })

watch(() => filteredResults.value.length, () => currentPage.value = 1)

onMounted(async () => {
  await Promise.all([hierarchyStore.fetchAll(), subscribersStore.fetchSubscribers(), receiptsStore.fetchReceipts(), receiptTypesStore.fetchTypes()])
  await loadBalances()
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

const getSubscriberName = (acc) => subscribersStore.subscribers.find(s => s.accountNumber === acc)?.name || 'غير معروف'
const getTypeName = (id) => receiptTypesStore.types.find(t => t.id === id)?.name || '-'
const getBalanceColor = (bal) => { if (bal > 0) return 'text-red-600'; if (bal < 0) return 'text-emerald-600'; return 'text-gray-600' }

const clearFilters = () => { filters.value = { branch: '', group: '', area: '', search: '', dateFrom: '', dateTo: '', typeId: '', amountFrom: '', amountTo: '', balanceStatus: '' } }

const exportResults = () => {
  const data = sortedResults.value.map(r => ({ 'رقم الحساب': r.accountNumber, 'الاسم': getSubscriberName(r.accountNumber), 'التاريخ': formatDateShort(r.date), 'التصنيف': getTypeName(r.typeId), 'المبلغ': r.amount, 'الرصيد الحالي': balances.value[r.accountNumber] }))
  exportToExcel(data, `استعلام-${new Date().toISOString().split('T')[0]}`, 'نتائج')
}

const openEdit = (receipt) => { selected.value = receipt; editForm.value = { date: receipt.date.split('T')[0], typeId: receipt.typeId, amount: receipt.amount, receiptNumber: receipt.receiptNumber || '' }; showEdit.value = true }
const confirmDelete = (receipt) => { selected.value = receipt; showDelete.value = true }

const handleUpdate = async () => {
  try { await receiptsStore.updateReceipt(selected.value.id, { date: editForm.value.date, typeId: Number(editForm.value.typeId), amount: Number(editForm.value.amount), receiptNumber: editForm.value.receiptNumber || null }); await loadBalances(); toast.success('تم التحديث - إعادة حساب الرصيد'); showEdit.value = false } catch (e) { toast.error(e.message) }
}
const handleDelete = async () => {
  try { await receiptsStore.deleteReceipt(selected.value.id); await loadBalances(); toast.success('تم الحذف - إعادة حساب الرصيد'); showDelete.value = false } catch (e) { toast.error(e.message) }
}
</script>
