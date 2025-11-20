<template>
  <div class="data-connector-management">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      title="Data Connector Management"
      description="Create and manage Autodesk Construction Cloud data requests"
      :icon="IconSync"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 创建数据请求卡片 -->
    <el-card class="create-request-card" v-if="!showProjectSelection">
      <template #header>
        <div class="card-header">
          <icon-plus />
          创建数据请求
        </div>
      </template>
      <div class="create-request-content">
        <p>点击下方按钮选择项目并创建数据请求</p>
        <el-button type="primary" size="large" @click="startProjectSelection" :loading="loading">
          <icon-folder />
          选择项目创建请求
        </el-button>
      </div>
    </el-card>

    <!-- 项目选择界面 -->
    <div v-if="showProjectSelection" class="project-selection-section">
      <!-- 项目选择卡片 -->
      <el-card class="project-selection-card">
        <template #header>
          <div class="card-header">
            <icon-folder />
            选择项目
            <div class="header-actions">
              <el-button @click="cancelProjectSelection" size="small">cancel</el-button>
            </div>
          </div>
        </template>

        <!-- 加载状态 -->
        <LoadingState 
          v-if="loadingProjects"
          type="card"
          title="Getting Project List"
          text="Please wait, getting project information from Data Connector API..."
          :show-progress="false"
          :show-cancel="false" />

        <!-- 项目列表 -->
        <div v-else-if="availableProjects.length > 0" class="project-list">
          <div class="project-stats">
            <StatusTag status="info" :text="`Total Projects: ${availableProjects.length}`" size="small" :show-icon="false" />
            <StatusTag status="success" :text="`Active Projects: ${activeProjectsCount}`" size="small" :show-icon="false" />
            <StatusTag status="info" :text="`Selected: ${selectedProjects.length}`" size="small" :show-icon="false" />
          </div>

          <el-table
            :data="availableProjects"
            @selection-change="handleProjectSelectionChange"
            style="width: 100%; margin-top: 20px;"
            stripe>
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="Project Name" min-width="200" show-overflow-tooltip />
            <el-table-column prop="id" label="Project ID" width="280" show-overflow-tooltip>
              <template #default="scope">
                <StatusTag status="info" :text="formatProjectId(scope.row.id)" size="small" :show-icon="false" />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="100">
              <template #default="scope">
                <StatusTag 
                  :status="scope.row.isActive ? 'active' : 'inactive'"
                  :text="scope.row.status || (scope.row.isActive ? 'Active' : 'Paused')"
                  size="small"
                  :show-icon="false" />
              </template>
            </el-table-column>
            <el-table-column prop="type" label="Type" width="150" show-overflow-tooltip />
          </el-table>

          <!-- 批量操作 -->
          <div class="batch-actions">
            <el-button @click="selectAllActiveProjects" type="info" size="small">
              选择所有活跃项目
            </el-button>
            <el-button @click="clearSelection" size="small">
              清空选择
            </el-button>
          </div>
        </div>

        <!-- 无项目状态 -->
        <div v-else class="no-projects">
          <el-empty description="No available projects found" />
        </div>
      </el-card>

      <!-- 请求配置卡片 -->
      <el-card class="request-config-card" v-if="selectedProjects.length > 0">
        <template #header>
          <div class="card-header">
            <icon-settings />
            请求配置
          </div>
        </template>

        <el-form :model="requestConfig" label-width="120px">
          <el-form-item label="Description">
            <el-input v-model="requestConfig.description" placeholder="Data request description" />
          </el-form-item>
          
          <el-form-item label="Request Type">
            <el-radio-group v-model="requestConfig.isOneTime">
              <el-radio :label="true">立即执行一次</el-radio>
              <el-radio :label="false">定期执行</el-radio>
            </el-radio-group>
            <div class="form-help-text">
              <span v-if="requestConfig.isOneTime" style="color: #409eff;">
                ✅ 将立即执行数据提取，无需等待调度
              </span>
              <span v-else style="color: #909399;">
                ⏰ 按设定的间隔定期执行数据提取
              </span>
            </div>
          </el-form-item>
          
          <!-- 定期执行的配置 -->
          <div v-if="!requestConfig.isOneTime">
          <el-form-item label="Schedule Interval">
            <el-select v-model="requestConfig.scheduleInterval">
              <el-option label="Daily" value="DAY" />
              <el-option label="Weekly" value="WEEK" />
              <el-option label="Monthly" value="MONTH" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Interval Count">
            <el-input-number v-model="requestConfig.reoccuringInterval" :min="1" :max="30" />
              <div class="form-help-text">
                每 {{ requestConfig.reoccuringInterval }} {{ getIntervalText() }} 执行一次
              </div>
            </el-form-item>
            
            <el-form-item label="Duration">
              <el-input-number v-model="requestConfig.duration" :min="1" :max="365" />
              <div class="form-help-text">
                {{ getDurationText() }}
              </div>
          </el-form-item>
          </div>
          
          <el-form-item label="Service Groups">
            <el-checkbox-group v-model="requestConfig.serviceGroups">
              <el-checkbox label="all">All Services (包含Reviews等所有数据)</el-checkbox>
              <el-checkbox label="admin">Admin</el-checkbox>
              <el-checkbox label="issues">Issues</el-checkbox>
              <el-checkbox label="locations">Locations</el-checkbox>
              <el-checkbox label="submittals">Submittals</el-checkbox>
              <el-checkbox label="cost">Cost</el-checkbox>
              <el-checkbox label="rfis">RFIs</el-checkbox>
              <el-checkbox label="forms">Forms</el-checkbox>
            </el-checkbox-group>
            <div class="form-help-text">
              💡 Tip: Selecting "All Services" will extract data from all available service groups, including services like Reviews that are not listed separately
            </div>
          </el-form-item>
        </el-form>

        <div class="create-actions">
          <el-button @click="testRequestFormat" :loading="testing" size="large" style="margin-right: 10px;">
            <icon-bug />
            测试请求格式
          </el-button>
          <el-button type="primary" @click="createBatchRequest" :loading="creating" size="large">
            <icon-check />
            为 {{ selectedProjects.length }} 个项目创建请求
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 现有请求列表 -->
    <el-card class="requests-list-card" v-if="!showProjectSelection">
      <template #header>
        <div class="card-header">
          <icon-list />
          数据请求列表
        <div class="header-actions">
          <el-button @click="showRecycleBin" size="small" style="margin-right: 8px;">
            <icon-folder />
            回收站
          </el-button>
          <el-button @click="refreshRequests" :loading="loading" size="small">
            <icon-refresh />
            刷新
          </el-button>
        </div>
        </div>
      </template>

      <!-- 请求列表 -->
      <div v-if="activeRequests.length > 0">
        <el-table :data="activeRequests" style="width: 100%">
          <el-table-column prop="description" label="Description" min-width="200" />
          <el-table-column prop="createdAt" label="Created Time" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="scheduleInterval" label="Interval" width="100" />
          <el-table-column prop="nextExecAt" label="Next Execution" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.nextExecAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="Status" width="100">
            <template #default="scope">
              <StatusTag 
                :status="scope.row.isActive !== false ? 'active' : 'inactive'"
                :text="scope.row.isActive !== false ? 'Active' : 'Paused'"
                size="small"
                :show-icon="false" />
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="360">
            <template #default="scope">
              <el-button type="text" size="small" @click="checkJobStatus(scope.row)" style="margin-right: 8px;">
                <icon-refresh />
                查看状态
              </el-button>
              <el-button type="text" size="small" @click="addToMonitoring(scope.row.id, scope.row.description)" style="margin-right: 8px;">
                <icon-plus />
                加入监测
              </el-button>
              <el-button type="text" size="small" @click="deleteRequest(scope.row)" style="color: #f56c6c;">
                <icon-delete />
                删除请求
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div v-else>
        <el-empty description="No data requests" />
      </div>
    </el-card>

    <!-- 错误状态 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin-top: 20px">
    </el-alert>


    <!-- 回收站弹窗 -->
    <el-dialog 
      v-model="showRecycleBinDialog" 
      title="🗂️ Historical Data Requests" 
      width="900px"
      :close-on-click-modal="false">
      <div v-if="recycleBin.length > 0">
        <el-table :data="recycleBin" style="width: 100%">
          <el-table-column prop="description" label="Description" min-width="200" />
          <el-table-column prop="createdAt" label="Created Time" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="completedAt" label="Completed Time" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.completedAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="downloadCount" label="Download Count" width="100">
            <template #default="scope">
              <StatusTag status="info" :text="String(scope.row.downloadCount || 0)" size="small" :show-icon="false" />
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="200">
            <template #default="scope">
              <el-button type="text" size="small" @click="checkJobStatus(scope.row)" style="margin-right: 8px;">
                <icon-refresh />
                查看状态
              </el-button>
              <el-button type="text" size="small" @click="restoreFromRecycleBin(scope.row)" style="color: #67c23a;">
                恢复监测
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else>
        <el-empty description="Recycle bin is empty">
          <template #description>
            <p>暂无已完成的历史数据请求</p>
            <p>当数据请求完成并下载后，会自动进入回收站</p>
          </template>
        </el-empty>
      </div>
      <template #footer>
        <el-button @click="showRecycleBinDialog = false">关闭</el-button>
        <el-button type="danger" @click="clearRecycleBin">清空回收站</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import StatusTag from '../components/StatusTag.vue'
