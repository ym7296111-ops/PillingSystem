<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">🧾</div>
        <div>
          <h1 class="text-xl font-bold">إدارة الإيصالات</h1>
          <p class="text-sm text-gray-500">القلب النابض - إيصالات بدون ضريبة - السنة المالية يوليو-يونيو</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="showTypeManager = true" class="btn-secondary text-sm">🏷️ إدارة التصنيفات</button>
        <button @click="openAdd" class="btn-primary text-sm">➕ إضافة إيصال</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card p-4"><p class="text-xs text-gray-500">إجمالي الإيصالات</p><p class="text-xl font-bold">{{ receiptsStore.receipts.length }}</p><p class="text-xs text-gray-400">{{ formatCurrency(totalAmount) }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">هذا الشهر</p><p class="text-xl font-bold">{{ thisMonthCount }}</p><p class="text-xs text-gray-400">{{ formatCurrency(thisMonthAmount) }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">السنة المالية {{ fiscalYear.label }}</p><p class="text-xl font-bold">{{ fiscalYearCount }}</p><p class="text-xs text-gray-400">{{ formatCurrency(fiscalYearAmount) }}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-500">متوسط الإيصال</p><p class="text-xl font-bold">{{ formatCurrency(avgAmount) }}</p></div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <SearchInput v-model="receiptsStore.searchQuery" placeholder="بحث برقم الحساب أو رقم الإيصال..." />
        <select v-model="receiptsStore.typeFilter" class="input text-sm"><option value="">جميع التصنيفات</option><option v-for="t in receiptTypesStore.types" :key="t.id" :value="t.id">{{ t.name }} {{ t.isDisabled ? '(معطل)' : '' }}</option></select>
        <select v-model="receiptsStore.branchFilter" class="input text-sm"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
        <input v-model="receiptsStore.dateFrom" type="date" class="input text-sm" placeholder="من" />
        <input v-model="receiptsStore.dateTo" type="date" class="input text-sm" placeholder="إلى" />
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="receiptsStore.loading" class="p-12 text-center"><div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div></div>
      <div v-else-if="paginated.length === 0"><EmptyState icon="🧾" title="لا توجد إيصالات" description="الإيصالات هي مستحقات على المشترك بدون ضريبة" ><button @click="openAdd" class="btn-primary mt-4">إضافة أول إيصال</button></EmptyState></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b text-xs text-gray-500">
            <tr><th class="px-4 py-3 text-right">رقم الحساب</th><th class="px-4 py-3 text-right">رقم الإيصال</th><th class="px-4 py-3 text-right">التاريخ</th><th class="px-4 py-3 text-right">التصنيف</th><th class="px-4 py-3 text-right">المبلغ</th><th class="px-4 py-3 text-right">السنة المالية</th><th class="px-4 py-3 text-center">إجراءات</th></tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="receipt in paginated" :key="receipt.id" class="hover:bg-gray-50 text-sm">
              <td class="px-4 py-3 font-mono font-bold">{{ receipt.accountNumber }}<div class="text-[11px] text-gray-500 font-normal">{{ getSubscriberName(receipt.accountNumber) }}</div></td>
              <td class="px-4 py-3 font-mono text-xs">{{ receipt.receiptNumber || '-' }}</td>
              <td class="px-4 py-3">{{ formatDateShort(receipt.date) }}</td>
              <td class="px-4 py-3"><span class="badge bg-blue-100 text-blue-800 text-xs">{{ getTypeName(receipt.typeId) }}</span></td>
              <td class="px-4 py-3 font-bold">{{ formatCurrency(receipt.amount) }}</td>
              <td class="px-4 py-3 text-xs">{{ receipt.fiscalYear }}</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit(receipt)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete(receipt)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length > perPage" class="p-4 border-t"><Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" /></div>
    </div>

    <!-- Add/Edit Modal with Dynamic UI -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        <div class="p-6 border-b flex items-center justify-between">
          <div><h3 class="font-bold text-lg">{{ isEdit ? 'تعديل إيصال' : 'إضافة إيصالات' }}</h3><p class="text-xs text-gray-500">الإيصالات موجبة دائماً - بدون ضريبة - السنة المالية يوليو-يونيو</p></div>
          <button @click="showForm = false" class="w-8 h-8 rounded-lg hover:bg-gray-100">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Account Selector (fixed for bulk) -->
          <div class="card p-4 bg-primary-50 border-primary-100">
            <label class="label">رقم الحساب (ثابت لجميع الإيصالات في الإدخال المجمع) *</label>
            <select v-model="form.accountNumber" class="input" :disabled="isEdit" required>
              <option value="">اختر المشترك</option>
              <option v-for="sub in subscribersStore.subscribers" :key="sub.accountNumber" :value="sub.accountNumber">{{ sub.accountNumber }} - {{ sub.name }}</option>
            </select>
            <div v-if="form.accountNumber" class="mt-2 text-xs text-primary-700">المشترك: {{ getSubscriberName(form.accountNumber) }} | الرصيد الحالي: {{ formatCurrency(balances[form.accountNumber] || 0) }}</div>
          </div>

          <!-- Single Mode -->
          <div v-if="!isBulkMode && !isEdit" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="label">رقم الإيصال (اختياري)</label><input v-model="singleForm.receiptNumber" type="text" class="input" placeholder="قد يكون فارغاً" /></div>
              <div><label class="label">التاريخ *</label><input v-model="singleForm.date" type="date" class="input" required /></div>
              <div><label class="label">التصنيف *</label><select v-model="singleForm.typeId" class="input" required><option value="">اختر التصنيف</option><option v-for="t in activeTypes" :key="t.id" :value="t.id">{{ t.name }}</option></select></div>
              <div><label class="label">المبلغ (موجب) *</label><input v-model.number="singleForm.amount" type="number" step="0.01" min="0.01" class="input" required /></div>
            </div>
            <button @click="isBulkMode = true" class="btn-secondary w-full text-sm">➕ إضافة إيصال آخر (تحويل إلى جدول ديناميكي)</button>
          </div>

          <!-- Bulk Mode - Dynamic Table -->
          <div v-if="isBulkMode && !isEdit" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-sm">جدول الإيصالات المتعددة (نفس رقم الحساب: {{ form.accountNumber }})</h4>
              <button @click="addBulkRow" class="btn-secondary text-xs">➕ إضافة صف</button>
            </div>
            <div class="overflow-x-auto border rounded-xl">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-3 py-2 text-right">#</th><th class="px-3 py-2 text-right">التاريخ *</th><th class="px-3 py-2 text-right">التصنيف *</th><th class="px-3 py-2 text-right">المبلغ *</th><th class="px-3 py-2 text-right">رقم الإيصال (اختياري)</th><th class="px-3 py-2 text-center">حذف</th></tr></thead>
                <tbody class="divide-y">
                  <tr v-for="(row, idx) in bulkRows" :key="idx">
                    <td class="px-3 py-2">{{ idx + 1 }}</td>
                    <td class="px-3 py-2"><input v-model="row.date" type="date" class="input text-xs py-1" required /></td>
                    <td class="px-3 py-2"><select v-model="row.typeId" class="input text-xs py-1" required><option value="">اختر</option><option v-for="t in activeTypes" :key="t.id" :value="t.id">{{ t.name }}</option></select></td>
                    <td class="px-3 py-2"><input v-model.number="row.amount" type="number" step="0.01" min="0.01" class="input text-xs py-1" required /></td>
                    <td class="px-3 py-2"><input v-model="row.receiptNumber" type="text" class="input text-xs py-1" placeholder="اختياري" /></td>
                    <td class="px-3 py-2 text-center"><button @click="bulkRows.splice(idx,1)" class="w-6 h-6 rounded bg-red-50 text-xs">✕</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span class="text-sm font-medium">الإجمالي: {{ bulkRows.length }} إيصال</span>
              <span class="font-bold">{{ formatCurrency(bulkRows.reduce((s,r) => s + (Number(r.amount)||0), 0)) }}</span>
            </div>
            <button @click="isBulkMode = false" class="btn-ghost w-full text-xs">العودة للإدخال الفردي</button>
          </div>

          <!-- Edit Mode -->
          <div v-if="isEdit" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="label">رقم الإيصال</label><input v-model="singleForm.receiptNumber" type="text" class="input" /></div>
              <div><label class="label">التاريخ *</label><input v-model="singleForm.date" type="date" class="input" required /></div>
              <div><label class="label">التصنيف *</label><select v-model="singleForm.typeId" class="input" required><option v-for="t in receiptTypesStore.types" :key="t.id" :value="t.id">{{ t.name }}</option></select></div>
              <div><label class="label">المبلغ *</label><input v-model.number="singleForm.amount" type="number" step="0.01" min="0.01" class="input" required /></div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t flex gap-3">
          <button @click="showForm = false" class="btn-secondary flex-1">إلغاء</button>
          <button @click="handleSave" :disabled="saving || !form.accountNumber" class="btn-primary flex-1">{{ saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديل' : isBulkMode ? `حفظ ${bulkRows.length} إيصال` : 'حفظ الإيصال' }}</button>
        </div>
      </div>
    </div>

    <!-- Receipt Types Manager -->
    <div v-if="showTypeManager" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showTypeManager = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeIn max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6"><h3 class="font-bold text-lg">إدارة تصنيفات الإيصالات</h3><button @click="showTypeManager = false" class="w-8 h-8 rounded-lg hover:bg-gray-100">✕</button></div>
        <div class="flex gap-2 mb-4"><input v-model="newTypeName" type="text" class="input flex-1" placeholder="اسم التصنيف الجديد" @keyup.enter="handleAddType" /><button @click="handleAddType" class="btn-primary text-sm">إضافة</button></div>
        <div class="space-y-2">
          <div v-for="type in receiptTypesStore.types" :key="type.id" class="flex items-center justify-between p-3 rounded-xl border" :class="type.isDisabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'">
            <div class="flex items-center gap-3"><span :class="['w-2 h-2 rounded-full', type.isDisabled ? 'bg-gray-400' : 'bg-emerald-500']"></span><span class="font-medium text-sm" :class="type.isDisabled ? 'text-gray-500' : ''">{{ type.name }}</span><span v-if="type.isDisabled" class="badge bg-gray-100 text-gray-600 text-[10px]">معطل</span><span class="text-xs text-gray-400">{{ receiptsStore.receipts.filter(r => r.typeId === type.id).length }} إيصال</span></div>
            <div class="flex gap-1">
              <button v-if="type.isDisabled" @click="receiptTypesStore.enableType(type.id)" class="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs" title="تفعيل">✅</button>
              <button v-else @click="receiptTypesStore.disableType(type.id)" class="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-xs" title="تعطيل">⏸️</button>
              <button @click="handleDeleteType(type)" class="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-xs" title="حذف (ذكي)">🗑️</button>
            </div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">💡 قاعدة الحذف الذكي: إذا كان التصنيف مرتبط بإيصالات، يتم تعطيله بدلاً من حذفه. المعطل يختفي من قوائم الإدخال الجديدة لكن يبقى في التقارير التاريخية.</div>
      </div>
    </div>

    <ConfirmModal :show="showDelete" title="حذف الإيصال" :message="`هل أنت متأكد من حذف الإيصال ${selected?.receiptNumber || selected?.id}؟ سيتم إعادة حساب الرصيد تلقائياً.`" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useReceiptsStore } from '@/stores/receipts'
import { useReceiptTypesStore } from '@/stores/receiptTypes'
import { useSubscribersStore } from '@/stores/subscribers'
import { useHierarchyStore } from '@/stores/hierarchy'
import { db, getCurrentFiscalYear } from '@/db'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const receiptsStore = useReceiptsStore()
const receiptTypesStore = useReceiptTypesStore()
const subscribersStore = useSubscribersStore()
const hierarchyStore = useHierarchyStore()

const showForm = ref(false)
const showDelete = ref(false)
const showTypeManager = ref(false)
const isEdit = ref(false)
const isBulkMode = ref(false)
const selected = ref(null)
const saving = ref(false)
const currentPage = ref(1)
const perPage = ref(15)
const newTypeName = ref('')

const form = ref({ accountNumber: '' })
const singleForm = ref({ receiptNumber: '', date: new Date().toISOString().split('T')[0], typeId: '', amount: 0 })
const bulkRows = ref([{ date: new Date().toISOString().split('T')[0], typeId: '', amount: 0, receiptNumber: '' }])

const fiscalYear = getCurrentFiscalYear()
const balances = ref({})

const filtered = computed(() => receiptsStore.filteredReceipts)
const paginated = computed(() => { const start = (currentPage.value - 1) * perPage.value; return filtered.value.slice(start, start + perPage.value) })
const activeTypes = computed(() => receiptTypesStore.types.filter(t => !t.isDisabled))

const totalAmount = computed(() => receiptsStore.receipts.reduce((s, r) => s + Number(r.amount), 0))
const thisMonthCount = computed(() => { const now = new Date(); return receiptsStore.receipts.filter(r => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length })
const thisMonthAmount = computed(() => { const now = new Date(); return receiptsStore.receipts.filter(r => { const d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).reduce((s, r) => s + Number(r.amount), 0) })
const fiscalYearCount = computed(() => receiptsStore.receipts.filter(r => r.fiscalYear === fiscalYear.label).length)
const fiscalYearAmount = computed(() => receiptsStore.receipts.filter(r => r.fiscalYear === fiscalYear.label).reduce((s, r) => s + Number(r.amount), 0))
const avgAmount = computed(() => receiptsStore.receipts.length ? totalAmount.value / receiptsStore.receipts.length : 0)

watch(() => filtered.value.length, () => currentPage.value = 1)

onMounted(async () => {
  await Promise.all([receiptsStore.fetchReceipts(), receiptTypesStore.fetchTypes(), subscribersStore.fetchSubscribers(), hierarchyStore.fetchAll()])
  await loadBalances()
})

const loadBalances = async () => {
  const all = await db.subscribers.toArray()
  const receipts = await db.receipts.toArray()
  const discounts = await db.discounts.toArray()
  const map = {}
  all.forEach(s => {
    const rTotal = receipts.filter(r => r.accountNumber === s.accountNumber).reduce((sum, r) => sum + Number(r.amount), 0)
    const dTotal = discounts.filter(d => d.accountNumber === s.accountNumber).reduce((sum, d) => sum + Number(d.discountAmount), 0)
    map[s.accountNumber] = Number(s.openingBalance) + rTotal - dTotal
  })
  balances.value = map
}

const getSubscriberName = (acc) => subscribersStore.subscribers.find(s => s.accountNumber === acc)?.name || 'غير معروف'
const getTypeName = (id) => receiptTypesStore.types.find(t => t.id === id)?.name || '-'

const openAdd = () => {
  isEdit.value = false
  isBulkMode.value = false
  selected.value = null
  form.value = { accountNumber: '' }
  singleForm.value = { receiptNumber: '', date: new Date().toISOString().split('T')[0], typeId: activeTypes.value[0]?.id || '', amount: 0 }
  bulkRows.value = [{ date: new Date().toISOString().split('T')[0], typeId: activeTypes.value[0]?.id || '', amount: 0, receiptNumber: '' }]
  showForm.value = true
}

const openEdit = (receipt) => {
  isEdit.value = true
  isBulkMode.value = false
  selected.value = receipt
  form.value = { accountNumber: receipt.accountNumber }
  singleForm.value = { receiptNumber: receipt.receiptNumber || '', date: receipt.date.split('T')[0], typeId: receipt.typeId, amount: receipt.amount }
  showForm.value = true
}

const confirmDelete = (receipt) => { selected.value = receipt; showDelete.value = true }

const addBulkRow = () => bulkRows.value.push({ date: new Date().toISOString().split('T')[0], typeId: activeTypes.value[0]?.id || '', amount: 0, receiptNumber: '' })

const handleSave = async () => {
  if (!form.value.accountNumber) { toast.error('رقم الحساب مطلوب'); return }
  saving.value = true
  try {
    if (isEdit.value) {
      await receiptsStore.updateReceipt(selected.value.id, { receiptNumber: singleForm.value.receiptNumber || null, date: singleForm.value.date, typeId: Number(singleForm.value.typeId), amount: Number(singleForm.value.amount) })
      toast.success('تم تحديث الإيصال - تم إعادة حساب الرصيد')
    } else if (isBulkMode.value) {
      const validRows = bulkRows.value.filter(r => r.date && r.typeId && r.amount > 0)
      if (validRows.length === 0) throw new Error('أدخل بيانات صحيحة للإيصالات')
      await receiptsStore.addBulkReceipts(form.value.accountNumber, validRows)
      toast.success(`تم حفظ ${validRows.length} إيصال - تم إعادة حساب الرصيد`)
    } else {
      if (!singleForm.value.date || !singleForm.value.typeId || !singleForm.value.amount) throw new Error('جميع الحقول المطلوبة يجب ملؤها')
      await receiptsStore.addReceipt({ accountNumber: form.value.accountNumber, receiptNumber: singleForm.value.receiptNumber || null, date: singleForm.value.date, typeId: Number(singleForm.value.typeId), amount: Number(singleForm.value.amount) })
      toast.success('تم حفظ الإيصال - تم إعادة حساب الرصيد')
    }
    await loadBalances()
    showForm.value = false
  } catch (e) { toast.error(e.message) } finally { saving.value = false }
}

const handleDelete = async () => {
  try { await receiptsStore.deleteReceipt(selected.value.id); await loadBalances(); toast.success('تم حذف الإيصال - تم إعادة حساب الرصيد'); showDelete.value = false } catch (e) { toast.error(e.message) }
}

const handleAddType = async () => {
  try { if (!newTypeName.value.trim()) return; await receiptTypesStore.addType(newTypeName.value); newTypeName.value = ''; toast.success('تمت إضافة التصنيف') } catch (e) { toast.error(e.message) }
}

const handleDeleteType = async (type) => {
  try { await receiptTypesStore.deleteType(type.id); const count = receiptsStore.receipts.filter(r => r.typeId === type.id).length; if (count > 0) toast.success('تم تعطيل التصنيف (يوجد إيصالات مرتبطة)'); else toast.success('تم حذف التصنيف') } catch (e) { toast.error(e.message) }
}
</script>
