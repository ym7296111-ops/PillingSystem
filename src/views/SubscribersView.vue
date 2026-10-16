<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">👥</div>
        <div>
          <h1 class="text-xl font-bold">إدارة المشتركين</h1>
          <p class="text-sm text-gray-500">رقم الحساب 9 أرقام: [كود فرع رقمين] + [أصفار] + [رقم اشتراك] - {{ filtered.length }} مشترك</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="downloadTemplate" class="btn-secondary text-sm">📋 تحميل قالب Excel</button>
        <button @click="showImport = true" class="btn-secondary text-sm">📥 استيراد جماعي</button>
        <button @click="openAdd" class="btn-primary text-sm">➕ إضافة مشترك</button>
      </div>
    </div>

    <!-- Formula Info -->
    <div class="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <h4 class="font-bold text-sm text-blue-900 mb-2">💡 معادلة رقم الحساب (9 أرقام)</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div class="bg-white p-3 rounded-xl">فرع 12، اشتراك 45678 → <span class="font-mono font-bold">120045678</span></div>
        <div class="bg-white p-3 rounded-xl">فرع 05، اشتراك 500 → <span class="font-mono font-bold">050000500</span></div>
        <div class="bg-white p-3 rounded-xl">فرع 01، اشتراك 123 → <span class="font-mono font-bold">010000123</span></div>
      </div>
      <p class="text-[11px] text-blue-700 mt-2">رقم الاشتراك فريد داخل نفس الفرع فقط، لكن رقم الحساب فريد على مستوى النظام</p>
    </div>

    <!-- Filters -->
    <div class="card p-5">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="md:col-span-2"><SearchInput v-model="store.searchQuery" placeholder="بحث برقم الحساب، الاسم، الهاتف..." /></div>
        <select v-model="store.branchFilter" class="input text-sm"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select>
        <select v-model="store.groupFilter" class="input text-sm"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.code">{{ g.code }} - {{ g.name }}</option></select>
        <select v-model="store.areaFilter" class="input text-sm"><option value="">جميع المناطق</option><option v-for="a in hierarchyStore.areas" :key="a.id" :value="a.code">{{ a.code }} - {{ a.name }}</option></select>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="store.loading" class="p-12 text-center"><div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div></div>
      <div v-else-if="paginated.length === 0"><EmptyState icon="👥" title="لا يوجد مشتركين" description="أضف مشتركين عبر الاستيراد الجماعي أو الإضافة اليدوية" ><button @click="openAdd" class="btn-primary mt-4">إضافة أول مشترك</button></EmptyState></div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b text-xs text-gray-500">
            <tr><th class="px-4 py-3 text-right">رقم الحساب (PK)</th><th class="px-4 py-3 text-right">رقم الاشتراك</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">كود المنطقة</th><th class="px-4 py-3 text-right">الرصيد الافتتاحي</th><th class="px-4 py-3 text-right">الرصيد الحالي</th><th class="px-4 py-3 text-center">إجراءات</th></tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sub in paginated" :key="sub.accountNumber" class="hover:bg-gray-50 text-sm">
              <td class="px-4 py-3 font-mono font-bold">{{ sub.accountNumber }}</td>
              <td class="px-4 py-3 font-mono">{{ sub.subscriptionNumber }}</td>
              <td class="px-4 py-3"><div class="font-medium">{{ sub.name }}</div><div class="text-xs text-gray-500">{{ sub.phone }} • {{ sub.idNumber }}</div></td>
              <td class="px-4 py-3 font-mono">{{ sub.areaCode }}</td>
              <td class="px-4 py-3">{{ formatCurrency(sub.openingBalance) }}</td>
              <td class="px-4 py-3 font-bold" :class="getBalanceColor(balances[sub.accountNumber])">{{ formatCurrency(balances[sub.accountNumber] ?? sub.openingBalance) }}<span class="text-[10px] mr-1">{{ getBalanceLabel(balances[sub.accountNumber] ?? sub.openingBalance) }}</span></td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit(sub)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete(sub)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button><button @click="viewStatement(sub)" class="w-8 h-8 rounded-lg bg-blue-50" title="كشف حساب">📄</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filtered.length > perPage" class="p-4 border-t"><Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" /></div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        <div class="p-6 border-b flex items-center justify-between"><h3 class="font-bold">{{ isEdit ? 'تعديل مشترك' : 'إضافة مشترك جديد' }}</h3><button @click="showForm = false" class="w-8 h-8 rounded-lg hover:bg-gray-100">✕</button></div>
        <form @submit.prevent="handleSave" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="label">الفرع *</label><select v-model="form.branchCode" class="input" @change="updateAccountNumber" required><option value="">اختر الفرع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.code">{{ b.code }} - {{ b.name }}</option></select></div>
            <div><label class="label">رقم الاشتراك *</label><input v-model="form.subscriptionNumber" type="number" class="input font-mono" @input="updateAccountNumber" placeholder="مثال: 45678" required /></div>
            <div class="md:col-span-2"><label class="label">رقم الحساب (9 أرقام - محسوب تلقائياً) *</label><div class="input bg-gray-50 font-mono font-bold text-primary-700">{{ form.accountNumber || 'اختر الفرع ورقم الاشتراك' }}</div><p class="text-[11px] text-gray-500 mt-1">المعادلة: كود فرع (رقمين) + أصفار + رقم اشتراك = 9 أرقام</p></div>
            <div><label class="label">كود المنطقة (7 أرقام) *</label><select v-model="form.areaCode" class="input font-mono" required><option value="">اختر المنطقة</option><option v-for="a in hierarchyStore.areas" :key="a.id" :value="a.code">{{ a.code }} - {{ a.name }}</option></select></div>
            <div><label class="label">الرصيد الافتتاحي (1/7) *</label><input v-model.number="form.openingBalance" type="number" step="0.01" class="input" required /></div>
            <div class="md:col-span-2"><label class="label">اسم المشترك (عربي) *</label><input v-model="form.name" type="text" class="input" required /></div>
            <div><label class="label">رقم الهوية/السجل</label><input v-model="form.idNumber" type="text" class="input" /></div>
            <div><label class="label">رقم الهاتف</label><input v-model="form.phone" type="text" class="input" /></div>
          </div>
          <div class="flex gap-3 pt-4 border-t"><button type="button" @click="showForm = false" class="btn-secondary flex-1">إلغاء</button><button type="submit" :disabled="saving" class="btn-primary flex-1">{{ isEdit ? 'حفظ' : 'إضافة' }}</button></div>
        </form>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImport = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
        <div class="p-6 border-b"><h3 class="font-bold text-lg">استيراد جماعي - Bulk Import</h3><p class="text-sm text-gray-500">قالب Excel مع التحقق المسبق (Pre-validation)</p></div>
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <div class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition">
            <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="handleFileSelect" class="hidden" />
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">📁</div>
            <p class="text-sm font-medium mb-2">{{ importFile ? importFile.name : 'اسحب الملف أو اضغط للاختيار' }}</p>
            <button @click="$refs.fileInput.click()" class="btn-secondary text-sm">اختيار ملف</button>
          </div>

          <div v-if="importResult" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-emerald-700">{{ importResult.successCount }}</p><p class="text-xs text-emerald-600">صحيحة - سيتم حفظها</p></div>
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-red-700">{{ importResult.errors.length }}</p><p class="text-xs text-red-600">خاطئة - لن تُحفظ</p></div>
              <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center"><p class="text-2xl font-bold">{{ importResult.total }}</p><p class="text-xs text-gray-600">الإجمالي</p></div>
            </div>

            <div v-if="importResult.errors.length > 0" class="card p-4 max-h-64 overflow-y-auto">
              <h4 class="font-bold text-sm mb-3 text-red-700">تقرير الأخطاء التفصيلي:</h4>
              <div class="space-y-2">
                <div v-for="(err, idx) in importResult.errors" :key="idx" class="text-xs p-2 bg-red-50 rounded-lg flex gap-2">
                  <span class="font-bold">صف {{ err.row }}:</span><span>{{ err.error }}</span>
                </div>
              </div>
              <button @click="exportErrors" class="btn-secondary text-xs mt-3">📤 تصدير تقرير الأخطاء Excel</button>
            </div>

            <div v-if="importResult.successCount > 0" class="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700">✅ سيتم حفظ {{ importResult.successCount }} مشترك صحيح فقط. يمكنك تصحيح الأخطاء وإعادة رفع الملف.</div>
          </div>
        </div>
        <div class="p-6 border-t flex gap-3">
          <button @click="showImport = false" class="btn-secondary flex-1">إغلاق</button>
          <button v-if="importResult && importResult.successCount > 0" @click="confirmImport" class="btn-success flex-1">تأكيد حفظ {{ importResult.successCount }} مشترك</button>
        </div>
      </div>
    </div>

    <ConfirmModal :show="showDelete" title="حذف المشترك" :message="`هل أنت متأكد من حذف ${selected?.name} (${selected?.accountNumber})؟ سيتم حذف جميع الإيصالات والخصومات المرتبطة.`" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف نهائي" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscribersStore } from '@/stores/subscribers'
