<template>
  <AppLayout>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useSettingsStore } from '@/stores/settings'
const settingsStore = useSettingsStore()
onMounted(async () => { await settingsStore.fetchSettings() })
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
