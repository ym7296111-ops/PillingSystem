import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, generateBillNumber, logActivity } from '@/db'

export const useBillsStore = defineStore('bills', () => {
  const bills = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const statusFilter = ref('')
  const dateFilter = ref('')

  const filteredBills = computed(() => {
    let result = [...bills.value]
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(b => 
        b.billNumber?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }
    
    if (statusFilter.value) {
      if (statusFilter.value === 'overdue') {
        result = result.filter(b => {
          return b.status !== 'paid' && new Date(b.dueDate) < new Date()
        })
      } else {
        result = result.filter(b => b.status === statusFilter.value)
      }
    }
    
    if (dateFilter.value) {
      result = result.filter(b => {
        const issueDate = new Date(b.issueDate).toISOString().split('T')[0]
        return issueDate === dateFilter.value
      })
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  const stats = computed(() => {
    const now = new Date()
    const total = bills.value.length
    const paid = bills.value.filter(b => b.status === 'paid').length
    const unpaid = bills.value.filter(b => b.status === 'unpaid').length
    const partial = bills.value.filter(b => b.status === 'partial').length
    const overdue = bills.value.filter(b => b.status !== 'paid' && new Date(b.dueDate) < now).length
    const totalAmount = bills.value.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0)
    const paidAmount = bills.value.filter(b => b.status === 'paid').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0)
    const unpaidAmount = totalAmount - paidAmount
    
    return { total, paid, unpaid, partial, overdue, totalAmount, paidAmount, unpaidAmount }
  })

  const fetchBills = async () => {
    loading.value = true
    try {
      bills.value = await db.bills.toArray()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const getBillsBySubscriber = (subscriberId) => {
    return bills.value.filter(b => b.subscriberId === Number(subscriberId))
  }

  const getBillById = async (id) => {
    try {
      return await db.bills.get(Number(id))
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const addBill = async (data) => {
    try {
      const billNumber = data.billNumber || await generateBillNumber()
      const amount = Number(data.amount) || 0
      const discount = Number(data.discount) || 0
      const tax = Number(data.tax) || 0
      const totalAmount = amount - discount + tax
      
      const newBill = {
        subscriberId: Number(data.subscriberId),
        billNumber,
        amount,
        discount,
        tax,
        totalAmount,
        issueDate: data.issueDate || new Date().toISOString(),
        dueDate: data.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        status: data.status || 'unpaid',
        description: data.description || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const id = await db.bills.add(newBill)
      await logActivity('bill_created', `تم إنشاء فاتورة ${billNumber} بقيمة ${totalAmount}`, id)
      await fetchBills()
      return id
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const updateBill = async (id, data) => {
    try {
      const amount = data.amount !== undefined ? Number(data.amount) : undefined
      const discount = data.discount !== undefined ? Number(data.discount) : undefined
      const tax = data.tax !== undefined ? Number(data.tax) : undefined
      
      let updateData = { ...data, updatedAt: new Date().toISOString() }
      
      if (amount !== undefined || discount !== undefined || tax !== undefined) {
        const existing = await db.bills.get(Number(id))
        const newAmount = amount !== undefined ? amount : existing.amount
        const newDiscount = discount !== undefined ? discount : existing.discount
        const newTax = tax !== undefined ? tax : existing.tax
        updateData.totalAmount = newAmount - newDiscount + newTax
      }
      
      await db.bills.update(Number(id), updateData)
      await logActivity('bill_updated', `تم تحديث الفاتورة ${data.billNumber || id}`, Number(id))
      await fetchBills()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const deleteBill = async (id) => {
    try {
      const bill = await db.bills.get(Number(id))
      await db.bills.delete(Number(id))
      await db.payments.where('billId').equals(Number(id)).delete()
      await logActivity('bill_deleted', `تم حذف الفاتورة ${bill?.billNumber}`, Number(id))
      await fetchBills()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const markAsPaid = async (id) => {
    await updateBill(id, { status: 'paid' })
  }

  return {
    bills,
    loading,
    searchQuery,
    statusFilter,
    dateFilter,
    filteredBills,
    stats,
    fetchBills,
    getBillsBySubscriber,
    getBillById,
    addBill,
    updateBill,
    deleteBill,
    markAsPaid
  }
})
