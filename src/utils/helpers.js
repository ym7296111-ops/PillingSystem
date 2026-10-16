export const formatCurrency = (amount, currency = 'ج.م') => {
  if (amount == null) return `0 ${currency}`
  return `${Number(amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
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

export const getStatusLabel = (status, list) => {
  return list.find(s => s.value === status)?.label || status
}

export const getStatusColor = (status, list) => {
  return list.find(s => s.value === status)?.color || 'badge-gray'
}

export const calculateOverdue = (dueDate, status) => {
  if (status === 'paid') return false
  return new Date(dueDate) < new Date()
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

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

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validatePhone = (phone) => {
  return /^(01[0-2,5]{1}[0-9]{8})$/.test(phone.replace(/\s/g, ''))
}
