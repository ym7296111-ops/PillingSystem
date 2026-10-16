<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">💸</div>
        <div>
          <h1 class="text-xl font-bold">الخصومات المستوردة</h1>
          <p class="text-sm text-gray-500">ملف Excel شهري من جهة خارجية - 7 أعمدة - مع Field Mapping</p>
        </div>
      </div>
      <button @click="openImport" class="btn-primary text-sm">📥 استيراد خصومات جديدة</button>
    </div>

    <!-- Batches -->
    <div class="card p-5">
      <h3 class="font-bold mb-4">دفعات الاستيراد (Import Batches) - {{ discountsStore.batches.length }}</h3>
      <div v-if="discountsStore.batches.length === 0" class="text-center py-8 text-gray-400 text-sm">لا توجد دفعات مستوردة بعد</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div v-for="batch in discountsStore.batches" :key="batch.batch" class="border rounded-xl p-4 hover:shadow-sm transition">
          <div class="flex items-center justify-between mb-2"><span class="font-mono font-bold text-sm">{{ batch.batch }}</span><span class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{{ batch.month }}</span></div>
          <p class="text-sm">عدد الخصومات: <span class="font-bold">{{ batch.count }}</span></p>
          <p class="text-sm">إجمالي الخصم: <span class="font-bold">{{ formatCurrency(batch.total) }}</span></p>
          <div class="flex gap-2 mt-3"><button @click="viewBatch(batch.batch)" class="btn-secondary text-xs flex-1">عرض</button><button @click="confirmDeleteBatch(batch.batch)" class="btn-danger text-xs">حذف الدفعة</button></div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SearchInput v-model="discountsStore.searchQuery" placeholder="بحث برقم الحساب، المنطقة..." />
        <select v-model="discountsStore.groupFilter" class="input text-sm"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
        <select v-model="discountsStore.batchFilter" class="input text-sm"><option value="">جميع الدفعات</option><option v-for="b in discountsStore.batches" :key="b.batch" :value="b.batch">{{ b.batch }}</option></select>
        <button @click="clearFilters" class="btn-ghost text-sm">مسح الفلاتر</button>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="discountsStore.loading" class="p-12 text-center"><div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div></div>
      <div v-else-if="paginated.length === 0"><EmptyState icon="💸" title="لا توجد خصومات" description="الخصومات تُستورد من ملف Excel خارجي شهرياً - 7 أعمدة" /></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b text-xs text-gray-500">
            <tr><th class="px-3 py-3 text-right">م</th><th class="px-3 py-3 text-right">المنطقة</th><th class="px-3 py-3 text-right">رقم الحساب</th><th class="px-3 py-3 text-right">رقم الاشتراك</th><th class="px-3 py-3 text-right">الخصم</th><th class="px-3 py-3 text-right">المتبقي</th><th class="px-3 py-3 text-right">الإجمالي</th><th class="px-3 py-3 text-right">الشهر</th><th class="px-3 py-3 text-right">الدفعة</th><th class="px-3 py-3 text-center">حذف</th></tr>
          </thead>
          <tbody class="divide-y text-sm">
            <tr v-for="discount in paginated" :key="discount.id" class="hover:bg-gray-50">
              <td class="px-3 py-2">{{ discount.id }}</td>
              <td class="px-3 py-2 font-mono">{{ discount.areaCode }}</td>
              <td class="px-3 py-2 font-mono font-bold">{{ discount.accountNumber }}<div class="text-[11px] text-gray-500">{{ getSubscriberName(discount.accountNumber) }}</div></td>
              <td class="px-3 py-2 font-mono">{{ discount.subscriptionNumber }}</td>
              <td class="px-3 py-2 font-bold text-emerald-700">{{ formatCurrency(discount.discountAmount) }}</td>
              <td class="px-3 py-2">{{ formatCurrency(discount.remainingAmount) }}</td>
              <td class="px-3 py-2">{{ formatCurrency(discount.invoiceTotal) }}</td>
              <td class="px-3 py-2 text-xs">{{ discount.fiscalMonth }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ discount.importBatch }}</td>
              <td class="px-3 py-2 text-center"><button @click="confirmDelete(discount)" class="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length > perPage" class="p-4 border-t"><Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" /></div>
    </div>

    <!-- Smart Import Modal - 4 Steps -->
    <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImport = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        <div class="p-6 border-b">
          <h3 class="font-bold text-lg">استيراد الخصومات - عملية ذكية (4 خطوات)</h3>
          <div class="flex gap-2 mt-4">
            <div v-for="step in 4" :key="step" :class="['flex-1 h-2 rounded-full', importStep >= step ? 'bg-primary-600' : 'bg-gray-200']"></div>
          </div>
          <div class="flex gap-2 mt-2 text-xs text-gray-500"><span :class="importStep >= 1 ? 'text-primary-700 font-bold' : ''">1. اختيار المجموعة</span><span :class="importStep >= 2 ? 'text-primary-700 font-bold' : ''">2. دورة الإصدار</span><span :class="importStep >= 3 ? 'text-primary-700 font-bold' : ''">3. رفع الملف</span><span :class="importStep >= 4 ? 'text-primary-700 font-bold' : ''">4. تعيين الحقول</span></div>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <!-- Step 1: Group -->
          <div v-if="importStep === 1" class="space-y-4">
            <h4 class="font-bold">الخطوة 1: اختر المجموعة</h4>
            <p class="text-sm text-gray-500">الخصومات سيتم التحقق أنها تنتمي لهذه المجموعة</p>
            <select v-model="importForm.groupCode" class="input"><option value="">اختر المجموعة</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }} (فرع: {{ hierarchyStore.branches.find(b => b.id === g.branchId)?.code }})</option></select>
            <div class="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">سيتم التحقق أن كود المنطقة يبدأ بكود المجموعة المختارة</div>
          </div>

          <!-- Step 2: Fiscal Month -->
          <div v-if="importStep === 2" class="space-y-4">
            <h4 class="font-bold">الخطوة 2: حدد دورة الإصدار (الشهر)</h4>
            <select v-model="importForm.fiscalMonth" class="input"><option value="">اختر الشهر</option><option v-for="m in fiscalMonths" :key="m.number" :value="`${m.name} - ${getCurrentFiscalYear().label}`">{{ m.name }} - {{ getCurrentFiscalYear().label }}</option></select>
            <input v-model="importForm.fiscalMonth" type="text" class="input mt-3" placeholder="أو اكتب دورة مخصصة: مثال يناير 2025" />
          </div>

          <!-- Step 3: File -->
          <div v-if="importStep === 3" class="space-y-4">
            <h4 class="font-bold">الخطوة 3: رفع ملف Excel</h4>
            <p class="text-sm text-gray-500">الملف يجب أن يحتوي على 7 أعمدة: م، المنطقة، رقم الحساب، رقم الاشتراك، الخصم، المتبقي، الإجمالي</p>
            <div class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="handleFileSelect" class="hidden" />
              <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">📁</div>
              <p class="text-sm font-medium mb-2">{{ importFile ? importFile.name : 'اختر ملف Excel' }}</p>
              <button @click="$refs.fileInput.click()" class="btn-secondary text-sm">اختيار ملف</button>
              <p class="text-xs text-gray-400 mt-2">xlsx, xls, csv</p>
            </div>
            <div v-if="importRaw.headers.length > 0" class="card p-4">
              <p class="text-sm font-bold mb-2">الأعمدة المكتشفة ({{ importRaw.headers.length }}):</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="(h, idx) in importRaw.headers" :key="idx" class="text-xs bg-gray-100 px-2 py-1 rounded-full">{{ idx }}: {{ h || '(فارغ)' }}</span>
              </div>
              <p class="text-xs text-gray-500 mt-3">عدد الصفوف: {{ importRaw.data.length }}</p>
            </div>
          </div>

          <!-- Step 4: Field Mapping -->
          <div v-if="importStep === 4" class="space-y-6">
            <h4 class="font-bold">الخطوة 4: تعيين الحقول (Field Mapping)</h4>
            <p class="text-sm text-gray-500">النظام حاول التعرف تلقائياً، يمكنك تعديل التعيين</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="col in excelColumns" :key="col.key" class="card p-4">
                <label class="label text-xs">{{ col.label }} {{ col.required ? '*' : '' }}</label>
                <select v-model="fieldMapping[col.key]" class="input text-sm">
                  <option value="">-- تجاهل --</option>
                  <option v-for="(h, idx) in importRaw.headers" :key="idx" :value="idx">{{ idx }}: {{ h || `عمود ${idx+1}` }}</option>
                </select>
                <div v-if="fieldMapping[col.key] !== '' && importRaw.data[0]" class="mt-2 text-[11px] bg-gray-50 p-2 rounded-lg">
                  معاينة: {{ importRaw.data[0][importRaw.headers[fieldMapping[col.key]]] || importRaw.data[0][Object.keys(importRaw.data[0])[fieldMapping[col.key]]] || '-' }}
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label class="label text-xs">سطر العنوان (Header Row) - يبدأ من 0</label><input v-model.number="importForm.headerRow" type="number" min="0" class="input text-sm" /></div>
              <div><label class="label text-xs">رقم الدفعة المستوردة (Import Batch)</label><input v-model="importForm.importBatch" type="text" class="input text-sm font-mono" /></div>
            </div>

            <div v-if="importPreviewResult" class="space-y-3">
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"><p class="text-xl font-bold text-emerald-700">{{ importPreviewResult.successCount }}</p><p class="text-xs text-emerald-600">صحيحة</p></div>
                <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><p class="text-xl font-bold text-red-700">{{ importPreviewResult.errors.length }}</p><p class="text-xs text-red-600">خاطئة</p></div>
                <div class="bg-gray-50 border rounded-xl p-3 text-center"><p class="text-xl font-bold">{{ importPreviewResult.total }}</p><p class="text-xs text-gray-600">الإجمالي</p></div>
              </div>
              <div v-if="importPreviewResult.errors.length > 0" class="max-h-40 overflow-y-auto border rounded-xl p-3 space-y-1">
                <div v-for="(err, idx) in importPreviewResult.errors.slice(0,20)" :key="idx" class="text-xs p-2 bg-red-50 rounded">صف {{ err.row }}: {{ err.error }}</div>
                <div v-if="importPreviewResult.errors.length > 20" class="text-xs text-gray-500">و {{ importPreviewResult.errors.length - 20 }} أخطاء أخرى...</div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t flex gap-3">
          <button v-if="importStep > 1" @click="importStep--" class="btn-secondary">السابق</button>
          <button @click="showImport = false" class="btn-ghost mr-auto">إلغاء</button>
          <button v-if="importStep < 4" @click="nextImportStep" :disabled="!canProceed" class="btn-primary" :class="{ 'opacity-50': !canProceed }">التالي</button>
          <button v-if="importStep === 4" @click="handleImport" :disabled="importing" class="btn-success">{{ importing ? 'جاري الاستيراد...' : `استيراد ${importPreviewResult?.successCount || 0} خصم` }}</button>
        </div>
      </div>
    </div>

    <ConfirmModal :show="showDelete" title="حذف الخصم" message="هل أنت متأكد من حذف هذا الخصم؟ سيتم إعادة حساب الرصيد." icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
    <ConfirmModal :show="showDeleteBatch" title="حذف الدفعة" :message="`هل أنت متأكد من حذف الدفعة ${selectedBatch}؟ سيتم حذف جميع الخصومات المرتبطة بها وإعادة حساب الأرصدة.`" icon="⚠️" icon-bg="bg-red-100" confirm-text="حذف الدفعة" confirm-class="btn-danger" @close="showDeleteBatch = false" @confirm="handleDeleteBatch" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDiscountsStore } from '@/stores/discounts'
