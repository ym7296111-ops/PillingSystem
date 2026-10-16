<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-collapsed="isCollapsed" :mobile-open="mobileOpen" @toggle-collapse="isCollapsed = !isCollapsed" @close-mobile="mobileOpen = false" />
    
    <div :class="['transition-all duration-300', isCollapsed ? 'lg:mr-20' : 'lg:mr-72']">
      <Header @toggle-mobile="mobileOpen = !mobileOpen" />
      <main class="p-4 md:p-6 lg:p-8">
        <slot />
      </main>
      
      <footer class="px-8 py-6 text-center text-sm text-gray-400 border-t border-gray-100 mt-8">
        <p>© {{ new Date().getFullYear() }} نظام الإدارة العامة لحسابات المشتركين - الإصدار 1.0.0 | يعمل بدون إنترنت - جميع البيانات محلية</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const isCollapsed = ref(false)
const mobileOpen = ref(false)
</script>
