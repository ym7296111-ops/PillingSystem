import Dexie from 'dexie'

export const db = new Dexie('SubscriberManagementDB')

db.version(1).stores({
  subscribers: '++id, name, phone, email, nationalId, status, subscriptionType, area, joinDate, createdAt',
  bills: '++id, subscriberId, billNumber, status, issueDate, dueDate, totalAmount, createdAt',
  payments: '++id, billId, subscriberId, paymentDate, method, amount, createdAt',
  settings: 'key',
  activities: '++id, type, relatedId, createdAt'
})

// Seed default settings
export const seedDefaultSettings = async () => {
  const existing = await db.settings.toArray()
  if (existing.length === 0) {
    await db.settings.bulkPut([
      { key: 'companyName', value: 'شركة الخدمات العامة' },
      { key: 'companyAddress', value: 'الجيزة، مصر' },
      { key: 'companyPhone', value: '01000000000' },
      { key: 'companyEmail', value: 'info@company.com' },
      { key: 'currency', value: 'ج.م' },
      { key: 'taxRate', value: 14 },
      { key: 'invoicePrefix', value: 'INV-' },
      { key: 'theme', value: 'light' }
    ])
  }
}

// Helpers
export const generateBillNumber = async () => {
  const settings = await db.settings.get('invoicePrefix')
  const prefix = settings?.value || 'INV-'
  const count = await db.bills.count()
  const year = new Date().getFullYear()
  return `${prefix}${year}-${String(count + 1).padStart(5, '0')}`
}

export const logActivity = async (type, description, relatedId = null) => {
  await db.activities.add({
    type,
    description,
    relatedId,
    createdAt: new Date().toISOString()
  })
}
