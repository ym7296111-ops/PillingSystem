<template>
  <div class="text-center py-12">
    <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-3xl">{{ icon }}</div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
    <p class="text-gray-500 text-sm max-w-sm mx-auto mb-6">{{ description }}</p>
    <slot />
  </div>
</template>
<script setup>
defineProps({ icon: { type: String, default: '📭' }, title: { type: String, default: 'لا توجد بيانات' }, description: { type: String, default: 'لم يتم العثور على أي بيانات للعرض' } })
</script>
