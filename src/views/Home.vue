<template>
  <div class="home">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="$t('home.title')"
      :description="$t('home.description')"
      :icon="IconDashboard" />

    <!-- API模块 -->
    <div class="api-modules">
      
      <!-- Forms API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-file />
              {{ $t('home.formsApi') }}
            </span>
            <StatusTag status="info" :text="$t('home.formsApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 核心功能 -->
        <div class="function-group">
          <h4>{{ $t('home.coreFeatures') }}</h4>
          <div class="button-grid">
            <el-button type="primary" @click="handleFormsDataClick">
              <icon-dashboard />
              {{ $t('home.projectFormsData') }}
            </el-button>
          </div>
        </div>

        <!-- 数据导出 -->
        <div class="function-group">
          <h4>{{ $t('home.dataExport') }}</h4>
          <div class="button-grid">
            <el-button type="warning" @click="handleFormsExportClick">
              <icon-download />
              {{ $t('home.formsJson') }}
            </el-button>
          </div>
        </div>

      </el-card>

   

      <!-- Data Connector API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-sync />
              {{ $t('home.dataConnectorApi') }}
            </span>
            <StatusTag status="warning" :text="$t('home.dataConnectorDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 核心功能 -->
        <div class="function-group">
          <h4>{{ $t('home.coreFeatures') }}</h4>
          <div class="button-grid">
            <el-button type="primary" @click="$router.push('/data-connector/sync')">
              <icon-sync />
              {{ $t('home.dataConnectorSync') }}
            </el-button>
          </div>
        </div>
      </el-card>


      <!-- Reviews API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-branch />
              {{ $t('home.reviewsApi') }}
            </span>
            <StatusTag status="success" :text="$t('home.reviewsApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 评审管理 -->
        <div class="function-group">
          <h4>{{ $t('home.reviewManagement') }}</h4>
          <div class="button-grid">
            <el-button type="primary" @click="handleReviewsDataClick">
              <icon-file />
              {{ $t('home.reviewsData') }}
            </el-button>
          </div>
        </div>

        <!-- 数据导出 -->
        <div class="function-group">
          <h4>{{ $t('home.dataExport') }}</h4>
          <div class="button-grid">
            <el-button type="warning" @click="handleReviewsExportClick">
              <icon-download />
              {{ $t('home.reviewsJson') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- RFIs API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-code />
              {{ $t('home.rfisApi') }}
            </span>
            <StatusTag status="success" :text="$t('home.rfisApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- RFI 管理 -->
        <div class="function-group">
          <h4>{{ $t('home.rfiManagement') }}</h4>
          <div class="button-grid single-button">
            <el-button type="primary" @click="handleRfisDataClick">
              <icon-file />
              {{ $t('home.rfisDataAndStatistics') }}
            </el-button>
          </div>
        </div>

        <!-- 数据导出 -->
        <div class="function-group">
          <h4>{{ $t('home.dataStatisticsExport') }}</h4>
          <div class="button-grid">
            <el-button type="warning" @click="handleRfisExportClick">
              <icon-download />
              {{ $t('home.rfisJson') }}
            </el-button>
            <el-button type="info" @click="handleRfisStatisticsExportClick">
              <icon-download />
              {{ $t('home.statisticsJson') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Issues API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-safe />
              {{ $t('home.issuesApi') }}
            </span>
            <StatusTag status="success" :text="$t('home.issuesApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- Issues 管理 -->
        <div class="function-group">
          <h4>{{ $t('home.issuesManagement') }}</h4>
          <div class="button-grid single-button">
            <el-button type="primary" @click="handleIssuesDataClick">
              <icon-safe />
              {{ $t('home.issuesData') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Autospecs + Packages API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-file />
              {{ $t('home.autospecsPackagesApi') }}
            </span>
            <StatusTag status="success" :text="$t('home.autospecsPackagesApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- Autospecs + Packages 管理 -->
        <div class="function-group">
          <h4>{{ $t('home.autospecsPackagesManagement') }}</h4>
          <div class="button-grid single-button">
            <el-button type="primary" @click="handleAutospecsPackagesDataClick">
              <icon-file />
              {{ $t('home.autospecsPackagesData') }}
            </el-button>
          </div>
        </div>

        <!-- 数据导出 -->
        <div class="function-group">
          <h4>{{ $t('home.dataStatisticsExport') }}</h4>
          <div class="button-grid">
            <el-button type="warning" @click="handleAutospecsExportClick">
              <icon-download />
              {{ $t('home.autospecsJson') }}
            </el-button>
            <el-button type="info" @click="handlePackagesExportClick">
              <icon-download />
              {{ $t('home.packagesJson') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- Submittal API 模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-file />
              {{ $t('home.submittalApi') }}
            </span>
            <StatusTag status="success" :text="$t('home.submittalApiDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- Submittal 管理 -->
        <div class="function-group">
          <h4>{{ $t('home.submittalManagementSystem') }}</h4>

          <div class="button-grid single-button">
            <el-button type="primary" @click="handleSubmittalClick">
              <icon-file />
              {{ $t('home.enterSubmittalManagement') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 文件下载配置模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-download />
              {{ $t('home.fileDownloadManagement') }}
            </span>
            <StatusTag status="primary" :text="$t('home.downloadConfiguration')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 下载配置 -->
        <div class="function-group">
          <h4>{{ $t('home.downloadConfig') }}</h4>
          <div class="button-grid">
            <el-button type="primary" @click="openDownloadConfig">
              <icon-settings />
              {{ $t('home.configureDownloadTasks') }}
            </el-button>
            <el-button type="success" @click="viewDownloadTasks">
              <icon-eye />
              {{ $t('home.viewDownloadTasks') }}
            </el-button>
          </div>
        </div>

        <!-- 快速下载 -->
        <div class="function-group">
          <h4>{{ $t('home.quickDownload') }}</h4>
          <div class="button-grid single-button">
            <el-button type="warning" @click="handleQuickDownloadClick">
              <icon-download />
              {{ $t('home.projectFileDownload') }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 项目管理模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-folder />
              {{ $t('home.projectManagement') }}
            </span>
            <StatusTag status="success" :text="$t('home.projectManagement')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 项目浏览功能 -->
        <div class="function-group">
          <h4>{{ $t('home.projectBrowse') }}</h4>
          <div class="button-grid single-button">
            <el-button type="primary" @click="handleFileBrowserClick">
              <icon-folder />
              {{ $t('home.fileBrowser') }}
            </el-button>
          </div>
        </div>

      </el-card>

      <!-- 数据库同步API模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-sync />
              {{ $t('home.databaseSyncApi') }}
            </span>
            <StatusTag status="primary" :text="$t('home.databaseSyncDesc')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 文件同步功能 -->
        <div class="function-group">
          <h4>{{ $t('home.fileSyncFeatures') }}</h4>
          <div class="button-grid single-button">
            <SmartSyncDialog @sync-result="handleSyncResult" />
          </div>
        </div>

        <!-- 数据查询功能 -->
        <div class="function-group">
          <h4>{{ $t('home.dataQueryFeatures') }}</h4>
          <div class="button-grid">
            <el-button type="info" @click="handleSyncStatusClick">
              <icon-eye />
              {{ $t('home.syncStatus') }}
            </el-button>
            <el-button type="warning" @click="handleDatabaseHealthClick">
              <icon-check-circle />
              {{ $t('home.databaseHealth') }}
            </el-button>
            <el-button type="primary" @click="handleSyncHistoryClick">
              <icon-clock-circle />
              Sync History
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 系统管理模块 -->
      <el-card class="module-card">
        <template #header>
          <div class="card-header">
            <span>
              <icon-settings />
              {{ $t('home.systemManagement') }}
            </span>
            <StatusTag status="success" :text="$t('home.systemFunctions')" size="small" :show-icon="false" />
          </div>
        </template>
        
        <!-- 系统功能 -->
        <div class="function-group">
          <h4>{{ $t('home.systemFunctions') }}</h4>
          <div class="button-grid single-button">
            <el-button type="success" @click="$router.push('/account-info')">
              <icon-user />
              {{ $t('home.accountInfo') }}
            </el-button>
            <el-button type="info" @click="$router.push('/system/status')">
              <icon-check-circle />
              {{ $t('home.systemStatus') }}
            </el-button>
          </div>
        </div>
      </el-card>

    </div>

    <!-- API响应显示区域 -->
    <el-card v-if="apiResponse" class="response-card">
      <template #header>
        <div class="card-header">
            <span>{{ $t('home.apiResponse') }}</span>
          <el-button type="text" @click="clearResponse">{{ $t('home.clearResponse') }}</el-button>
        </div>
      </template>
      <div class="response-content" v-html="apiResponse"></div>
    </el-card>

    <!-- 项目选择对话框 -->
    <ProjectSelector
      v-model="showProjectSelector"
      :multiple="false"
      :auto-refresh="false"
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
import SmartSyncDialog from '../components/SmartSyncDialog.vue'
import projectStore from '../utils/projectStore.js'
import { 
  IconDashboard, 
  IconFile, 
  IconSync, 
  IconSettings,
  IconUser,
  IconCheckCircle,
  IconApps,
  IconDownload,
  IconEye,
  IconCode,
  IconSafe,
  IconFolder,
  IconBranch,
  IconClockCircle
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'Home',
  components: {
    Breadcrumb,
    PageHeader,
    ProjectSelector,
    StatusTag,
    SmartSyncDialog,
    IconDashboard,
    IconFile,
    IconSync,
    IconSettings,
    IconUser,
    IconCheckCircle,
    IconApps,
    IconDownload,
    IconEye,
    IconCode,
    IconSafe,
    IconFolder,
    IconBranch,
    IconClockCircle
  },
  data() {
    return {
      apiResponse: null,
      showProjectSelector: false,
      pendingApiCall: null, // 存储待执行的API调用
      selectedProject: null
    }
  },
  methods: {
    async checkHealth() {
      try {
        const response = await axios.get('/health')
        this.$message.success(this.$t('home.systemRunning'))
        this.apiResponse = `<pre>${JSON.stringify(response.data, null, 2)}</pre>`
      } catch (error) {
        this.$message.error(this.$t('home.systemCheckFailed'))
        console.error(error)
      }
    },
    
    
    async callApi(endpoint) {
      try {
        this.$message.info(this.$t('home.callingApi', { endpoint }))
        const response = await axios.get(endpoint)
        
        if (response.headers['content-type']?.includes('text/html')) {
          // 如果返回HTML，在新窗口打开
          window.open(endpoint, '_blank')
        } else {
          // 如果返回JSON，显示在页面上
          this.apiResponse = `
            <div class="api-info">
              <p><strong>端点:</strong> ${endpoint}</p>
              <p><strong>状态:</strong> ${response.status} ${response.statusText}</p>
              <p><strong>响应时间:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          `
        }
        this.$message.success('API call successful')
      } catch (error) {
        this.$message.error(`API call failed: ${error.response?.status || error.message}`)
        this.apiResponse = `
          <div class="error-info">
            <p><strong>错误端点:</strong> ${endpoint}</p>
            <p><strong>Error Status:</strong> ${error.response?.status || 'Network Error'}</p>
            <p><strong>错误信息:</strong> ${error.response?.statusText || error.message}</p>
            <p><strong>时间:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          ${error.response?.data ? `<pre>${JSON.stringify(error.response.data, null, 2)}</pre>` : ''}
        `
      }
    },
    
    async downloadApi(endpoint) {
      try {
        this.$message.info(`Downloading ${endpoint}...`)
        const response = await axios.get(endpoint, {
          responseType: 'blob'
        })
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${endpoint.split('/').pop()}_${Date.now()}.json`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.$message.success('File download successful')
      } catch (error) {
        this.$message.error(`Download failed: ${error.response?.status || error.message}`)
      }
    },
    
    clearResponse() {
      this.apiResponse = null
    },

    // Forms数据页面点击处理
    handleFormsDataClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/forms/jarvis',
        description: 'Project Forms Data'
      }
      this.showProjectSelector = true
    },


    // 文件浏览器点击处理
    handleFileBrowserClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/file-browser',
        description: 'File Browser'
      }
      this.showProjectSelector = true
    },




    // Reviews数据页面点击处理
    handleReviewsDataClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/reviews/data',
        description: 'Project Reviews'
      }
      this.showProjectSelector = true
    },


    // 处理项目选择确认
    handleProjectSelected(selectedProject) {
      this.selectedProject = selectedProject
      
      // 保存选中的项目到存储
      projectStore.saveSelectedProject(selectedProject)
      
      this.$message.success(`Selected project: ${selectedProject.name}`)
      
      // 执行待执行的操作
      if (this.pendingApiCall) {
        this.executePendingApiCall()
      }
    },

    // 处理项目选择cancel
    handleProjectSelectionCancel() {
      this.pendingApiCall = null
    },

    // 执行待执行的API调用
    executePendingApiCall() {
      if (!this.pendingApiCall || !this.selectedProject) {
        return
      }

      const { type, target, description } = this.pendingApiCall
      
      console.log(`执行${description}，选中项目:`, this.selectedProject.name, this.selectedProject.id)
      
      if (type === 'route') {
        // 路由跳转，携带项目信息
        let finalPath = target
        if (target.includes('{project_id}')) {
          finalPath = target.replace('{project_id}', this.selectedProject.id)
        }
        this.$router.push({
          path: finalPath,
          query: {
            projectId: this.selectedProject.id,
            projectName: this.selectedProject.name
          }
        })
      } else if (type === 'api') {
        // API调用
        const method = this.pendingApiCall.method || 'GET'
        this.callApiWithProject(target, method)
      } else if (type === 'download') {
        // 文件下载
        this.downloadApiWithProject(target)
      } else if (type === 'download-config') {
        // 下载配置页面 - 显示loading后跳转
        this.navigateToDownloadConfig(target)
      }
      
      // 清除待执行的调用
      this.pendingApiCall = null
    },

    // 导航到下载配置页面（带loading状态）
    async navigateToDownloadConfig(target) {
      if (!this.selectedProject) {
        this.$message.error('No project selected')
        return
      }

      try {
        // 显示loading消息
        this.$message.info(`Preparing download configuration page (Project: ${this.selectedProject.name})...`)
        
        // 模拟加载过程
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 跳转到下载配置页面，并传递项目信息
        this.$router.push({
          path: target,
          query: {
            projectId: this.selectedProject.id,
            projectName: this.selectedProject.name
          }
        })
        
        this.$message.success('Redirecting to download configuration page...')
      } catch (error) {
        console.error('跳转失败:', error)
        this.$message.error('Redirect failed: ' + error.message)
      }
    },

    // 带项目信息的API调用
    async callApiWithProject(endpoint, method = 'GET') {
      if (!this.selectedProject) {
        this.$message.error('No project selected')
        return
      }

      try {
        // 替换URL中的项目ID占位符
        const finalEndpoint = endpoint.replace('{project_id}', this.selectedProject.id)
        
        this.$message.info(`Calling ${method} ${finalEndpoint} (Project: ${this.selectedProject.name})...`)
        
        let response
        if (method.toUpperCase() === 'POST') {
          response = await axios.post(finalEndpoint, {
            maxDepth: 10,
            includeCustomAttributes: true
          })
        } else {
          response = await axios.get(finalEndpoint, {
            params: {
              projectId: this.selectedProject.id
            }
          })
        }
        
        if (response.headers['content-type']?.includes('text/html')) {
          // 如果返回HTML，在新窗口打开
          window.open(`${finalEndpoint}?projectId=${this.selectedProject.id}`, '_blank')
        } else {
          // 如果返回JSON，显示在页面上
          this.apiResponse = `
            <div class="api-info">
              <p><strong>端点:</strong> ${method} ${finalEndpoint}</p>
              <p><strong>项目:</strong> ${this.selectedProject.name} (${this.selectedProject.id})</p>
              <p><strong>状态:</strong> ${response.status} ${response.statusText}</p>
              <p><strong>响应时间:</strong> ${new Date().toLocaleTimeString()}</p>
            </div>
            <pre>${JSON.stringify(response.data, null, 2)}</pre>
          `
        }
        this.$message.success('API call successful')
      } catch (error) {
        this.$message.error(`API call failed: ${error.response?.status || error.message}`)
        this.apiResponse = `
          <div class="error-info">
            <p><strong>错误端点:</strong> ${method} ${finalEndpoint}</p>
            <p><strong>项目:</strong> ${this.selectedProject.name} (${this.selectedProject.id})</p>
            <p><strong>Error Status:</strong> ${error.response?.status || 'Network Error'}</p>
            <p><strong>错误信息:</strong> ${error.response?.statusText || error.message}</p>
            <p><strong>时间:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          ${error.response?.data ? `<pre>${JSON.stringify(error.response.data, null, 2)}</pre>` : ''}
        `
      }
    },

    // 带项目信息的文件下载
    async downloadApiWithProject(endpoint) {
      if (!this.selectedProject) {
        this.$message.error('No project selected')
        return
      }

      try {
        // 替换URL中的项目ID占位符
        const finalEndpoint = endpoint.replace('{project_id}', this.selectedProject.id)
        
        this.$message.info(`Downloading ${finalEndpoint} (Project: ${this.selectedProject.name})...`)
        
        // 直接作为blob下载（因为API返回的是文件下载）
        const response = await axios.get(finalEndpoint, {
          responseType: 'blob'
        })
        
        // 直接使用blob响应
        const blob = new Blob([response.data], { type: 'application/json' })
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // 生成文件名，包含项目信息
        const projectName = this.selectedProject.name.replace(/[^a-zA-Z0-9]/g, '_')
        const endpointName = endpoint.split('/').pop()
        const fileName = `${endpointName}_${projectName}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(`File download successful: ${fileName}`)
      } catch (error) {
        console.error('下载失败:', error)
        this.$message.error(`Download failed: ${error.response?.status || error.message}`)
      }
    },

    // Forms导出点击处理
    handleFormsExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/forms/export-json',
        description: 'Forms JSON Export'
      }
      this.showProjectSelector = true
    },


    // Reviews导出点击处理
    handleReviewsExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/reviews/jarvis',
        description: 'Reviews JSON Export'
      }
      this.showProjectSelector = true
    },


    // RFIs数据页面点击处理（包含统计分析）
    handleRfisDataClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/rfis/data',
        description: 'Project RFIs Data and Statistical Analysis'
      }
      this.showProjectSelector = true
    },

    // RFIs导出点击处理
    handleRfisExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/rfis/jarvis',
        description: 'RFIs JSON Export'
      }
      this.showProjectSelector = true
    },

    // RFIs统计分析导出点击处理
    handleRfisStatisticsExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/rfis/jarvis/statistics',
        description: 'RFI Statistical Analysis JSON Export'
      }
      this.showProjectSelector = true
    },

    // 打开备份CDE平台
    openBackupCDE() {
      const backupUrl = 'http://127.0.0.1:8080/acc-backup'
      
      // 询问用户打开方式
      this.$confirm('Please select how to open CDE backup platform', 'Open Method', {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Open in Current Page',
        cancelButtonText: 'Open in New Tab',
        type: 'info'
      }).then(() => {
        // 在当前页面打开
        window.location.href = backupUrl
      }).catch(action => {
        if (action === 'cancel') {
          // 在新标签页打开
          window.open(backupUrl, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes')
          this.$message.success('Opening CDE backup platform in new tab...')
        }
        // 如果是关闭对话框，不做任何操作
      })
    },

    // 打开下载配置页面
    openDownloadConfig() {
      this.pendingApiCall = {
        type: 'download-config',
        target: '/download-config',
        description: 'Configure Download Tasks'
      }
      this.showProjectSelector = true
    },

    // 查看下载任务
    viewDownloadTasks() {
      this.$router.push('/download-tasks')
    },

    // 快速下载点击处理
    handleQuickDownloadClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/download-config',
        description: 'Project File Download Configuration'
      }
      this.showProjectSelector = true
    },

    // Autospecs + Packages 数据页面点击处理
    handleAutospecsPackagesDataClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/autospecs-packages/data',
        description: 'Project Autospecs + Packages Data'
      }
      this.showProjectSelector = true
    },

    // Autospecs 导出点击处理
    handleAutospecsExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/autospecs-packages/jarvis/autospecs/metadata',
        description: 'Autospecs JSON Export'
      }
      this.showProjectSelector = true
    },

    // Packages 导出点击处理
    handlePackagesExportClick() {
      this.pendingApiCall = {
        type: 'download',
        target: '/api/autospecs-packages/jarvis/packages',
        description: 'Packages JSON Export'
      }
      this.showProjectSelector = true
    },

    // Submittal 点击处理
    handleSubmittalClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/submittals/data',
        description: 'Submittal Management System'
      }
      this.showProjectSelector = true
    },

    // Issues 数据页面点击处理
    handleIssuesDataClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/issues/data',
        description: 'Project Issues Data'
      }
      this.showProjectSelector = true
    },

    // 数据库同步API相关处理方法
    // 处理智能同步结果
    handleSyncResult(syncResult) {
      if (syncResult.success) {
        const duration = syncResult.duration
        const results = syncResult.results
        
        this.apiResponse = `
          <div class="api-info">
            <p><strong>同步类型:</strong> ${syncResult.syncType === 'full' ? '全量同步' : '增量同步'}</p>
            <p><strong>项目:</strong> ${syncResult.project.name} (${syncResult.project.id})</p>
            <p><strong>状态:</strong> 成功</p>
            <p><strong>耗时:</strong> ${duration.toFixed(2)} 秒</p>
            <p><strong>同步结果:</strong></p>
            <ul>
              <li>文件夹: ${results.folders_synced || 0}</li>
              <li>文件: ${results.files_synced || 0}</li>
              <li>版本: ${results.versions_synced || 0}</li>
              <li>错误: ${results.errors ? results.errors.length : 0}</li>
            </ul>
          </div>
          <pre>${JSON.stringify(syncResult.response, null, 2)}</pre>
        `
      } else {
        this.apiResponse = `
          <div class="error-info">
            <p><strong>同步类型:</strong> ${syncResult.syncType === 'full' ? '全量同步' : '增量同步'}</p>
            <p><strong>项目:</strong> ${syncResult.project.name} (${syncResult.project.id})</p>
            <p><strong>状态:</strong> 失败</p>
            <p><strong>错误信息:</strong> ${syncResult.error}</p>
            <p><strong>时间:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          ${syncResult.response ? `<pre>${JSON.stringify(syncResult.response, null, 2)}</pre>` : ''}
        `
      }
    },

    // 同步状态点击处理
    handleSyncStatusClick() {
      this.pendingApiCall = {
        type: 'api',
        target: '/api/file-sync-db/project/{project_id}/sync-status',
        method: 'GET',
        description: 'Database Sync Status'
      }
      this.showProjectSelector = true
    },

    // 数据库健康检查点击处理
    handleDatabaseHealthClick() {
      this.callApi('/api/file-sync-db/health')
    },

    // 同步历史点击处理
    handleSyncHistoryClick() {
      this.pendingApiCall = {
        type: 'route',
        target: '/sync-history/{project_id}',
        description: 'Sync History'
      }
      this.showProjectSelector = true
    },

  }
}
</script>