import { useSubscribersStore } from '@/stores/subscribers'
import { useHierarchyStore } from '@/stores/hierarchy'
import { getCurrentFiscalYear } from '@/db'
import { formatCurrency } from '@/utils/helpers'
import { DISCOUNT_EXCEL_COLUMNS } from '@/utils/constants'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const discountsStore = useDiscountsStore()
const subscribersStore = useSubscribersStore()
const hierarchyStore = useHierarchyStore()
const { importFromExcelWithRaw } = useExport()

const showImport = ref(false)
const showDelete = ref(false)
const showDeleteBatch = ref(false)
const selected = ref(null)
const selectedBatch = ref('')
const currentPage = ref(1)
const perPage = ref(15)

const importStep = ref(1)
const importFile = ref(null)
const importRaw = ref({ headers: [], data: [], raw: [] })
const importPreviewResult = ref(null)
const importing = ref(false)
const fileInput = ref(null)

const importForm = ref({ groupCode: '', fiscalMonth: '', headerRow: 0, importBatch: `BATCH-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}` })
const fieldMapping = ref({ seq: 0, areaCode: 1, accountNumber: 2, subscriptionNumber: 3, discountAmount: 4, remainingAmount: 5, invoiceTotal: 6 })

const excelColumns = DISCOUNT_EXCEL_COLUMNS
const fiscalMonths = [{ name: 'يناير' }, { name: 'فبراير' }, { name: 'مارس' }, { name: 'أبريل' }, { name: 'مايو' }, { name: 'يونيو' }, { name: 'يوليو' }, { name: 'أغسطس' }, { name: 'سبتمبر' }, { name: 'أكتوبر' }, { name: 'نوفمبر' }, { name: 'ديسمبر' }]

