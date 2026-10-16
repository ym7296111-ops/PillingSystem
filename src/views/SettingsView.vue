<template>
  <div class="space-y-6 animate-fadeIn max-w-5xl">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">⚙️</div>
      <div>
        <h1 class="text-xl font-bold">الإعدادات</h1>
        <p class="text-sm text-gray-500">إدارة إعدادات النظام والشركة والنسخ الاحتياطي</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Company Info -->
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <h3 class="font-bold mb-1">معلومات الشركة</h3>
          <p class="text-sm text-gray-500 mb-6">ستظهر هذه المعلومات في الفواتير والتقارير</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="label">اسم الشركة *</label>
              <input v-model="form.companyName" type="text" class="input" placeholder="شركة الخدمات العامة" />
            </div>
            <div>
              <label class="label">رقم الهاتف</label>
              <input v-model="form.companyPhone" type="text" class="input" />
            </div>
            <div>
              <label class="label">البريد الإلكتروني</label>
              <input v-model="form.companyEmail" type="email" class="input" />
            </div>
            <div class="md:col-span-2">
              <label class="label">العنوان</label>
              <input v-model="form.companyAddress" type="text" class="input" placeholder="الجيزة، مصر" />
            </div>
            <div>
              <label class="label">العملة</label>
              <select v-model="form.currency" class="input">
                <option value="ج.م">جنيه مصري (ج.م)</option>
                <option value="ر.س">ريال سعودي (ر.س)</option>
                <option value="$">دولار ($)</option>
                <option value="د.إ">درهم (د.إ)</option>
              </select>
            </div>
            <div>
              <label class="label">نسبة الضريبة %</label>
              <input v-model.number="form.taxRate" type="number" step="0.1" min="0" max="100" class="input" />
            </div>
            <div>
              <label class="label">بادئة الفاتورة</label>
              <input v-model="form.invoicePrefix" type="text" class="input" placeholder="INV-" />
            </div>
            <div>
              <label class="label">المظهر</label>
              <select v-model="form.theme" class="input">
                <option value="light">فاتح</option>
                <option value="dark">داكن (قريباً)</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button @click="saveSettings" :disabled="saving" class="btn-primary">
              <span v-if="saving">جاري الحفظ...</span>
              <span v-else>💾 حفظ الإعدادات</span>
            </button>
            <button @click="resetForm" class="btn-secondary">إلغاء</button>
          </div>
        </div>

        <!-- Database Stats -->
        <div class="card p-6">
          <h3 class="font-bold mb-4">إحصائيات قاعدة البيانات</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold">{{ stats.subscribers }}</p>
              <p class="text-xs text-gray-500">مشترك</p>
            </div>
            <div class="bg-amber-50 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-amber-700">{{ stats.bills }}</p>
              <p class="text-xs text-amber-600">فاتورة</p>
            </div>
            <div class="bg-emerald-50 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-emerald-700">{{ stats.payments }}</p>
              <p class="text-xs text-emerald-600">دفعة</p>
            </div>
            <div class="bg-blue-50 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-blue-700">{{ stats.activities }}</p>
              <p class="text-xs text-blue-600">نشاط</p>
            </div>
          </div>
          <div class="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            💾 قاعدة البيانات محلية في متصفحك (IndexedDB). لا يتم إرسال أي بيانات لخوادم خارجية.
          </div>
        </div>
      </div>

      <!-- Backup & Actions -->
      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="font-bold mb-1">النسخ الاحتياطي</h3>
          <p class="text-xs text-gray-500 mb-4">احفظ نسخة من جميع البيانات أو استعد نسخة سابقة</p>

          <div class="space-y-3">
            <button @click="handleExport" class="w-full btn-primary text-sm justify-start">
              <span class="ml-2">📤</span> تصدير نسخة احتياطية (JSON)
            </button>
            <button @click="handleExportExcel" class="w-full btn-secondary text-sm justify-start">
              <span class="ml-2">📊</span> تصدير Excel شامل
            </button>
            
            <div class="border-t border-gray-100 my-3"></div>

            <div>
              <label class="label text-xs">استعادة نسخة احتياطية</label>
              <input ref="importInput" type="file" accept=".json" @change="handleImportFile" class="hidden" />
              <button @click="$refs.importInput.click()" class="w-full btn-secondary text-sm justify-start">
                <span class="ml-2">📥</span> استيراد نسخة (JSON)
              </button>
              <p class="text-[11px] text-gray-400 mt-2">سيتم دمج البيانات مع الحالية</p>
            </div>
          </div>
        </div>

        <div class="card p-6 border-red-100">
          <h3 class="font-bold text-red-700 mb-1">منطقة الخطر</h3>
          <p class="text-xs text-gray-500 mb-4">إجراءات لا يمكن التراجع عنها</p>

          <div class="space-y-3">
            <button @click="showClearModal = true" class="w-full btn-danger text-sm">
              🗑️ مسح جميع البيانات
            </button>
            <button @click="seedDemoData" class="w-full btn-ghost text-sm border border-gray-200">
              🌱 إضافة بيانات تجريبية
            </button>
          </div>
          <p class="text-[11px] text-red-400 mt-3">تحذير: مسح البيانات سيحذف جميع المشتركين والفواتير نهائياً</p>
        </div>

        <div class="card p-6 bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
          <h3 class="font-bold mb-2">حول النظام</h3>
          <div class="text-sm text-white/80 space-y-2">
            <p><strong>الإصدار:</strong> 1.0.0 (V1)</p>
            <p><strong>المنصة:</strong> GitHub Pages (Static)</p>
            <p><strong>قاعدة البيانات:</strong> IndexedDB (Dexie.js)</p>
            <p><strong>التقنيات:</strong> Vue 3, Vite, Pinia, Tailwind</p>
          </div>
          <div class="mt-4 pt-4 border-t border-white/20">
            <p class="text-xs text-white/60">تم تطوير النظام ليعمل بدون إنترنت بالكامل. جميع البيانات محفوظة محلياً في متصفحك.</p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :show="showClearModal"
      title="مسح جميع البيانات"
      message="هل أنت متأكد من مسح جميع البيانات؟ سيتم حذف جميع المشتركين والفواتير والمدفوعات نهائياً ولا يمكن التراجع عن هذا الإجراء."
      icon="⚠️"
      icon-bg="bg-red-100"
      confirm-text="مسح نهائي"
      confirm-class="btn-danger"
      @close="showClearModal = false"
      @confirm="handleClear"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useSubscribersStore } from '@/stores/subscribers'
