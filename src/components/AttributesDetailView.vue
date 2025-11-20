<template>
  <div class="attributes-detail-view">
    <JsonViewer :data="attributes" :expand-depth="2" />
  </div>
</template>

<script>
import JsonViewer from './JsonViewer.vue'

export default {
  name: 'AttributesDetailView',
  components: {
    JsonViewer
  },
  props: {
    attributes: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.attributes-detail-view {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}
</style>
