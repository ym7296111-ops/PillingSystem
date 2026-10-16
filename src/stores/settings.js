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
    } finally { loading.value = false }
  }

  const updateSetting = async (key, value) => {
    await db.settings.put({ key, value })
    settings.value[key] = value
  }

  const updateSettings = async (newSettings) => {
    const puts = Object.entries(newSettings).map(([k,v]) => db.settings.put({ key: k, value: v }))
    await Promise.all(puts)
    settings.value = { ...settings.value, ...newSettings }
  }

  const exportDatabase = async () => {
    return {
      sectors: await db.sectors.toArray(),
      branches: await db.branches.toArray(),
      groups: await db.groups.toArray(),
      areas: await db.areas.toArray(),
      subscribers: await db.subscribers.toArray(),
      receiptTypes: await db.receiptTypes.toArray(),
      receipts: await db.receipts.toArray(),
      discounts: await db.discounts.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  const importDatabase = async (data) => {
    if (data.sectors) await db.sectors.bulkPut(data.sectors)
    if (data.branches) await db.branches.bulkPut(data.branches)
    if (data.groups) await db.groups.bulkPut(data.groups)
    if (data.areas) await db.areas.bulkPut(data.areas)
    if (data.subscribers) await db.subscribers.bulkPut(data.subscribers)
    if (data.receiptTypes) await db.receiptTypes.bulkPut(data.receiptTypes)
    if (data.receipts) await db.receipts.bulkPut(data.receipts)
    if (data.discounts) await db.discounts.bulkPut(data.discounts)
    if (data.settings) await db.settings.bulkPut(data.settings)
    await fetchSettings()
  }

  const clearDatabase = async () => {
    await db.sectors.clear()
    await db.branches.clear()
    await db.groups.clear()
    await db.areas.clear()
    await db.subscribers.clear()
    await db.receiptTypes.clear()
    await db.receipts.clear()
    await db.discounts.clear()
    await db.settings.clear()
    await seedDefaultSettings()
    await fetchSettings()
  }

  return { settings, loading, fetchSettings, updateSetting, updateSettings, exportDatabase, importDatabase, clearDatabase }
})
