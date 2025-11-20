<template>
  <div class="issues">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="t('issues.title')"
      :description="t('issues.description')"
      :tag="t('issues.tag')"
      tag-type="warning"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 统计信息区域 -->
    <StatsSection 
      v-if="issuesData && !loading && !error"
      :stats="headerStats" 
      @stat-click="handleStatClick" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="t('issues.loading.title')"
      :text="t('issues.loading.text')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="t('issues.error.title')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="issuesData && !loading && !error"
      status="success"
      :title="t('issues.success.title')"
      :description="t('issues.success.description', { count: issuesData.issues?.length || 0 })"
      :details="t('issues.success.lastUpdated', { time: new Date().toLocaleString() })"
      size="default"
      :autoHide="true"
      :autoHideDelay="2000"
      style="margin-bottom: 24px;" />

    <!-- 查询信息卡片 -->
    <QueryInfoCard
      v-if="issuesData && !loading && !error"
      :title="t('issues.queryInfo.title')"
      api-endpoint="/api/issues/projects/{projectId}/list"
      :description="t('issues.queryInfo.description')"
      :result-count="issuesData.issues?.length || 0"
      :result-unit="t('issues.queryInfo.resultUnit')"
      :custom-fields="getIssuesQueryFields()" />

    <!-- 议题详情弹窗 -->
    <el-dialog
      v-if="showIssueDialog && selectedIssue"
      v-model="showIssueDialog"
      :title="`Issue Details - #${selectedIssue?.displayId || ''} ${selectedIssue?.title || ''}`"
      width="85%"
      :before-close="handleCloseDialog"
      draggable
      destroy-on-close
      class="issue-dialog"
      :key="`dialog-${dialogKey}`">
      <div class="dialog-content">
        <IssueDetail 
          :issue="selectedIssue" 
          :project="currentProject"
          :key="`detail-${dialogKey}`" />
      </div>
    </el-dialog>

    <!-- 议题数据内容 -->
    <div v-if="issuesData && !loading && !error">
      
      <!-- 议题元数据面板 -->
      <BaseCard 
        :title="t('issues.metadata.title')"
        :show-header="true"
        :collapsible="true"
        :default-collapsed="false"
        style="margin-bottom: 24px;">
        <IssueMetadataPanel 
          :project-id="currentProject.id"
          :auto-load="true"
          @data-loaded="handleMetadataLoaded"
          @data-error="handleMetadataError" />
      </BaseCard>


      <!-- 议题数据表格 -->
      <DataTable
        :key="`issues-table-${issuesData?.timestamp || 'default'}`"
        :data="issuesData.issues || []"
        :columns="tableColumns"
        :loading="loading"
        :title="t('issues.table.tableTitle')"
        :description="t('issues.table.tableDescription')"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        row-key="id"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- 议题ID列 -->
        <template #display-id="{ row }">
          <StatusTag 
            status="info" 
            :text="`#${row.displayId}`"
            size="small" 
            :show-icon="false" />
        </template>
        
        <!-- 议题状态列 -->
        <template #status="{ row }">
          <StatusTag
            :status="getIssueStatusType(row.status)"
            :text="getIssueStatusText(row.status)"
            size="small"
            :show-icon="true" />
        </template>
        
        <!-- 议题类型列 -->
        <template #issue-type="{ row }">
          <el-tag 
            v-if="row.issueTypeId" 
            :type="getIssueTypeTagType(row.issueTypeId)"
            size="small"
            class="issue-type-tag">
            {{ getIssueTypeName(row.issueTypeId, row.issueSubtypeId) }}
          </el-tag>
          <span v-else class="text-muted">{{ t('issues.status.uncategorized') }}</span>
        </template>
        
        <!-- 根本原因列 -->
        <template #root-cause="{ row }">
          <el-tag 
            v-if="row.rootCauseId" 
            :type="getRootCauseTagType(row.rootCauseId)"
            size="small"
            class="root-cause-tag">
            {{ getRootCauseName(row.rootCauseId) }}
          </el-tag>
          <span v-else class="text-muted">{{ t('issues.status.notSet') }}</span>
        </template>
        
        <!-- 优先级列 -->
        <template #priority="{ row }">
          <StatusTag
            v-if="row.priority"
            :status="getPriorityType(row.priority)"
            :text="getPriorityText(row.priority)"
            size="small"
            :show-icon="false" />
          <span v-else class="text-muted">-</span>
        </template>
        
        <!-- 分配人列 -->
        <template #assigned-to="{ row }">
          <div v-if="row.assignedTo" class="assigned-info">
            <div class="assigned-name">
              <span class="user-name">{{ getAssignedToName(row.assignedTo, row.assignedToType) }}</span>
              <span class="user-id">{{ row.assignedTo }}</span>
            </div>
            <el-tag 
              :type="getAssignedToTypeTagType(row.assignedToType)"
              size="small"
              class="assigned-type-tag">
              {{ getAssignedToTypeText(row.assignedToType) }}
            </el-tag>
          </div>
          <el-tag v-else type="info" size="small">{{ t('issues.status.unassigned') }}</el-tag>
        </template>
        
        <!-- 创建者列 -->
        <template #created-by="{ row }">
          <div class="user-info">
            <span class="user-name">{{ getUserName(row.createdBy) }}</span>
            <span class="user-id">{{ row.createdBy || 'N/A' }}</span>
          </div>
        </template>
        
        <!-- 到期时间列 -->
        <template #due-date="{ row }">
          <div class="due-date-info">
            <div v-if="row.dueDate && row.dueDate !== 'N/A'" class="due-date-content">
              <div class="due-date-text">{{ formatDate(row.dueDate) }}</div>
            </div>
            <div v-else class="no-due-date">
              <span class="text-muted">-</span>
            </div>
          </div>
        </template>
        
        <!-- 创建时间列 -->
        <template #created-at="{ row }">
          <span class="timestamp">{{ formatDateTime(row.createdAt) }}</span>
        </template>
        
        <!-- 开始时间列 -->
        <template #start-date="{ row }">
          <div v-if="row.startDate && row.startDate !== 'N/A'" class="start-date-content">
            <span class="timestamp">{{ formatDate(row.startDate) }}</span>
          </div>
          <el-tag v-else type="info" size="small">{{ t('issues.status.notSet') }}</el-tag>
        </template>
        
        <!-- 更新时间列 -->
        <template #updated-at="{ row }">
          <span class="timestamp">{{ formatDateTime(row.updatedAt) }}</span>
        </template>
        
      </DataTable>
      
      
      <!-- 原始数据 -->
      <BaseCard 
        :title="t('issues.rawData.title')"
        :show-header="true"
        :collapsible="true"
        :default-collapsed="true"
        style="margin-top: 24px;">
        <JsonViewer 
          :data="issuesData.raw_data || issuesData"
          :title="t('issues.rawData.description')"
          :max-height="600" />
      </BaseCard>
    </div>

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
import { ref, reactive, onMounted, computed, nextTick, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import StatusIndicator from '../components/StatusIndicator.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import DataTable from '../components/DataTable.vue'
import BaseCard from '../components/BaseCard.vue'
import JsonViewer from '../components/JsonViewer.vue'
import IssueDetail from '../components/IssueDetail.vue'
import IssueMetadataPanel from '../components/IssueMetadataPanel.vue'
import StatsSection from '../components/StatsSection.vue'
import ProjectSelector from '../components/ProjectSelector.vue'
import StatusTag from '../components/StatusTag.vue'
import projectStore from '../utils/projectStore.js'
import userCache from '../utils/userCache.js'
import entityCache from '../utils/entityCache.js'
import issueTypeCache from '../utils/issueTypeCache.js'
import rootCauseCache from '../utils/rootCauseCache.js'

// entityCache 导入（临时禁用，使用简化方案）
import { formatDateTime, formatDueDate } from '../utils/dateUtils.js'

// 图标导入
import { 
  Warning as IconIssue,
  Refresh,
  Download,
  Setting,
  View,
  Search,
  Filter,
  ChatDotRound,
  Paperclip,
  Clock,
  User,
  Link
} from '@element-plus/icons-vue'

export default {
  name: 'IssuesData',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    ErrorState,
    StatusIndicator,
    QueryInfoCard,
    DataTable,
    BaseCard,
    JsonViewer,
    IssueDetail,
    IssueMetadataPanel,
    StatsSection,
    ProjectSelector,
    StatusTag
  },
  setup() {
    const router = useRouter()
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const issuesData = ref(null)
    const showIssueDialog = ref(false)
    const selectedIssue = ref(null)
    const dialogKey = ref(0) // Force dialog recreation
    
    // 项目相关
    const currentProject = ref(null)
    const showProjectSelector = ref(false)
    
    // 标记面板相关
    
    // 页面头部配置
    const headerButtons = reactive([
      {
        text: t('issues.actions.refresh'),
        type: 'primary',
        icon: Refresh,
        action: 'refresh'
      },
      {
        text: t('issues.actions.sync'),
        type: 'success',
        icon: Download,
        action: 'sync'
      },
      {
        text: t('issues.actions.export'),
        type: 'default',
        icon: Download,
        action: 'export'
      },
      {
        text: t('issues.actions.settings'),
        type: 'default',
        icon: Setting,
        action: 'settings'
      }
    ])
    
    // 计算属性：头部统计
    const headerStats = computed(() => {
      if (!issuesData.value?.statistics) return []
      
      const stats = issuesData.value.statistics
      const headerStatsArray = [
        {
          label: t('issues.statistics.totalIssues'),
          value: stats.total_issues || 0,
          type: 'primary',
          icon: '🎯',
          description: t('issues.statistics.totalIssues'),
          clickable: false
        },
        {
          label: t('issues.statistics.openIssues'),
          value: stats.status_breakdown?.open || 0,
          type: 'warning',
          icon: '🔓',
          description: t('issues.statistics.openIssues'),
          clickable: true
        },
        {
          label: t('issues.statistics.inProgress'),
          value: stats.status_breakdown?.in_progress || 0,
          type: 'success',
          icon: '⚡',
          description: t('issues.statistics.inProgress'),
          clickable: true
        },
        {
          label: t('issues.statistics.closed'),
          value: stats.status_breakdown?.closed || 0,
          type: 'info',
          icon: '✅',
          description: t('issues.statistics.closed'),
          clickable: true
        }
      ]
      
      // 添加最近活动统计
      if (stats.recent_activity) {
        headerStatsArray.push({
          label: t('issues.statistics.recentActivity'),
          value: stats.recent_activity.created_last_7_days || 0,
          type: 'danger',
          icon: '🆕',
          description: t('issues.statistics.recentActivity'),
          clickable: false
        })
      }
      
      return headerStatsArray
    })
    
    // 表格配置 - 基于 JSON 数据结构优化
    const tableColumns = computed(() => [
      {
        prop: 'displayId',
        label: t('issues.table.issueId'),
        width: 100,
        slot: 'display-id',
        sortable: true
      },
      {
        prop: 'title',
        label: t('issues.table.title'),
        minWidth: 200,
        sortable: true
      },
      {
        prop: 'status',
        label: t('issues.table.status'),
        width: 120,
        slot: 'status',
        sortable: true
      },
      {
        prop: 'issueTypeId',
        label: t('issues.table.type'),
        width: 140,
        slot: 'issue-type',
        sortable: false
      },
      {
        prop: 'rootCauseId',
        label: t('issues.table.rootCause'),
        width: 160,
        slot: 'root-cause',
        sortable: false
      },
      {
        prop: 'assignedTo',
        label: t('issues.table.assignedTo'),
        width: 200,
        slot: 'assigned-to'
      },
      {
        prop: 'createdBy',
        label: t('issues.table.createdBy'),
        width: 150,
        slot: 'created-by'
      },
      {
        prop: 'dueDate',
        label: t('issues.table.dueDate'),
        width: 120,
        slot: 'due-date',
        sortable: true,
        align: 'center'
      },
      {
        prop: 'startDate',
        label: t('issues.table.startDate'),
        width: 120,
        slot: 'start-date',
        sortable: true,
        align: 'center'
      },
      {
        prop: 'updatedAt',
        label: t('issues.table.updatedAt'),
        width: 140,
        slot: 'updated-at',
        sortable: true,
        align: 'center'
      }
    ])
    
    const tableActions = computed(() => [
      {
        text: t('issues.actions.search'),
        type: 'primary',
        icon: Search,
        action: 'search'
      },
      {
        text: t('issues.actions.filter'),
        type: 'default',
        icon: Filter,
        action: 'filter'
      }
    ])
    
    const rowOperations = computed(() => [
      {
        text: t('issues.actions.viewDetails'),
        type: 'primary',
        icon: View,
        action: 'view'
      },
      {
        text: t('issues.actions.detailPage'),
        type: 'success',
        icon: View,
        action: 'detail-page'
      }
    ])
    
    // 错误处理配置
    const errorSuggestions = computed(() => t('issues.error.suggestions'))
    
    const errorButtons = computed(() => [
      {
        text: t('common.login'),
        type: 'primary',
        action: 'reauth'
      },
      {
        text: t('common.retry'),
        type: 'default',
        action: 'retry'
      }
    ])
    
    // 获取议题数据
    const fetchIssuesData = async () => {
      if (!currentProject.value) {
        error.value = t('issues.messages.projectRequired')
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('开始获取议题数据...', '项目:', currentProject.value.name)
      
      try {
        // 🔑 关键：预加载实体缓存数据
        console.log('🏢 预加载项目实体缓存数据...')
        const entityCachePromise = entityCache.getProjectEntities(currentProject.value.id)
        
        // 优化：使用单一API调用获取议题列表和统计信息
        const response = await axios.get(`/api/issues/projects/${currentProject.value.id}/list`, {
          timeout: 30000,
          params: {
            _t: Date.now(), // 防止缓存
            limit: 100, // 优化：减少请求量，提高响应速度
            include_stats: 'true' // 包含快速统计信息
          }
        })
        
        // 等待实体缓存加载完成
        await entityCachePromise
        
        if (response.data.status === 'success') {
          // 组合数据
          const combinedData = {
            issues: response.data.data.results || [],
            statistics: response.data.quick_statistics || null, // 使用快速统计
            pagination: response.data.pagination,
            project_id: currentProject.value.id,
            timestamp: new Date().toISOString(),
            raw_data: response.data.data,
            response_time: response.data.response_time_seconds
          }
          
          issuesData.value = combinedData
          
          console.log('议题数据获取成功:', {
            issues: combinedData.issues.length,
            statistics: combinedData.statistics,
            responseTime: combinedData.response_time
          })
          
          const responseTimeText = combinedData.response_time ? ` (${combinedData.response_time}s)` : ''
          ElMessage.success(t('issues.messages.loadSuccess') + `, total ${combinedData.issues.length} issues${responseTimeText}`)
        } else {
          throw new Error(response.data.error || t('issues.messages.loadFailed'))
        }
      } catch (err) {
        console.error('获取议题数据失败:', err)
        error.value = err.response?.data?.error || err.message || t('issues.messages.loadFailed')
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }
    
    // 增量同步议题
    const syncIssuesData = async () => {
      if (!currentProject.value) {
        ElMessage.warning(t('issues.messages.projectRequired'))
        return
      }

      loading.value = true
      
      try {
        console.log('开始增量同步议题数据...')
        
        // 获取上次同步时间
        const lastSyncTime = issuesData.value?.sync_info?.sync_time || 
                            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        
        const response = await axios.get(`/api/issues/projects/${currentProject.value.id}/sync`, {
          timeout: 60000,
          params: {
            lastSyncTime: lastSyncTime,
            batchSize: 100,
            includeDetails: 'true'
          }
        })
        
        if (response.data.status === 'success') {
          const syncResult = response.data.sync_result
          
          // 更新数据
          const updatedData = {
            ...issuesData.value,
            issues: syncResult.issues || [],
            statistics: syncResult.statistics,
            sync_info: {
              sync_time: syncResult.sync_time,
              last_sync_time: syncResult.last_sync_time,
              sync_type: 'Incremental Sync'
            },
            timestamp: new Date().toISOString()
          }
          
          issuesData.value = updatedData
          
          ElMessage.success(t('issues.messages.syncSuccess', { count: syncResult.total_issues }))
        } else {
          throw new Error(response.data.error || t('issues.messages.syncFailed'))
        }
      } catch (err) {
        console.error('增量同步失败:', err)
        ElMessage.error(err.response?.data?.error || err.message || t('issues.messages.syncFailed'))
      } finally {
        loading.value = false
      }
    }
    
    // cancel加载
    const cancelLoading = () => {
      loading.value = false
      ElMessage.info(t('issues.messages.cancelLoading'))
    }
    
    // 处理头部操作
    const handleHeaderAction = (action) => {
      switch (action) {
        case 'refresh':
          fetchIssuesData()
          break
        case 'sync':
          syncIssuesData()
          break
        case 'export':
          exportIssuesData()
          break
        case 'settings':
          ElMessage.info(t('common.info'))
          break
      }
    }
    
    // 处理错误操作
    const handleErrorAction = (action) => {
      switch (action) {
        case 'reauth':
          window.location.href = '/login'
          break
        case 'retry':
          fetchIssuesData()
          break
      }
    }
    
    // 处理表格操作
    const handleTableAction = (action) => {
      switch (action) {
        case 'search':
          ElMessage.info(t('common.info'))
          break
        case 'filter':
          ElMessage.info(t('common.info'))
          break
      }
    }
    
    // 处理行操作
    const handleRowOperation = (action, button, index) => {
      console.log('Row operation triggered:', action, button, index)
      
      const actualAction = action.split(':')[0]
      const row = button.row
      
      if (!row) {
        ElMessage.error('Unable to get row data')
        return
      }
      
      switch (actualAction) {
        case 'view':
          // 打开议题详情弹窗
          selectedIssue.value = null
          showIssueDialog.value = false
          dialogKey.value += 1
          
          nextTick(() => {
            selectedIssue.value = row
            showIssueDialog.value = true
            ElMessage.success(t('issues.messages.viewingIssue', { displayId: row.displayId, title: row.title }))
          })
          break
        case 'detail-page':
          // 跳转到独立的议题详情页面
          navigateToIssueDetail(row)
          break
        default:
          ElMessage.info(`${t('common.action')}: ${actualAction}`)
          break
      }
    }
    
    // 导出数据
    const exportIssuesData = () => {
      if (!issuesData.value) {
        ElMessage.warning(t('issues.messages.noDataToExport'))
        return
      }
      
      try {
        const dataStr = JSON.stringify(issuesData.value, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `project-issues-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('issues.messages.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('issues.messages.exportFailed'))
      }
    }
    
    // 获取查询字段信息
    const getIssuesQueryFields = () => {
      if (!issuesData.value) return []
      
      return [
        {
          label: 'Project ID',
          value: issuesData.value.project_id || 'N/A',
          type: 'code'
        },
        {
          label: 'Check Time',
          value: issuesData.value.timestamp || 'N/A',
          type: 'timestamp'
        },
        {
          label: 'Pagination Info',
          value: JSON.stringify(issuesData.value.pagination || {}),
          type: 'json'
        }
      ]
    }
    
    // 关闭弹窗处理
    const handleCloseDialog = () => {
      showIssueDialog.value = false
      selectedIssue.value = null
      dialogKey.value += 1
    }
    
    // 跳转到议题详情页面
    const navigateToIssueDetail = (issue) => {
      if (!issue || !currentProject.value) {
        ElMessage.error('Missing required issue or project information')
        return
      }
      
      router.push({
        path: '/issues/detail',
        query: {
          projectId: currentProject.value.id,
          issueId: issue.id
        }
      })
      
      ElMessage.success(t('issues.messages.navigatingToDetail', { displayId: issue.displayId }))
    }
    
    // 处理统计卡片点击
    const handleStatClick = (stat, index) => {
      console.log('Stat clicked:', stat, index)
      
      switch (stat.label) {
        case 'Open Issues':
          ElMessage.info('Filter open issues feature under development')
          break
        case 'In Progress':
          ElMessage.info('Filter in-progress issues feature under development')
          break
        case 'Closed':
          ElMessage.info('Filter closed issues feature under development')
          break
        default:
          ElMessage.info(`Clicked statistics item: ${stat.label}`)
      }
    }
    
    // 获取项目容器信息
    const fetchProjectContainers = async (projectId) => {
      try {
        console.log('🔍 获取项目容器信息:', projectId)
        const response = await axios.get(`/api/data-management/projects/${projectId}/details`)
        
        if (response.data.status === 'success') {
          const containers = response.data.data.containers
          if (containers) {
            console.log('✅ 项目容器信息获取成功:', containers)
            return containers
          } else {
            console.warn('⚠️ 项目详情中未找到容器信息，使用fallback方法')
            return null
          }
        } else {
          console.warn('⚠️ 获取项目详情失败，使用fallback方法')
          return null
        }
      } catch (error) {
        console.error('❌ 获取项目详情出错:', error)
        return null
      }
    }

    // 项目初始化方法 - 优化版本
    const initializeProject = async () => {
      const route = getCurrentInstance().appContext.config.globalProperties.$route
      const projectId = route.query.projectId
      const projectName = route.query.projectName
      
      if (projectId) {
        // 🔧 优化：不在初始化时获取容器信息，改为懒加载
        let containerId = null
        
        // 特殊处理：对于已知的项目，直接使用正确的容器ID
        if (projectId === 'b.1eea4119-3553-4167-b93d-3a3d5d07d33d') {
          containerId = '1eea4119-3553-4167-b93d-3a3d5d07d33d'
          console.log('🔧 使用已知项目的正确容器ID:', containerId)
        } else {
          // Fallback: 使用项目ID去掉 "b." 前缀，不调用API
          containerId = projectId.startsWith('b.') ? projectId.substring(2) : projectId
          console.log('⚠️ 使用fallback容器ID (延迟加载):', containerId)
        }
        
        currentProject.value = {
          id: projectId,
          name: projectName || projectId,
          containerId: containerId,
          containers: null // 延迟加载
        }
        console.log('从URL获取项目信息 (快速模式):', currentProject.value)
      } else {
        const savedProject = projectStore.getSelectedProject()
        if (savedProject) {
          // 如果保存的项目没有容器信息，尝试获取
          if (!savedProject.containers && savedProject.id) {
            const containers = await fetchProjectContainers(savedProject.id)
            if (containers && containers.markups) {
              savedProject.containerId = containers.markups.id
              savedProject.containers = containers
            } else if (!savedProject.containerId) {
              // Fallback
              savedProject.containerId = savedProject.id.startsWith('b.') 
                ? savedProject.id.substring(2) 
                : savedProject.id
            }
          }
          currentProject.value = savedProject
          console.log('从localStorage获取项目信息:', currentProject.value)
        }
      }

      if (currentProject.value) {
        // 🔧 优化：并行预加载缓存，但不等待完成
        Promise.all([
          entityCache.getProjectEntities(currentProject.value.id).catch(console.error),
          userCache.getProjectUsers(currentProject.value.id).catch(console.error)
        ]).then(() => {
          console.log('✅ 后台缓存预加载完成')
        })
        
        // 立即加载议题数据，不等待缓存
        fetchIssuesData()
      } else {
        showProjectSelector.value = true
      }
    }

    // 处理项目选择确认
    const handleProjectSelected = async (selectedProject) => {
      // 尝试获取正确的容器ID
      if (!selectedProject.containerId && selectedProject.id) {
        const containers = await fetchProjectContainers(selectedProject.id)
        if (containers && containers.markups) {
          selectedProject.containerId = containers.markups.id
          selectedProject.containers = containers
        } else {
          // Fallback: 使用项目ID去掉 "b." 前缀
          selectedProject.containerId = selectedProject.id.startsWith('b.') 
            ? selectedProject.id.substring(2) 
            : selectedProject.id
        }
      }
      currentProject.value = selectedProject
      projectStore.saveSelectedProject(selectedProject)
      ElMessage.success(`Selected project: ${selectedProject.name}`)
      fetchIssuesData()
    }

    // 处理项目选择cancel
    const handleProjectSelectionCancel = () => {
      if (!currentProject.value) {
        const router = getCurrentInstance().appContext.config.globalProperties.$router
        router.push('/')
      }
    }

    // 工具函数
    const getIssueStatusType = (status) => {
      const statusMap = {
        'draft': 'info',
        'open': 'warning', 
        'pending': 'warning',
        'in_progress': 'success',
        'in_review': 'primary',
        'closed': 'info',
        'resolved': 'success',
        'rejected': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    }

    const getIssueStatusText = (status) => {
      const statusKey = status?.toLowerCase()
      if (statusKey && t(`issues.status.${statusKey}`) !== `issues.status.${statusKey}`) {
        return t(`issues.status.${statusKey}`)
      }
      return status || t('common.unknown')
    }

    const getPriorityType = (priority) => {
      const priorityMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success',
        'critical': 'danger'
      }
      return priorityMap[priority?.toLowerCase()] || 'info'
    }

    const getPriorityText = (priority) => {
      const priorityKey = priority?.toLowerCase()
      if (priorityKey && t(`issues.priority.${priorityKey}`) !== `issues.priority.${priorityKey}`) {
        return t(`issues.priority.${priorityKey}`)
      }
      return priority || t('common.notSet')
    }

    // 分配类型处理函数
    const getAssignedToTypeText = (assignedToType) => {
      const typeKey = assignedToType?.toLowerCase()
      if (typeKey && t(`issues.assignedToType.${typeKey}`) !== `issues.assignedToType.${typeKey}`) {
        return t(`issues.assignedToType.${typeKey}`)
      }
      return assignedToType || t('common.unknown')
    }

    const getAssignedToTypeTagType = (assignedToType) => {
      const typeMap = {
        'user': 'primary',
        'role': 'success', 
        'company': 'warning'
      }
      return typeMap[assignedToType?.toLowerCase()] || 'info'
    }

    const getUserName = (userId) => {
      if (!userId) return 'N/A'
      
      // 优先使用新的实体缓存系统
      const displayName = entityCache.getUserDisplayName(userId, currentProject.value?.id)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 回退到原有的用户缓存
      const fallbackName = userCache.getUserDisplayName(userId, currentProject.value?.id)
      if (fallbackName && fallbackName !== userId) {
        return fallbackName
      }
      
      // 如果缓存中没有找到，返回简化的用户ID
      return userId.split('@')[0] || userId.substring(0, 8) + '...'
    }

    // 根据分配类型获取分配对象的显示名称
    const getAssignedToName = (assignedTo, assignedToType) => {
      if (!assignedTo) return t('issues.status.unassigned')
      
      // 调试：显示分配信息
      console.log('🔍 获取分配对象名称:', { assignedTo, assignedToType })
      
      // 尝试使用实体缓存
      try {
        const displayName = entityCache.getAssignedToDisplayName(assignedTo, assignedToType, currentProject.value?.id)
        if (displayName && displayName !== assignedTo) {
          console.log('✅ 实体缓存成功:', { assignedTo, assignedToType, displayName })
          return displayName
        }
      } catch (error) {
        console.warn('⚠️ 实体缓存失败:', error)
      }
      
      // 回退方案：根据分配类型处理
      switch (assignedToType) {
        case 'user':
          const userName = getUserName(assignedTo)
          console.log('👤 使用用户缓存:', { assignedTo, userName })
          return userName
        case 'role':
          // 角色ID通常是数字，显示为"角色-ID"
          console.log('👔 角色回退显示:', assignedTo)
          return `${t('issues.status.rolePrefix')}${assignedTo}`
        case 'company':
          // 公司ID，显示为"公司-ID"
          console.log('🏢 公司回退显示:', assignedTo)
          return `${t('issues.status.companyPrefix')}${assignedTo}`
        default:
          // 未知类型，尝试用户名获取
          console.log('❓ 未知类型，使用用户缓存:', { assignedTo, assignedToType })
          return getUserName(assignedTo)
      }
    }

    // 使用导入的formatDueDate函数，但需要适配返回格式
    const formatDueDateLocal = (dateString) => {
      const result = formatDueDate(dateString)
      return result.text || dateString
    }

    const getDueDateType = (dateString) => {
      if (!dateString || dateString === 'N/A') return 'info'
      try {
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 0) return 'danger'
        if (daysDiff === 0) return 'warning'
        if (daysDiff === 1) return 'warning'
        if (daysDiff <= 3) return 'primary'
        if (daysDiff <= 7) return 'success'
        return 'success'
      } catch (error) {
        return 'info'
      }
    }

    const getDueDateStatus = (dateString) => {
      if (!dateString || dateString === 'N/A') return ''
      try {
        const date = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 0) {
          const absDays = Math.abs(daysDiff)
          if (absDays === 1) return t('issues.dueStatus.overdueYesterday')
          if (absDays <= 7) return t('issues.dueStatus.overdueDaysAgo', { days: absDays })
          return t('issues.dueStatus.overdue')
        }
        if (daysDiff === 0) return t('issues.dueStatus.dueToday')
        if (daysDiff === 1) return t('issues.dueStatus.dueTomorrow')
        if (daysDiff === 2) return t('issues.dueStatus.dayAfterTomorrow')
        if (daysDiff <= 7) return t('issues.dueStatus.daysLater', { days: daysDiff })
        if (daysDiff <= 30) return t('issues.dueStatus.sufficientTime')
        return t('issues.dueStatus.ampleTime')
      } catch (error) {
        return ''
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === 'N/A') return 'N/A'
      
      try {
        const date = new Date(dateStr)
        if (isNaN(date.getTime())) return dateStr
        
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      } catch (error) {
        console.error('日期格式化错误:', error)
        return dateStr
      }
    }

    // 议题类型处理函数
    const issueTypeNames = ref(new Map()) // 缓存类型名称

    const getIssueTypeName = (typeId, subtypeId) => {
      if (!typeId && !subtypeId) return t('issues.status.uncategorized')
      
      const cacheKey = `${typeId || ''}-${subtypeId || ''}`
      
      // 如果已缓存，直接返回
      if (issueTypeNames.value.has(cacheKey)) {
        return issueTypeNames.value.get(cacheKey)
      }
      
      // 异步加载类型名称 - 只显示子分类
      if (currentProject.value?.id) {
        if (subtypeId) {
          // 只显示子类型，不显示主类型
          issueTypeCache.getIssueSubtypeName(subtypeId, currentProject.value.id)
            .then(name => {
              issueTypeNames.value.set(cacheKey, name)
            })
            .catch(error => {
              console.error('获取议题子类型名称失败:', error)
              issueTypeNames.value.set(cacheKey, issueTypeCache.formatTypeId(subtypeId))
            })
        } else if (typeId) {
          // 如果没有子类型，显示主类型
          issueTypeCache.getIssueTypeName(typeId, currentProject.value.id)
            .then(name => {
              issueTypeNames.value.set(cacheKey, name)
            })
            .catch(error => {
              console.error('获取议题类型名称失败:', error)
              issueTypeNames.value.set(cacheKey, issueTypeCache.formatTypeId(typeId))
            })
        }
      }
      
      // 返回临时显示值
      return issueTypeCache.formatTypeId(typeId || subtypeId)
    }

    const getIssueTypeTagType = (typeId) => {
      // 根据类型ID生成不同的标签颜色
      if (!typeId) return 'info'
      
      // 简单的哈希算法生成颜色
      const hash = typeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const colors = ['primary', 'success', 'warning', 'danger', 'info']
      return colors[hash % colors.length]
    }

    // 根本原因处理函数
    const rootCauseNames = ref(new Map()) // 缓存根本原因名称

    const getRootCauseName = (rootCauseId) => {
      if (!rootCauseId) return t('issues.status.notSet')
      
      // 如果已缓存，直接返回
      if (rootCauseNames.value.has(rootCauseId)) {
        return rootCauseNames.value.get(rootCauseId)
      }
      
      // 异步加载根本原因名称
      if (currentProject.value?.id) {
        rootCauseCache.getRootCauseName(rootCauseId, currentProject.value.id)
          .then(name => {
            rootCauseNames.value.set(rootCauseId, name)
          })
          .catch(error => {
            console.error('获取根本原因名称失败:', error)
            rootCauseNames.value.set(rootCauseId, rootCauseCache.formatRootCauseId(rootCauseId))
          })
      }
      
      // 返回临时显示值
      return rootCauseCache.formatRootCauseId(rootCauseId)
    }

    const getRootCauseTagType = (rootCauseId) => {
      // 根据根本原因ID生成不同的标签颜色
      if (!rootCauseId) return 'info'
      
      // 简单的哈希算法生成颜色，使用不同的种子避免与类型标签冲突
      const hash = rootCauseId.split('').reduce((acc, char) => acc + char.charCodeAt(0) * 2, 0)
      const colors = ['warning', 'danger', 'success', 'primary', 'info']
      return colors[hash % colors.length]
    }

    // 使用导入的formatDateTime函数
    
    // 处理元数据加载完成
    const handleMetadataLoaded = (metadata) => {
      console.log('元数据加载完成:', metadata)
      // 可以将元数据存储到响应式变量中供其他组件使用
    }
    
    // 处理元数据加载错误
    const handleMetadataError = (error) => {
      console.error('元数据加载错误:', error)
    }
    

    // 新增：按需获取容器信息的方法
    const fetchContainerInfoOnDemand = async () => {
      if (!currentProject.value || currentProject.value.containers) {
        return currentProject.value?.containers
      }
      
      try {
        console.log('🔍 按需获取项目容器信息:', currentProject.value.id)
        const containers = await fetchProjectContainers(currentProject.value.id)
        
        if (containers && containers.markups) {
          currentProject.value.containerId = containers.markups.id
          currentProject.value.containers = containers
          console.log('✅ 容器信息更新成功:', containers)
        }
        
        return containers
      } catch (error) {
        console.error('❌ 获取容器信息失败:', error)
        return null
      }
    }

    
    // 组件挂载时初始化项目
    onMounted(() => {
      initializeProject()
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      loading,
      error,
      issuesData,
      showIssueDialog,
      selectedIssue,
      dialogKey,
      
      // 项目相关
      currentProject,
      showProjectSelector,
      
      // 标记面板相关
      
      // 配置
      headerButtons,
      headerStats,
      tableColumns,
      tableActions,
      rowOperations,
      errorSuggestions,
      errorButtons,
      
      // 图标
      IconIssue,
      ChatDotRound,
      Paperclip,
      Clock,
      User,
      Link,
      
      // 方法
      fetchIssuesData,
      syncIssuesData,
      cancelLoading,
      handleHeaderAction,
      handleErrorAction,
      handleTableAction,
      handleRowOperation,
      exportIssuesData,
      getIssuesQueryFields,
      handleCloseDialog,
      navigateToIssueDetail,
      handleStatClick,
      initializeProject,
      handleProjectSelected,
      handleProjectSelectionCancel,
      getIssueStatusType,
      getIssueStatusText,
      getIssueTypeName,
      getIssueTypeTagType,
      getPriorityType,
      getPriorityText,
      getAssignedToTypeText,
      getAssignedToTypeTagType,
      getUserName,
      getAssignedToName,
      formatDueDate: formatDueDateLocal,
      formatDate,
      getDueDateType,
      getDueDateStatus,
      getRootCauseName,
      getRootCauseTagType,
      formatDateTime,
      handleMetadataLoaded,
      handleMetadataError,
      fetchContainerInfoOnDemand
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.issues {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.user-id {
  font-size: 11px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
}

.timestamp {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #666;
}

.text-muted {
  color: #909399;
}

.markup-controls {
  padding: 16px 0;
}

.markup-controls .el-button {
  margin-bottom: 16px;
}

.help-text {
  font-style: italic;
}

/* 到期时间样式 */
.due-date-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.due-date-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.due-date-text {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

.due-status-tag {
  align-self: center;
}

.no-due-date {
  display: flex;
  justify-content: center;
}

/* 同步信息样式 */
.sync-info {
  padding: 16px;
}

/* 弹窗样式 */
.issue-dialog {
  --el-dialog-border-radius: 12px;
}

.issue-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.issue-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.issue-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.issue-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.issue-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.issue-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  color: #f0f0f0;
}

.issue-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content {
  padding: 20px;
}

/* 标记警告 */
.no-container-warning {
  padding: 20px;
}

.no-container-warning .help-text {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

/* 议题类型标签样式 */
.issue-type-tag {
  font-weight: 500;
  border-radius: 6px;
  font-size: 12px;
  padding: 2px 8px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 根本原因标签样式 */
.root-cause-tag {
  font-weight: 500;
  border-radius: 6px;
  font-size: 12px;
  padding: 2px 8px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分配信息样式 */
.assigned-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assigned-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assigned-name .user-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.assigned-name .user-id {
  font-size: 11px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.assigned-type-tag {
  align-self: flex-start;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}

/* 标记控制样式 */
.markup-controls {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 15px;
  gap: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .issues {
    padding: 10px;
  }
  
  .user-info {
    align-items: flex-start;
  }
  
  .due-date-text {
    font-size: 11px;
  }
  
  .issue-type-tag {
    max-width: 80px;
    font-size: 11px;
  }
  
  .root-cause-tag {
    max-width: 100px;
    font-size: 11px;
  }
  
  .assigned-info {
    gap: 2px;
  }
  
  .assigned-name .user-name {
    font-size: 12px;
  }
  
  .assigned-name .user-id {
    font-size: 10px;
  }
  
  .assigned-type-tag {
    font-size: 10px;
    padding: 1px 4px;
  }
}
</style>
