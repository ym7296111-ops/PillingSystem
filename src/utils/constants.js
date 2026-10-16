export const SUBSCRIPTION_TYPES = [
  { value: 'residential', label: 'سكني', color: 'bg-blue-100 text-blue-800' },
  { value: 'commercial', label: 'تجاري', color: 'bg-purple-100 text-purple-800' },
  { value: 'industrial', label: 'صناعي', color: 'bg-orange-100 text-orange-800' },
  { value: 'government', label: 'حكومي', color: 'bg-emerald-100 text-emerald-800' }
]

export const SUBSCRIBER_STATUS = [
  { value: 'active', label: 'نشط', color: 'badge-success' },
  { value: 'inactive', label: 'غير نشط', color: 'badge-gray' },
  { value: 'suspended', label: 'موقوف', color: 'badge-danger' },
  { value: 'pending', label: 'قيد الانتظار', color: 'badge-warning' }
]

export const BILL_STATUS = [
  { value: 'paid', label: 'مدفوعة', color: 'badge-success' },
  { value: 'unpaid', label: 'غير مدفوعة', color: 'badge-danger' },
  { value: 'partial', label: 'مدفوعة جزئياً', color: 'badge-warning' },
  { value: 'overdue', label: 'متأخرة', color: 'bg-red-100 text-red-800 border border-red-200' }
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي', icon: '💵' },
  { value: 'bank', label: 'تحويل بنكي', icon: '🏦' },
  { value: 'wallet', label: 'محفظة إلكترونية', icon: '📱' },
  { value: 'card', label: 'بطاقة', icon: '💳' },
  { value: 'check', label: 'شيك', icon: '📝' }
]

export const AREAS = [
  'الجيزة', 'القاهرة', 'الإسكندرية', 'الدقي', 'المهندسين', 'الهرم', 'فيصل', 'أكتوبر', 'الشيخ زايد', 'المعادي', 'مدينة نصر', 'حلوان'
]

export const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]
