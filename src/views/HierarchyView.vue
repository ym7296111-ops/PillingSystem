<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">🏗️</div>
      <div>
        <h1 class="text-xl font-bold">إدارة الهيكلية التنظيمية</h1>
        <p class="text-sm text-gray-500">قطاع ← فرع (00-99) ← مجموعة (1-8) ← منطقة (7 أرقام)</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="card p-2 flex gap-2 overflow-x-auto">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="['px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition', activeTab === tab.key ? 'bg-primary-600 text-white shadow' : 'bg-gray-50 text-gray-600 hover:bg-gray-100']">
        {{ tab.icon }} {{ tab.label }} <span v-if="tab.count !== undefined" class="mr-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Sectors Tab -->
    <div v-if="activeTab === 'sectors'" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="font-bold">القطاعات ({{ hierarchyStore.sectors.length }})</h3>
        <button @click="openAdd('sector')" class="btn-primary text-sm">➕ إضافة قطاع</button>
      </div>
      <div class="card overflow-hidden">
        <div v-if="hierarchyStore.sectors.length === 0"><EmptyState icon="🏢" title="لا توجد قطاعات" description="أضف أول قطاع للبدء" /></div>
        <table v-else class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">عدد الفروع</th><th class="px-4 py-3 text-center">إجراءات</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="sector in hierarchyStore.sectors" :key="sector.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium">{{ sector.name }}</td>
              <td class="px-4 py-3">{{ hierarchyStore.branchesBySector(sector.id).length }}</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit('sector', sector)" class="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100">✏️</button><button @click="confirmDelete('sector', sector)" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Branches Tab -->
    <div v-if="activeTab === 'branches'" class="space-y-4">
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <h3 class="font-bold">الفروع ({{ hierarchyStore.branches.length }}) - كود رقمين 00-99</h3>
        <div class="flex gap-2">
          <select v-model="filterSector" class="input text-sm w-auto"><option value="">جميع القطاعات</option><option v-for="s in hierarchyStore.sectors" :key="s.id" :value="s.id">{{ s.name }}</option></select>
          <button @click="openAdd('branch')" class="btn-primary text-sm">➕ إضافة فرع</button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div v-if="filteredBranches.length === 0"><EmptyState icon="🏦" title="لا توجد فروع" description="كود الفرع رقمين فقط (00-99)" /></div>
        <table v-else class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-4 py-3 text-right">كود الفرع</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">القطاع</th><th class="px-4 py-3 text-right">المجموعات</th><th class="px-4 py-3 text-center">إجراءات</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="branch in filteredBranches" :key="branch.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-bold">{{ branch.code }}</td>
              <td class="px-4 py-3 font-medium">{{ branch.name }}</td>
              <td class="px-4 py-3 text-sm">{{ hierarchyStore.sectors.find(s => s.id === branch.sectorId)?.name || '-' }}</td>
              <td class="px-4 py-3">{{ hierarchyStore.groupsByBranch(branch.id).length }} / 8</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit('branch', branch)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete('branch', branch)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">💡 مثال: فرع 12، اشتراك 45678 → رقم الحساب: 120045678 (9 أرقام: كود فرع رقمين + أصفار + رقم اشتراك)</div>
    </div>

    <!-- Groups Tab -->
    <div v-if="activeTab === 'groups'" class="space-y-4">
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <h3 class="font-bold">المجموعات ({{ hierarchyStore.groups.length }}) - كود 1-8، حد أقصى 8 لكل فرع</h3>
        <div class="flex gap-2">
          <select v-model="filterBranch" class="input text-sm w-auto"><option value="">جميع الفروع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.id">{{ b.code }} - {{ b.name }}</option></select>
          <button @click="openAdd('group')" class="btn-primary text-sm">➕ إضافة مجموعة</button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div v-if="filteredGroups.length === 0"><EmptyState icon="👥" title="لا توجد مجموعات" description="المجموعة من 1 إلى 8 فقط لكل فرع" /></div>
        <table v-else class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-4 py-3 text-right">كود المجموعة</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">الفرع</th><th class="px-4 py-3 text-right">المناطق</th><th class="px-4 py-3 text-center">إجراءات</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="group in filteredGroups" :key="group.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-bold">{{ group.code }}</td>
              <td class="px-4 py-3 font-medium">{{ group.name }}</td>
              <td class="px-4 py-3 text-sm">{{ hierarchyStore.branches.find(b => b.id === group.branchId)?.name || '-' }} ({{ hierarchyStore.branches.find(b => b.id === group.branchId)?.code }})</td>
              <td class="px-4 py-3">{{ hierarchyStore.areasByGroup(group.id).length }}</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit('group', group)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete('group', group)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Areas Tab -->
    <div v-if="activeTab === 'areas'" class="space-y-4">
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <h3 class="font-bold">المناطق ({{ hierarchyStore.areas.length }}) - كود 7 أرقام: أول رقم = كود المجموعة</h3>
        <div class="flex gap-2">
          <select v-model="filterGroup" class="input text-sm w-auto"><option value="">جميع المجموعات</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.id">{{ g.code }} - {{ g.name }}</option></select>
          <button @click="openAdd('area')" class="btn-primary text-sm">➕ إضافة منطقة</button>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div v-if="filteredAreas.length === 0"><EmptyState icon="📍" title="لا توجد مناطق" description="مثال: المجموعة 3، المنطقة 1234 → كود المنطقة: 3001234" /></div>
        <table v-else class="w-full">
          <thead class="bg-gray-50 text-xs text-gray-500"><tr><th class="px-4 py-3 text-right">كود المنطقة (7 أرقام)</th><th class="px-4 py-3 text-right">الاسم</th><th class="px-4 py-3 text-right">المجموعة</th><th class="px-4 py-3 text-right">الفرع</th><th class="px-4 py-3 text-center">إجراءات</th></tr></thead>
          <tbody class="divide-y">
            <tr v-for="area in filteredAreas" :key="area.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-mono font-bold">{{ area.code }}</td>
              <td class="px-4 py-3 font-medium">{{ area.name }}</td>
              <td class="px-4 py-3 text-sm">{{ getGroupInfo(area.groupId).name }} ({{ getGroupInfo(area.groupId).code }})</td>
              <td class="px-4 py-3 text-sm">{{ getBranchInfo(getGroupInfo(area.groupId).branchId)?.name || '-' }}</td>
              <td class="px-4 py-3 text-center"><div class="flex justify-center gap-1"><button @click="openEdit('area', area)" class="w-8 h-8 rounded-lg bg-amber-50">✏️</button><button @click="confirmDelete('area', area)" class="w-8 h-8 rounded-lg bg-red-50">🗑️</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-3 bg-amber-50 rounded-xl text-xs text-amber-800">⚠️ كود المنطقة 7 أرقام: الرقم الأول = كود المجموعة (1-8) + 6 أرقام رقم المنطقة داخل المجموعة. مثال: المجموعة 3، المنطقة 1234 → 3001234</div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <h3 class="font-bold text-lg mb-4">{{ isEdit ? 'تعديل' : 'إضافة' }} {{ formTitles[formType] }}</h3>
        <div class="space-y-4">
          <div v-if="formType === 'branch'">
            <label class="label">القطاع *</label>
            <select v-model="form.sectorId" class="input" required><option value="">اختر القطاع</option><option v-for="s in hierarchyStore.sectors" :key="s.id" :value="s.id">{{ s.name }}</option></select>
          </div>
          <div v-if="formType === 'branch'">
            <label class="label">كود الفرع (رقمين 00-99) *</label>
            <input v-model="form.code" type="number" min="0" max="99" class="input" placeholder="مثال: 12" required />
            <p class="text-[11px] text-gray-500 mt-1">سيتم تنسيقه كرقمين: 05، 12، إلخ</p>
          </div>
          <div v-if="formType === 'group'">
            <label class="label">الفرع *</label>
            <select v-model="form.branchId" class="input" required><option value="">اختر الفرع</option><option v-for="b in hierarchyStore.branches" :key="b.id" :value="b.id">{{ b.code }} - {{ b.name }}</option></select>
          </div>
          <div v-if="formType === 'group'">
            <label class="label">كود المجموعة (1-8) *</label>
            <input v-model.number="form.code" type="number" min="1" max="8" class="input" placeholder="1-8" required />
          </div>
          <div v-if="formType === 'area'">
            <label class="label">المجموعة *</label>
            <select v-model="form.groupId" class="input" required><option value="">اختر المجموعة</option><option v-for="g in hierarchyStore.groups" :key="g.id" :value="g.id">{{ g.code }} - {{ g.name }} (فرع: {{ hierarchyStore.branches.find(b => b.id === g.branchId)?.code }})</option></select>
          </div>
          <div v-if="formType === 'area'">
            <label class="label">كود المنطقة (7 أرقام كحد أقصى) *</label>
            <input v-model="form.code" type="text" maxlength="7" class="input font-mono" placeholder="مثال: 3001234" required />
            <p class="text-[11px] text-gray-500 mt-1">أول رقم = كود المجموعة المختارة</p>
          </div>
          <div>
            <label class="label">الاسم *</label>
            <input v-model="form.name" type="text" class="input" :placeholder="`اسم ${formTitles[formType]}`" required />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showForm = false" class="btn-secondary flex-1">إلغاء</button>
          <button @click="handleSave" class="btn-primary flex-1">{{ isEdit ? 'حفظ' : 'إضافة' }}</button>
        </div>
      </div>
    </div>

    <ConfirmModal :show="showDelete" :title="`حذف ${formTitles[deleteType]}`" :message="deleteMessage" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHierarchyStore } from '@/stores/hierarchy'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const hierarchyStore = useHierarchyStore()

