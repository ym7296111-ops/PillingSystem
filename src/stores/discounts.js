import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/db'

export const useDiscountsStore = defineStore('discounts', () => {
  const discounts = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const groupFilter = ref('')
  const batchFilter = ref('')

  const filteredDiscounts = computed(() => {
    let result = [...discounts.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(d => 
        d.accountNumber?.includes(q) ||
        d.areaCode?.includes(q) ||
        d.subscriptionNumber?.includes(q)
      )
    }
    if (groupFilter.value) {
      result = result.filter(d => d.areaCode?.toString().startsWith(groupFilter.value.toString()))
    }
    if (batchFilter.value) {
      result = result.filter(d => d.importBatch === batchFilter.value)
    }
    return result.sort((a,b) => b.id - a.id)
  })

  const batches = computed(() => {
    const map = new Map()
    discounts.value.forEach(d => {
      if (!map.has(d.importBatch)) map.set(d.importBatch, { batch: d.importBatch, count: 0, total: 0, month: d.fiscalMonth })
      const entry = map.get(d.importBatch)
      entry.count++
      entry.total += Number(d.discountAmount)
    })
    return Array.from(map.values()).sort((a,b) => b.batch.localeCompare(a.batch))
  })

  const fetchDiscounts = async () => {
    loading.value = true
    try {
      discounts.value = await db.discounts.toArray()
    } finally { loading.value = false }
  }

  // Smart import with field mapping
  const importDiscounts = async (rows, mapping, options) => {
    // mapping: {seq, areaCode, accountNumber, subscriptionNumber, discountAmount, remainingAmount, invoiceTotal}
    // options: {groupCode, fiscalMonth, importBatch}
    const errors = []
    const valid = []

    const allSubscribers = await db.subscribers.toArray()
    const subMap = new Map(allSubscribers.map(s => [s.accountNumber, s]))
    const areas = await db.areas.toArray()
    const areaSet = new Set(areas.map(a => a.code))

    const groupCode = options.groupCode?.toString()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = options.headerRow ? i + options.headerRow + 1 : i + 2
      try {
        // Skip if marked to ignore
        if (options.ignoredRows?.includes(i)) continue

        const getVal = (field) => {
          const col = mapping[field]
          if (col == null || col === '') return ''
          return row[col] ?? row[Object.keys(row)[col]] ?? ''
        }

        const areaCode = getVal('areaCode')?.toString().trim()
        const accountNumber = getVal('accountNumber')?.toString().trim()
        const subscriptionNumber = getVal('subscriptionNumber')?.toString().trim()
        const discountAmount = Number(getVal('discountAmount')) || 0
        const remainingAmount = Number(getVal('remainingAmount')) || 0
        const invoiceTotal = Number(getVal('invoiceTotal')) || 0

        if (!accountNumber || !areaCode) {
          errors.push({ row: rowNum, error: 'رقم الحساب وكود المنطقة مطلوبان', data: row })
          continue
        }

        if (!subMap.has(accountNumber)) {
          errors.push({ row: rowNum, error: `رقم الحساب ${accountNumber} غير موجود في النظام`, data: row })
          continue
        }

        if (groupCode && !areaCode.startsWith(groupCode)) {
          errors.push({ row: rowNum, error: `كود المنطقة ${areaCode} لا ينتمي للمجموعة ${groupCode}`, data: row })
          continue
        }

        if (!areaSet.has(areaCode)) {
          // Allow but warn? For now error
          errors.push({ row: rowNum, error: `كود المنطقة ${areaCode} غير موجود في الهيكلية`, data: row })
          continue
        }

        // Check subscriber area matches?
        const sub = subMap.get(accountNumber)
        if (sub.areaCode !== areaCode) {
          errors.push({ row: rowNum, error: `كود المنطقة في الملف (${areaCode}) لا يطابق كود المشترك في النظام (${sub.areaCode})`, data: row })
          continue
        }

        valid.push({
          accountNumber,
          areaCode,
          subscriptionNumber: subscriptionNumber || sub.subscriptionNumber,
          discountAmount,
          remainingAmount,
          invoiceTotal,
          fiscalMonth: options.fiscalMonth,
          importBatch: options.importBatch
        })

      } catch (e) {
        errors.push({ row: rowNum, error: e.message, data: row })
      }
    }

    if (valid.length > 0) {
      await db.discounts.bulkAdd(valid)
      await fetchDiscounts()
    }

    return { successCount: valid.length, errors, total: rows.length }
  }

  const deleteDiscount = async (id) => {
    await db.discounts.delete(id)
    await fetchDiscounts()
  }

  const deleteBatch = async (batchId) => {
    await db.discounts.where('importBatch').equals(batchId).delete()
    await fetchDiscounts()
  }

  const getDiscountsByAccount = (accountNumber) => {
    return discounts.value.filter(d => d.accountNumber === accountNumber.toString())
  }

  return {
    discounts, loading, searchQuery, groupFilter, batchFilter,
    filteredDiscounts, batches,
    fetchDiscounts, importDiscounts, deleteDiscount, deleteBatch, getDiscountsByAccount
  }
})