import { useHierarchyStore } from '@/stores/hierarchy'
import { db, generateAccountNumber, calculateBalance } from '@/db'
import { formatCurrency, getBalanceStatus, getBalanceStatusLabel } from '@/utils/helpers'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const router = useRouter()
const store = useSubscribersStore()
const hierarchyStore = useHierarchyStore()
const { exportToExcel, importFromExcel } = useExport()

const showForm = ref(false)
const showImport = ref(false)
const showDelete = ref(false)
const isEdit = ref(false)
const selected = ref(null)
const saving = ref(false)
const currentPage = ref(1)
const perPage = ref(15)

const form = ref({ branchCode: '', subscriptionNumber: '', accountNumber: '', areaCode: '', name: '', idNumber: '', phone: '', openingBalance: 0 })

const importFile = ref(null)
const importResult = ref(null)
const importRawData = ref([])
const fileInput = ref(null)
const balances = ref({})

const filtered = computed(() => store.filteredSubscribers)
const paginated = computed(() => { const start = (currentPage.value - 1) * perPage.value; return filtered.value.slice(start, start + perPage.value) })

watch(() => filtered.value.length, () => currentPage.value = 1)

onMounted(async () => {
  await Promise.all([store.fetchSubscribers(), hierarchyStore.fetchAll()])
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

const getBalanceColor = (bal) => {
  if (bal == null) return ''
  if (bal > 0) return 'text-red-600'
  if (bal < 0) return 'text-emerald-600'
  return 'text-gray-600'
}
const getBalanceLabel = (bal) => {
  if (bal == null) return ''
  if (bal > 0) return '(عليه)'
  if (bal < 0) return '(له)'
  return '(صفر)'
}

const updateAccountNumber = () => {
  try {
    if (form.value.branchCode && form.value.subscriptionNumber) {
      form.value.accountNumber = generateAccountNumber(form.value.branchCode, form.value.subscriptionNumber)
    }
  } catch (e) {
    form.value.accountNumber = ''
  }
}

const openAdd = () => {
  isEdit.value = false
  selected.value = null
  form.value = { branchCode: '', subscriptionNumber: '', accountNumber: '', areaCode: '', name: '', idNumber: '', phone: '', openingBalance: 0 }
  showForm.value = true
}

const openEdit = (sub) => {
  isEdit.value = true
  selected.value = sub
  const branchCode = sub.accountNumber.substring(0,2)
  form.value = { branchCode, subscriptionNumber: sub.subscriptionNumber, accountNumber: sub.accountNumber, areaCode: sub.areaCode, name: sub.name, idNumber: sub.idNumber, phone: sub.phone, openingBalance: sub.openingBalance }
  showForm.value = true
}

const confirmDelete = (sub) => { selected.value = sub; showDelete.value = true }

const handleSave = async () => {
  saving.value = true
  try {
    if (!form.value.accountNumber || form.value.accountNumber.length !== 9) throw new Error('رقم الحساب يجب أن يكون 9 أرقام')
    const data = { accountNumber: form.value.accountNumber, subscriptionNumber: form.value.subscriptionNumber.toString(), areaCode: form.value.areaCode.toString(), name: form.value.name, idNumber: form.value.idNumber, phone: form.value.phone, openingBalance: Number(form.value.openingBalance) }
    if (isEdit.value) await store.updateSubscriber(selected.value.accountNumber, data)
    else await store.addSubscriber(data)
    await loadBalances()
    toast.success(isEdit.value ? 'تم التحديث' : 'تمت الإضافة')
    showForm.value = false
  } catch (e) { toast.error(e.message) } finally { saving.value = false }
}

const handleDelete = async () => {
  try { await store.deleteSubscriber(selected.value.accountNumber); await loadBalances(); toast.success('تم الحذف'); showDelete.value = false } catch (e) { toast.error(e.message) }
}

const downloadTemplate = () => {
  const template = [{ 'رقم الحساب (9 أرقام)': '120045678', 'رقم الاشتراك': '45678', 'كود المنطقة (7 أرقام)': '3001234', 'اسم المشترك': 'أحمد محمد', 'رقم الهوية/السجل': '12345678901234', 'رقم الهاتف': '01012345678', 'الرصيد الافتتاحي': 0 }]
  exportToExcel(template, 'قالب-المشتركين', 'قالب')
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  importFile.value = file
  try {
    const { data } = await importFromExcel(file)
    importRawData.value = data
    const result = await store.bulkImport(data)
    importResult.value = result
  } catch (err) { toast.error('فشل قراءة الملف') }
}

const confirmImport = async () => {
  toast.success(`تم حفظ ${importResult.value.successCount} مشترك بنجاح`)
  showImport.value = false
  importResult.value = null
  importFile.value = null
  await loadBalances()
}

const exportErrors = () => {
  const data = importResult.value.errors.map(err => ({ 'رقم الصف': err.row, 'الخطأ': err.error, 'البيانات': JSON.stringify(err.data) }))
  exportToExcel(data, `أخطاء-الاستيراد-${new Date().toISOString().split('T')[0]}`, 'أخطاء')
}

const viewStatement = (sub) => {
  router.push({ path: '/reports', query: { account: sub.accountNumber } })
}
</script>
