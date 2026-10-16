<template>
  <div class="space-y-6 animate-fadeIn max-w-5xl">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">⚙️</div>
      <div><h1 class="text-xl font-bold">الضبط العام</h1><p class="text-sm text-gray-500">رفع اللوجو، اسم القطاع والإدارة - يظهر في التقرير المطبوع</p></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <h3 class="font-bold mb-1">معلومات المؤسسة</h3>
          <p class="text-sm text-gray-500 mb-6">تظهر في هيدر التقرير المطبوع</p>
          <div class="space-y-4">
            <div><label class="label">اسم القطاع *</label><input v-model="form.sectorName" type="text" class="input" placeholder="مثال: قطاع الخدمات العامة" /></div>
            <div><label class="label">اسم الإدارة *</label><input v-model="form.managementName" type="text" class="input" placeholder="الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات" /></div>
            <div><label class="label">اسم الشركة (عربي)</label><input v-model="form.companyName" type="text" class="input" /></div>
            <div><label class="label">اسم الشركة (إنجليزي)</label><input v-model="form.companyNameEn" type="text" class="input" /></div>
            <div>
              <label class="label">اللوجو (يظهر في التقرير المطبوع)</label>
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  <img v-if="form.logo" :src="form.logo" class="w-full h-full object-contain" />
                  <span v-else class="text-2xl">🏢</span>
                </div>
                <div class="flex-1">
                  <input ref="logoInput" type="file" accept="image/*" @change="handleLogoUpload" class="hidden" />
                  <button @click="$refs.logoInput.click()" class="btn-secondary text-sm">📁 رفع لوجو</button>
                  <button v-if="form.logo" @click="form.logo = ''" class="btn-ghost text-sm mr-2">حذف</button>
                  <p class="text-[11px] text-gray-400 mt-2">PNG, JPG حتى 2MB</p>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex gap-3"><button @click="saveSettings" :disabled="saving" class="btn-primary">{{ saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات' }}</button><button @click="resetForm" class="btn-secondary">إلغاء</button></div>
        </div>

        <div class="card p-6">
          <h3 class="font-bold mb-4">إحصائيات قاعدة البيانات - IndexedDB</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold">{{ stats.sectors }}</p><p class="text-xs text-gray-500">قطاع</p></div>
            <div class="bg-blue-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-blue-700">{{ stats.branches }}</p><p class="text-xs text-blue-600">فرع</p></div>
            <div class="bg-purple-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-purple-700">{{ stats.groups }}</p><p class="text-xs text-purple-600">مجموعة</p></div>
            <div class="bg-emerald-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-emerald-700">{{ stats.areas }}</p><p class="text-xs text-emerald-600">منطقة</p></div>
            <div class="bg-amber-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-amber-700">{{ stats.subscribers }}</p><p class="text-xs text-amber-600">مشترك (9 أرقام)</p></div>
            <div class="bg-indigo-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-indigo-700">{{ stats.receipts }}</p><p class="text-xs text-indigo-600">إيصال</p></div>
            <div class="bg-pink-50 rounded-xl p-4 text-center"><p class="text-2xl font-bold text-pink-700">{{ stats.discounts }}</p><p class="text-xs text-pink-600">خصم مستورد</p></div>
            <div class="bg-gray-100 rounded-xl p-4 text-center"><p class="text-2xl font-bold">{{ stats.receiptTypes }}</p><p class="text-xs text-gray-600">تصنيف إيصال</p></div>
          </div>
          <div class="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">💾 قاعدة البيانات محلية في متصفحك (IndexedDB) - Dexie.js - لا يوجد Backend - يعمل Offline</div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="font-bold mb-1">النسخ الاحتياطي</h3>
          <p class="text-xs text-gray-500 mb-4">تصدير/استيراد جميع البيانات</p>
          <div class="space-y-3">
            <button @click="handleExport" class="w-full btn-primary text-sm justify-start">📤 تصدير نسخة احتياطية (JSON)</button>
            <button @click="handleExportExcel" class="w-full btn-secondary text-sm justify-start">📊 تصدير Excel شامل</button>
            <div class="border-t my-3"></div>
            <div><label class="label text-xs">استعادة نسخة</label><input ref="importInput" type="file" accept=".json" @change="handleImportFile" class="hidden" /><button @click="$refs.importInput.click()" class="w-full btn-secondary text-sm justify-start">📥 استيراد نسخة (JSON)</button></div>
          </div>
        </div>

        <div class="card p-6 border-red-100">
          <h3 class="font-bold text-red-700 mb-1">منطقة الخطر</h3>
          <div class="space-y-3">
            <button @click="showClearModal = true" class="w-full btn-danger text-sm">🗑️ مسح جميع البيانات</button>
            <button @click="seedDemoData" class="w-full btn-ghost text-sm border border-gray-200">🌱 إضافة بيانات تجريبية كاملة (هيكلية + مشتركين + إيصالات + خصومات)</button>
          </div>
        </div>

        <div class="card p-6 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
          <h3 class="font-bold mb-2">نظام الإدارة العامة لحسابات المشتركين</h3>
          <p class="text-xs text-white/80">إدارة الإيصالات والخصومات</p>
          <p class="text-[11px] text-white/60 mt-1">Subscriber Accounts Management System</p>
          <div class="text-sm text-white/80 space-y-1 mt-4">
            <p>الإصدار: 1.0.0 V1</p>
            <p>المنصة: GitHub Pages (Static)</p>
            <p>قاعدة البيانات: IndexedDB - Dexie.js</p>
            <p>السنة المالية: 1 يوليو - 30 يونيو</p>
            <p>رقم الحساب: 9 أرقام (فرع رقمين + أصفار + اشتراك)</p>
            <p>كود المنطقة: 7 أرقام (أول رقم = مجموعة 1-8)</p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal :show="showClearModal" title="مسح جميع البيانات" message="هل أنت متأكد من مسح جميع البيانات؟ سيتم حذف الهيكلية والمشتركين والإيصالات والخصومات نهائياً." icon="⚠️" icon-bg="bg-red-100" confirm-text="مسح نهائي" confirm-class="btn-danger" @close="showClearModal = false" @confirm="handleClear" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { db, generateAccountNumber, generateAreaCode, getCurrentFiscalYear } from '@/db'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const settingsStore = useSettingsStore()
