<template>
  <div class="reviews">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="t('reviews.title')"
      :description="t('reviews.description')"
      :tag="t('reviews.tag')"
      tag-type="success"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 统计信息区域 -->
    <StatsSection 
      v-if="reviewsData && !loading && !error"
      :stats="headerStats" 
      @stat-click="handleStatClick" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="t('reviews.loading.title')"
      :text="t('reviews.loading.text')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="t('reviews.error.title')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="reviewsData && !loading && !error"
      status="success"
      :title="t('reviews.success.title')"
      :description="t('reviews.success.description', { count: reviewsData.reviews?.length || 0 })"
      :details="t('reviews.success.lastUpdated', { time: new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }) })"
      size="default"
      style="margin-bottom: 24px;" />

    <!-- 查询信息卡片 -->
    <QueryInfoCard
      v-if="reviewsData && !loading && !error"
      :title="t('reviews.queryInfo.title')"
      api-endpoint="/api/reviews/jarvis"
      :description="t('reviews.queryInfo.description')"
      :result-count="reviewsData.reviews?.length || 0"
      :result-unit="t('reviews.queryInfo.resultUnit')"
      :custom-fields="getReviewsQueryFields()" />

    <!-- 评审详情弹窗 -->
    <el-dialog
      v-model="showReviewDialog"
      :title="`${t('reviews.dialog.reviewDetail')} - ${selectedReview?.name || ''}`"
      width="80%"
      :before-close="handleCloseReviewDialog"
      draggable
      class="review-dialog">
      <div v-if="selectedReview" class="dialog-content">
        <ReviewDetail 
          :review="selectedReview" 
          :project="currentProject" />
      </div>
    </el-dialog>

    <!-- 工作流详情弹窗 -->
    <el-dialog
      v-model="showWorkflowDialog"
      :title="`Workflow Details - ${selectedWorkflow?.name || ''}`"
      width="90%"
      :before-close="handleCloseWorkflowDialog"
      draggable
      destroy-on-close
      class="workflow-dialog">
      <div v-if="selectedWorkflow" class="dialog-content">
        <SingleWorkflowDetail 
          :key="workflowDetailKey"
          :workflow-id="selectedWorkflowId" 
          :project="currentProject" />
      </div>
    </el-dialog>

    <!-- 评审数据内容 -->
    <div v-if="reviewsData && !loading && !error">

      <!-- 评审数据表格 -->
      <DataTable
        :key="`reviews-table-${reviewsData?.timestamp || 'default'}`"
        :data="reviewsData.reviews || []"
        :columns="tableColumns"
        :loading="loading"
        :title="t('reviews.table.title')"
        :description="t('reviews.table.description')"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        row-key="sequence_id"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- 评审状态列 -->
        <template #status="{ row }">
          <StatusTag
            :status="row.status || 'unknown'"
            size="small"
            :show-icon="false" />
        </template>
        
        <!-- 序列ID列 -->
        <template #sequence-id="{ row }">
          <StatusTag 
            status="info" 
            :text="`#${row.sequence_id}`"
            size="small" 
            :show-icon="false" />
        </template>
        
        <!-- Workflow Name 列 -->
        <template #workflow-name="{ row }">
          <span class="workflow-name">{{ row.workflow_progress?.workflow_name || 'N/A' }}</span>
        </template>
        
        <!-- 归档状态列 -->
        <template #archived="{ row }">
          <StatusTag
            :status="row.archived ? 'archived' : 'active'"
            size="small"
            :show-icon="false" />
        </template>
        
        <!-- 创建者列 -->
        <template #created-by="{ row }">
          <div class="user-info">
            <span class="user-name">{{ row.created_by?.name || 'N/A' }}</span>
            <span class="user-id">{{ row.created_by?.autodeskId || '' }}</span>
          </div>
        </template>
        
        <!-- 下一步操作者列 -->
        <template #next-action="{ row }">
          <div class="next-action-simple">
            <!-- 已完成状态 -->
            <span v-if="isReviewCompleted(row)" class="completed-text">
              --
            </span>
            <!-- 进行中的评审 -->
            <div v-else class="action-users-list">
              <!-- 已认领用户 -->
              <template v-if="row.candidate_details?.claimed_users?.length > 0">
                <div 
                  v-for="(user, index) in row.candidate_details.claimed_users" 
                  :key="user.autodeskId || user.id"
                  class="user-item">
                  {{ user.name }} (Claimed)
                </div>
              </template>
              
              <!-- 候选用户 -->
              <template v-if="row.candidate_details?.users?.length > 0">
                <div 
                  v-for="(user, index) in row.candidate_details.users" 
                  :key="user.autodeskId || user.id"
                  class="user-item">
                  {{ user.name }} (User)
                </div>
              </template>
              
              <!-- 候选角色 -->
              <template v-if="row.candidate_details?.roles?.length > 0">
                <div 
                  v-for="(role, index) in row.candidate_details.roles" 
                  :key="role.id"
                  class="user-item">
                  {{ role.name }} (Role)
                </div>
              </template>
              
              <!-- 候选公司 -->
              <template v-if="row.candidate_details?.companies?.length > 0">
                <div 
                  v-for="(company, index) in row.candidate_details.companies" 
                  :key="company.id || company.name"
                  class="user-item">
                  {{ company.name }} (Company)
                </div>
              </template>
              
              <!-- 无候选人 -->
              <span v-if="!row.has_claimed_users && getTotalCandidates(row) === 0" class="no-action">
                --
              </span>
            </div>
          </div>
        </template>
        
        <!-- 到期时间列 -->
        <template #due-date="{ row }">
          <div class="due-date-info">
            <!-- 已完成的评审不显示到期时间 -->
            <div v-if="isReviewCompleted(row)" class="completed-due-date">
              <el-tag type="info" size="small">{{ t('reviews.status.finishedStatus') }}</el-tag>
            </div>
            <!-- 有到期时间的进行中评审 -->
            <div v-else-if="row.current_step_due_date && row.current_step_due_date !== 'N/A'" class="due-date-content">
              <div class="due-date-text">{{ formatDateTime(row.current_step_due_date) }}</div>
              <el-tag 
                :type="getDueDateType(row.current_step_due_date)" 
                size="small" 
                class="due-status-tag">
                {{ getDueDateStatus(row.current_step_due_date) }}
              </el-tag>
            </div>
            <!-- 无到期时间的进行中评审 -->
            <div v-else class="no-due-date">
              <el-tag type="info" size="small">{{ t('reviews.status.noDeadline') }}</el-tag>
            </div>
          </div>
        </template>
        
        <!-- 创建时间列 -->
        <template #created-at="{ row }">
          <span class="timestamp">{{ row.created_at }}</span>
        </template>
        
        <!-- 更新时间列 -->
        <template #updated-at="{ row }">
          <span class="timestamp">{{ row.updated_at }}</span>
        </template>
        
      </DataTable>
      
      <!-- Workflow 列表 -->
      <WorkflowList 
        v-if="currentProject"
        :project="currentProject"
        style="margin-top: 24px;"
        @workflow-detail="handleWorkflowDetail" />

      <!-- API JSON Data Viewer -->
      <BaseCard 
        title="🔍 API Response Data"
        :show-header="true"
        :collapsible="true"
        :default-collapsed="true"
        style="margin-top: 24px;">
        <JsonViewer 
          :data="reviewsData"
          title="Reviews API Response"
          description="Complete API response data from the reviews endpoint"
          :show-copy="true"
          :show-download="true"
          :collapsible="false"
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
import ReviewDetail from '../components/ReviewDetail.vue'
import StatsSection from '../components/StatsSection.vue'
import ProjectSelector from '../components/ProjectSelector.vue'
import StatusTag from '../components/StatusTag.vue'
import WorkflowList from '../components/WorkflowList.vue'
import SingleWorkflowDetail from '../components/SingleWorkflowDetail.vue'
import projectStore from '../utils/projectStore.js'
import reviewsCacheManager from '../utils/reviewsCache.js'
import { formatDueDate, formatDateTime } from '../utils/dateUtils.js'