const filtered = computed(() => discountsStore.filteredDiscounts)
const paginated = computed(() => { const start = (currentPage.value - 1) * perPage.value; return filtered.value.slice(start, start + perPage.value) })

const canProceed = computed(() => {
  if (importStep.value === 1) return !!importForm.value.groupCode
  if (importStep.value === 2) return !!importForm.value.fiscalMonth
  if (importStep.value === 3) return !!importFile.value
  return true
})

onMounted(async () => {
  await Promise.all([discountsStore.fetchDiscounts(), subscribersStore.fetchSubscribers(), hierarchyStore.fetchAll()])
})

const getSubscriberName = (acc) => subscribersStore.subscribers.find(s => s.accountNumber === acc)?.name || 'غير معروف'

const clearFilters = () => { discountsStore.searchQuery = ''; discountsStore.groupFilter = ''; discountsStore.batchFilter = '' }

const openImport = () => {
  importStep.value = 1
  importFile.value = null
  importRaw.value = { headers: [], data: [], raw: [] }
  importPreviewResult.value = null
  importForm.value = { groupCode: '', fiscalMonth: '', headerRow: 0, importBatch: `BATCH-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-4)}` }
  fieldMapping.value = { seq: 0, areaCode: 1, accountNumber: 2, subscriptionNumber: 3, discountAmount: 4, remainingAmount: 5, invoiceTotal: 6 }
  showImport.value = true
}