const { exportToExcel } = useExport()

const saving = ref(false)
const showClearModal = ref(false)
const importInput = ref(null)
const logoInput = ref(null)
const stats = ref({ sectors: 0, branches: 0, groups: 0, areas: 0, subscribers: 0, receipts: 0, discounts: 0, receiptTypes: 0 })

const form = reactive({ sectorName: '', managementName: '', companyName: '', companyNameEn: '', logo: '' })

onMounted(async () => {
  await settingsStore.fetchSettings()
  Object.assign(form, settingsStore.settings)
  await refreshStats()
})

const refreshStats = async () => {
  stats.value = {
    sectors: await db.sectors.count(),
    branches: await db.branches.count(),
    groups: await db.groups.count(),
    areas: await db.areas.count(),
    subscribers: await db.subscribers.count(),
    receipts: await db.receipts.count(),
    discounts: await db.discounts.count(),
    receiptTypes: await db.receiptTypes.count()
  }
}

const resetForm = () => Object.assign(form, settingsStore.settings)

const saveSettings = async () => {
  saving.value = true
  try { await settingsStore.updateSettings({ ...form }); toast.success('تم حفظ الإعدادات') } catch { toast.error('فشل الحفظ') } finally { saving.value = false }
}

const handleLogoUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { toast.error('حجم الصورة يجب أن لا يتجاوز 2MB'); return }
  const reader = new FileReader()
  reader.onload = (ev) => { form.logo = ev.target.result }
  reader.readAsDataURL(file)
}

const handleExport = async () => {
  try {
    const data = await settingsStore.exportDatabase()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('تم التصدير')
  } catch { toast.error('فشل التصدير') }
}

const handleExportExcel = async () => {
  const subs = await db.subscribers.toArray()
  const receipts = await db.receipts.toArray()
  exportToExcel(subs.map(s => ({ 'رقم الحساب': s.accountNumber, 'الاسم': s.name, 'المنطقة': s.areaCode })), `المشتركين-${new Date().toISOString().split('T')[0]}`, 'مشتركين')
  setTimeout(() => exportToExcel(receipts.map(r => ({ 'رقم الحساب': r.accountNumber, 'التاريخ': r.date, 'المبلغ': r.amount })), `الإيصالات-${new Date().toISOString().split('T')[0]}`, 'إيصالات'), 500)
  toast.success('تم التصدير')
}

const handleImportFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await settingsStore.importDatabase(data)
    await refreshStats()
    toast.success('تم الاستيراد')
  } catch { toast.error('فشل الاستيراد') }
}

const handleClear = async () => {
  try { await settingsStore.clearDatabase(); await refreshStats(); showClearModal.value = false; Object.assign(form, settingsStore.settings); toast.success('تم المسح') } catch { toast.error('فشل المسح') }
}

