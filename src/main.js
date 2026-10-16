import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import { initDatabase } from '@/db'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// تهيئة قاعدة البيانات قبل تشغيل التطبيق
initDatabase().catch(err => {
  console.error('فشل تهيئة قاعدة البيانات:', err)
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'bottom-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  rtl: true,
  transition: 'Vue-Toastification__fade',
  maxToasts: 4,
  newestOnTop: true
})
app.mount('#app')
