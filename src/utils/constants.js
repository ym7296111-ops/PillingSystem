export const BALANCE_STATUS = [
  { value: 'positive', label: 'عليه (مدين)', color: 'badge-danger' },
  { value: 'negative', label: 'له (دائن)', color: 'badge-success' },
  { value: 'zero', label: 'صفر', color: 'badge-gray' }
]

export const RECEIPT_TYPES_DEFAULT = [
  'استهلاك مياه',
  'صرف صحي',
  'رسوم إدارية',
  'متأخرات',
  'غرامات',
  'رسوم توصيل',
  'صيانة'
]

export const MONTHS_FISCAL = [
  { number: 7, name: 'يوليو', label: 'يوليو' },
  { number: 8, name: 'أغسطس', label: 'أغسطس' },
  { number: 9, name: 'سبتمبر', label: 'سبتمبر' },
  { number: 10, name: 'أكتوبر', label: 'أكتوبر' },
  { number: 11, name: 'نوفمبر', label: 'نوفمبر' },
  { number: 12, name: 'ديسمبر', label: 'ديسمبر' },
  { number: 1, name: 'يناير', label: 'يناير' },
  { number: 2, name: 'فبراير', label: 'فبراير' },
  { number: 3, name: 'مارس', label: 'مارس' },
  { number: 4, name: 'أبريل', label: 'أبريل' },
  { number: 5, name: 'مايو', label: 'مايو' },
  { number: 6, name: 'يونيو', label: 'يونيو' }
]

export const DISCOUNT_EXCEL_COLUMNS = [
  { key: 'seq', label: 'م', required: true },
  { key: 'areaCode', label: 'المنطقة', required: true },
  { key: 'accountNumber', label: 'رقم الحساب', required: true },
  { key: 'subscriptionNumber', label: 'رقم الاشتراك', required: true },
  { key: 'discountAmount', label: 'الخصم', required: true },
  { key: 'remainingAmount', label: 'المتبقي من الخصم', required: true },
  { key: 'invoiceTotal', label: 'إجمالي الفاتورة', required: true }
]

export const SUBSCRIBER_EXCEL_COLUMNS = [
  { key: 'accountNumber', label: 'رقم الحساب (9 أرقام)', required: true },
  { key: 'subscriptionNumber', label: 'رقم الاشتراك', required: true },
  { key: 'areaCode', label: 'كود المنطقة (7 أرقام)', required: true },
  { key: 'name', label: 'اسم المشترك', required: true },
  { key: 'idNumber', label: 'رقم الهوية/السجل', required: false },
  { key: 'phone', label: 'رقم الهاتف', required: false },
  { key: 'openingBalance', label: 'الرصيد الافتتاحي', required: true }
]
