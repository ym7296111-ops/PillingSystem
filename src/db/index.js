import Dexie from 'dexie'

export const db = new Dexie('SubscriberAccountsDB')

db.version(1).stores({
  sectors: '++id, name',
  branches: '++id, sectorId, code, name',
  groups: '++id, branchId, code, name',
  areas: '++id, groupId, code, name',
  subscribers: 'accountNumber, subscriptionNumber, areaCode, name, idNumber, phone, openingBalance',
  receiptTypes: '++id, name, isDisabled',
  receipts: '++id, accountNumber, receiptNumber, date, typeId, amount, fiscalYear',
  discounts: '++id, accountNumber, areaCode, subscriptionNumber, discountAmount, remainingAmount, invoiceTotal, fiscalMonth, importBatch',
  settings: 'key'
})

// ========== Business Logic Functions ==========

/**
 * توليد رقم الحساب - 9 أرقام بالضبط
 * [كود الفرع رقمين] + [أصفار فاصلة] + [رقم الاشتراك] = 9 أرقام
 */
export function generateAccountNumber(branchCode, subscriptionNumber) {
  const branchStr = branchCode.toString().padStart(2, '0')
  const subStr = subscriptionNumber.toString()
  const zerosNeeded = 9 - 2 - subStr.length
  if (zerosNeeded < 0) throw new Error('رقم الاشتراك طويل جداً - يجب أن لا يتجاوز 7 أرقام')
  if (zerosNeeded < 0) throw new Error('رقم الاشتراك طويل جداً')
  return branchStr + '0'.repeat(zerosNeeded) + subStr
}

/**
 * التحقق من صحة كود المنطقة - 7 أرقام
 * الرقم الأول = كود المجموعة (1-8)
 * باقي الأرقام 6 أرقام = رقم المنطقة داخل المجموعة
 */
export function validateAreaCode(areaCode) {
  const codeStr = areaCode.toString()
  if (codeStr.length > 7) return { valid: false, error: 'كود المنطقة يجب أن لا يتجاوز 7 أرقام' }
  if (codeStr.length < 2) return { valid: false, error: 'كود المنطقة قصير جداً' }
  const groupCode = parseInt(codeStr.charAt(0))
  if (groupCode < 1 || groupCode > 8) return { valid: false, error: 'الرقم الأول يجب أن يكون من 1 إلى 8 (كود المجموعة)' }
  return { valid: true, groupCode }
}

export function generateAreaCode(groupCode, areaNumber) {
  if (groupCode < 1 || groupCode > 8) throw new Error('كود المجموعة يجب أن يكون من 1 إلى 8')
  const areaNumStr = areaNumber.toString().padStart(6, '0')
  if (areaNumStr.length > 6) throw new Error('رقم المنطقة داخل المجموعة يجب أن لا يتجاوز 6 أرقام')
  return groupCode.toString() + areaNumStr
}

/**
 * السنة المالية: 1 يوليو إلى 30 يونيو
 */
export function getCurrentFiscalYear(date = new Date()) {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  if (month >= 7) {
    return {
      start: `${year}-07-01`,
      end: `${year + 1}-06-30`,
      label: `${year}/${year + 1}`,
      startYear: year,
      endYear: year + 1
    }
  }
  return {
    start: `${year - 1}-07-01`,
    end: `${year}-06-30`,
    label: `${year - 1}/${year}`,
    startYear: year - 1,
    endYear: year
  }
}

export function getFiscalYearForDate(dateStr) {
  const date = new Date(dateStr)
  return getCurrentFiscalYear(date)
}

export function getFiscalMonths() {
  const months = []
  const monthNames = ['يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
  const monthNumbers = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
  monthNames.forEach((name, idx) => {
    months.push({ name, number: monthNumbers[idx], label: name })
  })
  return months
}

/**
 * حساب الرصيد: افتتاحي + إيصالات - خصومات
 */
export async function calculateBalance(accountNumber, fiscalYearLabel = null) {
  const subscriber = await db.subscribers.get(accountNumber)
  if (!subscriber) return 0

  const fy = fiscalYearLabel || getCurrentFiscalYear().label

  const receipts = await db.receipts.where('accountNumber').equals(accountNumber).toArray()
  const filteredReceipts = fiscalYearLabel ? receipts.filter(r => r.fiscalYear === fy) : receipts

  const discounts = await db.discounts.where('accountNumber').equals(accountNumber).toArray()
  // For balance, we consider all discounts in fiscal year? Or all? Use same FY filter if needed
  // Simplified: all discounts for account

  const opening = Number(subscriber.openingBalance) || 0
  const totalReceipts = filteredReceipts.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalDiscounts = discounts.reduce((sum, d) => sum + Number(d.discountAmount), 0)

  return opening + totalReceipts - totalDiscounts
}

export async function calculateBalanceDetailed(accountNumber) {
  const subscriber = await db.subscribers.get(accountNumber)
  if (!subscriber) return null

  const fy = getCurrentFiscalYear()

  const receipts = await db.receipts.where('accountNumber').equals(accountNumber).toArray()
  const discounts = await db.discounts.where('accountNumber').equals(accountNumber).toArray()

  const opening = Number(subscriber.openingBalance) || 0
  const totalReceipts = receipts.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalDiscounts = discounts.reduce((sum, d) => sum + Number(d.discountAmount), 0)
  const current = opening + totalReceipts - totalDiscounts

  return {
    openingBalance: opening,
    totalReceipts,
    totalDiscounts,
    currentBalance: current,
    receipts,
    discounts,
    fiscalYear: fy
  }
}

export const seedDefaultSettings = async () => {
  const existing = await db.settings.toArray()
  if (existing.length === 0) {
    await db.settings.bulkPut([
      { key: 'sectorName', value: 'قطاع الخدمات العامة' },
      { key: 'managementName', value: 'الإدارة العامة لحسابات المشتركين' },
      { key: 'logo', value: '' },
      { key: 'currency', value: 'ج.م' },
      { key: 'companyName', value: 'نظام الإدارة العامة لحسابات المشتركين - إدارة الإيصالات والخصومات' },
      { key: 'companyNameEn', value: 'Subscriber Accounts Management System' }
    ])
  }
}

export const seedReceiptTypes = async () => {
  const count = await db.receiptTypes.count()
  if (count === 0) {
    await db.receiptTypes.bulkAdd([
      { name: 'استهلاك مياه', isDisabled: false },
      { name: 'صرف صحي', isDisabled: false },
      { name: 'رسوم إدارية', isDisabled: false },
      { name: 'متأخرات', isDisabled: false },
      { name: 'غرامات', isDisabled: false }
    ])
  }
}
