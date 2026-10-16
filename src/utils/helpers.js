import { generateAccountNumber, getCurrentFiscalYear } from '@/db'

export const formatCurrency = (amount, currency = 'ج.م') => {
  if (amount == null) return `0 ${currency}`
  return `${Number(amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export const formatNumber = (num) => {
  if (num == null) return '0'
  return Number(num).toLocaleString('ar-EG')
}

export const formatDate = (dateString, withTime = false) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('ar-EG', options)
}

export const formatDateShort = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ar-EG')
}

export const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Re-export business logic
export { generateAccountNumber, getCurrentFiscalYear }

export const validateAccountNumber = (accountNumber) => {
  const str = accountNumber?.toString() || ''
  if (str.length !== 9) return { valid: false, error: 'رقم الحساب يجب أن يكون 9 أرقام بالضبط' }
  if (!/^\d{9}$/.test(str)) return { valid: false, error: 'رقم الحساب يجب أن يحتوي على أرقام فقط' }
  return { valid: true, branchCode: str.substring(0, 2), subscriptionPart: str.substring(2) }
}

export const validateAreaCode = (areaCode) => {
  const str = areaCode?.toString() || ''
  if (str.length > 7) return { valid: false, error: 'كود المنطقة يجب أن لا يتجاوز 7 أرقام' }
  if (str.length < 1) return { valid: false, error: 'كود المنطقة مطلوب' }
  const groupCode = parseInt(str.charAt(0))
  if (isNaN(groupCode) || groupCode < 1 || groupCode > 8) return { valid: false, error: 'الرقم الأول يجب أن يكون من 1 إلى 8 (كود المجموعة)' }
  return { valid: true, groupCode }
}

export const getBalanceStatus = (balance) => {
  if (balance > 0) return 'positive' // عليه
  if (balance < 0) return 'negative' // له
  return 'zero'
}

export const getBalanceStatusLabel = (balance) => {
  if (balance > 0) return 'عليه'
  if (balance < 0) return 'له'
  return 'صفر'
}

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const exportToCSV = (data, filename) => {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
