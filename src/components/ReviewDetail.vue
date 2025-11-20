<template>
  <div class="review-detail">
    <div class="review-header">
      <h3>{{ review.name }}</h3>
      <div class="review-meta">
        <StatusTag 
          :status="getStatusForTag(review.status)" 
          :text="review.status"
          size="small"
          :show-icon="false" />
        <StatusTag v-if="review.archived" status="archived" :text="t('reviewDetail.basicInfo.archived')" size="small" :show-icon="false" />
        <span class="review-id">{{ t('reviewDetail.basicInfo.sequenceId') }}: #{{ review.sequenceId }}</span>
      </div>
    </div>
    
    <!-- basicInfo -->
    <div class="review-info">
      <div class="info-grid">
        <div class="info-item">
          <strong>{{ t('reviewDetail.basicInfo.id') }}:</strong>
          <code>{{ review.id }}</code>
        </div>
        <div class="info-item">
          <strong>{{ t('reviewDetail.basicInfo.sequenceId') }}:</strong>
          <code>{{ review.sequenceId }}</code>
        </div>
        <div class="info-item">
          <strong>{{ t('reviewDetail.workflow.id') }}:</strong>
          <code>{{ review.workflowId || 'N/A' }}</code>
        </div>
        <div class="info-item">
          <strong>{{ t('reviewDetail.workflow.currentStepId') }}:</strong>
          <code>{{ review.currentStepId || 'N/A' }}</code>
        </div>
        <div class="info-item">
          <strong>{{ t('reviewDetail.workflow.stepDueDate') }}:</strong>
          <span>{{ formatDate(review.currentStepDueDate) }}</span>
        </div>
      </div>
    </div>

    <!-- 参与者信息 -->
    <div class="participants-section">
      <h4>👥 {{ t('reviewDetail.participants.title') }}</h4>
      
      <!-- 创建者 -->
      <div class="participant-group">
        <div class="participant-label">📝 {{ t('reviewDetail.participants.creator') }}</div>
        <div class="participant-card" v-if="review.createdBy">
          <div class="participant-info">
            <div class="participant-name">{{ review.createdBy.name }}</div>
            <div class="participant-id">{{ review.createdBy.autodeskId }}</div>
          </div>
        </div>
        <div v-else class="no-data">{{ t('common.noData') }}</div>
      </div>
      
      <!-- 归档者 -->
      <div v-if="review.archived && review.archivedBy" class="participant-group">
        <div class="participant-label">📦 {{ t('reviewDetail.participants.archiver') }}</div>
        <div class="participant-card">
          <div class="participant-info">
            <div class="participant-name">{{ review.archivedBy.name }}</div>
            <div class="participant-id">{{ review.archivedBy.autodeskId }}</div>
          </div>
        </div>
      </div>
      
      <!-- 下一步操作者 -->
      <div v-if="review.nextActionBy" class="participant-group">
        <div class="participant-label">⏭️ {{ t('reviewDetail.participants.nextActionBy') }}</div>
        
        <!-- 审阅者类型分析 -->
        <div v-if="review.reviewer_analysis" class="reviewer-analysis-section">
          <div class="subsection-title">
            🎯 {{ t('reviewDetail.participants.currentReviewStatus') }} 
            <el-tag :type="getReviewModeType(review.reviewer_analysis.review_mode)" size="small">
              {{ getReviewModeText(review.reviewer_analysis.review_mode) }}
            </el-tag>
          </div>
          
          <!-- 主要审阅者（已认领） -->
          <div v-if="review.reviewer_analysis.has_primary_reviewers" class="primary-reviewers-section">
            <div class="reviewer-type-title">
              ✅ {{ t('reviewDetail.participants.primaryReviewers') }}
              <span class="count-badge">{{ review.reviewer_analysis.counts.primary_total }}</span>
            </div>
            <div class="participants-list">
              <div 
                v-for="user in review.reviewer_analysis.primary_reviewers" 
                :key="user.autodeskId"
                class="participant-card primary">
                <div class="participant-info">
                  <div class="participant-name">{{ user.name }}</div>
                  <div class="participant-id">{{ user.autodeskId }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 可选审阅者（候选者） -->
          <div v-if="review.reviewer_analysis.has_optional_reviewers" class="optional-reviewers-section">
            <div class="reviewer-type-title">
              🎯 {{ t('reviewDetail.participants.optionalReviewers') }}
              <span class="count-badge">{{ review.reviewer_analysis.counts.optional_total }}</span>
            </div>
            
            <!-- 候选用户 -->
            <div v-if="review.reviewer_analysis.optional_reviewers.users && review.reviewer_analysis.optional_reviewers.users.length > 0" class="candidate-group">
              <div class="candidate-type">👤 {{ t('reviewDetail.participants.candidateUsers') }} ({{ review.reviewer_analysis.optional_reviewers.users.length }})</div>
              <div class="participants-list">
                <div 
                  v-for="user in review.reviewer_analysis.optional_reviewers.users" 
                  :key="user.autodeskId"
                  class="participant-card user">
                  <div class="participant-info">
                    <div class="participant-name">{{ user.name }}</div>
                    <div class="participant-id">{{ user.autodeskId }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 候选角色 -->
            <div v-if="review.reviewer_analysis.assignment_details.has_roles" class="candidate-group">
              <div class="candidate-type">🏷️ {{ t('reviewDetail.participants.candidateRoles') }} ({{ review.reviewer_analysis.counts.optional_roles }})</div>
              <div class="role-tags">
                <el-tag 
                  v-for="roleName in review.reviewer_analysis.assignment_details.role_names" 
                  :key="roleName"
                  type="success" 
                  size="small">
                  {{ roleName }}
                </el-tag>
              </div>
            </div>
            
            <!-- 候选公司 -->
            <div v-if="review.reviewer_analysis.assignment_details.has_companies" class="candidate-group">
              <div class="candidate-type">🏢 {{ t('reviewDetail.participants.candidateCompanies') }} ({{ review.reviewer_analysis.counts.optional_companies }})</div>
              <div class="company-tags">
                <el-tag 
                  v-for="companyName in review.reviewer_analysis.assignment_details.company_names" 
                  :key="companyName"
                  type="warning" 
                  size="small">
                  {{ companyName }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 传统显示方式（如果没有审阅者分析数据） -->
        <div v-else>
          <!-- 已认领用户 -->
          <div v-if="review.nextActionBy.claimedBy && review.nextActionBy.claimedBy.length > 0" class="claimed-section">
            <div class="subsection-title">✅ {{ t('reviewDetail.participants.claimedUsers') }}</div>
            <div class="participants-list">
              <div 
                v-for="user in review.nextActionBy.claimedBy" 
                :key="user.autodeskId"
                class="participant-card claimed">
                <div class="participant-info">
                  <div class="participant-name">{{ user.name }}</div>
                  <div class="participant-id">{{ user.autodeskId }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 候选者 -->
          <div v-if="review.nextActionBy.candidates" class="candidates-section">
            <div class="subsection-title">🎯 {{ t('reviewDetail.participants.candidates') }}</div>
            
            <!-- 候选用户 -->
          <div v-if="review.nextActionBy.candidates.users && review.nextActionBy.candidates.users.length > 0" class="candidate-group">
            <div class="candidate-type">👤 {{ t('reviewDetail.participants.users') }} ({{ review.nextActionBy.candidates.users.length }})</div>
            <div class="participants-list">
              <div 
                v-for="user in review.nextActionBy.candidates.users" 
                :key="user.autodeskId"
                class="participant-card user">
                <div class="participant-info">
                  <div class="participant-name">{{ user.name }}</div>
                  <div class="participant-id">{{ user.autodeskId }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 候选角色 -->
          <div v-if="review.nextActionBy.candidates.roles && review.nextActionBy.candidates.roles.length > 0" class="candidate-group">
            <div class="candidate-type">🏷️ {{ t('reviewDetail.participants.roles') }} ({{ review.nextActionBy.candidates.roles.length }})</div>
            <div class="participants-list">
              <div 
                v-for="role in review.nextActionBy.candidates.roles" 
                :key="role.autodeskId"
                class="participant-card role">
                <div class="participant-info">
                  <div class="participant-name">{{ role.name }}</div>
                  <div class="participant-id">{{ role.autodeskId }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 候选公司 -->
          <div v-if="review.nextActionBy.candidates.companies && review.nextActionBy.candidates.companies.length > 0" class="candidate-group">
            <div class="candidate-type">🏢 {{ t('reviewDetail.participants.companies') }} ({{ review.nextActionBy.candidates.companies.length }})</div>
            <div class="participants-list">
              <div 
                v-for="company in review.nextActionBy.candidates.companies" 
                :key="company.autodeskId"
                class="participant-card company">
                <div class="participant-info">
                  <div class="participant-name">{{ company.name }}</div>
                  <div class="participant-id">{{ company.autodeskId }}</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间线信息 -->
    <div class="timeline-section">
      <h4>📅 {{ t('reviewDetail.timeline.title') }}</h4>
      <div class="timeline-grid">
        <div class="timeline-item">
          <div class="timeline-label">{{ t('reviewDetail.timeline.createdAt') }}</div>
          <div class="timeline-value">{{ formatDate(review.createdAt) }}</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-label">{{ t('reviewDetail.timeline.updatedAt') }}</div>
          <div class="timeline-value">{{ formatDate(review.updatedAt) }}</div>
        </div>
        <div v-if="review.finishedAt" class="timeline-item">
          <div class="timeline-label">{{ t('reviewDetail.timeline.finishedAt') }}</div>
          <div class="timeline-value">{{ formatDate(review.finishedAt) }}</div>
        </div>
        <div v-if="review.archivedAt" class="timeline-item">
          <div class="timeline-label">{{ t('reviewDetail.timeline.archivedAt') }}</div>
          <div class="timeline-value">{{ formatDate(review.archivedAt) }}</div>
        </div>
      </div>
    </div>

    <!-- 详细信息Tab面板 -->
    <div class="detail-tabs-container">
      <el-tabs v-model="activeTab" type="card" class="detail-tabs">
        <!-- 第一个Tab: 工作流图表 -->
        <el-tab-pane label="📊 Workflow Chart" name="workflow-chart">
          <!-- 工作流进度历史 -->
          <div v-if="review.id" class="progress-history-section">
            <ReviewProgressHistory 
              :review-id="review.id" 
              :project="project" />
          </div>
        </el-tab-pane>
        
        <!-- 第二个Tab: 评审文件版本 -->
        <el-tab-pane label="📄 File Versions" name="file-versions">
          <!-- 文件版本列表 -->
          <div class="file-versions-section">
            <!-- 加载状态 -->
            <div v-if="versionsLoading" class="versions-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>{{ t('reviewDetail.fileVersions.loading') }}</span>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="versionsError" class="versions-error">
              <el-alert
                :title="versionsError"
                type="error"
                :closable="false"
                show-icon />
              <el-button 
                type="primary" 
                size="small" 
                @click="loadVersions"
                style="margin-top: 8px;">
                {{ t('reviewDetail.fileVersions.retryLoad') }}
              </el-button>
            </div>
            
            <!-- 文件版本表格 -->
            <div v-else-if="versionsData && versionsData.versions && versionsData.versions.length > 0" class="versions-table-container">
              <div class="versions-header">
                <h4>📄 {{ t('reviewDetail.fileVersions.title') }}</h4>
                <div class="versions-stats">
                  <el-tag type="info" size="small">{{ t('reviewDetail.fileVersions.totalFiles', { count: versionsData.versions.length }) }}</el-tag>
                  <el-tag v-if="versionsData.stats?.duplicate_versions_count > 0" type="warning" size="small">
                    {{ t('reviewDetail.fileVersions.duplicatesRemoved', { count: versionsData.stats.duplicate_versions_count }) }}
                  </el-tag>
                </div>
              </div>
              
              <el-table 
                :data="versionsData.versions" 
                stripe 
                border 
                class="versions-table"
                :default-sort="{prop: 'name', order: 'ascending'}">
                
                <!-- 文件名 -->
                <el-table-column prop="name" :label="t('reviewDetail.fileVersions.fileName')" min-width="250" sortable show-overflow-tooltip>
                  <template #default="scope">
                    <div class="file-name-cell">
                      <el-icon><Document /></el-icon>
                      <span class="file-name">{{ scope.row.display_name || scope.row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                
                <!-- 文件类型 -->
                <el-table-column prop="file_extension" :label="t('reviewDetail.fileVersions.fileType')" width="90" sortable align="center">
                  <template #default="scope">
                    <el-tag v-if="scope.row.file_extension" size="small" type="info">
                      {{ scope.row.file_extension }}
                    </el-tag>
                    <span v-else class="no-data">-</span>
                  </template>
                </el-table-column>
                
                <!-- 版本 -->
                <el-table-column prop="version_number" :label="t('reviewDetail.fileVersions.version')" width="70" sortable align="center">
                  <template #default="scope">
                    <el-tag v-if="scope.row.version_number" size="small" type="warning">
                      v{{ scope.row.version_number }}
                    </el-tag>
                    <span v-else class="no-data">-</span>
                  </template>
                </el-table-column>
                
                <!-- 最终审阅状态 -->
                <el-table-column prop="approve_status" :label="t('reviewDetail.fileVersions.finalReviewStatus')" width="130" sortable align="center">
                  <template #default="scope">
                    <el-tag 
                      v-if="scope.row.approve_status"
                      :type="scope.row.approve_status.status_type" 
                      size="small">
                      {{ scope.row.approve_status.label }}
                    </el-tag>
                    <el-tag 
                      v-else
                      type="info" 
                      size="small">
                      {{ t('reviewDetail.fileVersions.notCompleted') }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <!-- 相关评审 -->
                <el-table-column :label="t('reviewDetail.fileVersions.relatedReview')" width="110" fixed="right" align="center">
                  <template #default="scope">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="showVersionDetail(scope.row)"
                      :icon="Search">
                      {{ t('reviewDetail.fileVersions.viewReview') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <!-- 无文件版本或手动加载 -->
            <div v-else class="versions-load-button">
              <el-button type="primary" @click="loadVersions">
                <el-icon><FolderOpened /></el-icon>
                {{ t('reviewDetail.fileVersions.loadButton') }}
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 第三个Tab: 详细信息 -->
        <el-tab-pane label="🔄 Workflow Template" name="workflow-details">
          <!-- 使用 SingleWorkflowDetail 组件替换原有的工作流详情 -->
          <div v-if="review.workflowId" class="workflow-section">
            <SingleWorkflowDetail 
              :workflow-id="review.workflowId" 
              :project="project" />
          </div>
          
          <!-- 无关联工作流提示 -->
          <div v-else class="no-workflow">
            <el-alert
              :title="t('reviewDetail.workflowInfo.noWorkflow')"
              type="info"
              :closable="false"
              show-icon />
          </div>
          
          <!-- 评审详细信息JSON数据查看器 (总是显示) -->
          <div class="review-details-json" style="margin-top: 16px;">
            <el-collapse>
              <el-collapse-item title="🔍 View Review Raw Data" name="review-details-json">
                <JsonViewer 
                  :data="review"
                  title="Review Raw Data"
                  :max-height="400" />
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>


    <!-- 文件版本详情弹窗 -->
    <el-dialog
      v-model="showVersionDialog"
      :title="t('reviewDetail.fileVersions.fileVersionDetail', { name: selectedVersion?.name || '' })"
      width="85%"
      top="5vh"
      :before-close="handleCloseVersionDialog"
      draggable
      destroy-on-close
      class="version-dialog optimized-modal">
      <div v-if="selectedVersion" class="dialog-content">
        <FileVersionDetail 
          :file-version="selectedVersion" 
          :project-id="project?.id" />
      </div>
    </el-dialog>

    <!-- 原始数据 -->
    <div class="raw-data-section">
      <el-collapse>
        <el-collapse-item :title="t('reviewDetail.rawData.reviewDataTitle')" name="review-raw-data">
          <JsonViewer 
            :data="review"
            :title="t('reviewDetail.rawData.reviewDataLabel')"
            :max-height="400" />
        </el-collapse-item>
        <el-collapse-item 
          v-if="workflowData" 
          :title="t('reviewDetail.rawData.workflowDataTitle')" 
          name="workflow-raw-data">
          <JsonViewer 
            :data="workflowData"
            :title="t('reviewDetail.rawData.workflowDataLabel')"
            :max-height="400" />
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Loading, View, Document, FolderOpened, Search, Check, Clock, Warning, User } from '@element-plus/icons-vue'
import JsonViewer from './JsonViewer.vue'
import FileVersionDetail from './FileVersionDetail.vue'
import StatusTag from './StatusTag.vue'
import ReviewProgressHistory from './ReviewProgressHistory.vue'
import SingleWorkflowDetail from './SingleWorkflowDetail.vue'
import { formatDate } from '../utils/dateUtils.js'

export default {
  name: 'ReviewDetail',
  components: {
    JsonViewer,
    FileVersionDetail,
    StatusTag,
    ReviewProgressHistory,
    SingleWorkflowDetail,
    Loading,
    View,
    Document,
    FolderOpened,
    Search,
    Check,
    Clock,
    Warning,
    User
  },
  props: {
    review: {
      type: Object,
      required: true
    },
    project: {
      type: Object,
      required: false,
      default: null
    }
  },
  setup(props) {
    const { t } = useI18n()
    
    // 响应式数据
    const versionsData = ref(null)
    const versionsLoading = ref(false)
    const versionsError = ref('')
    
    const showVersionDialog = ref(false)
    const selectedVersion = ref(null)
    
    const showProgressHistory = ref(false)
    const activeDetailSections = ref([])
    const activeTab = ref('workflow-chart')
    
    // Force reactive display of review data
    const reviewDisplay = computed(() => ({
      id: props.review?.id,
      name: props.review?.name,
      sequenceId: props.review?.sequenceId,
      timestamp: Date.now(),
      componentKey: `${props.review?.id}-${Math.random()}`
    }))
    
    
    // 加载文件版本数据
    const loadVersions = async () => {
      if (!props.review?.id) {
        versionsError.value = t('reviewDetail.messages.missingReviewId')
        return
      }
      
      if (!props.project?.id) {
        versionsError.value = t('reviewDetail.messages.missingProjectInfoForVersions')
        return
      }
      
      versionsLoading.value = true
      versionsError.value = ''
      
      try {
        const response = await axios.get(`/api/reviews/jarvis/${props.review.id}/versions`, {
          timeout: 30000,
          params: {
            projectId: props.project.id,
            _t: Date.now() // 防止缓存
          }
        })
        
        if (response.data.success) {
          versionsData.value = response.data
          
          // 输出调试信息
          console.log('文件版本API响应统计:', response.data.stats)
          console.log('文件版本数量:', response.data.versions?.length)
          
          // 检查前端是否还有重复的文件版本
          const versionUrns = response.data.versions?.map(v => v.urn) || []
          const uniqueUrns = new Set(versionUrns)
          console.log('文件版本检查 - 总URN数:', versionUrns.length)
          console.log('文件版本检查 - 唯一URN数:', uniqueUrns.size)
          if (versionUrns.length !== uniqueUrns.size) {
            console.warn('⚠️ 前端仍然检测到重复文件版本!')
          } else {
            console.log('✅ 文件版本数据无重复')
          }
          
          if (response.data.stats?.duplicate_versions_count > 0) {
            ElMessage.success(t('reviewDetail.messages.fileVersionLoadSuccessWithDuplicates', { count: response.data.stats.duplicate_versions_count }))
          } else {
            ElMessage.success(t('reviewDetail.messages.fileVersionLoadSuccess'))
          }
        } else {
          throw new Error(response.data.error || t('reviewDetail.messages.fileVersionLoadFailed'))
        }
      } catch (err) {
        console.error('加载文件版本失败:', err)
        versionsError.value = err.response?.data?.error || err.message || t('reviewDetail.messages.fileVersionLoadFailed')
        ElMessage.error(versionsError.value)
      } finally {
        versionsLoading.value = false
      }
    }
    
    // 显示文件版本详情
    const showVersionDetail = (version) => {
      selectedVersion.value = version
      showVersionDialog.value = true
    }
    
    // 关闭文件版本详情对话框
    const handleCloseVersionDialog = () => {
      try {
        showVersionDialog.value = false
        selectedVersion.value = null
      } catch (error) {
        console.error('Error closing version dialog:', error)
        // 强制重置状态
        showVersionDialog.value = false
        selectedVersion.value = null
      }
    }
    
    // 工具方法
    const getStatusType = (status) => {
      const statusMap = {
        'OPEN': 'success',
        'CLOSED': 'info',
        'VOID': 'warning',
        'FAILED': 'danger'
      }
      return statusMap[status] || 'info'
    }

    // StatusTag适配方法
    const getStatusForTag = (status) => {
      const statusMap = {
        'OPEN': 'open',
        'CLOSED': 'closed',
        'VOID': 'void',
        'FAILED': 'failed'
      }
      return statusMap[status] || status?.toLowerCase() || 'unknown'
    }
    
    // 使用导入的formatDate函数
    
    // 获取审阅模式的显示文本
    const getReviewModeText = (mode) => {
      const modeTexts = {
        'primary_only': t('reviewDetail.reviewModes.primary_only'),
        'optional_only': t('reviewDetail.reviewModes.optional_only'),
        'mixed': t('reviewDetail.reviewModes.mixed'),
        'none': t('reviewDetail.reviewModes.none')
      }
      return modeTexts[mode] || mode
    }
    
    // 获取审阅模式的标签类型
    const getReviewModeType = (mode) => {
      const modeTypes = {
        'primary_only': 'success',
        'optional_only': 'warning',
        'mixed': 'info',
        'none': 'danger'
      }
      return modeTypes[mode] || 'default'
    }
    
    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return ''
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }
    
    
    
    // 监听review变化，重置数据 - 使用sequenceId作为主要标识
    watch(() => props.review?.sequenceId || props.review?.id, (newId, oldId) => {
      if (newId !== oldId) {
        console.log(`Review changed from ${oldId} to ${newId}`)
        try {
          versionsData.value = null
          versionsError.value = ''
          showVersionDialog.value = false
          selectedVersion.value = null
          showProgressHistory.value = false
        } catch (error) {
          console.error('Error resetting review detail data:', error)
        }
      }
    }, { immediate: true })
    
    // 组件挂载
    onMounted(() => {
      console.log('ReviewDetail mounted with review:', {
        id: props.review?.id,
        name: props.review?.name,
        sequenceId: props.review?.sequenceId,
        fullReviewObject: props.review
      })
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      versionsData,
      versionsLoading,
      versionsError,
      loadVersions,
      showVersionDialog,
      selectedVersion,
      showVersionDetail,
      handleCloseVersionDialog,
      showProgressHistory,
      activeDetailSections,
      activeTab,
      reviewDisplay,
      
      // 工具方法
      getStatusType,
      getStatusForTag,
      formatDate,
      formatFileSize,
      getReviewModeText,
      getReviewModeType
    }
  }
}
</script>

<style scoped>
.review-detail {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f2f5;
}

.review-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
}

.review-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  border-left: 4px solid #3b82f6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.info-item strong {
  min-width: 120px;
  color: #374151;
  font-size: 13px;
}

.info-item code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #dc2626;
}

.participants-section {
  margin-bottom: 24px;
}

.participants-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.participant-group {
  margin-bottom: 20px;
}

.participant-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.subsection-title {
  font-weight: 500;
  color: #6b7280;
  margin: 12px 0 8px 0;
  font-size: 13px;
}

.candidate-type {
  font-weight: 500;
  color: #4b5563;
  margin: 8px 0 6px 0;
  font-size: 12px;
}

.participants-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.participant-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s ease;
}

.participant-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.participant-card.claimed {
  border-color: #10b981;
  background: #f0fdf4;
}

.participant-card.primary {
  border-color: #10b981;
  background: #f0fdf4;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
}

.participant-card.user {
  border-color: #3b82f6;
  background: #eff6ff;
}

.participant-card.role {
  border-color: #10b981;
  background: #f0fdf4;
}

.participant-card.company {
  border-color: #f59e0b;
  background: #fffbeb;
}

.reviewer-analysis-section {
  margin-bottom: 16px;
}

.reviewer-type-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background-color: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.primary-reviewers-section {
  margin-bottom: 16px;
}

.optional-reviewers-section {
  margin-bottom: 16px;
}

.role-tags, .company-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.participant-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 14px;
}

.participant-id {
  font-size: 11px;
  color: #6b7280;
  font-family: 'Consolas', 'Monaco', monospace;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px dashed #d1d5db;
}

.timeline-section {
  margin-bottom: 24px;
}

.timeline-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.timeline-item {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.timeline-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

.timeline-value {
  font-size: 13px;
  color: #1f2937;
  font-family: 'Consolas', 'Monaco', monospace;
}

.workflow-section {
  margin-bottom: 24px;
}

.workflow-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.workflow-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  color: #6b7280;
}

.workflow-error {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
}

.workflow-visualization {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.workflow-stats {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.workflow-load-button {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.no-workflow {
  margin-bottom: 24px;
}

/* 评审进度历史样式 */
.progress-history-section {
  margin-bottom: 24px;
}

.progress-history-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.progress-history-load-button {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

.progress-history-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

/* 工作流进度样式 */
.workflow-progress-section {
  margin-bottom: 24px;
}

.workflow-progress-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.workflow-progress-display {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.progress-info h5 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.workflow-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.progress-summary {
  flex-shrink: 0;
}

.progress-bar-container {
  position: relative;
}

.progress-text {
  margin-top: 8px;
  text-align: center;
  color: #374151;
  font-weight: 500;
  font-size: 14px;
}

/* 工作流步骤进度可视化 - 时间线样式 */
.workflow-steps-progress {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.steps-timeline {
  position: relative;
}

.timeline-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 32px;
  position: relative;
}

.timeline-step:last-child {
  margin-bottom: 0;
}

.step-node {
  position: relative;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.timeline-step.completed .step-circle {
  background: #10b981;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.timeline-step.current .step-circle {
  background: #3b82f6;
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  animation: pulse-glow 2s infinite;
}

.timeline-step.pending .step-circle {
  background: #f8fafc;
  color: #6b7280;
  border: 2px solid #d1d5db;
}

.completed-icon {
  color: white;
  font-size: 20px;
}

.current-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  animation: pulse-dot 1.5s infinite;
}

.step-line {
  position: absolute;
  left: 23px;
  top: 48px;
  bottom: -32px;
  width: 2px;
  transition: all 0.3s ease;
  z-index: 1;
}

.step-line.completed {
  background: linear-gradient(to bottom, #10b981, #059669);
}

.step-line.pending {
  background: #e5e7eb;
}

.timeline-step:last-child .step-line {
  display: none;
}

/* 步骤内容样式 */
.step-content {
  flex: 1;
  min-width: 0;
}

.step-header {
  margin-bottom: 12px;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.step-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.step-status-tag {
  font-size: 11px !important;
  padding: 3px 8px !important;
  height: auto !important;
  line-height: 1.2 !important;
  border-radius: 12px !important;
}

.step-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 13px;
}

.step-type {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.step-duration {
  color: #f59e0b;
  font-weight: 500;
}

/* 时间信息样式 */
.step-timing {
  margin: 12px 0;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #e5e7eb;
}

.completion-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-size: 13px;
  font-weight: 500;
}

.completion-time .el-icon {
  font-size: 14px;
}

.due-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
}

.due-time .el-icon {
  font-size: 14px;
}

/* 负责人样式 */
.step-assignees {
  margin: 12px 0;
}

.assignees-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 8px;
}

.assignees-label .el-icon {
  font-size: 14px;
  color: #6b7280;
}

.assignees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assignee-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.assignee-item:hover {
  background: #e0f2fe;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0ea5e9;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.assignee-name {
  font-size: 13px;
  color: #0c4a6e;
  font-weight: 500;
}

/* 其他候选者样式 */
.step-candidates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.step-candidates .el-tag {
  font-size: 11px !important;
  padding: 4px 8px !important;
  height: auto !important;
  line-height: 1.2 !important;
}

/* 完成标记样式 */
.completed-check {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
}

/* 动画效果 */
@keyframes pulse-glow {
  0% {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transform: scale(1);
  }
}

@keyframes pulse-dot {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.versions-section {
  margin-bottom: 24px;
}

.versions-section h4 {
  color: #1f2937;
  margin-bottom: 16px;
  font-size: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.versions-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  color: #6b7280;
}

.versions-error {
  padding: 16px;
  background: #fef2f2;
  border-radius: 8px;
}

.versions-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.versions-stats {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  margin-bottom: 16px;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.version-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.version-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1f2937;
}

.version-name span {
  flex: 1;
}

.version-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.info-item strong {
  min-width: 120px;
  color: #6b7280;
  flex-shrink: 0;
}

.urn-text {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #dc2626;
  word-break: break-all;
  flex: 1;
}

.identifier-text {
  background: #e0f2fe;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #0369a1;
  word-break: break-all;
  flex: 1;
}

.custom-attributes {
  background: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.attributes-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 13px;
}

.attributes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attribute-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.attribute-name {
  font-weight: 500;
  color: #374151;
  min-width: 150px;
  font-size: 12px;
}

.attribute-value {
  flex: 1;
  color: #1f2937;
  font-size: 12px;
}

.versions-load-button {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #d1d5db;
}

/* 文件版本表格样式 */
.file-versions-section {
  padding: 16px;
}

.versions-table-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.versions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.versions-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 16px;
}

.versions-stats {
  display: flex;
  gap: 8px;
}

.versions-table {
  width: 100%;
}

.versions-table .el-table__header-wrapper {
  background: #f8fafc;
}

.versions-table .el-table__header th {
  background: #f8fafc !important;
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
}

.versions-table .el-table__row:hover > td {
  background-color: #f0f9ff !important;
}

.versions-table .el-button--small {
  padding: 4px 8px;
  font-size: 12px;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

.version-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

/* 组件特定的模态框样式 */

.version-dialog {
  --el-dialog-content-font-size: 14px;
}

.version-dialog .dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

/* Tab面板样式 */
.detail-tabs-container {
  margin-bottom: 24px;
}

.detail-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-tabs .el-tabs__header {
  margin: 0;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-tabs .el-tabs__content {
  padding: 24px;
}

.progress-history-section {
  margin: 0;
}

.raw-data-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .review-detail {
    padding: 16px;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .participants-list {
    grid-template-columns: 1fr;
  }
  
  .timeline-grid {
    grid-template-columns: 1fr;
  }
}
</style>