// 图标导入
import { 
  DocumentChecked as IconReview,
  Refresh,
  Download,
  Setting,
  View,
  Search,
  Filter,
  Check,
  Clock,
  Warning
} from '@element-plus/icons-vue'

export default {
  name: 'Reviews',
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
    ReviewDetail,
    StatsSection,
    ProjectSelector,
    StatusTag,
    WorkflowList,
    SingleWorkflowDetail
  },
  setup() {
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const reviewsData = ref(null)
    const showReviewDialog = ref(false)
    const selectedReview = ref(null)
    const showWorkflowDialog = ref(false)
    const selectedWorkflow = ref(null)
    
    // 项目相关
    const currentProject = ref(null)
    const showProjectSelector = ref(false)
    
    // 评审数据映射缓存 - 用于文件版本详情页面获取评审名称
    const reviewsMap = ref(new Map())
    
    // 页面头部配置
    const headerButtons = reactive([
      {
        text: t('reviews.actions.refresh'),
        type: 'primary',
        icon: Refresh,
        action: 'refresh'
      },
      {
        text: t('reviews.actions.export'),
        type: 'default',
        icon: Download,
        action: 'export'
      },
      {
        text: t('reviews.actions.settings'),
        type: 'default',
        icon: Setting,
        action: 'settings'
      }
    ])
    
    // 计算属性：头部统计
    const headerStats = computed(() => {
      if (!reviewsData.value?.stats) return []
      
      const stats = reviewsData.value.stats
      const headerStatsArray = [
        {
          label: t('reviews.statistics.totalReviews'),
          value: stats.total_reviews || 0,
          type: 'primary',
          icon: '📋',
          description: 'Total number of reviews in the project',
          clickable: false
        },
        {
          label: t('reviews.statistics.activeReviews'),
          value: stats.active_count || 0,
          type: 'success',
          icon: '✅',
          description: 'Currently active reviews',
          clickable: true
        },
        {
          label: 'Archived',
          value: stats.archived_count || 0,
          type: 'info',
          icon: '📦',
          description: 'Completed and archived reviews',
          clickable: true
        },
        {
          label: 'Open Status',
          value: stats.status_counts?.OPEN || 0,
          type: 'warning',
          icon: '🔓',
          description: 'Number of reviews with open status',
          clickable: true
        }
      ]
      
      // 如果有重复数据，添加去重信息
      if (stats.duplicate_count && stats.duplicate_count > 0) {
        headerStatsArray.push({
          label: 'Deduplicated',
          value: stats.duplicate_count,
          type: 'danger',
          icon: '🔄',
          description: 'Detected and removed duplicate data',
          clickable: false
        })
      }
      
      return headerStatsArray
    })
    
    // 表格配置
    const tableColumns = [
      {
        prop: 'name',
        label: t('reviews.table.name'),
        minWidth: 200,
        sortable: true
      },
      {
        prop: 'sequence_id',
        label: t('reviews.table.sequenceId'),
        width: 100,
        slot: 'sequence-id'
      },
      {
        prop: 'workflow_progress.workflow_name',
        label: 'Workflow',
        width: 150,
        slot: 'workflow-name'
      },
      {
        prop: 'status',
        label: t('reviews.table.status'),
        width: 100,
        slot: 'status'
      },
      {
        prop: 'archived',
        label: t('reviews.table.archived'),
        width: 100,
        slot: 'archived'
      },
      {
        prop: 'created_by',
        label: t('reviews.table.createdBy'),
        width: 150,
        slot: 'created-by'
      },
      {
        prop: 'next_action_by',
        label: t('reviews.table.nextAction'),
        width: 200,
        slot: 'next-action'
      },
      {
        prop: 'current_step_due_date',
        label: t('reviews.table.dueTime'),
        width: 160,
        slot: 'due-date',
        sortable: true,
        align: 'center'
      },
      {
        prop: 'created_at',
        label: t('reviews.table.createdAt'),
        width: 160,
        slot: 'created-at',
        sortable: true
      },
      {
        prop: 'updated_at',
        label: t('reviews.table.updatedAt'),
        width: 160,
        slot: 'updated-at',
        sortable: true
      }
    ]
    
    const tableActions = [
      {
        text: t('common.search'),
        type: 'primary',
        icon: Search,
        action: 'search'
      },
      {
        text: t('common.filter'),
        type: 'default',
        icon: Filter,
        action: 'filter'
      }
    ]
    
    const rowOperations = [
      {
        text: t('reviews.actions.viewDetail'),
        type: 'primary',
        icon: View,
        action: 'check'
      }
    ]
    
    // 错误处理配置
    const errorSuggestions = t('reviews.error.suggestions')
    
    const errorButtons = [
      {
        text: t('reviews.actions.reauth'),
        type: 'primary',
        action: 'reauth'
      },
      {
        text: t('common.retry'),
        type: 'default',
        action: 'retry'
      }
    ]
    
    // 获取评审数据
    const fetchReviewsData = async () => {
      if (!currentProject.value) {
        error.value = t('reviews.messages.projectRequired')
        return
      }

      loading.value = true
      error.value = ''
      
      console.log('开始获取评审数据...', '项目:', currentProject.value.name)
      
      try {
        // 添加时间戳防止缓存
        const response = await axios.get('/api/reviews/jarvis', {
          timeout: 30000,
          params: {
            _t: Date.now(), // 防止缓存
            projectId: currentProject.value.id
          }
        })
        
        if (response.data.success) {
          // Force clear the data first to ensure reactivity
          reviewsData.value = null
          await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
          reviewsData.value = response.data
          
          // 更新评审数据映射缓存
          if (response.data.reviews && Array.isArray(response.data.reviews)) {
            // 使用缓存管理器更新缓存
            reviewsCacheManager.updateProjectReviews(currentProject.value.id, response.data.reviews)
            
            // 同时更新本地映射（保持向后兼容）
            const newMap = new Map()
            response.data.reviews.forEach(review => {
              if (review.id && review.name) {
                newMap.set(review.id, {
                  id: review.id,
                  name: review.name,
                  sequenceId: review.sequenceId,
                  status: review.status
                })
              }
            })
            reviewsMap.value = newMap
            console.log('评审数据映射缓存已更新:', newMap.size, '条记录')
          }
          
          // 输出调试信息
          console.log('API响应统计:', response.data.stats)
          console.log('表格数据数量:', response.data.reviews?.length)
          console.log('原始数据数量:', response.data.raw_data?.length)
          console.log('详细分析数量:', response.data.detailed_analysis?.length)
          
          // 检查前端是否还有重复数据
          const reviewIds = response.data.reviews?.map(r => r.id) || []
          const uniqueIds = new Set(reviewIds)
          console.log('前端检查 - 总ID数:', reviewIds.length)
          console.log('前端检查 - 唯一ID数:', uniqueIds.size)
          if (reviewIds.length !== uniqueIds.size) {
            console.warn('⚠️ 前端仍然检测到重复ID!')
            const duplicates = reviewIds.filter((id, index) => reviewIds.indexOf(id) !== index)
            console.warn('重复的ID:', [...new Set(duplicates)])
          } else {
            console.log('✅ 前端数据无重复')
          }
          
          if (response.data.stats?.duplicate_count > 0) {
            ElMessage.success(t('reviews.messages.loadSuccess') + `, deduplicated ${response.data.stats.duplicate_count} duplicate records`)
          } else {
            ElMessage.success(t('reviews.messages.loadSuccess'))
          }
        } else {
          throw new Error(response.data.error || t('reviews.messages.loadFailed'))
        }
      } catch (err) {
        console.error('获取评审数据失败:', err)
        error.value = err.response?.data?.error || err.message || t('reviews.messages.loadFailed')
        ElMessage.error(t('reviews.messages.loadFailed') + ': ' + error.value)
      } finally {
        loading.value = false
      }
    }
    
    // cancel加载
    const cancelLoading = () => {
      loading.value = false
      ElMessage.info(t('reviews.messages.loadCancelled'))
    }
    
    // 处理头部操作
    const handleHeaderAction = (action) => {
      switch (action) {
        case 'refresh':
          fetchReviewsData()
          break
        case 'export':
          exportReviewsData()
          break
        case 'settings':
          ElMessage.info(t('reviews.messages.settingsInDevelopment'))
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
          fetchReviewsData()
          break
      }
    }
    
    // 处理表格操作
    const handleTableAction = (action) => {
      switch (action) {
        case 'search':
          ElMessage.info(t('reviews.messages.searchInDevelopment'))
          break
        case 'filter':
          ElMessage.info(t('reviews.messages.filterInDevelopment'))
          break
      }
    }
    
    // 处理行操作
    const handleRowOperation = (action, button, index) => {
      console.log('Row operation triggered:', action, button, index)
      console.log('Button object:', button)
      
      try {
        // 从action中提取实际的操作类型（去掉索引）
        const actualAction = action.split(':')[0]
        
        // 获取对应行的数据 - 使用button中传递的实际行数据
        const row = button?.row
        
        if (!row) {
          ElMessage.error(t('reviews.messages.cannotGetRowData'))
          return
        }
        
        console.log('Using row data:', {
          id: row.id,
          name: row.name,
          sequence_id: row.sequence_id
        })
        
        switch (actualAction) {
          case 'check':
          case 'view':
            // 打开评审详情弹窗
            const reviewForDetail = getReviewForDetail(row)
            console.log('Opening review detail for:', {
              rowId: row.id,
              rowSequenceId: row.sequence_id,
              rowName: row.name,
              reviewForDetailId: reviewForDetail?.id,
              reviewForDetailSequenceId: reviewForDetail?.sequenceId,
              reviewForDetailName: reviewForDetail?.name
            })
            
            if (!reviewForDetail) {
              ElMessage.error(t('reviews.messages.cannotGetReviewDetail'))
              return
            }
            
            // 安全地设置选中的评审和显示弹窗
            selectedReview.value = reviewForDetail
            showReviewDialog.value = true
            ElMessage.success(t('reviews.messages.viewingReview', { name: row.name }))
            break
          default:
            ElMessage.info(t('reviews.messages.operation', { action: actualAction }))
            break
        }
      } catch (error) {
        console.error('处理行操作时发生错误:', error)
        ElMessage.error(t('reviews.messages.operationFailed'))
      }
    }
    
    // 导出数据
    const exportReviewsData = () => {
      if (!reviewsData.value) {
        ElMessage.warning(t('reviews.messages.noDataToExport'))
        return
      }
      
      try {
        const dataStr = JSON.stringify(reviewsData.value, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `project-reviews-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('reviews.messages.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('reviews.messages.exportFailed'))
      }
    }
    
    // 获取查询字段信息
    const getReviewsQueryFields = () => {
      if (!reviewsData.value) return []
      
      return [
        {
          label: 'Project ID',
          value: reviewsData.value.project_id || 'N/A',
          type: 'code'
        },
        {
          label: 'Query Parameters',
          value: JSON.stringify(reviewsData.value.query_params || {}),
          type: 'json'
        },
        {
          label: 'Pagination Info',
          value: JSON.stringify(reviewsData.value.pagination || {}),
          type: 'json'
        },
        {
          label: 'Check Time',
          value: reviewsData.value.timestamp || 'N/A',
          type: 'timestamp'
        }
      ]
    }
    
    // 为详情组件准备评审数据
    const getReviewForDetail = (row) => {
      if (!row) {
        console.error('getReviewForDetail: row is null or undefined')
        return null
      }
      
      console.log('getReviewForDetail called with row:', {
        id: row.id,
        name: row.name,
        sequence_id: row.sequence_id
      })
      
      try {
        // 从原始数据中找到对应的完整评审数据
        // 首先尝试用sequenceId匹配，然后fallback到id匹配
        let rawReview = reviewsData.value?.raw_data?.find(r => r.sequenceId === row.sequence_id)
        if (!rawReview) {
          rawReview = reviewsData.value?.raw_data?.find(r => r.id === row.id)
        }
        console.log('Found rawReview:', rawReview ? {
          id: rawReview.id,
          name: rawReview.name,
          sequenceId: rawReview.sequenceId
        } : 'null')
        
        if (rawReview) {
          return rawReview
        }
        
        // 如果找不到原始数据，使用处理过的数据构造
        const constructedReview = {
          id: row.id || '',
          sequenceId: row.sequence_id || '',
          name: row.name || 'Unknown Review',
          status: row.status || 'UNKNOWN',
          currentStepId: row.current_step_id || null,
          currentStepDueDate: row.current_step_due_date || null,
          createdBy: row.created_by || null,
          createdAt: row.created_at || null,
          updatedAt: row.updated_at || null,
          finishedAt: row.finished_at || null,
          archived: row.archived || false,
          archivedBy: row.archived_by || null,
          archivedAt: row.archived_at || null,
          workflowId: row.workflow_id || null,
          nextActionBy: row.next_action_by || null
        }
        
        console.log('Constructed review:', {
          id: constructedReview.id,
          name: constructedReview.name,
          sequenceId: constructedReview.sequenceId
        })
        
        return constructedReview
      } catch (error) {
        console.error('getReviewForDetail error:', error)
        return null
      }
    }
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        'OPEN': 'success',
        'CLOSED': 'info',
        'VOID': 'warning',
        'FAILED': 'danger'
      }
      return statusMap[status] || 'info'
    }
    
    // 关闭评审弹窗处理
    const handleCloseReviewDialog = () => {
      try {
        showReviewDialog.value = false
        selectedReview.value = null
      } catch (error) {
        console.error('关闭评审弹窗时发生错误:', error)
        // 强制重置状态
        showReviewDialog.value = false
        selectedReview.value = null
      }
    }

    // 关闭工作流弹窗处理
    const handleCloseWorkflowDialog = () => {
      try {
        showWorkflowDialog.value = false
        selectedWorkflow.value = null
      } catch (error) {
        console.error('关闭工作流弹窗时发生错误:', error)
        // 强制重置状态
        showWorkflowDialog.value = false
        selectedWorkflow.value = null
      }
    }

    // 处理工作流详情
    const handleWorkflowDetail = (workflow) => {
      console.log('Reviews: Opening workflow detail for:', workflow)
      selectedWorkflow.value = workflow
      showWorkflowDialog.value = true
    }

    // 计算属性：工作流相关的键和ID
    const selectedWorkflowId = computed(() => {
      return selectedWorkflow.value ? String(selectedWorkflow.value.id) : ''
    })

    const workflowDetailKey = computed(() => {
      return selectedWorkflow.value ? `workflow-detail-${selectedWorkflow.value.id}` : 'workflow-detail-empty'
    })
    
    // 处理统计卡片点击
    const handleStatClick = (stat, index) => {
      console.log('Stat clicked:', stat, index)
      
      switch (stat.label) {
        case 'Active Reviews':
          ElMessage.info('Filter active reviews feature under development')
          break
        case 'Archived':
          ElMessage.info('Filter archived reviews feature under development')
          break
        case 'Open Status':
          ElMessage.info('Filter open status reviews feature under development')
          break
        default:
          ElMessage.info(`Clicked statistics item: ${stat.label}`)
      }
    }
    
    // 项目初始化方法
    const initializeProject = async () => {
      // 检查URL参数中是否有项目ID
      const route = getCurrentInstance().appContext.config.globalProperties.$route
      const projectId = route.query.projectId
      const projectName = route.query.projectName
      
      if (projectId) {
        // 从URL参数获取项目信息
        currentProject.value = {
          id: projectId,
          name: projectName || projectId
        }
        console.log('从URL获取项目信息:', currentProject.value)
      } else {
        // 尝试从localStorage获取之前选择的项目
        const savedProject = projectStore.getSelectedProject()
        if (savedProject) {
          currentProject.value = savedProject
          console.log('从localStorage获取项目信息:', currentProject.value)
        }
      }

      if (currentProject.value) {
        // 有项目信息，开始获取数据
        fetchReviewsData()
      } else {
        // 没有项目信息，显示项目选择对话框
        showProjectSelector.value = true
      }
    }

    // 处理项目选择确认
    const handleProjectSelected = (selectedProject) => {
      currentProject.value = selectedProject
      projectStore.saveSelectedProject(selectedProject)
      ElMessage.success(`Selected project: ${selectedProject.name}`)
      fetchReviewsData()
    }

    // 处理项目选择cancel
    const handleProjectSelectionCancel = () => {
      // 如果cancel选择且没有当前项目，返回首页
      if (!currentProject.value) {
        const router = getCurrentInstance().appContext.config.globalProperties.$router
        router.push('/')
      }
    }

    // 计算候选人总数
    const getTotalCandidates = (row) => {
      if (!row.candidates_count) return 0
      return (row.candidates_count.users || 0) + 
             (row.candidates_count.roles || 0) + 
             (row.candidates_count.companies || 0)
    }

    // 使用导入的formatDueDate函数，适配返回格式
    const formatDueDateLocal = (dateString) => {
      const result = formatDueDate(dateString)
      return result.text || dateString
    }

    // 获取到期时间状态类型
    const getDueDateType = (dateString) => {
      if (!dateString || dateString === 'N/A') return 'info'
      try {
        const date = new Date(dateString)
        const now = new Date()
        
        // 获取今天的日期（不包含时间）
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 0) return 'danger'  // 已过期
        if (daysDiff === 0) return 'warning'  // 今日到期
        if (daysDiff === 1) return 'warning'  // 明日到期
        if (daysDiff <= 3) return 'primary'  // 临近到期
        if (daysDiff <= 7) return 'success'  // 一周内
        return 'success'  // 充足时间
      } catch (error) {
        return 'info'
      }
    }

    // 获取到期时间状态文本
    const getDueDateStatus = (dateString) => {
      if (!dateString || dateString === 'N/A') return ''
      try {
        const date = new Date(dateString)
        const now = new Date()
        
        // 获取今天的日期（不包含时间）
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        // 计算小时差（用于今日到期的精确显示）
        const hoursDiff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60))
        
        if (daysDiff < 0) {
          const absDays = Math.abs(daysDiff)
          if (absDays === 1) return 'Overdue Yesterday'
          if (absDays <= 7) return `Overdue ${absDays} days ago`
          return 'Overdue'
        }
        if (daysDiff === 0) {
          if (hoursDiff <= 0) return 'Overdue'
          if (hoursDiff <= 2) return 'Due Soon'
          if (hoursDiff <= 6) return 'Due Today'
          return 'Due Today'
        }
        if (daysDiff === 1) return 'Due Tomorrow'
        if (daysDiff === 2) return 'Due Day After Tomorrow'
        if (daysDiff <= 7) return `Due in ${daysDiff} days`
        if (daysDiff <= 30) return 'Sufficient Time'
        return 'Ample Time'
      } catch (error) {
        return ''
      }
    }

    // 判断评审是否已完成
    const isReviewCompleted = (row) => {
      if (!row.status) return false
      // 已关闭、已归档、已拒绝、已失效等状态都视为已完成
      const completedStatuses = ['CLOSED', 'VOID', 'FAILED', 'REJECTED']
      return completedStatuses.includes(row.status) || row.archived
    }

    // 获取完成状态的显示文本
    const getCompletedStatusText = (row) => {
      if (row.archived) return 'Archived'
      
      switch (row.status) {
        case 'CLOSED':
          return 'Closed'
        case 'VOID':
          return 'Voided'
        case 'FAILED':
          return 'Failed'
        case 'REJECTED':
          return 'Rejected'
        default:
          return 'Completed'
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
      reviewsData,
      showReviewDialog,
      selectedReview,
      showWorkflowDialog,
      selectedWorkflow,
      
      // 项目相关
      currentProject,
      showProjectSelector,
      reviewsMap,
      
      // 配置
      headerButtons,
      headerStats,
      tableColumns,
      tableActions,
      rowOperations,
      errorSuggestions,
      errorButtons,
      
      // 图标
      IconReview,
      Check,
      Clock,
      Warning,
      
      // 方法
      fetchReviewsData,
      cancelLoading,
      handleHeaderAction,
      handleErrorAction,
      handleTableAction,
      handleRowOperation,
      exportReviewsData,
      getReviewsQueryFields,
      getReviewForDetail,
      getStatusType,
      handleCloseReviewDialog,
      handleCloseWorkflowDialog,
      handleWorkflowDetail,
      handleStatClick,
      initializeProject,
      handleProjectSelected,
      handleProjectSelectionCancel,
      getTotalCandidates,
      formatDueDate: formatDueDateLocal,
      formatDateTime,
      getDueDateType,
      getDueDateStatus,
      isReviewCompleted,
      getCompletedStatusText,
      selectedWorkflowId,
      workflowDetailKey
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.reviews {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  gap: 20px;
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  padding: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.info { color: #909399; }

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

.workflow-name {
  font-size: 13px;
  color: #606266;
}

/* 简化的 Next Action 样式 */
.next-action-simple {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-users-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-item {
  font-size: 12px;
  line-height: 1.4;
  color: #303133;
}

.completed-text,
.no-action {
  color: #909399;
  font-size: 12px;
}

.timestamp {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #666;
}

/* 弹窗样式 */
.review-dialog {
  --el-dialog-border-radius: 12px;
}

.review-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.review-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.review-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.review-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.review-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.review-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  color: #f0f0f0;
}

.review-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
  max-height: 80vh;
  overflow-y: auto;
}

/* 工作流弹窗样式 */
.workflow-dialog {
  --el-dialog-border-radius: 12px;
}

.workflow-dialog :deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.workflow-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
}

.workflow-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.workflow-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.workflow-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.workflow-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  color: #f0f0f0;
}

.workflow-dialog :deep(.el-dialog__body) {
  padding: 0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-content {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reviews {
    padding: 10px;
  }
  
  .stats-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .user-info {
    align-items: flex-start;
  }
  
  .candidates-summary {
    flex-direction: column;
    align-items: flex-start;
  }
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

.no-due-date,
.completed-due-date {
  display: flex;
  justify-content: center;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .due-date-text {
    font-size: 11px;
  }
}
</style>