import { 
  IconSync, 
  IconPlus, 
  IconFolder,
  IconSettings, 
  IconCheck, 
  IconList, 
  IconRefresh,
  IconHome,
  IconDelete
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'DataConnectorSync',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    StatusTag,
    IconSync,
    IconPlus,
    IconFolder,
    IconSettings,
    IconCheck,
    IconList,
    IconRefresh,
    IconHome,
    IconDelete
  },
  data() {
    return {
      loading: false,
      loadingProjects: false,
      creating: false,
      testing: false,
      error: null,
      showProjectSelection: false,
      
      // 项目相关
      availableProjects: [],
      selectedProjects: [],
      
      // 请求配置
      requestConfig: {
        description: 'Data Extract Request',
        isOneTime: true,  // 默认为一次性请求
        scheduleInterval: 'WEEK',
        reoccuringInterval: 1,
        duration: 30,  // 默认持续30天/周/月
        serviceGroups: ['all']
      },
      
      // 现有请求
      requests: [],
      
      // 回收站相关
      recycleBin: [], // 已完成的请求存储
      showRecycleBinDialog: false
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          text: 'Back to Home',
          type: 'default',
          icon: 'Home',
          action: 'home'
        }
      ]
    },

    // 过滤活跃的请求
    activeRequests() {
      return this.requests.filter(request => request.isActive !== false)
    },
    
    activeProjectsCount() {
      return this.availableProjects.filter(p => p.isActive).length
    }
  },
  mounted() {
    this.loadRequests()
  },
  methods: {
    // 页面头部操作
    handleHeaderAction(action) {
      switch (action) {
        case 'home':
          this.$router.push('/')
          break
      }
    },

    // 开始项目选择
    async startProjectSelection() {
      this.showProjectSelection = true
      this.loadingProjects = true
      this.error = null
      
      try {
        const response = await axios.get('/api/auth/projects')
        
        if (response.data.status === 'success') {
          this.availableProjects = response.data.projects.list
        } else {
          throw new Error(response.data.error || 'Failed to get project list')
        }
      } catch (error) {
        console.error('获取项目列表失败:', error)
        this.error = error.response?.data?.error || error.message
      } finally {
        this.loadingProjects = false
      }
    },

    // cancel项目选择
    cancelProjectSelection() {
      this.showProjectSelection = false
      this.selectedProjects = []
      this.availableProjects = []
    },

    // 处理项目选择变化
    handleProjectSelectionChange(selection) {
      this.selectedProjects = selection.map(project => project.id)
    },

    // 选择所有活跃项目
    selectAllActiveProjects() {
      const activeProjects = this.availableProjects.filter(p => p.isActive)
      this.$refs.projectTable && this.$refs.projectTable.toggleAllSelection()
      // 由于Element UI的限制，这里需要手动设置选择状态
      this.selectedProjects = activeProjects.map(p => p.id)
    },

    // 清空选择
    clearSelection() {
      this.$refs.projectTable && this.$refs.projectTable.clearSelection()
      this.selectedProjects = []
    },

    // 测试请求格式
    async testRequestFormat() {
      if (this.selectedProjects.length === 0) {
        this.$message.warning('Please select at least one project')
        return
      }

      this.testing = true
      this.error = null

      try {
        const requestData = {
          selectedProjects: this.selectedProjects,
          requestConfig: this.requestConfig
        }

        const response = await axios.post('/api/data-connector/test-request', requestData)

        if (response.data.status === 'success') {
          const { validation_errors, is_valid, test_config } = response.data
          
          if (is_valid) {
            this.$alert(`✅ 请求格式验证通过！\n\n配置预览:\n${JSON.stringify(test_config, null, 2)}`, '格式验证结果', {
              confirmButtonText: 'OK',
              type: 'success'
            })
          } else {
            const errorMsg = `❌ 请求格式验证失败:\n\n${validation_errors.join('\n')}\n\n配置预览:\n${JSON.stringify(test_config, null, 2)}`
            this.$alert(errorMsg, '格式验证结果', {
              confirmButtonText: 'OK',
              type: 'warning'
            })
          }
        } else {
          throw new Error(response.data.error || 'Failed to test request format')
        }
      } catch (error) {
        console.error('测试请求格式失败:', error)
        this.error = error.response?.data?.error || error.message
      } finally {
        this.testing = false
      }
    },

    // 创建批量请求
    async createBatchRequest() {
      if (this.selectedProjects.length === 0) {
        this.$message.warning('Please select at least one project')
        return
      }

      this.creating = true
      this.error = null

      try {
        const requestData = {
          selectedProjects: this.selectedProjects,
          requestConfig: this.requestConfig
        }

        const response = await axios.post('/api/data-connector/create-batch', requestData)

        if (response.data.status === 'success') {
          const requestId = response.data.request_id
          
          // 计算预估执行时间
          const estimatedTime = this.getEstimatedExecutionTime()
          
          this.$message.success(response.data.message + `\n🤖 已自动开始监测下载状态\n⏰ 预计${estimatedTime}后开始执行`)
          
          // 添加到自动监测列表
          this.addToMonitoring(requestId, this.requestConfig.description)
          
          this.showProjectSelection = false
          this.selectedProjects = []
          this.availableProjects = []
          this.loadRequests() // 刷新请求列表
        } else {
          throw new Error(response.data.error || 'Failed to create request')
        }
      } catch (error) {
        console.error('创建批量请求失败:', error)
        this.error = error.response?.data?.error || error.message
        
        // 特殊处理403权限错误
        if (error.response?.status === 403) {
          const errorData = error.response.data
          let errorMessage = errorData.error || 'Insufficient permissions'
          
          if (errorData.suggestions && errorData.suggestions.length > 0) {
            errorMessage += '\n\n解决建议:\n' + errorData.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')
          }
          
          this.$alert(errorMessage, '权限错误 (HTTP 403)', {
            confirmButtonText: 'Re-authenticate',
            cancelButtonText: 'Close',
            type: 'error',
            showCancelButton: true
          }).then(() => {
            // 用户选择重新认证
            window.location.href = '/api/auth/start'
          }).catch(() => {
            // 用户选择关闭
          })
        } else {
          // 显示详细的错误信息
          if (error.response?.data?.debug_info) {
            const debugInfo = error.response.data.debug_info
            console.log('Debug Info:', debugInfo)
          }
        }
      } finally {
        this.creating = false
      }
    },

    // 加载现有请求
    async loadRequests() {
      this.loading = true
      try {
        const response = await axios.get('/api/data-connector/requests')
        this.requests = response.data.results || []
      } catch (error) {
        console.error('加载请求列表失败:', error)
        // 不显示错误，因为可能是首次使用
        this.requests = []
      } finally {
        this.loading = false
      }
    },

    // 刷新请求列表
    refreshRequests() {
      this.loadRequests()
    },


    addToMonitoring(requestId, description) {
      // 查找请求的详细信息
      const request = this.requests.find(r => r.id === requestId)
      
      // 尝试多种可能的项目ID字段名
      let projectId = request?.projectIds?.[0] || 
                     request?.projectIdList?.[0] ||  // ACC API使用的字段名
                     request?.projectId || 
                     request?.project_id ||
                     request?.project?.id ||
                     request?.projects?.[0]?.id ||
                     (Array.isArray(request?.projects) ? request.projects[0] : request?.projects)
      
      // 如果项目ID不包含"b."前缀，添加前缀以匹配项目缓存格式
      if (projectId && !projectId.startsWith('b.')) {
        projectId = 'b.' + projectId
      }
      
      const requestData = {
        id: requestId,
        description: description,
        projectId: projectId,
        projectName: this.getProjectNameForRequest(requestId),
        createdAt: request?.createdAt || new Date().toISOString(),
        lastChecked: null,
        status: 'monitoring'
      }
      
      // 发送到全局监测面板
      if (this.$eventBus) {
        this.$eventBus.emit('add-to-global-monitoring', requestData)
        this.$message.success(`🤖 已添加到全局监测: "${description}"`)
      } else {
        this.$message.error('事件总线未初始化，无法添加到全局监测')
      }
    },


    // 获取请求对应的项目名称
    getProjectNameForRequest(requestId) {
      const request = this.requests.find(req => req.id === requestId)
      if (request && request.projectIds && request.projectIds.length > 0) {
        // 如果有多个项目，显示第一个项目名称和总数
        if (request.projectIds.length === 1) {
          return request.projectNames ? request.projectNames[0] : 'Unknown Project'
        } else {
          return `${request.projectNames ? request.projectNames[0] : '项目'} 等${request.projectIds.length}个项目`
        }
      }
      return 'Unknown Project'
    },


    // 查看请求状态
    async checkJobStatus(request) {
      console.log('查看请求状态:', request)
      
      try {
        const response = await axios.get(`/api/data-connector/requests/${request.id}/jobs`)
        
        if (response.data.status === 'success') {
          const jobs = response.data.jobs.results || []
          
          if (jobs.length === 0) {
            this.$alert(`📋 请求状态检查\n\n请求ID: ${request.id}\n描述: ${request.description}\n状态: 等待执行\n\n⏰ ACC Data Connector执行机制:\n• 系统按调度间隔执行作业（DAY/WEEK/MONTH）\n• 一次性请求也需要等待下一个调度窗口\n• DAY间隔通常在UTC 16:00左右执行（香港时间00:00）\n• 首次执行可能需要等待30分钟到数小时\n• 执行开始后5-15分钟内会生成数据文件\n\n💡 建议:\n• 点击"加入监测"启用自动监测和下载\n• 系统会在文件准备好后自动下载`, '请求状态', {
              confirmButtonText: 'OK',
              type: 'info'
            })
          } else {
            let statusText = `📋 请求执行状态\n\n请求ID: ${request.id}\n描述: ${request.description}\n作业数量: ${jobs.length}\n\n`
            
            jobs.forEach((job, index) => {
              statusText += `作业 ${index + 1}:\n`
              statusText += `  状态: ${job.status}\n`
              statusText += `  完成状态: ${job.completionStatus || '进行中'}\n`
              statusText += `  开始时间: ${job.startedAt ? new Date(job.startedAt).toLocaleString('zh-CN') : '未开始'}\n`
              statusText += `  完成时间: ${job.completedAt ? new Date(job.completedAt).toLocaleString('zh-CN') : '未完成'}\n\n`
            })
            
            // 检查是否有已完成的作业
            const completedJobs = jobs.filter(job => job.status === 'complete' && job.completionStatus === 'success')
            if (completedJobs.length > 0) {
              statusText += `🎉 有 ${completedJobs.length} 个作业已完成！`
              
              // 检查是否有ZIP文件可下载
              let hasDownloadableFiles = false
              for (const job of completedJobs) {
                try {
                  const filesResponse = await axios.get(`/api/data-connector/jobs/${job.id}/data-listing`)
                  if (filesResponse.data.status === 'success') {
                    const files = filesResponse.data.files || []
                    const zipFile = files.find(f => f.name.endsWith('.zip'))
                    if (zipFile) {
                      job.zipFile = zipFile
                      hasDownloadableFiles = true
                    }
                  }
                } catch (e) {
                  console.error('获取文件列表失败:', e)
                }
              }
              
              if (hasDownloadableFiles) {
                statusText += `\n\n💾 发现可下载的数据文件！`
                statusText += `\n\n💡 提示:\n• 可点击"查看详情"手动下载\n• 或点击"加入监测"启用自动下载`
                
                this.$confirm(statusText, '请求状态', {
                  confirmButtonText: 'View Details',
                  cancelButtonText: 'Close',
                  type: 'success'
                }).then(() => {
                  this.viewRequestDetails(request)
                }).catch(() => {
                  // 用户选择关闭
                })
                return
              }
            }
            
            statusText += `\n\n💡 提示: 可点击"加入监测"启用自动监测和下载`
            
            this.$alert(statusText, '请求状态', {
              confirmButtonText: 'OK',
              type: completedJobs.length > 0 ? 'success' : 'info'
            })
          }
        } else {
          throw new Error(response.data.error || 'Failed to get job status')
        }
      } catch (error) {
        console.error('查看请求状态失败:', error)
        this.$message.error('查看请求状态失败: ' + (error.response?.data?.error || error.message))
      }
    },

    // 查看请求详情
    async viewRequestDetails(request) {
      console.log('查看请求详情:', request)
      
      try {
        // 获取作业列表
        const jobsResponse = await axios.get(`/api/data-connector/requests/${request.id}/jobs`)
        
        if (jobsResponse.data.status === 'success') {
          const jobs = jobsResponse.data.jobs.results || []
          const completedJobs = jobs.filter(job => job.status === 'complete' && job.completionStatus === 'success')
          
          if (completedJobs.length > 0) {
            // 有已完成的作业，显示下载选项
            let downloadText = `📁 数据请求详情\n\n请求ID: ${request.id}\n描述: ${request.description}\n\n可下载的数据:\n`
            
            let jobsWithFiles = []
            for (let i = 0; i < completedJobs.length; i++) {
              const job = completedJobs[i]
              downloadText += `\n作业 ${i + 1} (${job.id}):\n`
              downloadText += `  完成时间: ${new Date(job.completedAt).toLocaleString('zh-CN')}\n`
              
              try {
                // 获取文件列表
                const filesResponse = await axios.get(`/api/data-connector/jobs/${job.id}/data-listing`)
                if (filesResponse.data.status === 'success') {
                  const files = filesResponse.data.files || []
                  downloadText += `  文件数量: ${files.length}\n`
                  
                  // 查找ZIP文件
                  const zipFile = files.find(f => f.name.endsWith('.zip'))
                  if (zipFile) {
                    downloadText += `  ZIP文件: ${zipFile.name} (${(zipFile.size / 1024).toFixed(1)}KB)\n`
                    job.zipFile = zipFile
                    jobsWithFiles.push(job)
                  }
                }
              } catch (e) {
                downloadText += `  文件信息获取失败\n`
              }
            }
            
            if (jobsWithFiles.length > 0) {
              downloadText += `\n💡 提示: 点击确定后可选择下载文件`
              
              this.$confirm(downloadText, '请求详情', {
                confirmButtonText: 'Download ZIP File',
                cancelButtonText: 'Close',
                type: 'success'
              }).then(() => {
                // 用户选择下载，找到第一个有ZIP文件的作业
                const jobWithZip = jobsWithFiles[0]
                if (jobWithZip) {
                  this.manualDownloadFile(jobWithZip.id, jobWithZip.zipFile.name)
                }
              }).catch(() => {
                // 用户cancel下载
              })
            } else {
              downloadText += `\n⚠️ 未找到可下载的ZIP文件`
              this.$alert(downloadText, '请求详情', {
                confirmButtonText: 'OK',
                type: 'info'
              })
            }
          } else {
            // 没有已完成的作业
            this.$alert(`📋 数据请求详情\n\n请求ID: ${request.id}\n描述: ${request.description}\n调度间隔: ${request.scheduleInterval}\n下次执行: ${this.formatDate(request.nextExecAt)}\n状态: ${request.isActive ? 'Active' : 'Paused'}\n\n当前没有已完成的数据提取作业。\n\n💡 建议点击"加入监测"启用自动监测`, '请求详情', {
              confirmButtonText: 'OK',
              type: 'info'
            })
          }
        }
      } catch (error) {
        console.error('查看请求详情失败:', error)
        this.$message.error('查看请求详情失败: ' + (error.response?.data?.error || error.message))
      }
    },

    // 手动下载文件
    async manualDownloadFile(jobId, filename) {
      const loadingMessage = this.$message.loading({
        content: `正在获取下载链接: ${filename}`,
        duration: 0
      })
      
      try {
        console.log(`手动下载文件: ${filename} (作业ID: ${jobId})`)
        
        // 获取下载链接
        const response = await axios.get(`/api/data-connector/jobs/${jobId}/data-download`, {
          params: { filename: filename }
        })
        
        if (response.data.status === 'success') {
          const downloadUrl = response.data.download_url
          
          loadingMessage.close()
          this.$message.success('获取下载链接成功，开始下载...')
          
          // 触发下载
          await this.triggerDownload(downloadUrl, filename)
        } else {
          throw new Error(response.data.error || 'Failed to get download link')
        }
      } catch (error) {
        loadingMessage.close()
        console.error('手动下载文件失败:', error)
        this.$message.error('下载失败: ' + (error.response?.data?.error || error.message))
      }
    },

    // 自动下载文件
    async autoDownloadFile(jobId, filename, description) {
      try {
        console.log(`🤖 自动下载文件: ${filename} (请求: ${description})`)
        
        // 获取下载链接
        const response = await axios.get(`/api/data-connector/jobs/${jobId}/data-download`, {
          params: { filename: filename }
        })
        
        if (response.data.status === 'success') {
          const downloadUrl = response.data.download_url
          
          // 自动触发下载
          await this.triggerDownload(downloadUrl, filename)
          console.log(`✅ 自动下载成功: ${filename}`)
          
        } else {
          throw new Error(response.data.error || 'Failed to get download link')
        }
      } catch (error) {
        console.error('自动下载失败:', error)
        
        // 下载失败时显示通知，但不中断监测
        this.$notify({
          title: '⚠️ 自动下载失败',
          message: `文件 "${filename}" 下载失败: ${error.message}`,
          type: 'warning',
          duration: 5000
        })
      }
    },



    // 触发文件下载
    async triggerDownload(url, filename) {
      try {
        // 方法1: 使用fetch下载并创建blob
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        // 创建隐藏的下载链接
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        link.style.display = 'none'
        
        // 添加到DOM，点击下载，然后移除
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理URL对象
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl)
        }, 1000)
        
        this.$message.success(`文件 ${filename} 下载开始`)
        
      } catch (error) {
        console.error('触发下载失败:', error)
        
        // 降级方案：直接打开链接
        try {
          const link = document.createElement('a')
          link.href = url
          link.target = '_blank'
          link.download = filename
          link.style.display = 'none'
          
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          this.$message.info(`已在新窗口打开下载链接，请手动保存文件`)
        } catch (fallbackError) {
          console.error('降级下载也失败:', fallbackError)
          this.$message.error('自动下载失败，请手动复制下载链接')
          
          // 最后的降级方案：复制链接到剪贴板
          this.copyToClipboard(url)
        }
      }
    },

    // 工具方法
    formatProjectId(id) {
      if (!id) return ''
      if (id.length > 20) {
        return `${id.substring(0, 8)}...${id.substring(id.length - 8)}`
      }
      return id
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleString('zh-CN')
      } catch (e) {
        return dateString
      }
    },

    // 获取间隔文本
    getIntervalText() {
      switch (this.requestConfig.scheduleInterval) {
        case 'DAY': return 'day'
        case 'WEEK': return 'week'
        case 'MONTH': return 'month'
        default: return 'time'
      }
    },

    // 获取持续时间描述
    getDurationText() {
      const duration = this.requestConfig.duration
      switch (this.requestConfig.scheduleInterval) {
        case 'DAY': 
          return `Duration ${duration} days`
        case 'WEEK': 
          return `Duration ${duration} weeks`
        case 'MONTH': 
          return `Duration ${duration} months`
        default: 
          return `Duration ${duration} cycles`
      }
    },

    // 显示监测列表弹窗
    showMonitoringList() {
      this.showMonitoringDialog = true
    },

    // 显示回收站弹窗
    showRecycleBin() {
      this.showRecycleBinDialog = true
    },

    // 移动请求到回收站
    moveToRecycleBin(requestId, requestInfo) {
      // 从现有请求列表中找到完整的请求信息
      const fullRequest = this.requests.find(req => req.id === requestId)
      if (fullRequest) {
        const recycleBinItem = {
          ...fullRequest,
          completedAt: new Date().toISOString(),
          downloadCount: 1,
          originalRequestInfo: requestInfo
        }
        
        // 添加到回收站，避免重复
        const existingIndex = this.recycleBin.findIndex(item => item.id === requestId)
        if (existingIndex >= 0) {
          this.recycleBin[existingIndex] = recycleBinItem
        } else {
          this.recycleBin.unshift(recycleBinItem)
        }
        
        // 从现有请求列表中移除
        const requestIndex = this.requests.findIndex(req => req.id === requestId)
        if (requestIndex >= 0) {
          this.requests.splice(requestIndex, 1)
        }
        
        console.log('请求已移入回收站:', requestId)
      }
    },

    // 从回收站恢复监测
    restoreFromRecycleBin(request) {
      this.addToMonitoring(request.id, request.description)
      this.$message.success(`已从回收站恢复监测: "${request.description}"`)
    },

    // 清空回收站
    clearRecycleBin() {
      this.$confirm('确定要清空回收站吗？此操作不可撤销。', '确认清空', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.recycleBin = []
        this.$message.success('回收站已清空')
      }).catch(() => {
        // 用户cancel
      })
    },

    // 删除请求
    async deleteRequest(request) {
      try {
        const result = await this.$confirm(
          `确定要删除请求 "${request.description}" 吗？此操作将停用该请求。`,
          '删除确认',
          {
            confirmButtonText: 'Confirm Delete',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )

        if (result === 'confirm') {
          const response = await axios.delete(`/api/data-connector/requests/${request.id}`)
          
          if (response.data.status === 'success') {
            this.$message.success('请求已成功停用，状态已更新为"暂停"')
            this.loadRequests()
          } else {
            this.$message.error('删除失败: ' + response.data.error)
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除请求失败:', error)
          this.$message.error('删除失败: ' + (error.response?.data?.error || error.message))
        }
      }
    },

    // 获取预估执行时间
    getEstimatedExecutionTime() {
      const now = new Date()
      const currentHour = now.getUTCHours()
      
      if (this.requestConfig.isOneTime) {
        // 一次性请求的预估时间
        if (currentHour >= 15 && currentHour <= 17) {
          // 在调度窗口内，可能很快执行
          return '5-15分钟'
        } else if (currentHour < 15) {
          // 需要等到下午的调度窗口
          const hoursToWait = 16 - currentHour
          return `${hoursToWait}小时左右`
        } else {
          // 需要等到明天的调度窗口
          const hoursToWait = 24 - currentHour + 16
          return `${hoursToWait}小时左右`
        }
      } else {
        // 定期请求的预估时间
        const interval = this.requestConfig.scheduleInterval
        if (interval === 'DAY') {
          return '最多24小时'
        } else if (interval === 'WEEK') {
          return '最多7天'
        } else {
          return '最多30天'
        }
      }
    }
  }
}
</script>

<style scoped>
.data-connector-management {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
}

.create-request-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.create-request-content {
  text-align: center;
  padding: 40px;
}

.create-request-content p {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
}

.project-selection-section {
  margin-bottom: 20px;
}

.project-selection-card,
.request-config-card,
.requests-list-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.loading-container {
  height: 200px;
  position: relative;
}

.project-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.batch-actions {
  margin-top: 20px;
  text-align: right;
}

.batch-actions .el-button {
  margin-left: 10px;
}

.create-actions {
  text-align: center;
  margin-top: 20px;
}

.no-projects {
  text-align: center;
  padding: 40px;
}

.form-help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-connector-management {
    padding: 10px;
  }
  
  .project-stats {
    flex-direction: column;
    gap: 5px;
  }
  
  .batch-actions {
    text-align: center;
  }
  
  .batch-actions .el-button {
    margin: 5px;
    width: calc(50% - 10px);
  }
}
</style>
