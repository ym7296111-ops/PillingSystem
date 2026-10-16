import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, logActivity } from '@/db'

export const useSubscribersStore = defineStore('subscribers', () => {
  const subscribers = ref([])
  const loading = ref(false)
  const searchQuery = ref('')
  const statusFilter = ref('')
  const typeFilter = ref('')
  const areaFilter = ref('')

  const filteredSubscribers = computed(() => {
    let result = [...subscribers.value]
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(s => 
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.nationalId?.includes(q) ||
        s.address?.toLowerCase().includes(q)
      )
    }
    
    if (statusFilter.value) {
      result = result.filter(s => s.status === statusFilter.value)
    }
    
    if (typeFilter.value) {
      result = result.filter(s => s.subscriptionType === typeFilter.value)
    }
    
    if (areaFilter.value) {
      result = result.filter(s => s.area === areaFilter.value)
    }
    
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  const stats = computed(() => {
    return {
      total: subscribers.value.length,
      active: subscribers.value.filter(s => s.status === 'active').length,
      inactive: subscribers.value.filter(s => s.status === 'inactive').length,
      suspended: subscribers.value.filter(s => s.status === 'suspended').length,
      pending: subscribers.value.filter(s => s.status === 'pending').length
    }
  })

  const fetchSubscribers = async () => {
    loading.value = true
    try {
      subscribers.value = await db.subscribers.toArray()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const getSubscriberById = async (id) => {
    try {
      return await db.subscribers.get(Number(id))
    } catch (e) {
      console.error(e)
      return null
    }
  }

  const addSubscriber = async (data) => {
    try {
      const newSub = {
        ...data,
        joinDate: data.joinDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const id = await db.subscribers.add(newSub)
      await logActivity('subscriber_created', `تم إضافة مشترك جديد: ${data.name}`, id)
      await fetchSubscribers()
      return id
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const updateSubscriber = async (id, data) => {
    try {
      await db.subscribers.update(Number(id), {
        ...data,
        updatedAt: new Date().toISOString()
      })
      await logActivity('subscriber_updated', `تم تحديث بيانات المشترك: ${data.name}`, Number(id))
      await fetchSubscribers()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const deleteSubscriber = async (id) => {
    try {
      const sub = await db.subscribers.get(Number(id))
      await db.subscribers.delete(Number(id))
      // Also delete related bills and payments
      await db.bills.where('subscriberId').equals(Number(id)).delete()
      await db.payments.where('subscriberId').equals(Number(id)).delete()
      await logActivity('subscriber_deleted', `تم حذف المشترك: ${sub?.name}`, Number(id))
      await fetchSubscribers()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const bulkAddSubscribers = async (list) => {
    try {
      const toAdd = list.map(item => ({
        name: item.name || item['الاسم'] || '',
        phone: item.phone || item['الهاتف'] || item['رقم الهاتف'] || '',
        email: item.email || item['البريد'] || '',
        nationalId: item.nationalId || item['الرقم القومي'] || '',
        address: item.address || item['العنوان'] || '',
        area: item.area || item['المنطقة'] || 'الجيزة',
        subscriptionType: item.subscriptionType || item['نوع الاشتراك'] || 'residential',
        status: item.status || item['الحالة'] || 'active',
        joinDate: item.joinDate || new Date().toISOString(),
        notes: item.notes || item['ملاحظات'] || '',
        balance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })).filter(s => s.name && s.phone)
      
      if (toAdd.length > 0) {
        await db.subscribers.bulkAdd(toAdd)
        await logActivity('bulk_import', `تم استيراد ${toAdd.length} مشترك`)
        await fetchSubscribers()
      }
      return toAdd.length
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  return {
    subscribers,
    loading,
    searchQuery,
    statusFilter,
    typeFilter,
    areaFilter,
    filteredSubscribers,
    stats,
    fetchSubscribers,
    getSubscriberById,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    bulkAddSubscribers
  }
})
