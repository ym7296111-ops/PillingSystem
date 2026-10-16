<template>
  <div class="space-y-6 animate-fadeIn">
    <div class="flex items-center gap-4">
      <router-link to="/subscribers" class="w-10 h-10 rounded-xl bg-white border flex items-center justify-center hover:bg-gray-50">←</router-link>
      <h1 class="text-xl font-bold">تفاصيل المشترك</h1>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto"></div>
    </div>

    <div v-else-if="!subscriber" class="card p-12 text-center">
      <p class="text-gray-500">المشترك غير موجود</p>
      <router-link to="/subscribers" class="btn-primary mt-4 inline-flex">العودة للقائمة</router-link>
    </div>

    <template v-else>
      <!-- Profile Card -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-6 lg:col-span-1">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white flex items-center justify-center text-2xl font-bold mb-4">
              {{ subscriber.name.charAt(0) }}
            </div>
            <h2 class="text-xl font-bold">{{ subscriber.name }}</h2>
            <p class="text-sm text-gray-500">{{ subscriber.phone }}</p>
            <span :class="['badge mt-3', statusColor]">{{ statusLabel }}</span>
          </div>

          <div class="mt-8 space-y-4 text-sm">
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">البريد</span>
              <span class="font-medium">{{ subscriber.email || '-' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">الرقم القومي</span>
              <span class="font-medium">{{ subscriber.nationalId || '-' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">المنطقة</span>
              <span class="font-medium">{{ subscriber.area }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">النوع</span>
              <span class="font-medium">{{ typeLabel }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-50">
              <span class="text-gray-500">الانضمام</span>
              <span class="font-medium">{{ formatDateShort(subscriber.joinDate) }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-gray-500">العنوان</span>
              <span class="font-medium text-right max-w-[150px]">{{ subscriber.address || '-' }}</span>
            </div>
          </div>

          <div v-if="subscriber.notes" class="mt-6 p-3 bg-amber-50 rounded-xl text-sm">
            <p class="font-medium text-amber-800 mb-1">ملاحظات:</p>
            <p class="text-amber-700">{{ subscriber.notes }}</p>
          </div>

          <div class="mt-6 flex gap-2">
            <button @click="showEdit = true" class="btn-secondary flex-1 text-sm">✏️ تعديل</button>
            <button @click="showDelete = true" class="btn-danger flex-1 text-sm">🗑️ حذف</button>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <!-- Financial Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="card p-5">
              <p class="text-xs text-gray-500">إجمالي الفواتير</p>
              <p class="text-xl font-bold mt-1">{{ subscriberBills.length }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ formatCurrency(totalBilled) }}</p>
            </div>
            <div class="card p-5 border-emerald-100">
              <p class="text-xs text-emerald-600">إجمالي المدفوع</p>
              <p class="text-xl font-bold text-emerald-700 mt-1">{{ formatCurrency(totalPaid) }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ subscriberPayments.length }} عملية</p>
            </div>
            <div class="card p-5" :class="balance > 0 ? 'border-red-100 bg-red-50/30' : 'border-gray-100'">
              <p class="text-xs" :class="balance > 0 ? 'text-red-600' : 'text-gray-500'">الرصيد المستحق</p>
              <p class="text-xl font-bold mt-1" :class="balance > 0 ? 'text-red-700' : 'text-gray-900'">{{ formatCurrency(balance) }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ balance > 0 ? 'مستحق الدفع' : 'لا يوجد مستحقات' }}</p>
            </div>
          </div>

          <!-- Bills -->
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold">الفواتير ({{ subscriberBills.length }})</h3>
              <button @click="showBillForm = true" class="btn-primary text-xs">➕ فاتورة جديدة</button>
            </div>

            <div v-if="subscriberBills.length === 0" class="text-center py-8 text-gray-400 text-sm">لا توجد فواتير لهذا المشترك</div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th class="px-3 py-2 text-right">الرقم</th>
                    <th class="px-3 py-2 text-right">المبلغ</th>
                    <th class="px-3 py-2 text-right">التاريخ</th>
                    <th class="px-3 py-2 text-right">الحالة</th>
                    <th class="px-3 py-2 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="bill in subscriberBills" :key="bill.id" class="hover:bg-gray-50">
                    <td class="px-3 py-2 font-mono font-bold">{{ bill.billNumber }}</td>
                    <td class="px-3 py-2 font-bold">{{ formatCurrency(bill.totalAmount) }}</td>
                    <td class="px-3 py-2">{{ formatDateShort(bill.issueDate) }}</td>
                    <td class="px-3 py-2"><span :class="['badge text-[10px]', billStatusColor(bill)]">{{ billStatusLabel(bill) }}</span></td>
                    <td class="px-3 py-2 text-center">
                      <button v-if="bill.status !== 'paid'" @click="openPay(bill)" class="text-xs bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100">دفع</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payments -->
          <div class="card p-6">
            <h3 class="font-bold mb-4">سجل المدفوعات ({{ subscriberPayments.length }})</h3>
            <div v-if="subscriberPayments.length === 0" class="text-center py-8 text-gray-400 text-sm">لا توجد مدفوعات</div>
            <div v-else class="space-y-2">
              <div v-for="pay in subscriberPayments" :key="pay.id" class="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm">{{ methodIcon(pay.method) }}</div>
                  <div>
                    <p class="font-bold text-sm">{{ formatCurrency(pay.amount) }}</p>
                    <p class="text-xs text-gray-500">{{ formatDateShort(pay.paymentDate) }} • {{ getMethodLabel(pay.method) }}</p>
                  </div>
                </div>
                <div class="text-left">
                  <p class="text-xs font-mono">{{ pay.reference || '-' }}</p>
                  <p class="text-xs text-gray-400">فاتورة {{ billsStore.bills.find(b => b.id === pay.billId)?.billNumber || pay.billId }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <SubscriberForm v-if="showEdit" :subscriber="subscriber" :loading="saving" @close="showEdit = false" @save="handleUpdate" />
      <BillForm v-if="showBillForm" :subscribers="[subscriber]" :currency="settingsStore.settings.currency" :tax-rate="Number(settingsStore.settings.taxRate)" @close="showBillForm = false" @save="handleAddBill" />
      <ConfirmModal :show="showDelete" title="حذف المشترك" :message="`هل أنت متأكد من حذف ${subscriber.name}؟ سيتم حذف جميع بياناته.`" icon="🗑️" icon-bg="bg-red-100" confirm-text="حذف نهائي" confirm-class="btn-danger" @close="showDelete = false" @confirm="handleDelete" />

      <!-- Pay Modal -->
      <div v-if="showPay" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPay = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
          <h3 class="font-bold text-lg mb-4">تسجيل دفعة</h3>
          <div class="space-y-4">
            <div>
              <label class="label">المبلغ *</label>
              <input v-model.number="payForm.amount" type="number" class="input" />
            </div>
            <div>
              <label class="label">الطريقة</label>
              <select v-model="payForm.method" class="input">
                <option v-for="m in paymentMethods" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="showPay = false" class="btn-secondary flex-1">إلغاء</button>
            <button @click="handlePay" class="btn-success flex-1">تأكيد</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubscribersStore } from '@/stores/subscribers'
import { useBillsStore } from '@/stores/bills'
import { usePaymentsStore } from '@/stores/payments'
import { useSettingsStore } from '@/stores/settings'
import { SUBSCRIBER_STATUS, SUBSCRIPTION_TYPES, BILL_STATUS, PAYMENT_METHODS } from '@/utils/constants'
import { formatCurrency, formatDateShort } from '@/utils/helpers'
import SubscriberForm from '@/components/subscribers/SubscriberForm.vue'
import BillForm from '@/components/bills/BillForm.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const route = useRoute()
const router = useRouter()

const subscribersStore = useSubscribersStore()
const billsStore = useBillsStore()
const paymentsStore = usePaymentsStore()
const settingsStore = useSettingsStore()

const loading = ref(true)
const subscriber = ref(null)
const saving = ref(false)
const showEdit = ref(false)
const showDelete = ref(false)
const showBillForm = ref(false)
const showPay = ref(false)
const selectedBill = ref(null)

const paymentMethods = PAYMENT_METHODS

const payForm = ref({ amount: 0, method: 'cash' })

onMounted(async () => {
  await Promise.all([
    subscribersStore.fetchSubscribers(),
    billsStore.fetchBills(),
    paymentsStore.fetchPayments(),
    settingsStore.fetchSettings()
  ])
  subscriber.value = await subscribersStore.getSubscriberById(route.params.id)
  loading.value = false
})

const statusLabel = computed(() => SUBSCRIBER_STATUS.find(s => s.value === subscriber.value?.status)?.label || '')
const statusColor = computed(() => SUBSCRIBER_STATUS.find(s => s.value === subscriber.value?.status)?.color || 'badge-gray')
const typeLabel = computed(() => SUBSCRIPTION_TYPES.find(t => t.value === subscriber.value?.subscriptionType)?.label || '')

const subscriberBills = computed(() => billsStore.bills.filter(b => b.subscriberId === Number(route.params.id)).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)))
const subscriberPayments = computed(() => paymentsStore.payments.filter(p => p.subscriberId === Number(route.params.id)).sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)))

