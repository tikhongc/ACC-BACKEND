<template>
  <div class="project-info">
    <el-card class="project-card">
      <div class="project-content">
        <div class="project-icon">
          <icon-folder />
        </div>
        <div class="project-details">
          <h3>{{ projectName }}</h3>
          <p class="project-id">Project ID: {{ projectId }}</p>
        </div>
        <div class="project-actions">
          <el-button type="text" size="small" @click="copyProjectId">
            <icon-copy />
            複製 ID
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { IconFolder, IconCopy } from '@arco-design/web-vue/es/icon'

export default {
  name: 'ProjectInfo',
  components: {
    IconFolder,
    IconCopy
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      default: 'Unknown Project'
    }
  },
  methods: {
    async copyProjectId() {
      try {
        await navigator.clipboard.writeText(this.projectId)
        this.$message.success('Project ID copied to clipboard')
      } catch (error) {
        console.error('Copy failed:', error)
        this.$message.error('Copy failed')
      }
    }
  }
}
</script>

<style scoped>
.project-info {
  margin-bottom: 20px;
}

.project-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.project-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.project-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #67c23a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.project-details {
  flex: 1;
}

.project-details h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.project-id {
  margin: 0;
  font-size: 14px;
  color: #909399;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.project-actions {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .project-details {
    text-align: center;
  }
}
</style>