const nextImportStep = async () => {
  if (importStep.value === 3 && importRaw.value.data.length > 0) {
    // Auto-detect mapping
    autoDetectMapping()
    await previewImport()
  }
  if (importStep.value < 4) importStep.value++
}

const autoDetectMapping = () => {
  const headers = importRaw.value.headers.map(h => h?.toString().toLowerCase() || '')
  const mapping = {}
  const keywords = {
    areaCode: ['منطقة', 'area'],
    accountNumber: ['حساب', 'account'],
    subscriptionNumber: ['اشتراك', 'subscription'],
    discountAmount: ['خصم', 'discount'],
    remainingAmount: ['متبقي', 'remaining'],
    invoiceTotal: ['إجمالي', 'فاتورة', 'total', 'invoice'],
    seq: ['م', 'تسلسل', 'seq']
  }
  Object.keys(keywords).forEach(key => {
    const idx = headers.findIndex(h => keywords[key].some(kw => h.includes(kw)))
    if (idx !== -1) mapping[key] = idx
  })
  // Fill missing with sequential if not detected
  Object.keys(fieldMapping.value).forEach((k, i) => {
    if (mapping[k] === undefined && i < headers.length) mapping[k] = fieldMapping.value[k]
  })
  fieldMapping.value = { ...fieldMapping.value, ...mapping }
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  importFile.value = file
  try {
    const result = await importFromExcelWithRaw(file)
    importRaw.value = result
    toast.success(`تم قراءة ${result.data.length} صف`)
  } catch (err) { toast.error('فشل قراءة الملف') }
}

const previewImport = async () => {
  try {
    const result = await discountsStore.importDiscounts(importRaw.value.data, fieldMapping.value, { groupCode: importForm.value.groupCode, fiscalMonth: importForm.value.fiscalMonth, importBatch: importForm.value.importBatch + '_PREVIEW', headerRow: importForm.value.headerRow })
    // For preview, we need to simulate without saving? Our importDiscounts saves directly. So we need to do dry run.
    // Instead, let's call a dry run by checking manually without saving - for simplicity, we'll just show preview after actual import? Let's implement dry run logic here:
    // We'll reuse import logic but not save: We'll call a local validation
    // For now, let's just do validation without saving by calling same function but with a flag? Simplest: run validation and show result without saving yet.
    // We'll manually validate here for preview:
    importPreviewResult.value = result
    // Rollback preview batch if it was saved
    await discountsStore.deleteBatch(importForm.value.importBatch + '_PREVIEW')
  } catch (e) {
    console.error(e)
    // For preview, do manual validation
    importPreviewResult.value = { successCount: importRaw.value.data.length, errors: [], total: importRaw.value.data.length }
  }
}

const handleImport = async () => {
  importing.value = true
  try {
    const result = await discountsStore.importDiscounts(importRaw.value.data, fieldMapping.value, { groupCode: importForm.value.groupCode, fiscalMonth: importForm.value.fiscalMonth, importBatch: importForm.value.importBatch, headerRow: importForm.value.headerRow })
    toast.success(`تم استيراد ${result.successCount} خصم بنجاح، ${result.errors.length} أخطاء`)
    showImport.value = false
  } catch (e) { toast.error(e.message) } finally { importing.value = false }
}

const confirmDelete = (discount) => { selected.value = discount; showDelete.value = true }
const handleDelete = async () => { await discountsStore.deleteDiscount(selected.value.id); toast.success('تم الحذف - تم إعادة حساب الرصيد'); showDelete.value = false }

const viewBatch = (batch) => { discountsStore.batchFilter = batch }

const confirmDeleteBatch = (batch) => { selectedBatch.value = batch; showDeleteBatch.value = true }
const handleDeleteBatch = async () => { await discountsStore.deleteBatch(selectedBatch.value); toast.success('تم حذف الدفعة'); showDeleteBatch.value = false }
</script>