<style scoped>
@import '../styles/common.css';

.home {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}


.api-modules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xxl);
  margin-bottom: 32px;
}

.module-card {
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--color-bg-primary);
  overflow: hidden;
  position: relative;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-success) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.module-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--color-primary);
}

.module-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 1.2em;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border-bottom: 1px solid var(--color-border-lighter);
}

.card-header span {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-primary);
}

.function-group {
  margin-bottom: var(--spacing-xl);
  padding: 0 var(--spacing-xl);
}

.function-group:last-child {
  margin-bottom: var(--spacing-lg);
}

.function-group h4 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-size: 0.95em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  padding-left: var(--spacing-md);
}

.function-group h4::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: var(--color-primary);
  border-radius: 2px;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  align-items: stretch;
}

/* 单按钮布局 - 用于只有一个按钮的情况 */
.function-group:has(.button-grid .el-button:only-child) .button-grid,
.button-grid.single-button {
  grid-template-columns: 1fr;
}

/* 系统管理模块特殊布局 */
.module-card:nth-last-child(2) .button-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* 项目管理模块特殊布局 */
.module-card:last-child .button-grid {
  grid-template-columns: 1fr;
}

.button-grid .el-button {
  width: 100%;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--border-radius-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.button-grid .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.button-grid .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.button-grid .el-button:hover::before {
  left: 100%;
}

.button-grid .el-button:active {
  transform: translateY(-1px);
}

.response-card {
  margin-top: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.response-content {
  max-height: 500px;
  overflow-y: auto;
}

.response-content pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.api-info {
  background: #e8f5e8;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 4px solid #67c23a;
}

.error-info {
  background: #fef0f0;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
  border-left: 4px solid #f56c6c;
}

.api-info p, .error-info p {
  margin: 5px 0;
  font-size: 14px;
}


/* 数据库同步模块按钮网格优化 */
.module-card .function-group .button-grid {
  gap: var(--spacing-lg);
}

.module-card .function-group .button-grid .el-button {
  min-height: 52px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-modules {
    grid-template-columns: 1fr;
  }
  
  .button-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions .el-button {
    margin: 5px;
    width: calc(100% - 10px);
  }
  
}
</style>
