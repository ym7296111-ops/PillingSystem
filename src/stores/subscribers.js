import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateAccountNumber, calculateBalance } from '@/db'
import { validateAccountNumber, validateAreaCode } from '@/utils/helpers'

export const useSubscribersStore = defineStore('subscribers', () => {
  const subscribers = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const branchFilter = ref('')
  const groupFilter = ref('')
  const areaFilter = ref('')

  const filteredSubscribers = computed(() => {
    let result = [...subscribers.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(s => 
        s.accountNumber?.toString().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.idNumber?.toLowerCase().includes(q) ||
        s.subscriptionNumber?.toString().includes(q)
      )
    }
    if (areaFilter.value) {
      result = result.filter(s => s.areaCode === areaFilter.value)
    } else if (groupFilter.value) {
      // filter by group - area codes starting with group code
      result = result.filter(s => s.areaCode?.toString().startsWith(groupFilter.value.toString()))
    } else if (branchFilter.value) {
      result = result.filter(s => s.accountNumber?.toString().startsWith(branchFilter.value.toString().padStart(2,'0')))
    }
    return result.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber))
  })

  const fetchSubscribers = async () => {
    loading.value = true
    try {
      subscribers.value = await db.subscribers.toArray()
    } finally { loading.value = false }
  }

  const getSubscriber = async (accountNumber) => {
    return await db.subscribers.get(accountNumber.toString())
  }

  const addSubscriber = async (data) => {
    // Validate
    const accValidation = validateAccountNumber(data.accountNumber)
    if (!accValidation.valid) throw new Error(accValidation.error)
    
    const areaValidation = validateAreaCode(data.areaCode)
    if (!areaValidation.valid) throw new Error(areaValidation.error)

    // Check unique accountNumber
    const exists = await db.subscribers.get(data.accountNumber.toString())
    if (exists) throw new Error('رقم الحساب موجود مسبقاً')

    // Check subscriptionNumber unique within branch
    const branchCode = data.accountNumber.toString().substring(0,2)
    const allSubs = await db.subscribers.toArray()
    const duplicateSub = allSubs.find(s => 
      s.accountNumber.toString().startsWith(branchCode) && 
      s.subscriptionNumber.toString() === data.subscriptionNumber.toString()
    )
    if (duplicateSub) throw new Error(`رقم الاشتراك ${data.subscriptionNumber} موجود مسبقاً في الفرع ${branchCode}`)

    // Check area exists
    const areaExists = await db.areas.where('code').equals(data.areaCode.toString()).count()
    if (areaExists === 0) throw new Error(`كود المنطقة ${data.areaCode} غير موجود في الهيكلية`)

    await db.subscribers.add({
      accountNumber: data.accountNumber.toString(),
      subscriptionNumber: data.subscriptionNumber.toString(),
      areaCode: data.areaCode.toString(),
      name: data.name,
      idNumber: data.idNumber || '',
      phone: data.phone || '',
      openingBalance: Number(data.openingBalance) || 0
    })
    await fetchSubscribers()
  }

  const updateSubscriber = async (accountNumber, data) => {
    await db.subscribers.update(accountNumber.toString(), data)
    await fetchSubscribers()
  }

  const deleteSubscriber = async (accountNumber) => {
    await db.subscribers.delete(accountNumber.toString())
    await db.receipts.where('accountNumber').equals(accountNumber.toString()).delete()
    await db.discounts.where('accountNumber').equals(accountNumber.toString()).delete()
    await fetchSubscribers()
  }

  // Bulk import with validation
  const bulkImport = async (rows) => {
    const errors = []
    const validRows = []
    const existingAccountNumbers = new Set((await db.subscribers.toArray()).map(s => s.accountNumber))
    const branchSubMap = new Map() // branchCode -> Set of subscriptionNumbers
    const allSubs = await db.subscribers.toArray()
    allSubs.forEach(s => {
      const bc = s.accountNumber.toString().substring(0,2)
      if (!branchSubMap.has(bc)) branchSubMap.set(bc, new Set())
      branchSubMap.get(bc).add(s.subscriptionNumber.toString())
    })

    const areasList = await db.areas.toArray()
    const areaCodesSet = new Set(areasList.map(a => a.code))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel row number
      try {
        const accountNumber = (row.accountNumber || row['رقم الحساب'] || row['رقم الحساب (9 أرقام)'] || '').toString().trim()
        const subscriptionNumber = (row.subscriptionNumber || row['رقم الاشتراك'] || '').toString().trim()
        const areaCode = (row.areaCode || row['كود المنطقة'] || row['كود المنطقة (7 أرقام)'] || '').toString().trim()
        const name = (row.name || row['اسم المشترك'] || '').toString().trim()
        const openingBalance = row.openingBalance ?? row['الرصيد الافتتاحي'] ?? 0

        if (!accountNumber || !subscriptionNumber || !areaCode || !name) {
          errors.push({ row: rowNum, data: row, error: 'حقول إلزامية ناقصة (رقم الحساب، رقم الاشتراك، كود المنطقة، الاسم)' })
          continue
        }

        const accVal = validateAccountNumber(accountNumber)
        if (!accVal.valid) {
          errors.push({ row: rowNum, data: row, error: accVal.error })
          continue
        }

        const areaVal = validateAreaCode(areaCode)
        if (!areaVal.valid) {
          errors.push({ row: rowNum, data: row, error: areaVal.error })
          continue
        }

        if (!areaCodesSet.has(areaCode)) {
          errors.push({ row: rowNum, data: row, error: `كود المنطقة ${areaCode} غير موجود في الهيكلية` })
          continue
        }

        if (existingAccountNumbers.has(accountNumber)) {
          errors.push({ row: rowNum, data: row, error: `رقم الحساب ${accountNumber} موجود مسبقاً` })
          continue
        }

        // Check subscription uniqueness within branch
        const branchCode = accountNumber.substring(0,2)
        if (!branchSubMap.has(branchCode)) branchSubMap.set(branchCode, new Set())
        if (branchSubMap.get(branchCode).has(subscriptionNumber)) {
          errors.push({ row: rowNum, data: row, error: `رقم الاشتراك ${subscriptionNumber} مكرر في الفرع ${branchCode}` })
          continue
        }

        // Validate accountNumber formula: generate and compare?
        // We expect accountNumber = branchCode + zeros + subscriptionNumber
        try {
          const expected = generateAccountNumber(branchCode, subscriptionNumber)
          if (expected !== accountNumber) {
            errors.push({ row: rowNum, data: row, error: `رقم الحساب ${accountNumber} لا يطابق المعادلة. المتوقع: ${expected}` })
            continue
          }
        } catch (e) {
          errors.push({ row: rowNum, data: row, error: e.message })
          continue
        }

        validRows.push({
          accountNumber,
          subscriptionNumber,
          areaCode,
          name,
          idNumber: (row.idNumber || row['رقم الهوية/السجل'] || '').toString(),
          phone: (row.phone || row['رقم الهاتف'] || '').toString(),
          openingBalance: Number(openingBalance) || 0
        })
        existingAccountNumbers.add(accountNumber)
        branchSubMap.get(branchCode).add(subscriptionNumber)

      } catch (e) {
        errors.push({ row: rowNum, data: row, error: e.message })
      }
    }

    if (validRows.length > 0) {
      await db.subscribers.bulkAdd(validRows)
      await fetchSubscribers()
    }

    return { successCount: validRows.length, errors, total: rows.length }
  }

  return {
    subscribers, loading, searchQuery, branchFilter, groupFilter, areaFilter,
    filteredSubscribers,
    fetchSubscribers, getSubscriber, addSubscriber, updateSubscriber, deleteSubscriber, bulkImport
  }
})
