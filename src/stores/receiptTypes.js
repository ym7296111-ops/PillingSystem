import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, seedReceiptTypes } from '@/db'

export const useReceiptTypesStore = defineStore('receiptTypes', () => {
  const types = ref([])
  const loading = ref(false)

  const fetchTypes = async () => {
    loading.value = true
    try {
      await seedReceiptTypes()
      types.value = await db.receiptTypes.toArray()
    } finally { loading.value = false }
  }

  const activeTypes = () => types.value.filter(t => !t.isDisabled)

  const addType = async (name) => {
    if (!name.trim()) throw new Error('اسم التصنيف مطلوب')
    if (types.value.some(t => t.name === name.trim())) throw new Error('التصنيف موجود مسبقاً')
    const id = await db.receiptTypes.add({ name: name.trim(), isDisabled: false })
    await fetchTypes()
    return id
  }

  const updateType = async (id, name) => {
    await db.receiptTypes.update(id, { name })
    await fetchTypes()
  }

  const deleteType = async (id) => {
    const count = await db.receipts.where('typeId').equals(id).count()
    if (count === 0) {
      await db.receiptTypes.delete(id)
    } else {
      // Soft delete - disable
      await db.receiptTypes.update(id, { isDisabled: true })
    }
    await fetchTypes()
  }

  const enableType = async (id) => {
    await db.receiptTypes.update(id, { isDisabled: false })
    await fetchTypes()
  }

  const disableType = async (id) => {
    await db.receiptTypes.update(id, { isDisabled: true })
    await fetchTypes()
  }

  return { types, loading, fetchTypes, activeTypes, addType, updateType, deleteType, enableType, disableType }
})
