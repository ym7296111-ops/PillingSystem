<template>
  <div class="space-y-6 animate-fadeIn">
    <!-- Header Actions -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">👥</div>
        <div>
          <h1 class="text-xl font-bold">إدارة المشتركين</h1>
          <p class="text-sm text-gray-500">{{ filtered.length }} مشترك من أصل {{ store.subscribers.length }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button @click="showImport = true" class="btn-secondary text-sm">
          <span class="ml-2">📥</span> استيراد Excel
        </button>
        <button @click="handleExport" class="btn-secondary text-sm">
          <span class="ml-2">📤</span> تصدير Excel
        </button>
        <button @click="openAdd" class="btn-primary text-sm">
          <span class="ml-2">➕</span> إضافة مشترك
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-5">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="md:col-span-2">
          <SearchInput v-model="store.searchQuery" placeholder="بحث بالاسم، الهاتف، البريد، الرقم القومي..." />
        </div>
        <select v-model="store.statusFilter" class="input text-sm">
          <option value="">جميع الحالات</option>
          <option v-for="s in subscriberStatus" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <select v-model="store.typeFilter" class="input text-sm">
          <option value="">جميع الأنواع</option>
          <option v-for="t in subscriptionTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <select v-model="store.areaFilter" class="input text-sm">
          <option value="">جميع المناطق</option>
          <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
        </select>
      </div>
      <div v-if="hasActiveFilters" class="mt-3 flex items-center gap-2">
        <span class="text-xs text-gray-500">الفلاتر النشطة:</span>
        <button v-if="store.statusFilter" @click="store.statusFilter=''" class="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">{{ getStatusLabel(store.statusFilter) }} ✕</button>
        <button v-if="store.typeFilter" @click="store.typeFilter=''" class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{{ getTypeLabel(store.typeFilter) }} ✕</button>
        <button v-if="store.areaFilter" @click="store.areaFilter=''" class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{{ store.areaFilter }} ✕</button>
        <button @click="clearFilters" class="text-xs text-gray-500 hover:text-gray-700">مسح الكل</button>
      </div>
    </div>

    <!-- Stats mini -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div v-for="stat in miniStats" :key="stat.label" class="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500">{{ stat.label }}</p>
          <p class="text-lg font-bold">{{ stat.value }}</p>
        </div>
        <span class="text-xl">{{ stat.icon }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="store.loading" class="p-12 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-3"></div>
        <p class="text-sm text-gray-500">جاري تحميل البيانات...</p>
      </div>

      <div v-else-if="paginated.length === 0">
        <EmptyState icon="👥" title="لا يوجد مشتركين" description="لم يتم العثور على مشتركين يطابقون البحث. جرب تغيير الفلاتر أو أضف مشترك جديد." >
          <button @click="openAdd" class="btn-primary mt-4">إضافة أول مشترك</button>
        </EmptyState>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr class="text-xs text-gray-500 text-right">
              <th class="px-4 py-3 font-semibold">المشترك</th>
              <th class="px-4 py-3 font-semibold">التواصل</th>
              <th class="px-4 py-3 font-semibold">المنطقة</th>
              <th class="px-4 py-3 font-semibold">النوع</th>
              <th class="px-4 py-3 font-semibold">الحالة</th>
              <th class="px-4 py-3 font-semibold">تاريخ الانضمام</th>
              <th class="px-4 py-3 font-semibold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sub in paginated" :key="sub.id" class="hover:bg-gray-50/70 transition group">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {{ sub.name.charAt(0) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-sm truncate max-w-[150px]">{{ sub.name }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ sub.nationalId || 'بدون رقم قومي' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="text-sm font-medium">{{ sub.phone }}</p>
                <p class="text-xs text-gray-500 truncate max-w-[150px]">{{ sub.email || 'بدون بريد' }}</p>
              </td>
              <td class="px-4 py-3 text-sm">{{ sub.area }}</td>
              <td class="px-4 py-3">
                <span :class="['badge text-xs', getTypeColor(sub.subscriptionType)]">{{ getTypeLabel(sub.subscriptionType) }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="['badge text-xs', getStatusColor(sub.status)]">{{ getStatusLabel(sub.status) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDateShort(sub.joinDate) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <router-link :to="`/subscribers/${sub.id}`" class="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-sm" title="عرض">👁️</router-link>
                  <button @click="openEdit(sub)" class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-sm" title="تعديل">✏️</button>
                  <button @click="confirmDelete(sub)" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-sm" title="حذف">🗑️</button>
                </div>
                <div class="flex md:hidden items-center justify-center gap-1">
                  <router-link :to="`/subscribers/${sub.id}`" class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">👁️</router-link>
                  <button @click="openEdit(sub)" class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">✏️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filtered.length > perPage" class="p-4 border-t border-gray-100">
        <Pagination :current-page="currentPage" :total="filtered.length" :per-page="perPage" @update:page="currentPage = $event" />
      </div>
    </div>

    <!-- Modals -->
    <SubscriberForm v-if="showForm" :subscriber="selectedSubscriber" :loading="saving" @close="showForm = false" @save="handleSave" />

    <ConfirmModal
      :show="showDelete"
      title="حذف المشترك"
      :message="`هل أنت متأكد من حذف المشترك ${selectedSubscriber?.name}؟ سيتم حذف جميع الفواتير والمدفوعات المرتبطة به.`"
      icon="🗑️"
      icon-bg="bg-red-100"
      confirm-text="حذف نهائي"
      confirm-class="btn-danger"
      @close="showDelete = false"
      @confirm="handleDelete"
    />

    <!-- Import Modal -->
    <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showImport = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeIn">
        <h3 class="font-bold text-lg mb-2">استيراد المشتركين من Excel</h3>
        <p class="text-sm text-gray-500 mb-6">قم برفع ملف Excel يحتوي على أعمدة: الاسم، الهاتف، البريد، المنطقة، نوع الاشتراك، الحالة</p>
        
        <div class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" @change="handleFileSelect" class="hidden" />
          <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">📁</div>
          <p class="text-sm font-medium mb-2">{{ importFile ? importFile.name : 'اسحب الملف هنا أو اضغط للاختيار' }}</p>
          <button @click="$refs.fileInput.click()" class="btn-secondary text-sm">اختيار ملف</button>
          <p class="text-xs text-gray-400 mt-3">يدعم xlsx, xls, csv</p>
        </div>

        <div v-if="importPreview.length > 0" class="mt-6">
          <p class="text-sm font-medium mb-2">معاينة ({{ importPreview.length }} صف):</p>
          <div class="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto text-xs">
            <div v-for="(row, idx) in importPreview.slice(0,5)" :key="idx" class="py-1 border-b border-gray-100 last:border-0">
              {{ row.name || row['الاسم'] }} - {{ row.phone || row['الهاتف'] }}
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="showImport = false" class="btn-secondary flex-1">إلغاء</button>
          <button @click="handleImport" :disabled="!importPreview.length || importing" class="btn-primary flex-1">
            <span v-if="importing">جاري الاستيراد...</span>
            <span v-else>استيراد {{ importPreview.length }} مشترك</span>
          </button>
        </div>

        <div class="mt-6 p-3 bg-blue-50 rounded-xl">
          <p class="text-xs font-medium text-blue-800 mb-1">💡 قالب Excel:</p>
          <button @click="downloadTemplate" class="text-xs text-blue-600 hover:underline">تحميل قالب فارغ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSubscribersStore } from '@/stores/subscribers'
import { SUBSCRIPTION_TYPES, SUBSCRIBER_STATUS, AREAS } from '@/utils/constants'
import { formatDateShort } from '@/utils/helpers'
import SearchInput from '@/components/common/SearchInput.vue'
import Pagination from '@/components/common/Pagination.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SubscriberForm from '@/components/subscribers/SubscriberForm.vue'
import { useToast } from 'vue-toastification'
import { useExport } from '@/composables/useExport'

const toast = useToast()
const route = useRoute()
const store = useSubscribersStore()
const { exportToExcel, importFromExcel } = useExport()

const subscriptionTypes = SUBSCRIPTION_TYPES
const subscriberStatus = SUBSCRIBER_STATUS
const areas = AREAS

const showForm = ref(false)
const showDelete = ref(false)
const showImport = ref(false)
const selectedSubscriber = ref(null)
const saving = ref(false)
const currentPage = ref(1)
const perPage = ref(10)

const importFile = ref(null)
const importPreview = ref([])
const importing = ref(false)
const fileInput = ref(null)

onMounted(async () => {
  await store.fetchSubscribers()
  if (route.query.q) {
    store.searchQuery = route.query.q
  }
})

const filtered = computed(() => store.filteredSubscribers)
const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

watch(() => filtered.value.length, () => currentPage.value = 1)
watch(() => [store.searchQuery, store.statusFilter, store.typeFilter, store.areaFilter], () => currentPage.value = 1)

const hasActiveFilters = computed(() => store.statusFilter || store.typeFilter || store.areaFilter)

const miniStats = computed(() => [
  { label: 'الكل', value: store.stats.total, icon: '👥' },
  { label: 'نشط', value: store.stats.active, icon: '✅' },
  { label: 'غير نشط', value: store.stats.inactive, icon: '⏸️' },
  { label: 'موقوف', value: store.stats.suspended, icon: '🚫' },
  { label: 'انتظار', value: store.stats.pending, icon: '⏳' }
])

const getStatusLabel = (v) => subscriberStatus.find(s => s.value === v)?.label || v
const getStatusColor = (v) => subscriberStatus.find(s => s.value === v)?.color || 'badge-gray'
const getTypeLabel = (v) => subscriptionTypes.find(t => t.value === v)?.label || v
const getTypeColor = (v) => subscriptionTypes.find(t => t.value === v)?.color || 'badge-gray'

const clearFilters = () => {
  store.statusFilter = ''
  store.typeFilter = ''
  store.areaFilter = ''
  store.searchQuery = ''
}

const openAdd = () => {
  selectedSubscriber.value = null
  showForm.value = true
}

const openEdit = (sub) => {
  selectedSubscriber.value = sub
  showForm.value = true
}

const confirmDelete = (sub) => {
  selectedSubscriber.value = sub
  showDelete.value = true
}

const handleSave = async (data) => {
  saving.value = true
  try {
    if (selectedSubscriber.value) {
      await store.updateSubscriber(selectedSubscriber.value.id, data)
      toast.success('تم تحديث بيانات المشترك بنجاح')
    } else {
      await store.addSubscriber(data)
      toast.success('تم إضافة المشترك بنجاح')
    }
    showForm.value = false
  } catch (e) {
    toast.error('حدث خطأ أثناء الحفظ')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  try {
    await store.deleteSubscriber(selectedSubscriber.value.id)
    toast.success('تم حذف المشترك بنجاح')
    showDelete.value = false
  } catch (e) {
    toast.error('فشل حذف المشترك')
  }
}

const handleExport = () => {
  const data = filtered.value.map(s => ({
    'الاسم': s.name,
    'الهاتف': s.phone,
    'البريد': s.email,
    'الرقم القومي': s.nationalId,
    'المنطقة': s.area,
    'العنوان': s.address,
    'نوع الاشتراك': getTypeLabel(s.subscriptionType),
    'الحالة': getStatusLabel(s.status),
    'تاريخ الانضمام': formatDateShort(s.joinDate),
    'ملاحظات': s.notes
  }))
  if (exportToExcel(data, `المشتركين-${new Date().toISOString().split('T')[0]}`, 'المشتركين')) {
    toast.success('تم تصدير البيانات بنجاح')
  }
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  importFile.value = file
  try {
    const json = await importFromExcel(file)
    importPreview.value = json
  } catch (err) {
    toast.error('فشل قراءة الملف')
  }
}

const handleImport = async () => {
  importing.value = true
  try {
    const count = await store.bulkAddSubscribers(importPreview.value)
    toast.success(`تم استيراد ${count} مشترك بنجاح`)
    showImport.value = false
    importPreview.value = []
    importFile.value = null
  } catch (e) {
    toast.error('فشل الاستيراد')
  } finally {
    importing.value = false
  }
}

const downloadTemplate = () => {
  const template = [
    { 'الاسم': 'أحمد محمد', 'الهاتف': '01012345678', 'البريد': 'ahmed@example.com', 'الرقم القومي': '12345678901234', 'المنطقة': 'الجيزة', 'العنوان': 'شارع الهرم', 'نوع الاشتراك': 'سكني', 'الحالة': 'نشط', 'ملاحظات': '' }
  ]
  exportToExcel(template, 'قالب-المشتركين', 'قالب')
}
</script>