const seedDemoData = async () => {
  try {
    // Sectors
    await db.sectors.bulkAdd([{ name: 'قطاع القاهرة الكبرى' }, { name: 'قطاع الدلتا' }])
    const sectors = await db.sectors.toArray()
    // Branches 01, 02, 12
    await db.branches.bulkAdd([
      { sectorId: sectors[0].id, code: '01', name: 'فرع الجيزة' },
      { sectorId: sectors[0].id, code: '02', name: 'فرع القاهرة' },
      { sectorId: sectors[0].id, code: '12', name: 'فرع أكتوبر' }
    ])
    const branches = await db.branches.toArray()
    // Groups 1-3 per branch
    await db.groups.bulkAdd([
      { branchId: branches[0].id, code: 1, name: 'مجموعة 1 - الهرم' },
      { branchId: branches[0].id, code: 2, name: 'مجموعة 2 - فيصل' },
      { branchId: branches[0].id, code: 3, name: 'مجموعة 3 - الدقي' },
      { branchId: branches[1].id, code: 1, name: 'مجموعة 1 - وسط البلد' }
    ])
    const groups = await db.groups.toArray()
    // Areas: code 7 digits, first digit = group code
    await db.areas.bulkAdd([
      { groupId: groups[0].id, code: '1000001', name: 'منطقة الهرم 1' },
      { groupId: groups[0].id, code: '1000002', name: 'منطقة الهرم 2' },
      { groupId: groups[1].id, code: '2000001', name: 'منطقة فيصل 1' },
      { groupId: groups[2].id, code: '3001234', name: 'منطقة الدقي - مثال المجموعة 3' },
      { groupId: groups[3].id, code: '1000003', name: 'منطقة وسط البلد' }
    ])
    const areas = await db.areas.toArray()
    // Subscribers with 9-digit accountNumber formula
    await db.subscribers.bulkAdd([
      { accountNumber: generateAccountNumber('01', '45678'), subscriptionNumber: '45678', areaCode: areas[0].code, name: 'أحمد محمد علي', idNumber: '29001011234567', phone: '01012345678', openingBalance: 100 },
      { accountNumber: generateAccountNumber('01', '500'), subscriptionNumber: '500', areaCode: areas[0].code, name: 'سارة أحمد محمود', idNumber: '29502021234568', phone: '01123456789', openingBalance: 0 },
      { accountNumber: generateAccountNumber('12', '45678'), subscriptionNumber: '45678', areaCode: areas[2].code, name: 'محمد حسن إبراهيم - نفس الاشتراك فرع مختلف', idNumber: '28511151234569', phone: '01234567890', openingBalance: 50 },
      { accountNumber: generateAccountNumber('01', '123'), subscriptionNumber: '123', areaCode: areas[3].code, name: 'شركة النور للتجارة', idNumber: '123456789', phone: '01098765432', openingBalance: 200 }
    ])
    // Receipt Types
    await db.receiptTypes.bulkAdd([
      { name: 'استهلاك مياه', isDisabled: false },
      { name: 'صرف صحي', isDisabled: false },
      { name: 'رسوم إدارية', isDisabled: false }
    ])
    const types = await db.receiptTypes.toArray()
    const subs = await db.subscribers.toArray()
    const fy = getCurrentFiscalYear()
    // Receipts
    await db.receipts.bulkAdd([
      { accountNumber: subs[0].accountNumber, receiptNumber: 'R001', date: new Date().toISOString(), typeId: types[0].id, amount: 150, fiscalYear: fy.label },
      { accountNumber: subs[0].accountNumber, receiptNumber: 'R002', date: new Date(Date.now() - 10*24*60*60*1000).toISOString(), typeId: types[1].id, amount: 50, fiscalYear: fy.label },
      { accountNumber: subs[1].accountNumber, receiptNumber: null, date: new Date().toISOString(), typeId: types[0].id, amount: 200, fiscalYear: fy.label }
    ])
    // Discounts
    await db.discounts.bulkAdd([
      { accountNumber: subs[0].accountNumber, areaCode: subs[0].areaCode, subscriptionNumber: subs[0].subscriptionNumber, discountAmount: 30, remainingAmount: 10, invoiceTotal: 200, fiscalMonth: 'يناير - 2024/2025', importBatch: 'BATCH-2025-01-01' },
      { accountNumber: subs[1].accountNumber, areaCode: subs[1].areaCode, subscriptionNumber: subs[1].subscriptionNumber, discountAmount: 20, remainingAmount: 0, invoiceTotal: 180, fiscalMonth: 'يناير - 2024/2025', importBatch: 'BATCH-2025-01-01' }
    ])

    await refreshStats()
    toast.success('تم إضافة بيانات تجريبية كاملة: قطاعات، فروع، مجموعات، مناطق، مشتركين 9 أرقام، إيصالات، خصومات')
  } catch (e) { console.error(e); toast.error('فشل إضافة البيانات: ' + e.message) }
}
</script>
