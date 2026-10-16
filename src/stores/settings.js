import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, seedDefaultSettings } from '@/db'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref({})
  const loading = ref(false)

  const fetchSettings = async () => {
    loading.value = true
    try {
      await seedDefaultSettings()
      const all = await db.settings.toArray()
      const obj = {}
      all.forEach(s => obj[s.key] = s.value)
      settings.value = obj
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  const updateSetting = async (key, value) => {
    try {
      await db.settings.put({ key, value })
      settings.value[key] = value
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const updateSettings = async (newSettings) => {
    try {
      const promises = Object.entries(newSettings).map(([k, v]) => db.settings.put({ key: k, value: v }))
      await Promise.all(promises)
      settings.value = { ...settings.value, ...newSettings }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const exportDatabase = async () => {
    const data = {
      subscribers: await db.subscribers.toArray(),
      bills: await db.bills.toArray(),
      payments: await db.payments.toArray(),
      settings: await db.settings.toArray(),
      activities: await db.activities.toArray(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
    return data
  }

  const importDatabase = async (data) => {
    try {
      if (data.subscribers) await db.subscribers.bulkPut(data.subscribers)
      if (data.bills) await db.bills.bulkPut(data.bills)
      if (data.payments) await db.payments.bulkPut(data.payments)
      if (data.settings) await db.settings.bulkPut(data.settings)
      if (data.activities) await db.activities.bulkPut(data.activities)
      await fetchSettings()
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const clearDatabase = async () => {
    await db.subscribers.clear()
    await db.bills.clear()
    await db.payments.clear()
    await db.activities.clear()
    await seedDefaultSettings()
    await fetchSettings()
  }

  return {
    settings,
    loading,
    fetchSettings,
    updateSetting,
    updateSettings,
    exportDatabase,
    importDatabase,
    clearDatabase
  }
})
