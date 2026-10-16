<template>
  <div class="flex items-center justify-between mt-6">
    <div class="text-sm text-gray-600">عرض <span class="font-semibold">{{ startItem }}</span> إلى <span class="font-semibold">{{ endItem }}</span> من أصل <span class="font-semibold">{{ total }}</span></div>
    <div class="flex gap-1">
      <button @click="$emit('update:page', currentPage - 1)" :disabled="currentPage <= 1" class="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50">السابق</button>
      <template v-for="p in visiblePages" :key="p">
        <button v-if="p !== '...'" @click="$emit('update:page', p)" :class="['px-3 py-2 rounded-lg text-sm border', currentPage === p ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 hover:bg-gray-50']">{{ p }}</button>
        <span v-else class="px-2 py-2 text-gray-400">...</span>
      </template>
      <button @click="$emit('update:page', currentPage + 1)" :disabled="currentPage >= totalPages" class="px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50">التالي</button>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ currentPage: { type: Number, default: 1 }, total: { type: Number, default: 0 }, perPage: { type: Number, default: 10 } })
defineEmits(['update:page'])
const totalPages = computed(() => Math.ceil(props.total / props.perPage) || 1)
const startItem = computed(() => (props.currentPage - 1) * props.perPage + 1)
const endItem = computed(() => Math.min(props.currentPage * props.perPage, props.total))
const visiblePages = computed(() => {
  const pages = []; const total = totalPages.value; const current = props.currentPage
  if (total <= 7) { for (let i=1;i<=total;i++) pages.push(i) }
  else { pages.push(1); if (current>3) pages.push('...'); for (let i=Math.max(2,current-1); i<=Math.min(total-1,current+1); i++) pages.push(i); if (current<total-2) pages.push('...'); pages.push(total) }
  return pages
})
</script>
