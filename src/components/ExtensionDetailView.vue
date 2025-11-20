<template>
  <div class="extension-detail-view">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="类型">{{ extension.type }}</el-descriptions-item>
      <el-descriptions-item label="版本">{{ extension.version }}</el-descriptions-item>
      <el-descriptions-item v-if="extension.schema?.href" label="Schema" :span="2">
        <el-link :href="extension.schema.href" target="_blank" type="primary">
          {{ extension.schema.href }}
        </el-link>
      </el-descriptions-item>
    </el-descriptions>
    
    <div v-if="extension.data" class="extension-data">
      <h5>扩展数据</h5>
      <JsonViewer :data="extension.data" :expand-depth="1" />
    </div>
  </div>
</template>

<script>
import JsonViewer from './JsonViewer.vue'

export default {
  name: 'ExtensionDetailView',
  components: {
    JsonViewer
  },
  props: {
    extension: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.extension-detail-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.extension-data h5 {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}
</style>
