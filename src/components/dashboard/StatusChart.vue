<template>
  <div class="card p-6">
    <h3 class="font-bold text-gray-900 mb-1">{{ title }}</h3>
    <p class="text-sm text-gray-500 mb-6">{{ subtitle }}</p>
    <div class="h-64 flex items-center justify-center">
      <canvas ref="chartRef"></canvas>
    </div>
    <div class="mt-6 space-y-2">
      <div v-for="item in legend" :key="item.label" class="flex items-center justify-between text-sm">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" :style="{ background: item.color }"></span>
          <span class="text-gray-600">{{ item.label }}</span>
        </div>
        <span class="font-bold">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  title: { type: String, default: 'توزيع الحالات' },
  subtitle: { type: String, default: '' },
  labels: { type: Array, default: () => [] },
  values: { type: Array, default: () => [] },
  colors: { type: Array, default: () => ['#10b981','#ef4444','#f59e0b','#6b7280'] },
  legend: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(chartRef.value, {
    type: 'doughnut',
    data: {
      labels: props.labels,
      datasets: [{
        data: props.values,
        backgroundColor: props.colors,
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          backgroundColor: '#1f2937',
          titleFont: { family: 'Cairo' },
          bodyFont: { family: 'Cairo' },
          padding: 12,
          cornerRadius: 12
        }
      }
    }
  })
}

onMounted(renderChart)
watch(() => [props.labels, props.values], renderChart, { deep: true })
</script>
