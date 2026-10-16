<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('close')"></div>
    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
      <div class="p-6">
        <div class="flex items-center gap-4 mb-4">
          <div :class="['w-12 h-12 rounded-full flex items-center justify-center', iconBg]"><span class="text-2xl">{{ icon }}</span></div>
          <div><h3 class="text-lg font-bold text-gray-900">{{ title }}</h3><p class="text-sm text-gray-500 mt-1">{{ message }}</p></div>
        </div>
        <div v-if="$slots.default" class="mt-4 p-3 bg-gray-50 rounded-xl text-sm"><slot /></div>
        <div class="flex gap-3 mt-6 justify-end">
          <button @click="$emit('close')" class="btn-secondary flex-1">إلغاء</button>
          <button @click="$emit('confirm')" :class="[confirmClass, 'flex-1']">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'تأكيد العملية' },
  message: { type: String, default: 'هل أنت متأكد؟' },
  icon: { type: String, default: '⚠️' },
  iconBg: { type: String, default: 'bg-amber-100' },
  confirmText: { type: String, default: 'تأكيد' },
  confirmClass: { type: String, default: 'btn-danger' }
})
defineEmits(['close','confirm'])
</script>