const activeTab = ref('sectors')
const showForm = ref(false)
const showDelete = ref(false)
const formType = ref('sector')
const deleteType = ref('sector')
const selectedItem = ref(null)
const isEdit = ref(false)
const filterSector = ref('')
const filterBranch = ref('')
const filterGroup = ref('')

const form = ref({ name: '', code: '', sectorId: '', branchId: '', groupId: '' })
const formTitles = { sector: 'قطاع', branch: 'فرع', group: 'مجموعة', area: 'منطقة' }
const deleteMessage = ref('')

const tabs = computed(() => [
  { key: 'sectors', label: 'القطاعات', icon: '🏢', count: hierarchyStore.sectors.length },
  { key: 'branches', label: 'الفروع', icon: '🏦', count: hierarchyStore.branches.length },
  { key: 'groups', label: 'المجموعات', icon: '👥', count: hierarchyStore.groups.length },
  { key: 'areas', label: 'المناطق', icon: '📍', count: hierarchyStore.areas.length }
])

const filteredBranches = computed(() => {
  if (!filterSector.value) return hierarchyStore.branches
  return hierarchyStore.branches.filter(b => b.sectorId === Number(filterSector.value))
})
const filteredGroups = computed(() => {
  if (!filterBranch.value) return hierarchyStore.groups
  return hierarchyStore.groups.filter(g => g.branchId === Number(filterBranch.value))
})
const filteredAreas = computed(() => {
  if (!filterGroup.value) return hierarchyStore.areas
  return hierarchyStore.areas.filter(a => a.groupId === Number(filterGroup.value))
})

