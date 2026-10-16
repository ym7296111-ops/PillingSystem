import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, getCurrentFiscalYear } from '@/db'

export const useReceiptsStore = defineStore('receipts', () => {
  const receipts = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const typeFilter = ref('')
  const branchFilter = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')

  const filteredReceipts = computed(() => {
    let result = [...receipts.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(r => 
        r.accountNumber?.includes(q) ||
        r.receiptNumber?.toLowerCase().includes(q)
      )
    }
    if (typeFilter.value) {
      result = result.filter(r => r.typeId === Number(typeFilter.value))
    }
    if (branchFilter.value) {
      result = result.filter(r => r.accountNumber.startsWith(branchFilter.value))
    }
    if (dateFrom.value) {
      result = result.filter(r => new Date(r.date) >= new Date(dateFrom.value))
    }
    if (dateTo.value) {
      result = result.filter(r => new Date(r.date) <= new Date(dateTo.value))
    }
    return result.sort((a,b) => new Date(b.date) - new Date(a.date))
  })

  const fetchReceipts = async () => {
    loading.value = true
    try {
      receipts.value = await db.receipts.toArray()
    } finally { loading.value = false }
  }

  const addReceipt = async (data) => {
    const fy = getCurrentFiscalYear(new Date(data.date))
    const id = await db.receipts.add({
      accountNumber: data.accountNumber.toString(),
      receiptNumber: data.receiptNumber || null,
      date: data.date,
      typeId: Number(data.typeId),
      amount: Number(data.amount),
      fiscalYear: fy.label
    })
    await fetchReceipts()
    return id
  }

  const addBulkReceipts = async (accountNumber, rows) => {
    // rows: [{date, typeId, amount, receiptNumber}]
    const toAdd = rows.map(r => {
      const fy = getCurrentFiscalYear(new Date(r.date))
      return {
        accountNumber: accountNumber.toString(),
        receiptNumber: r.receiptNumber || null,
        date: r.date,
        typeId: Number(r.typeId),
        amount: Number(r.amount),
        fiscalYear: fy.label
      }
    })
    await db.receipts.bulkAdd(toAdd)
    await fetchReceipts()
  }

  const updateReceipt = async (id, data) => {
    const fy = data.date ? getCurrentFiscalYear(new Date(data.date)).label : undefined
    const updateData = { ...data }
    if (fy) updateData.fiscalYear = fy
    if (updateData.amount) updateData.amount = Number(updateData.amount)
    if (updateData.typeId) updateData.typeId = Number(updateData.typeId)
    await db.receipts.update(id, updateData)
    await fetchReceipts()
  }

  const deleteReceipt = async (id) => {
    await db.receipts.delete(id)
    await fetchReceipts()
  }

  const getReceiptsByAccount = (accountNumber) => {
    return receipts.value.filter(r => r.accountNumber === accountNumber.toString())
  }

  return {
    receipts, loading, searchQuery, typeFilter, branchFilter, dateFrom, dateTo,
    filteredReceipts,
    fetchReceipts, addReceipt, addBulkReceipts, updateReceipt, deleteReceipt, getReceiptsByAccount
  }
})