const totalBilled = computed(() => subscriberBills.value.reduce((s, b) => s + Number(b.totalAmount), 0))
const totalPaid = computed(() => subscriberPayments.value.reduce((s, p) => s + Number(p.amount), 0))
const balance = computed(() => totalBilled.value - totalPaid.value)

const billStatusLabel = (bill) => {
  if (bill.status !== 'paid' && new Date(bill.dueDate) < new Date()) return 'متأخرة'
  return BILL_STATUS.find(s => s.value === bill.status)?.label || bill.status
}
const billStatusColor = (bill) => {
  if (bill.status !== 'paid' && new Date(bill.dueDate) < new Date()) return 'bg-red-100 text-red-800'
  return BILL_STATUS.find(s => s.value === bill.status)?.color || 'badge-gray'
}
const getMethodLabel = (v) => PAYMENT_METHODS.find(m => m.value === v)?.label || v
const methodIcon = (v) => PAYMENT_METHODS.find(m => m.value === v)?.icon || '💳'

const handleUpdate = async (data) => {
  saving.value = true
  try {
    await subscribersStore.updateSubscriber(subscriber.value.id, data)
    subscriber.value = await subscribersStore.getSubscriberById(route.params.id)
    showEdit.value = false
    toast.success('تم التحديث')
  } catch {
    toast.error('فشل التحديث')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  try {
    await subscribersStore.deleteSubscriber(subscriber.value.id)
    toast.success('تم الحذف')
    router.push('/subscribers')
  } catch {
    toast.error('فشل الحذف')
  }
}

const handleAddBill = async (data) => {
  try {
    data.subscriberId = subscriber.value.id
    await billsStore.addBill(data)
    toast.success('تم إنشاء الفاتورة')
    showBillForm.value = false
  } catch {
    toast.error('فشل إنشاء الفاتورة')
  }
}

const openPay = (bill) => {
  selectedBill.value = bill
  const paid = paymentsStore.getPaymentsByBill(bill.id).reduce((s, p) => s + Number(p.amount), 0)
  payForm.value.amount = bill.totalAmount - paid
  showPay.value = true
}

const handlePay = async () => {
  try {
    await paymentsStore.addPayment({
      billId: selectedBill.value.id,
      subscriberId: subscriber.value.id,
      amount: payForm.value.amount,
      method: payForm.value.method,
      paymentDate: new Date().toISOString()
    })
    await billsStore.fetchBills()
    toast.success('تم تسجيل الدفعة')
    showPay.value = false
  } catch {
    toast.error('فشل تسجيل الدفعة')
  }
}
</script>
