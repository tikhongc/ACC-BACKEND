<template>
  <div class="download-config">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      title="File Download Configuration"
      description="Configure and manage project file download tasks"
      icon="IconDownload" />

    <!-- 项目选择 -->
    <el-card class="project-card" v-if="!selectedProject">
      <template #header>
        <div class="card-header">
          <span>
            <icon-folder />
            选择项目
          </span>
        </div>
      </template>
      
      <div class="project-selection">
        <p>请先选择要下载文件的项目：</p>
        <el-button type="primary" @click="showProjectSelector = true">
          <icon-folder />
          选择项目
        </el-button>
      </div>
    </el-card>

    <!-- 下载配置主界面 -->
    <div v-if="selectedProject" class="config-main">
      
      <!-- 加载状态 -->
      <LoadingState 
        v-if="isInitializing"
        type="card"
        title="Getting Project Data"
        text="Please wait, getting project file information and configuration data from server..."
        size="default"
      />
      
      <!-- 配置内容 -->
      <div v-else>
        <!-- 项目信息 -->
      <el-card class="project-info-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-folder />
              当前项目: {{ selectedProject.name }}
            </span>
            <div class="header-actions">
              <el-tooltip content="Set the maximum depth for file tree traversal, affecting the discovery range of files and folders" placement="top">
                <div class="depth-control">
                  <span class="control-label">遍历深度:</span>
                  <el-input-number
                    v-model="maxDepth"
                    :min="2"
                    :max="20"
                    size="small"
                    style="width: 80px"
                    @change="onMaxDepthChange"
                  />
                </div>
              </el-tooltip>
              <el-button type="text" @click="changeProject">更换项目</el-button>
            </div>
          </div>
        </template>
        
        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-label">项目ID:</span>
            <span class="stat-value">{{ selectedProject.id }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Hub:</span>
            <span class="stat-value">{{ selectedProject.hub_name }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">类型:</span>
            <span class="stat-value">{{ selectedProject.type }}</span>
          </div>
        </div>
      </el-card>

      <!-- 下载配置选项 -->
      <el-row :gutter="20">
        
        <!-- 文件类型选择 -->
        <el-col :span="12">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>
                  <icon-file />
                  文件类型选择
                </span>
                <el-button type="text" @click="refreshFileTypes" :loading="loadingFileTypes">
                  刷新
                </el-button>
              </div>
            </template>
            
            <div class="file-types-section">
              <el-checkbox-group v-model="selectedFileTypes" @change="onFileTypesChange">
                <div v-for="(typeInfo, typeKey) in supportedFileTypes" :key="typeKey" class="file-type-item">
                  <el-checkbox :label="typeKey">
                    <div class="file-type-content">
                      <span class="type-name">{{ typeInfo.name }}</span>
                      <span class="type-extensions">{{ typeInfo.extensions.join(', ') }}</span>
                    </div>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </el-card>
        </el-col>

        <!-- 文件夹选择 -->
        <el-col :span="12">
          <el-card class="config-card">
            <template #header>
              <div class="card-header">
                <span>
                  <icon-folder />
                  文件夹选择
                </span>
                <el-button type="text" @click="refreshFolders" :loading="loadingFolders">
                  刷新
                </el-button>
              </div>
            </template>
            
            <div class="folders-section">
              <el-radio-group v-model="selectedFolderOption" @change="onFolderOptionChange">
                <el-radio label="all">下载所有文件</el-radio>
                <el-radio label="specific">选择特定文件夹</el-radio>
              </el-radio-group>
              
              <div v-if="selectedFolderOption === 'specific'" class="folder-tree">
                <el-tree
                  ref="folderTree"
                  :data="projectFolders"
                  :props="folderTreeProps"
                  show-checkbox
                  node-key="id"
                  @check-change="onFolderSelectionChange">
                  <template #default="{ node, data }">
                    <div class="folder-node">
                      <icon-folder />
                      <span class="folder-name">{{ data.name }}</span>
                      <span class="folder-stats">({{ data.file_count }} 文件)</span>
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 文件预览 -->
      <el-card class="files-preview-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-eye />
              File Preview {{ previewFiles.length > 0 ? `(${previewFiles.length} files)` : '' }}
            </span>
            <div class="header-actions">
              <span v-if="!loadingPreview" class="total-size">总大小: {{ formatFileSize(totalFileSize) }}</span>
              <el-button type="text" @click="refreshPreview" :loading="loadingPreview">
                刷新预览
              </el-button>
              <el-button type="text" @click="debugFileCount" style="color: #f56c6c;">
                调试文件数量
              </el-button>
              <el-button type="text" @click="clearCache" style="color: #e6a23c;">
                清除缓存
              </el-button>
            </div>
          </div>
        </template>
        
        <!-- 文件预览加载状态 -->
        <LoadingState 
          v-if="loadingPreview"
          type="card"
          title="Loading File Preview"
          text="Please wait, getting project file list and detailed information..."
          size="default"
        />
        
        <!-- 文件预览内容 -->
        <div v-else-if="previewFiles.length > 0" class="files-preview">
          <el-table 
            :data="previewFiles" 
            style="width: 100%" 
            max-height="400"
            @selection-change="handleSelectionChange"
            :row-class-name="getRowClassName"
            ref="fileTable">
            <el-table-column 
              type="selection" 
              width="55" 
              :selectable="isRowSelectable" />
            <el-table-column prop="name" label="File Name" min-width="200">
              <template #default="scope">
                <div class="file-name-cell">
                  <icon-file />
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="120" />
            <el-table-column prop="size" label="Size" width="100">
              <template #default="scope">
                {{ formatFileSize(scope.row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="path" label="Path" min-width="250" show-overflow-tooltip />
            <el-table-column prop="downloadable" label="Downloadable" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.downloadable ? 'success' : 'danger'" size="small">
                  {{ scope.row.downloadable ? 'Yes' : 'No' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="100">
              <template #default="scope">
                <el-button 
                  v-if="!scope.row.downloadable" 
                  type="text" 
                  size="small" 
                  disabled>
                  不支持
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-preview">
          <el-empty description="No file preview data available" :image-size="60">
            <template #description>
              <p>请选择文件类型和文件夹后点击刷新预览</p>
            </template>
          </el-empty>
        </div>
      </el-card>

      <!-- 下载选项 -->
      <el-card class="download-options-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-settings />
              下载选项
            </span>
          </div>
        </template>
        
        <el-form :model="downloadOptions" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Download Directory">
                <el-input v-model="downloadOptions.downloadPath" placeholder="Default: ACC_BACKUP/assets" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Concurrent Downloads">
                <el-input-number v-model="downloadOptions.concurrency" :min="1" :max="10" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Retry Count">
                <el-input-number v-model="downloadOptions.retryCount" :min="0" :max="5" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Timeout (seconds)">
                <el-input-number v-model="downloadOptions.timeout" :min="30" :max="300" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="Download Options">
            <el-checkbox-group v-model="downloadOptions.options">
              <el-checkbox label="overwrite">覆盖已存在文件</el-checkbox>
              <el-checkbox label="createFolders">创建文件夹结构</el-checkbox>
              <el-checkbox label="skipErrors">跳过错误继续下载</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="startDownload" :loading="startingDownload" :disabled="!canStartDownload">
          <icon-download />
          开始下载 ({{ selectedFiles.length }} 个文件)
        </el-button>
        <el-button size="large" @click="resetConfig">
          <icon-refresh />
          重置配置
        </el-button>
        <el-button type="success" size="large" @click="$router.push('/download-tasks')">
          <icon-eye />
          查看下载任务
        </el-button>
      </div>
      </div>
    </div>

    <!-- 项目选择对话框 -->
    <ProjectSelector
      v-model="showProjectSelector"
      :multiple="false"
      :auto-refresh="false"
      :default-project="getDefaultProject()"
      @confirm="handleProjectSelected"
      @cancel="handleProjectSelectionCancel" />

  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import ProjectSelector from '../components/ProjectSelector.vue'
import StatusTag from '../components/StatusTag.vue'
import LoadingState from '../components/LoadingState.vue'
import projectStore from '../utils/projectStore.js'
import { 
  IconDownload, 
  IconFile, 
  IconFolder,
  IconEye,
  IconSettings,
  IconRefresh
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'DownloadConfig',
  components: {
    Breadcrumb,
    PageHeader,
    ProjectSelector,
    StatusTag,
    LoadingState,
    IconDownload,
    IconFile,
    IconFolder,
    IconEye,
    IconSettings,
    IconRefresh
  },
  data() {
    return {
      selectedProject: null,
      showProjectSelector: false,
      isInitializing: false,
      
      // 文件类型相关
      supportedFileTypes: {},
      selectedFileTypes: [],
      loadingFileTypes: false,
      
      // 文件夹相关
      projectFolders: [],
      selectedFolderOption: 'all',
      selectedFolders: [],
      loadingFolders: false,
      folderTreeProps: {
        children: 'children',
        label: 'name'
      },
      
      // 文件预览相关
      previewFiles: [],
      selectedFiles: [],
      totalFileSize: 0,
      loadingPreview: false,
      
      // 下载选项
      downloadOptions: {
        downloadPath: 'ACC_BACKUP/assets',
        concurrency: 3,
        retryCount: 2,
        timeout: 120,
        options: ['createFolders', 'skipErrors']
      },
      
      // 状态
      startingDownload: false,
      
      // 遍历深度设置
      maxDepth: 10
    }
  },
  computed: {
    canStartDownload() {
      return this.selectedProject && this.selectedFiles.length > 0 && !this.startingDownload
    }
  },
  async mounted() {
    // 检查路由参数中是否有项目信息（从主页面跳转过来）
    if (this.$route.query.projectId && this.$route.query.projectName) {
      // 如果有路由参数，直接设置项目并初始化
      this.selectedProject = {
        id: this.$route.query.projectId,
        name: this.$route.query.projectName
      }
      await this.initializeProject()
    } else {
      // 否则显示项目选择器
      this.showProjectSelector = true
    }
    
    // 加载支持的文件类型（不依赖项目选择）
    await this.loadSupportedFileTypes()
  },
  methods: {
    async initializeProject() {
      if (!this.selectedProject) return
      
      this.isInitializing = true
      
      try {
        // 并行加载项目数据
        await Promise.all([
          this.loadProjectFolders(),
          this.loadProjectFiles()
        ])
        
        this.$message.success('Project data loading completed')
      } catch (error) {
        console.error('初始化项目失败:', error)
        this.$message.error('Project initialization failed: ' + (error.message || 'Unknown error'))
      } finally {
        this.isInitializing = false
      }
    },
    
    async loadSupportedFileTypes() {
      this.loadingFileTypes = true
      try {
        const response = await axios.get('/api/download-config/file-types')
        if (response.data.status === 'success') {
          this.supportedFileTypes = response.data.file_types
          // 默认选择所有可下载的文件类型
          this.selectedFileTypes = Object.keys(this.supportedFileTypes).filter(
            key => this.supportedFileTypes[key].downloadable
          )
        }
      } catch (error) {
        this.$message.error('Failed to load file types: ' + (error.response?.data?.error || error.message))
      } finally {
        this.loadingFileTypes = false
      }
    },
    
    async loadProjectFolders() {
      if (!this.selectedProject) return
      
      this.loadingFolders = true
      try {
        const response = await axios.get(`/api/download-config/project/${this.selectedProject.id}/folders`, {
          params: {
            maxDepth: this.maxDepth
          }
        })
        if (response.data.status === 'success') {
          this.projectFolders = this.buildFolderTree(response.data.folders || [])
        }
      } catch (error) {
        this.$message.error('Failed to load folders: ' + (error.response?.data?.error || error.message))
      } finally {
        this.loadingFolders = false
      }
    },
    
    async loadProjectFiles() {
      if (!this.selectedProject) return
      
      this.loadingPreview = true
      try {
        const params = {
          file_types: this.selectedFileTypes,
          maxDepth: this.maxDepth
        }
        
        console.log('🔍 发送文件预览请求，项目ID:', this.selectedProject.id, '参数:', params)
        
        if (this.selectedFolderOption === 'specific' && this.selectedFolders.length > 0) {
          params.folder_ids = this.selectedFolders
        }
        
        // 添加时间戳参数绕过缓存，确保获取最新数据
        params._t = Date.now()
        
        const response = await axios.get(`/api/download-config/project/${this.selectedProject.id}/files`, {
          params
        })
        
        if (response.data.status === 'success') {
          const data = response.data.data
          this.previewFiles = data.files || []
          // 不自动选择所有文件，让用户手动选择
          this.selectedFiles = []
          this.totalFileSize = data.total_size || 0
          
          // 清空表格选择状态
          this.$nextTick(() => {
            if (this.$refs.fileTable) {
              this.$refs.fileTable.clearSelection()
            }
          })
        }
      } catch (error) {
        this.$message.error('Failed to load file list: ' + (error.response?.data?.error || error.message))
      } finally {
        this.loadingPreview = false
      }
    },
    
    buildFolderTree(folders) {
      // 简化的文件夹树构建，实际应该根据路径层级构建
      return folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        file_count: folder.file_count,
        folder_count: folder.folder_count,
        level: folder.level,
        children: []
      }))
    },
    
    async startDownload() {
      if (!this.canStartDownload) return
      
      this.startingDownload = true
      try {
        const downloadData = {
          project_id: this.selectedProject.id,
          file_ids: this.selectedFiles.map(f => f.id),
          options: {
            ...this.downloadOptions,
            file_types: this.selectedFileTypes,
            folder_option: this.selectedFolderOption,
            selected_folders: this.selectedFolders
          }
        }
        
        console.log('🚀 发送下载请求，项目ID:', this.selectedProject.id, '下载数据:', downloadData)
        
        const response = await axios.post('/api/download-config/download', downloadData)
        
        if (response.data.status === 'success') {
          this.$message.success(`Download task created: ${response.data.task_id}`)
          
          // 通知下载进度组件有新任务开始
          this.$eventBus.emit('download-task-started', response.data.task_id)
          
          // 触发下载进度组件显示模态框
          this.$eventBus.emit('show-download-modal', response.data.task_id)
          
          // 返回首页
          this.$router.push('/')
        }
      } catch (error) {
        this.$message.error('Failed to start download: ' + (error.response?.data?.error || error.message))
      } finally {
        this.startingDownload = false
      }
    },
    
    resetConfig() {
      this.selectedFileTypes = Object.keys(this.supportedFileTypes).filter(
        key => this.supportedFileTypes[key].downloadable
      )
      this.selectedFolderOption = 'all'
      this.selectedFolders = []
      this.selectedFiles = []
      this.downloadOptions = {
        downloadPath: 'ACC_BACKUP/assets',
        concurrency: 3,
        retryCount: 2,
        timeout: 120,
        options: ['createFolders', 'skipErrors']
      }
      this.loadProjectFiles()
    },
    
    handleSelectionChange(selection) {
      this.selectedFiles = selection.filter(f => f.downloadable)
      console.log('📋 用户选择的文件:', this.selectedFiles.length, '个')
      console.log('📄 选择的文件详情:', this.selectedFiles.map(f => f.name))
    },
    
    isRowSelectable(row) {
      return row.downloadable
    },
    
    getRowClassName({ row }) {
      return row.downloadable ? '' : 'disabled-row'
    },
    
    changeProject() {
      this.selectedProject = null
      this.showProjectSelector = true
    },
    
    handleProjectSelected(project) {
      this.selectedProject = project
      projectStore.saveSelectedProject(project)
      this.initializeProject()
    },
    
    handleProjectSelectionCancel() {
      // 如果没有选择项目，返回首页
      if (!this.selectedProject) {
        this.$router.push('/')
      }
    },
    
    getDefaultProject() {
      // 优先返回路由参数中的项目
      if (this.$route.query.projectId) {
        return {
          id: this.$route.query.projectId,
          name: this.$route.query.projectName || 'Unknown Project'
        }
      }
      
      // 其次返回保存的项目
      const savedProject = projectStore.getSelectedProject()
      if (savedProject) {
        return savedProject
      }
      
      return null
    },
    
    onFileTypesChange() {
      this.loadProjectFiles()
    },
    
    onFolderOptionChange() {
      if (this.selectedFolderOption === 'all') {
        this.selectedFolders = []
      }
      this.loadProjectFiles()
    },
    
    onFolderSelectionChange() {
      this.selectedFolders = this.$refs.folderTree.getCheckedKeys()
      this.loadProjectFiles()
    },
    
    refreshFileTypes() {
      this.loadSupportedFileTypes()
    },
    
    refreshFolders() {
      this.loadProjectFolders()
    },
    
    refreshPreview() {
      this.loadProjectFiles()
    },
    
    async onMaxDepthChange() {
      if (!this.selectedProject) return
      
      try {
        this.$message.info(`Reloading data, traversal depth: ${this.maxDepth}`)
        
        // 清除缓存并重新加载所有数据
        await axios.post('/api/download-config/clear-cache')
        
        await Promise.all([
          this.loadProjectFolders(),
          this.loadProjectFiles()
        ])
        
        this.$message.success('Data reload completed')
      } catch (error) {
        console.error('重新加载数据失败:', error)
        this.$message.error('Data reload failed: ' + error.message)
      }
    },
    
    async debugFileCount() {
      if (!this.selectedProject) {
        this.$message.error('Please select a project first')
        return
      }
      
      try {
        this.$message.info('Getting debug information...')
        
        const response = await axios.get(`/api/download-config/project/${this.selectedProject.id}/debug`)
        
        if (response.data.status === 'success') {
          const debugInfo = response.data.debug_info
          
          // 显示调试信息
          const message = `
调试信息：
- 项目ID: ${debugInfo.project_id}
- 树统计文件数: ${debugInfo.tree_statistics?.total_files || 0}
- 实际遍历文件数: ${debugInfo.actual_file_count_in_tree}
- 顶级文件夹数: ${debugInfo.top_folders_count}
- 当前预览文件数: ${this.previewFiles.length}

顶级文件夹:
${debugInfo.top_folders.map(f => `  - ${f.name} (${f.children_count} items)`).join('\n')}
          `.trim()
          
          this.$alert(message, 'File Count Debug Information', {
            confirmButtonText: 'OK',
            type: 'info'
          })
          
          console.log('🔍 完整调试信息:', debugInfo)
        }
      } catch (error) {
        this.$message.error('Failed to get debug information: ' + (error.response?.data?.error || error.message))
        console.error('调试失败:', error)
      }
    },
    
    async clearCache() {
      try {
        this.$message.info('Clearing cache...')
        
        const response = await axios.post('/api/download-config/clear-cache')
        
        if (response.data.status === 'success') {
          this.$message.success(response.data.message)
          // 清除缓存后重新加载文件列表
          console.log('🧹 缓存已清除，重新加载文件列表')
          await this.loadProjectFiles()
        }
      } catch (error) {
        this.$message.error('Failed to clear cache: ' + (error.response?.data?.error || error.message))
        console.error('清除缓存失败:', error)
      }
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.download-config {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.project-card, .project-info-card {
  margin-bottom: 20px;
}

.project-selection {
  text-align: center;
  padding: 40px;
}

.project-selection p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.project-stats {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.config-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.depth-control {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.control-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.total-size {
  font-size: 14px;
  color: #666;
}

.file-types-section {
  max-height: 300px;
  overflow-y: auto;
}

.file-type-item {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 6px;
  transition: all 0.3s;
}

.file-type-item:hover {
  background-color: #f9f9f9;
}

.file-type-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-name {
  font-weight: 500;
  color: #333;
}

.type-extensions {
  font-size: 12px;
  color: #666;
}

.folders-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.folder-tree {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 10px;
}

.folder-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.folder-name {
  font-weight: 500;
}

.folder-stats {
  font-size: 12px;
  color: #666;
}

.files-preview-card {
  margin: 20px 0;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-options-card {
  margin: 20px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 20px 0;
}

/* 禁用行样式 */
:deep(.disabled-row) {
  background-color: #f5f5f5;
  color: #999;
}

:deep(.disabled-row .el-checkbox) {
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .download-config {
    padding: 10px;
  }
  
  .project-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
