<template>
  <div class="file-versions-view">
    <el-table :data="versions" border stripe>
      <el-table-column prop="attributes.versionNumber" label="Version" width="80" />
      <el-table-column prop="attributes.name" label="File Name" min-width="200" />
      <el-table-column prop="attributes.createUserName" label="Creator" width="120" />
      <el-table-column label="Created Time" width="160">
        <template #default="scope">
          {{ formatDateTime(scope.row.attributes.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="File Size" width="100">
        <template #default="scope">
          {{ formatFileSize(scope.row.attributes.storageSize) }}
        </template>
      </el-table-column>
      <el-table-column label="Status" width="120">
        <template #default="scope">
          <el-tag 
            :type="getProcessingStatusType(scope.row.attributes.extension?.data?.processState)"
            size="small"
          >
            {{ translateProcessingState(scope.row.attributes.extension?.data?.processState) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="120">
        <template #default="scope">
          <el-button 
            v-if="scope.row.links?.webView?.href"
            size="small" 
            type="primary" 
            text
            @click="openInACC(scope.row.links.webView.href)"
          >
            View
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'FileVersionsView',
  props: {
    versions: {
      type: Array,
      required: true
    }
  },
  setup() {
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return 'Unknown'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getProcessingStatusType = (state) => {
      const statusMap = {
        'PROCESSING_COMPLETE': 'success',
        'PROCESSING': 'warning',
        'FAILED': 'danger'
      }
      return statusMap[state] || 'info'
    }

    const translateProcessingState = (state) => {
      const translations = {
        'PROCESSING_COMPLETE': 'Processing Complete',
        'PROCESSING': 'Processing',
        'FAILED': 'Processing Failed'
      }
      return translations[state] || state || 'Unknown'
    }

    const openInACC = (url) => {
      window.open(url, '_blank')
    }

    return {
      formatFileSize,
      formatDateTime,
      getProcessingStatusType,
      translateProcessingState,
      openInACC
    }
  }
}
</script>

<style scoped>
.file-versions-view {
  width: 100%;
}
</style>
