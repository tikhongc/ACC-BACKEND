<template>
  <div class="rfis-statistics">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="$t('rfisStatistics.title')"
      :description="$t('rfisStatistics.description')"
      :tag="$t('rfisStatistics.tag')"
      tag-type="info"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="$t('rfisStatistics.loading.title')"
      :text="$t('rfisStatistics.loading.text')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="$t('rfisStatistics.error.title')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 统计数据内容 -->
    <div v-if="statisticsData && !loading && !error">

      <!-- 概览统计 -->
      <StatsSection 
        :stats="overviewStats" 
        :title="$t('rfisStatistics.overview.title')"
        @stat-click="handleStatClick" />

      <!-- 详细统计卡片 -->
      <div class="statistics-grid">
        
        <!-- 状态分布 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-dashboard />
                {{ $t('rfisStatistics.charts.statusDistribution') }}
              </span>
            </div>
          </template>
          <div class="distribution-chart">
            <div class="chart-items">
              <div 
                v-for="(count, status) in statisticsData.statistics.status_distribution" 
                :key="status"
                class="chart-item">
                <StatusTag 
                  :status="getStatusType(status)" 
                  :text="status" 
                  size="default" />
                <span class="count">{{ count }}</span>
                <span class="percentage">{{ getPercentage(count, statisticsData.statistics.overview.total_rfis) }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 优先级分布 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-bar-chart />
                {{ $t('rfisStatistics.charts.priorityDistribution') }}
              </span>
            </div>
          </template>
          <div class="distribution-chart">
            <div class="chart-items">
              <div 
                v-for="(count, priority) in statisticsData.statistics.priority_distribution" 
                :key="priority"
                class="chart-item">
                <StatusTag 
                  :status="getPriorityType(priority)" 
                  :text="priority" 
                  size="default" />
                <span class="count">{{ count }}</span>
                <span class="percentage">{{ getPercentage(count, statisticsData.statistics.overview.total_rfis) }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 影响分析 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-exclamation-circle />
                {{ $t('rfisStatistics.charts.impactAnalysis') }}
              </span>
            </div>
          </template>
          <div class="impact-analysis">
            <div class="impact-item">
              <label>{{ $t('rfisStatistics.impact.costImpact') }}:</label>
              <div class="impact-value">
                <span class="count">{{ statisticsData.statistics.impact_analysis.cost_impact }}</span>
                <StatusTag status="warning" :text="$t('rfisStatistics.impact.hasImpact')" size="small" />
              </div>
            </div>
            <div class="impact-item">
              <label>{{ $t('rfisStatistics.impact.scheduleImpact') }}:</label>
              <div class="impact-value">
                <span class="count">{{ statisticsData.statistics.impact_analysis.schedule_impact }}</span>
                <StatusTag status="danger" :text="$t('rfisStatistics.impact.hasImpact')" size="small" />
              </div>
            </div>
            <div class="impact-item">
              <label>{{ $t('rfisStatistics.impact.bothImpacts') }}:</label>
              <div class="impact-value">
                <span class="count">{{ statisticsData.statistics.impact_analysis.both_impacts }}</span>
                <StatusTag status="danger" :text="$t('rfisStatistics.impact.highRisk')" size="small" />
              </div>
            </div>
            <div class="impact-item">
              <label>{{ $t('rfisStatistics.impact.noImpact') }}:</label>
              <div class="impact-value">
                <span class="count">{{ statisticsData.statistics.impact_analysis.no_impact }}</span>
                <StatusTag status="success" :text="$t('rfisStatistics.impact.safe')" size="small" />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 回复分析 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-message />
                {{ $t('rfisStatistics.charts.responseAnalysis') }}
              </span>
            </div>
          </template>
          <div class="response-analysis">
            <div class="response-item">
              <label>{{ $t('rfisStatistics.response.withResponse') }}:</label>
              <div class="response-value">
                <span class="count">{{ statisticsData.statistics.response_analysis.with_responses }}</span>
                <StatusTag status="success" :text="$t('rfisStatistics.response.processed')" size="small" />
              </div>
            </div>
            <div class="response-item">
              <label>{{ $t('rfisStatistics.response.withoutResponse') }}:</label>
              <div class="response-value">
                <span class="count">{{ statisticsData.statistics.response_analysis.without_responses }}</span>
                <StatusTag status="warning" :text="$t('rfisStatistics.response.pending')" size="small" />
              </div>
            </div>
            <div class="response-item full-width">
              <label>{{ $t('rfisStatistics.response.responseRate') }}:</label>
              <div class="response-rate">
                <div class="rate-bar">
                  <div 
                    class="rate-fill" 
                    :style="{ width: statisticsData.statistics.response_analysis.response_rate + '%' }">
                  </div>
                </div>
                <span class="rate-text">{{ statisticsData.statistics.response_analysis.response_rate }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 附件分析 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-folder />
                附件分析
              </span>
            </div>
          </template>
          <div class="attachment-analysis">
            <div class="attachment-item">
              <label>有附件:</label>
              <div class="attachment-value">
                <span class="count">{{ statisticsData.statistics.attachment_analysis.with_attachments }}</span>
                <StatusTag status="success" text="Has Documents" size="small" />
              </div>
            </div>
            <div class="attachment-item">
              <label>無附件:</label>
              <div class="attachment-value">
                <span class="count">{{ statisticsData.statistics.attachment_analysis.without_attachments }}</span>
                <StatusTag status="info" text="No Documents" size="small" />
              </div>
            </div>
            <div class="attachment-item full-width">
              <label>總附件數:</label>
              <div class="attachment-total">
                <span class="total-count">{{ statisticsData.statistics.attachment_analysis.total_attachments }}</span>
                <span class="avg-text">平均每個 RFI: {{ getAverageAttachments() }} 個附件</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 效率指标 -->
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">
                <icon-dashboard />
                效率指標
              </span>
            </div>
          </template>
          <div class="efficiency-metrics">
            <div class="metric-item">
              <label>完成率:</label>
              <div class="metric-value">
                <div class="metric-bar">
                  <div 
                    class="metric-fill completion" 
                    :style="{ width: statisticsData.statistics.efficiency_metrics.completion_rate + '%' }">
                  </div>
                </div>
                <span class="metric-text">{{ statisticsData.statistics.efficiency_metrics.completion_rate }}%</span>
              </div>
            </div>
            <div class="metric-item">
              <label>逾期率:</label>
              <div class="metric-value">
                <div class="metric-bar">
                  <div 
                    class="metric-fill overdue" 
                    :style="{ width: statisticsData.statistics.efficiency_metrics.overdue_rate + '%' }">
                  </div>
                </div>
                <span class="metric-text">{{ statisticsData.statistics.efficiency_metrics.overdue_rate }}%</span>
              </div>
            </div>
            <div class="metric-item">
              <label>附件率:</label>
              <div class="metric-value">
                <div class="metric-bar">
                  <div 
                    class="metric-fill attachment" 
                    :style="{ width: statisticsData.statistics.efficiency_metrics.attachment_rate + '%' }">
                  </div>
                </div>
                <span class="metric-text">{{ statisticsData.statistics.efficiency_metrics.attachment_rate }}%</span>
              </div>
            </div>
          </div>
        </el-card>

      </div>

        <!-- 专业领域和类别分布 -->
        <div class="distribution-section">
          
          <!-- 专业领域分布 -->
          <el-card class="distribution-card" v-if="Object.keys(statisticsData.statistics.discipline_distribution).length > 0">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <icon-apps />
                  專業領域分布
                </span>
              </div>
            </template>
            <div class="distribution-list">
              <div 
                v-for="(count, discipline) in statisticsData.statistics.discipline_distribution" 
                :key="discipline"
                class="distribution-item">
                <span class="discipline-name">{{ discipline }}</span>
                <div class="discipline-bar">
                  <div 
                    class="discipline-fill" 
                    :style="{ width: getPercentage(count, statisticsData.statistics.overview.total_rfis) + '%' }">
                  </div>
                </div>
                <span class="discipline-count">{{ count }}</span>
                <span class="discipline-percentage">{{ getPercentage(count, statisticsData.statistics.overview.total_rfis) }}%</span>
              </div>
            </div>
          </el-card>

          <!-- 类别分布 -->
          <el-card class="distribution-card" v-if="Object.keys(statisticsData.statistics.category_distribution).length > 0">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <icon-tag />
                  類別分布
                </span>
              </div>
            </template>
            <div class="distribution-list">
              <div 
                v-for="(count, category) in statisticsData.statistics.category_distribution" 
                :key="category"
                class="distribution-item">
                <span class="category-name">{{ category }}</span>
                <div class="category-bar">
                  <div 
                    class="category-fill" 
                    :style="{ width: getPercentage(count, statisticsData.statistics.overview.total_rfis) + '%' }">
                  </div>
                </div>
                <span class="category-count">{{ count }}</span>
                <span class="category-percentage">{{ getPercentage(count, statisticsData.statistics.overview.total_rfis) }}%</span>
              </div>
            </div>
          </el-card>

        </div>

      <!-- RFI 配置信息 -->
      <el-card class="config-card" shadow="never" v-if="showConfigPanel">
        <template #header>
          <div class="card-header">
            <span class="header-title">
              <icon-settings />
              RFI 配置信息
            </span>
            <el-button 
              type="text" 
              size="small"
              @click="showConfigPanel = false">
              隱藏配置
            </el-button>
          </div>
        </template>
        
        <RfiConfigPanel :project="currentProject" />
      </el-card>

      <!-- 查询信息 -->
      <QueryInfoCard
        title="RFI Statistics Query"
        api-endpoint="/api/rfis/jarvis/statistics"
        description="Get statistical analysis data for project RFIs"
        :result-count="statisticsData.statistics.overview.total_rfis"
        result-unit="RFIs"
        :custom-fields="getStatisticsQueryFields()" />

      <!-- 原始数据展示 -->
      <JsonViewer
        v-if="showRawData"
        :data="statisticsData"
        title="🔍 Statistics Raw Data"
        description="Complete statistical data structure obtained from ACC RFIs Statistics API"
        :show-copy="true"
        :show-download="true"
        :collapsible="true"
        :collapsed="true" />

    </div>

  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import StatsSection from '../components/StatsSection.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import JsonViewer from '../components/JsonViewer.vue'
import StatusTag from '../components/StatusTag.vue'
import RfiConfigPanel from '../components/RfiConfigPanel.vue'
import projectStore from '../utils/projectStore.js'
import { 
  IconBarChart, 
  IconExclamationCircle, 
  IconMessage, 
  IconFolder, 
  IconDashboard, 
  IconApps, 
  IconTag,
  IconSettings
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'RfisStatistics',
  components: {
    Breadcrumb,
    PageHeader,
    StatsSection,
    LoadingState,
    ErrorState,
    QueryInfoCard,
    JsonViewer,
    StatusTag,
    RfiConfigPanel,
    IconBarChart,
    IconExclamationCircle,
    IconMessage,
    IconFolder,
    IconDashboard,
    IconApps,
    IconTag,
    IconSettings
  },
  data() {
    return {
      statisticsData: null,
      loading: false,
      error: null,
      showRawData: false,
      showConfigPanel: false,
      currentProject: null
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          id: 'refresh',
          text: this.$t('rfisStatistics.actions.refresh'),
          type: 'primary',
          icon: 'refresh'
        },
        {
          id: 'export',
          text: this.$t('rfisStatistics.actions.export'),
          type: 'success',
          icon: 'download'
        },
        {
          id: 'toggle-raw',
          text: this.showRawData ? this.$t('rfisStatistics.actions.hideRawData') : this.$t('rfisStatistics.actions.showRawData'),
          type: 'info',
          icon: 'code'
        },
        {
          id: 'toggle-config',
          text: this.showConfigPanel ? this.$t('rfisStatistics.actions.hideConfig') : this.$t('rfisStatistics.actions.showConfig'),
          type: 'warning',
          icon: 'settings'
        }
      ]
    },

    overviewStats() {
      if (!this.statisticsData?.statistics?.overview) return []
      
      const overview = this.statisticsData.statistics.overview
      const efficiency = this.statisticsData.statistics.efficiency_metrics || {}
      
      return [
        {
          id: 'total',
          label: this.$t('rfisStatistics.overview.totalRfis'),
          value: overview.total_rfis || 0,
          type: 'primary',
          icon: 'file'
        },
        {
          id: 'open',
          label: this.$t('rfisStatistics.overview.openRfis'),
          value: overview.open_rfis || 0,
          type: 'warning',
          icon: 'clock'
        },
        {
          id: 'closed',
          label: this.$t('rfisStatistics.overview.closedRfis'),
          value: overview.closed_rfis || 0,
          type: 'success',
          icon: 'check'
        },
        {
          id: 'answered',
          label: this.$t('rfisStatistics.overview.answeredRfis'),
          value: overview.answered_rfis || 0,
          type: 'info',
          icon: 'message'
        },
        {
          id: 'overdue',
          label: this.$t('rfisStatistics.overview.overdueRfis'),
          value: overview.overdue_rfis || 0,
          type: 'danger',
          icon: 'warning'
        },
        {
          id: 'completion_rate',
          label: this.$t('rfisStatistics.overview.completionRate'),
          value: `${efficiency.completion_rate || 0}%`,
          type: 'success',
          icon: 'chart'
        }
      ]
    },

    errorSuggestions() {
      return [
        this.$t('rfisStatistics.error.suggestions.checkNetwork'),
        this.$t('rfisStatistics.error.suggestions.checkProjectId'),
        this.$t('rfisStatistics.error.suggestions.checkToken'),
        this.$t('rfisStatistics.error.suggestions.checkPermissions')
      ]
    },

    errorButtons() {
      return [
        {
          id: 'retry',
          text: this.$t('rfisStatistics.error.buttons.retry'),
          type: 'primary'
        },
        {
          id: 'back',
          text: this.$t('rfisStatistics.error.buttons.back'),
          type: 'default'
        }
      ]
    }
  },
  async mounted() {
    // 獲取項目信息
    this.currentProject = projectStore.getSelectedProject()
    
    if (!this.currentProject) {
      // 嘗試從路由參數獲取項目信息
      const projectId = this.$route.query.projectId
      const projectName = this.$route.query.projectName
      
      if (projectId && projectName) {
        this.currentProject = { id: projectId, name: projectName }
        projectStore.saveSelectedProject(this.currentProject)
      } else {
        this.$message.error(this.$t('rfisStatistics.messages.noProjectSelected'))
        this.$router.push('/')
        return
      }
    }

    await this.loadStatisticsData()
  },
  methods: {
    async loadStatisticsData() {
      if (!this.currentProject) {
        this.error = 'No project selected'
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log('正在獲取 RFI 統計數據，項目:', this.currentProject.name, this.currentProject.id)
        
        const response = await axios.get('/api/rfis/jarvis/statistics', {
          params: {
            projectId: this.currentProject.id
          },
          timeout: 30000
        })

        console.log('RFI 統計數據響應:', response.data)

        if (response.data.success) {
          this.statisticsData = response.data
          this.$message.success(this.$t('rfisStatistics.messages.loadSuccess'))
        } else {
          throw new Error(response.data.error || this.$t('rfisStatistics.messages.loadFailed'))
        }

      } catch (error) {
        console.error('獲取 RFI 統計數據失敗:', error)
        this.error = error.response?.data?.error || error.message || this.$t('rfisStatistics.messages.loadFailed')
        this.$message.error(this.error)
      } finally {
        this.loading = false
      }
    },

    getStatisticsQueryFields() {
      if (!this.statisticsData) return []
      
      return [
        { label: 'Project ID', value: this.statisticsData.project_id || 'N/A' },
        { label: 'Query Time', value: this.statisticsData.timestamp || 'N/A' },
        { label: 'Total RFIs', value: this.statisticsData.statistics?.overview?.total_rfis || 0 },
        { label: 'Completion Rate', value: `${this.statisticsData.statistics?.efficiency_metrics?.completion_rate || 0}%` }
      ]
    },

    getStatusType(status) {
      const statusMap = {
        'open': 'warning',
        'answered': 'success',
        'closed': 'info',
        'draft': 'info',
        'void': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    },

    getPriorityType(priority) {
      const priorityMap = {
        'high': 'danger',
        'normal': 'info',
        'low': 'success'
      }
      return priorityMap[priority?.toLowerCase()] || 'info'
    },

    getPercentage(count, total) {
      if (!total || total === 0) return 0
      return Math.round((count / total) * 100)
    },

    getAverageAttachments() {
      if (!this.statisticsData?.statistics?.overview?.total_rfis) return 0
      const total = this.statisticsData.statistics.attachment_analysis.total_attachments
      const rfis = this.statisticsData.statistics.overview.total_rfis
      return Math.round((total / rfis) * 10) / 10
    },

    handleHeaderAction(actionId) {
      switch (actionId) {
        case 'refresh':
          this.loadStatisticsData()
          break
        case 'export':
          this.exportStatisticsData()
          break
        case 'toggle-raw':
          this.showRawData = !this.showRawData
          break
        case 'toggle-config':
          this.showConfigPanel = !this.showConfigPanel
          break
      }
    },

    handleStatClick(statId) {
      console.log('統計項點擊:', statId)
      // 可以根據統計項進行導航等操作
    },

    handleErrorAction(actionId) {
      switch (actionId) {
        case 'retry':
          this.loadStatisticsData()
          break
        case 'back':
          this.$router.push('/')
          break
      }
    },

    cancelLoading() {
      this.loading = false
    },

    async exportStatisticsData() {
      try {
        this.$message.info(this.$t('rfisStatistics.messages.exporting'))
        
        const response = await axios.get('/api/rfis/jarvis/statistics', {
          params: {
            projectId: this.currentProject.id
          },
          responseType: 'blob'
        })
        
        const blob = new Blob([response.data], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const projectName = this.currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')
        const fileName = `rfis_statistics_${projectName}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(this.$t('rfisStatistics.messages.exportSuccess', { fileName }))
      } catch (error) {
        console.error('導出統計數據失敗:', error)
        this.$message.error(this.$t('rfisStatistics.messages.exportFailed', { error: error.response?.data?.error || error.message }))
      }
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfis-statistics {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.distribution-chart {
  margin-top: var(--spacing-md);
}

.chart-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.count {
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 40px;
}

.percentage {
  font-size: 0.9em;
  color: var(--color-text-secondary);
  min-width: 50px;
}

.impact-analysis,
.response-analysis,
.attachment-analysis,
.efficiency-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.impact-item,
.response-item,
.attachment-item,
.metric-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.impact-item::before,
.response-item::before,
.attachment-item::before,
.metric-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.impact-item:hover,
.response-item:hover,
.attachment-item:hover,
.metric-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.impact-item:hover::before,
.response-item:hover::before,
.attachment-item:hover::before,
.metric-item:hover::before {
  transform: scaleX(1);
}

.impact-item.full-width,
.response-item.full-width,
.attachment-item.full-width {
  grid-column: 1 / -1;
}

.impact-item label,
.response-item label,
.attachment-item label,
.metric-item label {
  font-weight: 600;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.impact-value,
.response-value,
.attachment-value,
.metric-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.response-rate,
.attachment-total {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.rate-bar,
.metric-bar {
  flex: 1;
  height: 12px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, #00b894, #00cec9);
  border-radius: 6px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.rate-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

.metric-fill {
  height: 100%;
  border-radius: 6px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.metric-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

.metric-fill.completion {
  background: linear-gradient(90deg, #00b894, #00cec9);
}

.metric-fill.overdue {
  background: linear-gradient(90deg, #e17055, #d63031);
}

.metric-fill.attachment {
  background: linear-gradient(90deg, #74b9ff, #0984e3);
}

.rate-text,
.metric-text {
  font-weight: 500;
  color: var(--color-text-primary);
  min-width: 50px;
}

.total-count {
  font-weight: 600;
  font-size: 1.2em;
  color: var(--color-text-primary);
}

.avg-text {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}

.distribution-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.distribution-card {
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  position: relative;
}

.distribution-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.distribution-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.distribution-list::-webkit-scrollbar {
  width: 6px;
}

.distribution-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.distribution-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 3px;
}

.distribution-item {
  display: grid;
  grid-template-columns: 140px 1fr 60px 60px;
  gap: var(--spacing-md);
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.distribution-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.distribution-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.distribution-item:hover::before {
  transform: scaleY(1);
}

.discipline-name,
.category-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.discipline-bar,
.category-bar {
  height: 10px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.discipline-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 5px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.discipline-fill::after,
.category-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.discipline-count,
.category-count {
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 16px;
  text-align: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.discipline-percentage,
.category-percentage {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

/* 響應式設計優化 */
@media (max-width: 1200px) {
  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  }
  
  .distribution-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .distribution-item {
    grid-template-columns: 120px 1fr 50px 50px;
    gap: var(--spacing-sm);
  }
}

@media (max-width: 768px) {
  .rfis-statistics {
    padding: var(--spacing-md);
  }
  
  .statistics-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .impact-analysis,
  .response-analysis,
  .attachment-analysis,
  .efficiency-metrics {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .distribution-item {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
    text-align: center;
  }
  
  .discipline-name,
  .category-name {
    font-size: 16px;
    margin-bottom: var(--spacing-xs);
  }
  
  .discipline-bar,
  .category-bar {
    margin: var(--spacing-xs) 0;
  }
  
  .discipline-count,
  .category-count,
  .discipline-percentage,
  .category-percentage {
    display: inline-block;
    margin: 0 var(--spacing-xs);
  }
}

@media (max-width: 480px) {
  .rfis-statistics {
    padding: var(--spacing-sm);
  }
  
  .stat-card .card-header {
    padding: 16px 20px 12px;
    margin: -16px -20px 16px;
  }
  
  .distribution-list {
    max-height: 300px;
  }
  
  .distribution-item {
    padding: 12px;
  }
}
</style>
