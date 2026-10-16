<template>
  <div class="card p-6">
    <div class="flex items-center justify-between mb-6">
      <div><h3 class="font-bold text-gray-900">الإيصالات الشهرية - السنة المالية</h3><p class="text-sm text-gray-500">من يوليو إلى يونيو</p></div>
      <div class="flex gap-2"><span class="flex items-center gap-2 text-xs"><span class="w-3 h-3 bg-primary-600 rounded-full"></span> إيصالات</span><span class="flex items-center gap-2 text-xs"><span class="w-3 h-3 bg-amber-400 rounded-full"></span> خصومات</span></div>
    </div>
    <div class="h-72"><canvas ref="chartRef"></canvas></div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
const props = defineProps({ data: { type: Object, default: () => ({}) } })
const chartRef = ref(null)
let chartInstance = null
const renderChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  const months = props.data.months || ['يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل','مايو','يونيو']
  const receipts = props.data.receipts || [12000, 19000, 15000, 25000, 22000, 30000, 18000, 20000, 23000, 17000, 21000, 26000]
  const discounts = props.data.discounts || [5000, 4000, 6000, 3000, 5000, 2000, 3500, 4000, 3000, 2500, 4500, 3000]
  chartInstance = new Chart(chartRef.value, {
    type: 'bar',
    data: { labels: months, datasets: [{ label: 'إيصالات', data: receipts, backgroundColor: '#2563eb', borderRadius: 8, borderSkipped: false, barThickness: 18 }, { label: 'خصومات', data: discounts, backgroundColor: '#fbbf24', borderRadius: 8, borderSkipped: false, barThickness: 18 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { rtl: true, backgroundColor: '#1f2937', titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' }, padding: 12, cornerRadius: 12 } }, scales: { x: { grid: { display: false }, ticks: { font: { family: 'Cairo' } } }, y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Cairo' } }, beginAtZero: true } } }
  })
}
onMounted(renderChart)
watch(() => props.data, renderChart, { deep: true })
</script>
