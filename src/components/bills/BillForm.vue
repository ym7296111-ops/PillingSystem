<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">🧾</div>
          <div>
            <h3 class="font-bold">{{ isEdit ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة' }}</h3>
            <p class="text-xs text-gray-500">أدخل تفاصيل الفاتورة</p>
          </div>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <label class="label">المشترك *</label>
          <select v-model="form.subscriberId" class="input" required>
            <option value="">اختر المشترك</option>
            <option v-for="sub in subscribers" :key="sub.id" :value="sub.id">{{ sub.name }} - {{ sub.phone }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">المبلغ الأساسي *</label>
            <input v-model.number="form.amount" type="number" step="0.01" min="0" class="input" required />
          </div>
          <div>
            <label class="label">الخصم</label>
            <input v-model.number="form.discount" type="number" step="0.01" min="0" class="input" placeholder="0.00" />
          </div>
          <div>
            <label class="label">الضريبة ({{ taxRate }}%)</label>
            <input v-model.number="form.tax" type="number" step="0.01" min="0" class="input" placeholder="0.00" />
          </div>
          <div>
            <label class="label">الإجمالي</label>
            <div class="input bg-gray-50 font-bold text-primary-700">
              {{ totalAmount.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) }} {{ currency }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">تاريخ الإصدار</label>
            <input v-model="form.issueDate" type="date" class="input" />
          </div>
          <div>
            <label class="label">تاريخ الاستحقاق *</label>
            <input v-model="form.dueDate" type="date" class="input" required />
          </div>
        </div>

        <div>
          <label class="label">حالة الفاتورة</label>
          <select v-model="form.status" class="input">
            <option value="unpaid">غير مدفوعة</option>
            <option value="paid">مدفوعة</option>
            <option value="partial">مدفوعة جزئياً</option>
          </select>
        </div>

        <div>
          <label class="label">وصف الفاتورة</label>
          <input v-model="form.description" type="text" class="input" placeholder="فاتورة خدمات شهر..." />
        </div>

        <div>
          <label class="label">ملاحظات</label>
          <textarea v-model="form.notes" rows="2" class="input resize-none" placeholder="ملاحظات إضافية..."></textarea>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" @click="$emit('close')" class="btn-secondary flex-1">إلغاء</button>
          <button type="submit" :disabled="loading" class="btn-primary flex-1">
            {{ isEdit ? 'حفظ التعديلات' : 'إنشاء الفاتورة' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  bill: { type: Object, default: null },
  subscribers: { type: Array, default: () => [] },
  loading: Boolean,
  currency: { type: String, default: 'ج.م' },
  taxRate: { type: Number, default: 14 }
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.bill)

const form = ref({
  subscriberId: '',
  amount: 0,
  discount: 0,
  tax: 0,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
  status: 'unpaid',
  description: '',
  notes: ''
})

const totalAmount = computed(() => {
  const amt = Number(form.value.amount) || 0
  const disc = Number(form.value.discount) || 0
  const tax = Number(form.value.tax) || 0
  return amt - disc + tax
})

onMounted(() => {
  if (props.bill) {
    form.value = {
      subscriberId: props.bill.subscriberId,
      amount: props.bill.amount,
      discount: props.bill.discount || 0,
      tax: props.bill.tax || 0,
      issueDate: props.bill.issueDate ? props.bill.issueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: props.bill.dueDate ? props.bill.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      status: props.bill.status,
      description: props.bill.description || '',
      notes: props.bill.notes || ''
    }
  } else {
    // Auto calculate tax
    if (props.taxRate) {
      // tax will be calculated manually if needed
    }
  }
})

const handleSubmit = () => {
  emit('save', { ...form.value, totalAmount: totalAmount.value })
}
</script>
