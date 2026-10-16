<template>
  <div class="card p-6 hover:shadow-soft transition-all duration-300 group">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-500 mb-1">{{ title }}</p>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ value }}</h3>
        <div v-if="change" class="flex items-center gap-1 text-xs">
          <span :class="['px-2 py-0.5 rounded-full font-medium', changeType === 'positive' ? 'bg-emerald-100 text-emerald-700' : changeType === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600']">
            {{ change }}
          </span>
          <span class="text-gray-500">{{ changeLabel }}</span>
        </div>
        <p v-if="subtitle" class="text-xs text-gray-400 mt-1">{{ subtitle }}</p>
      </div>
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300', iconBg]">
        {{ icon }}
      </div>
    </div>
    <div v-if="progress !== null" class="mt-4">
      <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div :class="['h-full rounded-full transition-all duration-500', progressColor]" :style="{ width: progress + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  subtitle: String,
  icon: String,
  iconBg: { type: String, default: 'bg-primary-100' },
  change: String,
  changeLabel: String,
  changeType: { type: String, default: 'neutral' },
  progress: { type: Number, default: null },
  progressColor: { type: String, default: 'bg-primary-600' }
})
</script>
