<template>
  <div class="relative">
    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span class="text-gray-400">🔍</span></div>
    <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" type="text" :placeholder="placeholder" class="input pr-10" />
    <button v-if="modelValue" @click="$emit('update:modelValue', '')" class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600">✕</button>
  </div>
</template>
<script setup>
defineProps({ modelValue: String, placeholder: { type: String, default: 'بحث...' } })
defineEmits(['update:modelValue'])
</script>