import { useBillsStore } from '@/stores/bills'
import { usePaymentsStore } from '@/stores/payments'
import { db } from '@/db'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const settingsStore = useSettingsStore()
const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()
const { exportToExcel } = useExport()

const saving = ref(false)
const showClearModal = ref(false)
const importInput = ref(null)

const stats = ref({ subscribers: 0, bills: 0, payments: 0, activities: 0 })

const form = reactive({
  companyName: '',
  companyPhone: '',
  companyEmail: '',
  companyAddress: '',
  currency: 'ج.م',
  taxRate: 14,
  invoicePrefix: 'INV-',
  theme: 'light'
})

onMounted(async () => {
  await settingsStore.fetchSettings()
  Object.assign(form, settingsStore.settings)
  await refreshStats()
})

const refreshStats = async () => {
  stats.value = {
    subscribers: await db.subscribers.count(),
    bills: await db.bills.count(),
    payments: await db.payments.count(),
    activities: await db.activities.count()
  }
}

const resetForm = () => {
  Object.assign(form, settingsStore.settings)
}

const saveSettings = async () => {
  saving.value = true
  try {
    await settingsStore.updateSettings({ ...form })
    toast.success('تم حفظ الإعدادات بنجاح')
  } catch {
    toast.error('فشل حفظ الإعدادات')
  } finally {
    saving.value = false
  }
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
    toast.success('تم تصدير النسخة الاحتياطية')
  } catch {
    toast.error('فشل التصدير')
  }
}