const getGroupInfo = (groupId) => hierarchyStore.groups.find(g => g.id === groupId) || {}
const getBranchInfo = (branchId) => hierarchyStore.branches.find(b => b.id === branchId) || {}

onMounted(() => hierarchyStore.fetchAll())

const openAdd = (type) => {
  formType.value = type
  isEdit.value = false
  selectedItem.value = null
  form.value = { name: '', code: '', sectorId: '', branchId: '', groupId: '' }
  showForm.value = true
}

const openEdit = (type, item) => {
  formType.value = type
  isEdit.value = true
  selectedItem.value = item
  if (type === 'sector') form.value = { name: item.name }
  if (type === 'branch') form.value = { name: item.name, code: item.code, sectorId: item.sectorId }
  if (type === 'group') form.value = { name: item.name, code: item.code, branchId: item.branchId }
  if (type === 'area') form.value = { name: item.name, code: item.code, groupId: item.groupId }
  showForm.value = true
}

const confirmDelete = (type, item) => {
  deleteType.value = type
  selectedItem.value = item
  deleteMessage.value = `هل أنت متأكد من حذف ${formTitles[type]} "${item.name}"؟`
  showDelete.value = true
}

const handleSave = async () => {
  try {
    if (formType.value === 'sector') {
      if (!form.value.name.trim()) throw new Error('الاسم مطلوب')
      if (isEdit.value) await hierarchyStore.updateSector(selectedItem.value.id, form.value.name)
      else await hierarchyStore.addSector(form.value.name)
    } else if (formType.value === 'branch') {
      if (!form.value.sectorId) throw new Error('القطاع مطلوب')
      if (form.value.code === '') throw new Error('كود الفرع مطلوب')
      if (isEdit.value) await hierarchyStore.updateBranch(selectedItem.value.id, { name: form.value.name, sectorId: Number(form.value.sectorId), code: form.value.code.toString().padStart(2,'0') })
      else await hierarchyStore.addBranch({ sectorId: Number(form.value.sectorId), code: form.value.code, name: form.value.name })
    } else if (formType.value === 'group') {
      if (!form.value.branchId) throw new Error('الفرع مطلوب')
      if (!form.value.code) throw new Error('كود المجموعة مطلوب')
      if (isEdit.value) await hierarchyStore.updateGroup(selectedItem.value.id, { name: form.value.name, branchId: Number(form.value.branchId), code: Number(form.value.code) })
      else await hierarchyStore.addGroup({ branchId: Number(form.value.branchId), code: Number(form.value.code), name: form.value.name })
    } else if (formType.value === 'area') {
      if (!form.value.groupId) throw new Error('المجموعة مطلوبة')
      if (!form.value.code) throw new Error('كود المنطقة مطلوب')
      if (isEdit.value) await hierarchyStore.updateArea(selectedItem.value.id, { name: form.value.name, groupId: Number(form.value.groupId), code: form.value.code.toString() })
      else await hierarchyStore.addArea({ groupId: Number(form.value.groupId), code: form.value.code.toString(), name: form.value.name })
    }
    toast.success('تم الحفظ بنجاح')
    showForm.value = false
  } catch (e) {
    toast.error(e.message)
  }
}

const handleDelete = async () => {
  try {
    if (deleteType.value === 'sector') await hierarchyStore.deleteSector(selectedItem.value.id)
    if (deleteType.value === 'branch') await hierarchyStore.deleteBranch(selectedItem.value.id)
    if (deleteType.value === 'group') await hierarchyStore.deleteGroup(selectedItem.value.id)
    if (deleteType.value === 'area') await hierarchyStore.deleteArea(selectedItem.value.id)
    toast.success('تم الحذف')
    showDelete.value = false
  } catch (e) {
    toast.error(e.message)
  }
}
</script>
