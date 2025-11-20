<template>
  <div class="optimized-sync-progress-view">
    <OptimizedSyncProgress />
  </div>
</template>

<script>
import OptimizedSyncProgress from '@/components/OptimizedSyncProgress.vue'

export default {
  name: 'OptimizedSyncProgressView',
  components: {
    OptimizedSyncProgress
  }
}
</script>

<style scoped>
.optimized-sync-progress-view {
  min-height: 100vh;
}
</style>
