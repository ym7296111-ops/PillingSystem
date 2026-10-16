<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="font-bold text-gray-900">الإيرادات الشهرية</h3>
        <p class="text-sm text-gray-500">تحليل الإيرادات خلال آخر 6 أشهر</p>
      </div>
      <div class="flex gap-2">
        <span class="flex items-center gap-2 text-xs"><span class="w-3 h-3 bg-primary-600 rounded-full"></span> محصلة</span>
        <span class="flex items-center gap-2 text-xs"><span class="w-3 h-3 bg-amber-400 rounded-full"></span> مستحقة</span>
      </div>
    </div>
    <div class="h-72">
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  data: { type: Object, default: () => ({}) }
})

const chartRef = ref(null)
let chartInstance = null

const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()

  const months = props.data.months || ['يناير','فبراير','مارس','أبريل','مايو','يونيو']
  const paid = props.data.paid || [12000, 19000, 15000, 25000, 22000, 30000]
  const unpaid = props.data.unpaid || [5000, 4000, 6000, 3000, 5000, 2000]

  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'محصلة',
          data: paid,
          backgroundColor: '#2563eb',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 22
        },
        {
          label: 'مستحقة',
          data: unpaid,
          backgroundColor: '#fbbf24',
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 22
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Cairo' } }
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: { font: { family: 'Cairo' } },
          beginAtZero: true
        }
      }
    }
  })
}

onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>
