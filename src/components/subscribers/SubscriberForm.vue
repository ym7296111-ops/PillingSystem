<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn flex flex-col">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">👤</div>
          <div>
            <h3 class="font-bold text-gray-900">{{ isEdit ? 'تعديل بيانات المشترك' : 'إضافة مشترك جديد' }}</h3>
            <p class="text-xs text-gray-500">جميع الحقول المميزة بـ * مطلوبة</p>
          </div>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">الاسم الكامل *</label>
            <input v-model="form.name" type="text" class="input" placeholder="أدخل الاسم الكامل" required />
          </div>

          <div>
            <label class="label">رقم الهاتف *</label>
            <input v-model="form.phone" type="tel" class="input" placeholder="01xxxxxxxxx" required />
            <p v-if="form.phone && !isValidPhone" class="text-xs text-red-500 mt-1">رقم الهاتف غير صحيح</p>
          </div>

          <div>
            <label class="label">البريد الإلكتروني</label>
            <input v-model="form.email" type="email" class="input" placeholder="example@mail.com" />
          </div>

          <div>
            <label class="label">الرقم القومي</label>
            <input v-model="form.nationalId" type="text" class="input" placeholder="14 رقم" maxlength="14" />
          </div>

          <div>
            <label class="label">المنطقة *</label>
            <select v-model="form.area" class="input" required>
              <option value="">اختر المنطقة</option>
              <option v-for="area in areas" :key="area" :value="area">{{ area }}</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="label">العنوان التفصيلي</label>
            <input v-model="form.address" type="text" class="input" placeholder="الشارع، الحي، علامة مميزة..." />
          </div>

          <div>
            <label class="label">نوع الاشتراك *</label>
            <select v-model="form.subscriptionType" class="input" required>
              <option v-for="type in subscriptionTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
          </div>

          <div>
            <label class="label">حالة المشترك *</label>
            <select v-model="form.status" class="input" required>
              <option v-for="st in subscriberStatus" :key="st.value" :value="st.value">{{ st.label }}</option>
            </select>
          </div>

          <div>
            <label class="label">تاريخ الانضمام</label>
            <input v-model="form.joinDate" type="date" class="input" />
          </div>

          <div>
            <label class="label">الرصيد الافتتاحي</label>
            <input v-model.number="form.balance" type="number" step="0.01" class="input" placeholder="0.00" />
          </div>

          <div class="md:col-span-2">
            <label class="label">ملاحظات</label>
            <textarea v-model="form.notes" rows="3" class="input resize-none" placeholder="أي ملاحظات إضافية..."></textarea>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" @click="$emit('close')" class="btn-secondary flex-1">إلغاء</button>
          <button type="submit" :disabled="loading || !isValidPhone" class="btn-primary flex-1">
            <span v-if="loading" class="animate-spin mr-2">⏳</span>
            {{ isEdit ? 'حفظ التعديلات' : 'إضافة المشترك' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { SUBSCRIPTION_TYPES, SUBSCRIBER_STATUS, AREAS } from '@/utils/constants'
import { validatePhone } from '@/utils/helpers'

const props = defineProps({
  subscriber: { type: Object, default: null },
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.subscriber)
const subscriptionTypes = SUBSCRIPTION_TYPES
const subscriberStatus = SUBSCRIBER_STATUS
const areas = AREAS

const form = ref({
  name: '',
  phone: '',
  email: '',
  nationalId: '',
  area: 'الجيزة',
  address: '',
  subscriptionType: 'residential',
  status: 'active',
  joinDate: new Date().toISOString().split('T')[0],
  balance: 0,
  notes: ''
})

const isValidPhone = computed(() => {
  if (!form.value.phone) return true
  return validatePhone(form.value.phone)
})

onMounted(() => {
  if (props.subscriber) {
    form.value = {
      name: props.subscriber.name || '',
      phone: props.subscriber.phone || '',
      email: props.subscriber.email || '',
      nationalId: props.subscriber.nationalId || '',
      area: props.subscriber.area || 'الجيزة',
      address: props.subscriber.address || '',
      subscriptionType: props.subscriber.subscriptionType || 'residential',
      status: props.subscriber.status || 'active',
      joinDate: props.subscriber.joinDate ? props.subscriber.joinDate.split('T')[0] : new Date().toISOString().split('T')[0],
      balance: props.subscriber.balance || 0,
      notes: props.subscriber.notes || ''
    }
  }
})

const handleSubmit = () => {
  emit('save', { ...form.value })
}
</script>
