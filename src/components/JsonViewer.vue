<template>
  <el-card class="json-viewer-card" :shadow="shadow">
    <template #header>
      <div class="json-header">
        <div class="header-info">
          <span class="json-title">{{ title || 'JSON Data' }}</span>
          <span v-if="description" class="json-description">{{ description }}</span>
        </div>
        <div class="header-actions">
          <el-button 
            v-if="showCopy"
            type="primary" 
            size="small" 
            @click="copyToClipboard"
            :loading="copying"
            class="action-btn">
            <el-icon><DocumentCopy /></el-icon>
            {{ copying ? 'Copying...' : 'Copy' }}
          </el-button>
          <el-button 
            v-if="showDownload"
            type="success" 
            size="small" 
            @click="downloadJson"
            :loading="downloading"
            class="action-btn">
            <el-icon><Download /></el-icon>
            {{ downloading ? 'Downloading...' : 'Download' }}
          </el-button>
          <el-button 
            v-if="collapsible"
            type="info" 
            size="small" 
            @click="toggleCollapse"
            class="action-btn">
            <el-icon>
              <ArrowDown v-if="isCollapsed" />
              <ArrowUp v-else />
            </el-icon>
            {{ isCollapsed ? 'Expand' : 'Collapse' }}
          </el-button>
        </div>
      </div>
    </template>
    
    <div v-show="!isCollapsed" class="json-content-wrapper">
      <pre class="json-content">{{ formattedJson }}</pre>
    </div>
  </el-card>
</template>

<script>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, Download, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

export default {
  name: 'JsonViewer',
  components: {
    DocumentCopy,
    Download,
    ArrowDown,
    ArrowUp
  },
  props: {
    data: {
      type: [Object, Array],
      required: true
    },
    title: {
      type: String,
      default: 'JSON Data'
    },
    description: {
      type: String,
      default: ''
    },
    expandDepth: {
      type: Number,
      default: 2
    },
    showCopy: {
      type: Boolean,
      default: true
    },
    showDownload: {
      type: Boolean,
      default: false
    },
    collapsible: {
      type: Boolean,
      default: false
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    shadow: {
      type: String,
      default: 'hover'
    }
  },
  setup(props) {
    const copying = ref(false)
    const downloading = ref(false)
    const isCollapsed = ref(props.collapsed)
    
    const formattedJson = computed(() => {
      return JSON.stringify(props.data, null, 2)
    })

    const copyToClipboard = async () => {
      copying.value = true
      
      try {
        await navigator.clipboard.writeText(formattedJson.value)
        ElMessage.success('JSON data copied to clipboard')
      } catch (error) {
        console.error('Copy failed:', error)
        
        // Fallback: create temporary textarea element
        try {
          const textarea = document.createElement('textarea')
          textarea.value = formattedJson.value
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
          ElMessage.success('JSON data copied to clipboard')
        } catch (fallbackError) {
          console.error('Fallback copy method also failed:', fallbackError)
          ElMessage.error('Copy failed, please select and copy manually')
        }
      } finally {
        copying.value = false
      }
    }

    const downloadJson = () => {
      downloading.value = true
      
      try {
        const dataStr = formattedJson.value
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // Generate filename
        const timestamp = new Date().getTime()
        const fileName = `data_${timestamp}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(`JSON data downloaded: ${fileName}`)
      } catch (error) {
        console.error('Download failed:', error)
        ElMessage.error('Download failed, please retry')
      } finally {
        downloading.value = false
      }
    }

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
    }

    return {
      formattedJson,
      copying,
      downloading,
      isCollapsed,
      copyToClipboard,
      downloadJson,
      toggleCollapse
    }
  }
}
</script>

<style scoped>
.json-viewer-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.json-viewer-card :deep(.el-card__header) {
  padding: 16px 20px;
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-bottom: 2px solid #e9ecef;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.json-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.json-description {
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  font-size: 12px;
  padding: 6px 12px;
  height: auto;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn .el-icon {
  margin-right: 4px;
}

.json-content-wrapper {
  padding: 0;
}

.json-content {
  margin: 0;
  padding: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #2c3e50;
  background: #f8f9fa;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 500px;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
}

/* 滚动条样式 */
.json-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-content::-webkit-scrollbar-track {
  background: #e9ecef;
  border-radius: 4px;
}

.json-content::-webkit-scrollbar-thumb {
  background: #adb5bd;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.json-content::-webkit-scrollbar-thumb:hover {
  background: #6c757d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 0 0 auto;
  }
  
  .json-content {
    font-size: 11px;
    max-height: 300px;
  }
}
</style>