const handleExportExcel = async () => {
  await subscribersStore.fetchSubscribers()
  await billsStore.fetchBills()
  await paymentsStore.fetchPayments()
  
  const subsData = subscribersStore.subscribers.map(s => ({
    'الاسم': s.name, 'الهاتف': s.phone, 'البريد': s.email, 'المنطقة': s.area, 'النوع': s.subscriptionType, 'الحالة': s.status
  }))
  const billsData = billsStore.bills.map(b => ({
    'رقم الفاتورة': b.billNumber, 'المشترك ID': b.subscriberId, 'المبلغ': b.totalAmount, 'الحالة': b.status, 'تاريخ الإصدار': b.issueDate
  }))
  
  exportToExcel(subsData, `المشتركين-${new Date().toISOString().split('T')[0]}`, 'المشتركين')
  setTimeout(() => {
    exportToExcel(billsData, `الفواتير-${new Date().toISOString().split('T')[0]}`, 'الفواتير')
  }, 500)
  toast.success('تم تصدير ملفات Excel')
}

const handleImportFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await settingsStore.importDatabase(data)
    await refreshStats()
    toast.success('تم استيراد البيانات بنجاح')
  } catch {
    toast.error('فشل استيراد الملف - تأكد من صحة التنسيق')
  }
}

const handleClear = async () => {
  try {
    await settingsStore.clearDatabase()
    await refreshStats()
    showClearModal.value = false
    toast.success('تم مسح جميع البيانات')
    Object.assign(form, settingsStore.settings)
  } catch {
    toast.error('فشل مسح البيانات')
  }
}

const seedDemoData = async () => {
  try {
    const demoSubscribers = [
      { name: 'أحمد محمد علي', phone: '01012345678', email: 'ahmed@example.com', nationalId: '29001011234567', area: 'الجيزة', address: 'شارع الهرم، الجيزة', subscriptionType: 'residential', status: 'active', joinDate: new Date().toISOString(), balance: 0, notes: 'عميل مميز', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: 'شركة النور للتجارة', phone: '01123456789', email: 'info@alnoor.com', nationalId: '12345678901234', area: 'القاهرة', address: 'وسط البلد، القاهرة', subscriptionType: 'commercial', status: 'active', joinDate: new Date(Date.now() - 30*24*60*60*1000).toISOString(), balance: 0, notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: 'سارة أحمد محمود', phone: '01234567890', email: 'sara@example.com', nationalId: '29502021234568', area: 'المهندسين', address: 'المهندسين، الجيزة', subscriptionType: 'residential', status: 'pending', joinDate: new Date().toISOString(), balance: 0, notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: 'مصنع الأمل الصناعي', phone: '01098765432', email: 'factory@alamal.com', nationalId: '11223344556677', area: 'أكتوبر', address: 'المنطقة الصناعية، أكتوبر', subscriptionType: 'industrial', status: 'active', joinDate: new Date(Date.now() - 60*24*60*60*1000).toISOString(), balance: 0, notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { name: 'محمد حسن إبراهيم', phone: '01011223344', email: '', nationalId: '28511151234569', area: 'فيصل', address: 'شارع فيصل', subscriptionType: 'residential', status: 'suspended', joinDate: new Date(Date.now() - 90*24*60*60*1000).toISOString(), balance: 0, notes: 'متأخر في السداد', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
    
    await db.subscribers.bulkAdd(demoSubscribers)
    const subs = await db.subscribers.toArray()
    
    const demoBills = subs.slice(0, 3).map((sub, idx) => ({
      subscriberId: sub.id,
      billNumber: `INV-2024-${String(idx+1).padStart(5,'0')}`,
      amount: 500 + idx * 250,
      discount: idx * 10,
      tax: 70,
      totalAmount: 500 + idx * 250 - idx * 10 + 70,
      issueDate: new Date(Date.now() - idx*10*24*60*60*1000).toISOString(),
      dueDate: new Date(Date.now() + (15-idx*5)*24*60*60*1000).toISOString(),
      status: idx === 0 ? 'paid' : idx === 1 ? 'unpaid' : 'partial',
      description: `فاتورة خدمات شهر ${idx+1}`,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    await db.bills.bulkAdd(demoBills)
    await refreshStats()
    toast.success('تم إضافة البيانات التجريبية')
  } catch (e) {
    console.error(e)
    toast.error('فشل إضافة البيانات التجريبية')
  }
}
</script>
