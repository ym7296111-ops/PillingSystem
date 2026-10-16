import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, logActivity } from '@/db'

export const usePaymentsStore = defineStore('payments', () => {
  const payments = ref([])
  const loading = ref(false)
  const searchQuery = ref('')

  const filteredPayments = computed(() => {
    let result = [...payments.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p => 
        p.reference?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
  })

  const stats = computed(() => {
    const total = payments.value.length
    const totalAmount = payments.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const thisMonth = payments.value.filter(p => {
      const d = new Date(p.paymentDate)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const thisMonthAmount = thisMonth.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    
    return { total, totalAmount, thisMonthCount: thisMonth.length, thisMonthAmount }
  })

  const fetchPayments = async () => {
    loading.value = true
    try {
      payments.value = await db.payments.toArray()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const getPaymentsByBill = (billId) => {
    return payments.value.filter(p => p.billId === Number(billId))
  }

  const getPaymentsBySubscriber = (subscriberId) => {
    return payments.value.filter(p => p.subscriberId === Number(subscriberId))
  }

  const addPayment = async (data) => {
    try {
      const newPayment = {
        billId: Number(data.billId),
        subscriberId: Number(data.subscriberId),
        amount: Number(data.amount),
        paymentDate: data.paymentDate || new Date().toISOString(),
        method: data.method || 'cash',
        reference: data.reference || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString()
      }
      
      const id = await db.payments.add(newPayment)
      
      // Update bill status
      const bill = await db.bills.get(Number(data.billId))
      if (bill) {
        const billPayments = await db.payments.where('billId').equals(Number(data.billId)).toArray()
        const totalPaid = billPayments.reduce((sum, p) => sum + Number(p.amount), 0)
        
        let newStatus = 'unpaid'
        if (totalPaid >= bill.totalAmount) {
          newStatus = 'paid'
        } else if (totalPaid > 0) {
          newStatus = 'partial'
        }
        
        await db.bills.update(Number(data.billId), { status: newStatus })
      }
      
      await logActivity('payment_created', `تم تسجيل دفعة ${data.amount} للفاتورة ${data.billId}`, id)
      await fetchPayments()
      return id
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const deletePayment = async (id) => {
    try {
      const payment = await db.payments.get(Number(id))
      await db.payments.delete(Number(id))
      
      // Recalculate bill status
      if (payment) {
        const billPayments = await db.payments.where('billId').equals(payment.billId).toArray()
        const bill = await db.bills.get(payment.billId)
        if (bill) {
          const totalPaid = billPayments.reduce((sum, p) => sum + Number(p.amount), 0)
          let newStatus = 'unpaid'
          if (totalPaid >= bill.totalAmount) newStatus = 'paid'
          else if (totalPaid > 0) newStatus = 'partial'
          await db.bills.update(payment.billId, { status: newStatus })
        }
      }
      
      await logActivity('payment_deleted', `تم حذف دفعة ${id}`, Number(id))
      await fetchPayments()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return {
    payments,
    loading,
    searchQuery,
    filteredPayments,
    stats,
    fetchPayments,
    getPaymentsByBill,
    getPaymentsBySubscriber,
    addPayment,
    deletePayment
  }
})
