import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useHierarchyStore = defineStore('hierarchy', () => {
  const sectors = ref([])
  const branches = ref([])
  const groups = ref([])
  const areas = ref([])
  const loading = ref(false)

  const fetchAll = async () => {
    loading.value = true
    try {
      sectors.value = await db.sectors.toArray()
      branches.value = await db.branches.toArray()
      groups.value = await db.groups.toArray()
      areas.value = await db.areas.toArray()
    } finally { loading.value = false }
  }

  // Sectors
  const addSector = async (name) => {
    const id = await db.sectors.add({ name })
    await fetchAll()
    return id
  }
  const updateSector = async (id, name) => {
    await db.sectors.update(id, { name })
    await fetchAll()
  }
  const deleteSector = async (id) => {
    // Check if branches exist
    const hasBranches = branches.value.some(b => b.sectorId === id)
    if (hasBranches) throw new Error('لا يمكن حذف القطاع لوجود فروع مرتبطة به')
    await db.sectors.delete(id)
    await fetchAll()
  }

  // Branches - code 2 digits 00-99
  const addBranch = async (data) => {
    const code = parseInt(data.code)
    if (isNaN(code) || code < 0 || code > 99) throw new Error('كود الفرع يجب أن يكون من 00 إلى 99')
    // Check unique code
    const exists = branches.value.find(b => b.code === code.toString().padStart(2, '0'))
    if (exists) throw new Error('كود الفرع موجود مسبقاً')
    const id = await db.branches.add({
      sectorId: data.sectorId,
      code: code.toString().padStart(2, '0'),
      name: data.name
    })
    await fetchAll()
    return id
  }
  const updateBranch = async (id, data) => {
    await db.branches.update(id, data)
    await fetchAll()
  }
  const deleteBranch = async (id) => {
    const hasGroups = groups.value.some(g => g.branchId === id)
    if (hasGroups) throw new Error('لا يمكن حذف الفرع لوجود مجموعات مرتبطة به')
    const hasSubscribers = await db.subscribers.filter(s => s.accountNumber.toString().startsWith(branches.value.find(b => b.id === id)?.code || '')).count()
    // Actually check via accountNumber logic: branch code is first 2 digits
    // We should prevent if any subscriber's accountNumber starts with branch code
    const branch = branches.value.find(b => b.id === id)
    if (branch) {
      const count = await db.subscribers.where('accountNumber').startsWith(branch.code).count()
      // Dexie startsWith not work on string primary key? Use filter
      // For simplicity, filter in JS
      const allSubs = await db.subscribers.toArray()
      const hasSubs = allSubs.some(s => s.accountNumber.toString().startsWith(branch.code))
      if (hasSubs) throw new Error('لا يمكن حذف الفرع لوجود مشتركين مرتبطين به')
    }
    await db.branches.delete(id)
    await fetchAll()
  }

  // Groups - code 1-8 max per branch
  const addGroup = async (data) => {
    const code = parseInt(data.code)
    if (isNaN(code) || code < 1 || code > 8) throw new Error('كود المجموعة يجب أن يكون من 1 إلى 8')
    const existingGroups = groups.value.filter(g => g.branchId === data.branchId)
    if (existingGroups.length >= 8) throw new Error('الحد الأقصى للمجموعات في الفرع هو 8')
    if (existingGroups.some(g => g.code === code)) throw new Error('كود المجموعة موجود مسبقاً في هذا الفرع')
    const id = await db.groups.add({ branchId: data.branchId, code, name: data.name })
    await fetchAll()
    return id
  }
  const updateGroup = async (id, data) => {
    await db.groups.update(id, data)
    await fetchAll()
  }
  const deleteGroup = async (id) => {
    const hasAreas = areas.value.some(a => a.groupId === id)
    if (hasAreas) throw new Error('لا يمكن حذف المجموعة لوجود مناطق مرتبطة بها')
    await db.groups.delete(id)
    await fetchAll()
  }

  // Areas - code 7 digits max, first digit = group code
  const addArea = async (data) => {
    const codeStr = data.code.toString()
    if (codeStr.length > 7) throw new Error('كود المنطقة يجب أن لا يتجاوز 7 أرقام')
    const group = groups.value.find(g => g.id === data.groupId)
    if (!group) throw new Error('المجموعة غير موجودة')
    const firstDigit = parseInt(codeStr.charAt(0))
    if (firstDigit !== group.code) throw new Error(`الرقم الأول يجب أن يساوي كود المجموعة (${group.code})`)
    if (areas.value.some(a => a.code === codeStr)) throw new Error('كود المنطقة موجود مسبقاً')
    const id = await db.areas.add({ groupId: data.groupId, code: codeStr, name: data.name })
    await fetchAll()
    return id
  }
  const updateArea = async (id, data) => {
    await db.areas.update(id, data)
    await fetchAll()
  }
  const deleteArea = async (id) => {
    const area = areas.value.find(a => a.id === id)
    if (area) {
      const hasSubs = await db.subscribers.where('areaCode').equals(area.code).count()
      if (hasSubs > 0) throw new Error('لا يمكن حذف المنطقة لوجود مشتركين مرتبطين بها')
    }
    await db.areas.delete(id)
    await fetchAll()
  }

  // Computed helpers
  const branchesBySector = (sectorId) => branches.value.filter(b => b.sectorId === sectorId)
  const groupsByBranch = (branchId) => groups.value.filter(g => g.branchId === branchId)
  const areasByGroup = (groupId) => areas.value.filter(a => a.groupId === groupId)
  
  const getHierarchyPath = (areaCode) => {
    const area = areas.value.find(a => a.code === areaCode)
    if (!area) return null
    const group = groups.value.find(g => g.id === area.groupId)
    const branch = groups.value.length && group ? branches.value.find(b => b.id === group.branchId) : null
    const sector = branch ? sectors.value.find(s => s.id === branch.sectorId) : null
    return { sector, branch, group, area }
  }

  return {
    sectors, branches, groups, areas, loading,
    fetchAll,
    addSector, updateSector, deleteSector,
    addBranch, updateBranch, deleteBranch,
    addGroup, updateGroup, deleteGroup,
    addArea, updateArea, deleteArea,
    branchesBySector, groupsByBranch, areasByGroup,
    getHierarchyPath
  }
})
