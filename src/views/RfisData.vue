<template>
  <div class="rfis">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="$t('rfis.title')"
      :description="$t('rfis.description')"
      :tag="$t('rfis.tag')"
      tag-type="success"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 标签页切换 -->
    <el-card class="tabs-card" shadow="never" style="margin-bottom: 24px;">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="rfi-tabs">
        <el-tab-pane :label="$t('rfis.table.title')" name="data">
        </el-tab-pane>
        <el-tab-pane :label="$t('rfisStatistics.title')" name="statistics">
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- RFI 数据列表标签页 -->
    <div v-show="activeTab === 'data'" class="tab-content">
      <!-- 统计信息区域 -->
    <StatsSection 
      v-if="rfisData && !loading && !error"
      :stats="headerStats" 
      @stat-click="handleStatClick" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="activeTab === 'data' ? $t('rfis.loading.title') : $t('rfis.loading.statistics')"
      :text="activeTab === 'data' ? $t('rfis.loading.text') : $t('rfis.loading.statisticsText')"
      :show-progress="false"
      :show-cancel="true"
      @cancel="cancelLoading" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="activeTab === 'data' ? $t('rfis.error.title') : $t('rfis.error.statisticsTitle')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

      <!-- 成功状态指示器 -->
      <StatusIndicator
        v-if="rfisData && !loading && !error"
        status="success"
        :title="$t('rfis.success.title')"
        :description="$t('rfis.success.description', { count: rfisData.rfis?.length || 0 })"
        :details="$t('rfis.success.lastUpdated', { time: new Date().toLocaleString() })"
        size="default"
        :auto-hide="true"
        :auto-hide-delay="2000"
        style="margin-bottom: 24px;" />

      <!-- RFI 配置信息 -->
      <el-card class="config-card" shadow="never" v-if="showConfigPanel && currentProject">
        <template #header>
          <div class="card-header">
            <span class="header-title">
              <icon-settings />RFI配置信息</span>
            <el-button 
              type="text" 
              size="small"
              @click="showConfigPanel = false">隱藏配置</el-button>
          </div>
        </template>
        
        <RfiConfigPanel :project="currentProject" />
      </el-card>

      <!-- 查询信息卡片 -->
      <QueryInfoCard
        v-if="rfisData && !loading && !error"
        :title="$t('rfis.queryInfo.title')"
        api-endpoint="/api/rfis/jarvis"
        :description="$t('rfis.queryInfo.description')"
        :result-count="rfisData.rfis?.length || 0"
        :result-unit="$t('rfis.queryInfo.resultUnit')"
        :custom-fields="getRfisQueryFields()" />

      <!-- 搜索和筛选面板 -->
    <el-card v-if="!loading && !error" class="filter-card" shadow="never" style="margin-bottom: 24px;">
      <div class="search-filter-container">
        <!-- 搜索框 -->
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            :placeholder="$t('rfis.search.placeholder')"
            prefix-icon="Search"
            clearable
            @input="handleSearch"
            class="search-input"
            style="width: 400px;">
          </el-input>
          <el-button 
            type="primary" 
            :icon="showFilters ? 'ArrowUp' : 'ArrowDown'"
            @click="showFilters = !showFilters">
            {{ showFilters ? $t('rfis.search.collapseFilters') : $t('rfis.search.expandFilters') }}
          </el-button>
        </div>

        <!-- 快速筛选标签 -->
        <div v-if="rfisData?.stats" class="quick-filters">
          <el-tag 
            v-for="tag in quickFilterTags"
            :key="tag.id"
            :type="tag.type"
            :effect="activeQuickFilter === tag.id ? 'dark' : 'plain'"
            @click="applyQuickFilter(tag)"
            class="quick-filter-tag"
            style="cursor: pointer; margin-right: 8px;">
            {{ tag.label }} ({{ tag.count }})
          </el-tag>
        </div>

        <!-- 筛选器表单 -->
        <el-form v-show="showFilters" :inline="true" :model="filters" class="filter-form" style="margin-top: 16px;">
          <el-form-item label="Status">
            <el-select v-model="filters.status" placeholder="All Statuses" clearable @change="applyFilters" style="width: 150px;">
              <el-option label="Draft" value="draft" />
              <el-option label="Open" value="open" />
              <el-option label="Answered" value="answered" />
              <el-option label="Answered (Rev1)" value="answeredRev1" />
              <el-option label="Answered (Rev2)" value="answeredRev2" />
              <el-option label="Closed" value="closed" />
              <el-option label="Void" value="void" />
              <el-option label="Rejected" value="rejected" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Priority">
            <el-select v-model="filters.priority" placeholder="All Priorities" clearable @change="applyFilters" style="width: 150px;">
              <el-option label="High" value="High" />
              <el-option label="Medium" value="Medium" />
              <el-option label="Low" value="Low" />
              <el-option label="Normal" value="Normal" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Discipline">
            <el-select 
              v-model="filters.discipline" 
              placeholder="All Disciplines" 
              clearable 
              filterable
              @change="applyFilters" 
              style="width: 180px;">
              <el-option 
                v-for="discipline in disciplineOptions"
                :key="discipline"
                :label="discipline"
                :value="discipline" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Category">
            <el-select 
              v-model="filters.category" 
              placeholder="All Categories" 
              clearable 
              filterable
              @change="applyFilters" 
              style="width: 180px;">
              <el-option 
                v-for="category in categoryOptions"
                :key="category"
                :label="category"
                :value="category" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="applyFilters">Apply Filters</el-button>
            <el-button @click="resetFilters">Reset</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- RFI 配置信息 -->
    <el-card class="config-card" shadow="never" v-if="showConfigPanel && currentProject">
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


    <!-- RFI详情弹窗 -->
    <el-dialog
      v-if="showRfiDialog && selectedRfi"
      v-model="showRfiDialog"
      :title="`RFI Details - ${selectedRfi?.display_name || ''}`"
      width="80%"
      :before-close="handleCloseDialog"
      draggable
      destroy-on-close
      class="rfi-dialog"
      :key="`dialog-${dialogKey}`">
      <div class="dialog-content">
        <RfiDetail 
          :rfi="selectedRfi" 
          :project="currentProject"
          :key="`detail-${dialogKey}`" />
      </div>
    </el-dialog>

    <!-- RFI数据内容 -->
    <div v-if="rfisData && !loading && !error">


      <!-- RFI数据表格 -->
      <DataTable
        :key="`rfis-table-${rfisData?.timestamp || 'default'}`"
        :data="rfisData.rfis || []"
        :columns="tableColumns"
        :loading="loading"
        title="📋 Project RFI List"
        description="Click the View Details button to see detailed RFI information and related materials"
        :action-buttons="tableActions"
        :operations="rowOperations"
        :show-index="true"
        row-key="id"
        @action="handleTableAction"
        @row-operation="handleRowOperation">
        
        <!-- RFI标题列 -->
        <template #display_name="{ row }">
          <div class="rfi-title">
            <div class="title-main">
              <span class="title-text">{{ row.title || row.display_name || 'Untitled RFI' }}</span>
              <span 
                v-if="row.custom_identifier" 
                class="identifier-text">
                #{{ row.custom_identifier }}
              </span>
            </div>
            <div v-if="row.question" class="question-preview">
              {{ row.question.length > 50 ? row.question.substring(0, 50) + '...' : row.question }}
            </div>
          </div>
        </template>


        <!-- RFI状态列 -->
        <template #status="{ row }">
          <div class="status-info">
            <span class="status-text">
              {{ getStatusText(row.status) }}
            </span>
          </div>
        </template>

        <!-- 工作流类型列 -->
        <template #workflow_type="{ row }">
          <StatusTag 
            :status="getWorkflowStatusType(row.workflow_type)" 
            :text="getWorkflowTypeText(row.workflow_type)" 
            size="small" />
        </template>

        <!-- 优先级列 -->
        <template #priority="{ row }">
          <span class="priority-text">
            {{ row.priority || 'Normal' }}
          </span>
        </template>

        <!-- 专业领域列 -->
        <template #discipline="{ row }">
          <span>{{ row.discipline || 'Not Specified' }}</span>
        </template>

        <!-- 类别列 -->
        <template #category="{ row }">
          <span>{{ row.category || 'Not Specified' }}</span>
        </template>

        <!-- 影响评估列 -->
        <template #impact="{ row }">
          <div class="impact-text-container">
            <span 
              v-if="row.cost_impact === 'Yes'" 
              class="impact-text cost-impact">
              Cost
            </span>
            <span 
              v-if="row.schedule_impact === 'Yes'" 
              class="impact-text schedule-impact">
              Schedule
            </span>
            <span 
              v-if="row.cost_impact !== 'Yes' && row.schedule_impact !== 'Yes'" 
              class="impact-text no-impact">
              No Impact
            </span>
            <div v-if="row.impact_analysis?.overall_impact" class="overall-impact">
              <span class="impact-text overall-impact-text">
                {{ getImpactText(row.impact_analysis.overall_impact) }}
              </span>
            </div>
          </div>
        </template>

        <!-- 创建时间列 -->
        <template #created_at="{ row }">
          <div class="time-info">
            <div>{{ row.created_at }}</div>
            <div class="creator-info" v-if="row.created_by">
              Created by {{ getUserDisplayName(row.created_by) }}
            </div>
          </div>
        </template>

        <!-- 到期时间列 -->
        <template #due_date="{ row }">
          <div class="due-date-info">
            <div :class="{ 'overdue': row.is_overdue }">
              {{ row.due_date || 'Not Set' }}
            </div>
            <span 
              v-if="row.is_overdue" 
              class="overdue-text">
              Overdue
            </span>
          </div>
        </template>


      </DataTable>

      <!-- RFI数据JSON viewer -->
      <JsonViewer
        :data="rfisData"
        title="🔍 RFI Data List JSON"
        description="Complete JSON structure of RFI data list, including all RFI records and statistics"
        :show-copy="true"
        :show-download="true"
        :collapsible="true"
        :collapsed="true"
        style="margin-top: 24px;" />

      <!-- 原始数据展示 -->
      <JsonViewer
        v-if="showRawData"
        :data="rfisData"
        title="🔍 RFI Raw Data"
        description="Complete data structure obtained from ACC RFIs API"
        :show-copy="true"
        :show-download="true"
        :collapsible="true"
        :collapsed="true" />

      </div>
    </div>

    <!-- 统计分析标签页 -->
    <div v-if="activeTab === 'statistics'" class="tab-content">
      <!-- 加载状态 -->
      <div v-if="statisticsLoading" class="statistics-loading">
        <el-skeleton :rows="8" animated />
        <div style="text-align: center; margin-top: 20px; color: #666;">
          正在載入統計數據...
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="statisticsError" class="statistics-error">
        <el-empty description="Statistics data loading failed">
          <el-button type="primary" @click="loadStatistics">重新載入</el-button>
        </el-empty>
      </div>

      <!-- 无数据状态 -->
      <div v-else-if="!statisticsData || !statisticsData.statistics" class="statistics-no-data">
        <el-empty description="No statistics data available">
          <el-button type="primary" @click="loadStatistics">載入統計數據</el-button>
        </el-empty>
      </div>

      <!-- 统计分析内容区域 -->
      <div v-else class="statistics-content">
        
        <!-- 主要統計概覽卡片 -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <el-col :span="4">
            <el-card class="stat-card primary-stat">
              <div class="stat-item">
                <div class="stat-icon">📋</div>
                <div class="stat-value">{{ statisticsData.statistics?.overview?.total_rfis || 0 }}</div>
                <div class="stat-label">總 RFI 數量</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card warning-stat">
              <div class="stat-item">
                <div class="stat-icon">🔄</div>
                <div class="stat-value">{{ statisticsData.statistics?.overview?.open_rfis || 0 }}</div>
                <div class="stat-label">開啟中</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card success-stat">
              <div class="stat-item">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{{ statisticsData.statistics?.overview?.closed_rfis || 0 }}</div>
                <div class="stat-label">已關閉</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card info-stat">
              <div class="stat-item">
                <div class="stat-icon">💬</div>
                <div class="stat-value">{{ statisticsData.statistics?.overview?.answered_rfis || 0 }}</div>
                <div class="stat-label">已回答</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card danger-stat">
              <div class="stat-item">
                <div class="stat-icon">⏰</div>
                <div class="stat-value">{{ statisticsData.statistics?.overview?.overdue_rfis || 0 }}</div>
                <div class="stat-label">已逾期</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card class="stat-card gradient-stat">
              <div class="stat-item">
                <div class="stat-icon">📊</div>
                <div class="stat-value">{{ statisticsData.statistics?.efficiency_metrics?.completion_rate || 0 }}%</div>
                <div class="stat-label">完成率</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 效率指標卡片 -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">回覆率</span>
                  <el-tag type="success" size="small">{{ statisticsData.statistics?.efficiency_metrics?.response_rate || 0 }}%</el-tag>
                </div>
                <div class="metric-progress">
                  <el-progress 
                    :percentage="statisticsData.statistics?.efficiency_metrics?.response_rate || 0" 
                    :show-text="false" 
                    stroke-width="8"
                    color="#67C23A" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">逾期率</span>
                  <el-tag type="danger" size="small">{{ statisticsData.statistics?.efficiency_metrics?.overdue_rate || 0 }}%</el-tag>
                </div>
                <div class="metric-progress">
                  <el-progress 
                    :percentage="statisticsData.statistics?.efficiency_metrics?.overdue_rate || 0" 
                    :show-text="false" 
                    stroke-width="8"
                    color="#F56C6C" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">附件率</span>
                  <el-tag type="info" size="small">{{ statisticsData.statistics?.efficiency_metrics?.attachment_rate || 0 }}%</el-tag>
                </div>
                <div class="metric-progress">
                  <el-progress 
                    :percentage="statisticsData.statistics?.efficiency_metrics?.attachment_rate || 0" 
                    :show-text="false" 
                    stroke-width="8"
                    color="#409EFF" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="metric-card">
              <div class="metric-item">
                <div class="metric-header">
                  <span class="metric-title">完成率</span>
                  <el-tag type="warning" size="small">{{ statisticsData.statistics?.efficiency_metrics?.completion_rate || 0 }}%</el-tag>
                </div>
                <div class="metric-progress">
                  <el-progress 
                    :percentage="statisticsData.statistics?.efficiency_metrics?.completion_rate || 0" 
                    :show-text="false" 
                    stroke-width="8"
                    color="#E6A23C" />
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 分布統計區域 -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <!-- 狀態分布 -->
          <el-col :span="8">
            <el-card class="distribution-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">🔄 狀態分布</span>
                  <el-tag size="small">{{ getDistributionCount(statisticsData.statistics?.status_distribution) }} 種狀態</el-tag>
                </div>
              </template>
              <div class="distribution-content">
                <div 
                  v-for="(count, status) in statisticsData.statistics?.status_distribution || {}" 
                  :key="status"
                  class="distribution-item">
                  <div class="item-info">
                    <span class="item-label">{{ status }}</span>
                    <span class="item-count">{{ count }}</span>
                  </div>
                  <div class="item-bar">
                    <div 
                      class="bar-fill status-bar" 
                      :style="{ width: getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) + '%' }">
                    </div>
                  </div>
                  <span class="item-percentage">{{ getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) }}%</span>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 優先級分布 -->
          <el-col :span="8">
            <el-card class="distribution-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">⚡ 優先級分布</span>
                  <el-tag size="small">{{ getDistributionCount(statisticsData.statistics?.priority_distribution) }} 種優先級</el-tag>
                </div>
              </template>
              <div class="distribution-content">
                <div 
                  v-for="(count, priority) in statisticsData.statistics?.priority_distribution || {}" 
                  :key="priority"
                  class="distribution-item">
                  <div class="item-info">
                    <span class="item-label">{{ priority }}</span>
                    <span class="item-count">{{ count }}</span>
                  </div>
                  <div class="item-bar">
                    <div 
                      class="bar-fill priority-bar" 
                      :style="{ width: getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) + '%' }">
                    </div>
                  </div>
                  <span class="item-percentage">{{ getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) }}%</span>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 專業領域分布 -->
          <el-col :span="8">
            <el-card class="distribution-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">🏗️ 專業領域分布</span>
                  <el-tag size="small">{{ getDistributionCount(statisticsData.statistics?.discipline_distribution) }} 個領域</el-tag>
                </div>
              </template>
              <div class="distribution-content">
                <div 
                  v-for="(count, discipline) in statisticsData.statistics?.discipline_distribution || {}" 
                  :key="discipline"
                  class="distribution-item">
                  <div class="item-info">
                    <span class="item-label">{{ discipline }}</span>
                    <span class="item-count">{{ count }}</span>
                  </div>
                  <div class="item-bar">
                    <div 
                      class="bar-fill discipline-bar" 
                      :style="{ width: getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) + '%' }">
                    </div>
                  </div>
                  <span class="item-percentage">{{ getPercentage(count, statisticsData.statistics?.overview?.total_rfis || 0) }}%</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 影響分析和回覆分析 -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <!-- 影響分析 -->
          <el-col :span="12">
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">💼 影響分析</span>
                  <el-tag type="warning" size="small">項目影響評估</el-tag>
                </div>
              </template>
              <div class="analysis-grid">
                <div class="analysis-item cost-impact">
                  <div class="analysis-icon">💰</div>
                  <div class="analysis-info">
                    <div class="analysis-label">成本影響</div>
                    <div class="analysis-value">{{ statisticsData.statistics?.impact_analysis?.cost_impact || 0 }}</div>
                  </div>
                </div>
                <div class="analysis-item schedule-impact">
                  <div class="analysis-icon">📅</div>
                  <div class="analysis-info">
                    <div class="analysis-label">時程影響</div>
                    <div class="analysis-value">{{ statisticsData.statistics?.impact_analysis?.schedule_impact || 0 }}</div>
                  </div>
                </div>
                <div class="analysis-item both-impact">
                  <div class="analysis-icon">⚠️</div>
                  <div class="analysis-info">
                    <div class="analysis-label">雙重影響</div>
                    <div class="analysis-value">{{ statisticsData.statistics?.impact_analysis?.both_impacts || 0 }}</div>
                  </div>
                </div>
                <div class="analysis-item no-impact">
                  <div class="analysis-icon">✅</div>
                  <div class="analysis-info">
                    <div class="analysis-label">無影響</div>
                    <div class="analysis-value">{{ statisticsData.statistics?.impact_analysis?.no_impact || 0 }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 回覆分析 -->
          <el-col :span="12">
            <el-card class="analysis-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">💬 回覆分析</span>
                  <el-tag type="info" size="small">溝通狀況</el-tag>
                </div>
              </template>
              <div class="response-analysis">
                <div class="response-stats">
                  <div class="response-item with-response">
                    <div class="response-icon">✅</div>
                    <div class="response-info">
                      <div class="response-label">已回覆</div>
                      <div class="response-value">{{ statisticsData.statistics?.response_analysis?.with_responses || 0 }}</div>
                    </div>
                  </div>
                  <div class="response-item without-response">
                    <div class="response-icon">⏳</div>
                    <div class="response-info">
                      <div class="response-label">待回覆</div>
                      <div class="response-value">{{ statisticsData.statistics?.response_analysis?.without_responses || 0 }}</div>
                    </div>
                  </div>
                </div>
                <div class="response-rate-display">
                  <div class="rate-label">整體回覆率</div>
                  <div class="rate-circle">
                    <el-progress 
                      type="circle" 
                      :percentage="statisticsData.statistics?.response_analysis?.response_rate || 0"
                      :width="80"
                      :stroke-width="8"
                      color="#67C23A">
                      <template #default="{ percentage }">
                        <span class="rate-text">{{ percentage }}%</span>
                      </template>
                    </el-progress>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 附件分析 -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
          <el-col :span="24">
            <el-card class="attachment-card">
              <template #header>
                <div class="card-header">
                  <span class="header-title">📎 附件分析</span>
                  <el-tag type="success" size="small">文檔管理狀況</el-tag>
                </div>
              </template>
              <div class="attachment-analysis">
                <div class="attachment-stats">
                  <div class="attachment-item">
                    <div class="attachment-icon">📁</div>
                    <div class="attachment-info">
                      <div class="attachment-label">有附件的 RFI</div>
                      <div class="attachment-value">{{ statisticsData.statistics?.attachment_analysis?.with_attachments || 0 }}</div>
                    </div>
                  </div>
                  <div class="attachment-item">
                    <div class="attachment-icon">📄</div>
                    <div class="attachment-info">
                      <div class="attachment-label">無附件的 RFI</div>
                      <div class="attachment-value">{{ statisticsData.statistics?.attachment_analysis?.without_attachments || 0 }}</div>
                    </div>
                  </div>
                  <div class="attachment-item">
                    <div class="attachment-icon">📊</div>
                    <div class="attachment-info">
                      <div class="attachment-label">附件總數</div>
                      <div class="attachment-value">{{ statisticsData.statistics?.attachment_analysis?.total_attachments || 0 }}</div>
                    </div>
                  </div>
                  <div class="attachment-item">
                    <div class="attachment-icon">📈</div>
                    <div class="attachment-info">
                      <div class="attachment-label">附件覆蓋率</div>
                      <div class="attachment-value">{{ statisticsData.statistics?.efficiency_metrics?.attachment_rate || 0 }}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 详细统计表格 -->
        <StatisticsTable
          title="RFI Detailed Statistics Data"
          subtitle="Complete data distribution analysis, including status, priority, discipline and category statistics"
          :data="getStatisticsTableData()"
          :show-export="true"
          @row-click="handleStatisticRowClick"
          @export="handleExportStatistics" />

        <!-- 统计数据JSON viewer -->
        <JsonViewer
          :data="statisticsData"
          title="📊 Statistics Analysis JSON"
          description="Complete JSON data of RFI statistical analysis, including all distribution statistics and efficiency indicators"
          :show-copy="true"
          :show-download="true"
          :collapsible="true"
          :collapsed="true"
          style="margin-top: 24px;" />
      </div>
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
import StatusIndicator from '../components/StatusIndicator.vue'
import QueryInfoCard from '../components/QueryInfoCard.vue'
import DataTable from '../components/DataTable.vue'
import JsonViewer from '../components/JsonViewer.vue'
import StatusTag from '../components/StatusTag.vue'
import RfiDetail from '../components/RfiDetail.vue'
import RfiConfigPanel from '../components/RfiConfigPanel.vue'
import StatisticsTable from '../components/StatisticsTable.vue'
import projectStore from '../utils/projectStore.js'
import userCache from '../utils/userCache.js'
import { formatDateTime } from '../utils/dateUtils.js'
import { IconSettings } from '@arco-design/web-vue/es/icon'

export default {
  name: 'RfisData',
  components: {
    Breadcrumb,
    PageHeader,
    StatsSection,
    LoadingState,
    ErrorState,
    StatusIndicator,
    QueryInfoCard,
    DataTable,
    JsonViewer,
    StatusTag,
    RfiDetail,
    RfiConfigPanel,
    StatisticsTable,
    IconSettings
  },
  data() {
    return {
      activeTab: 'data', // 当前活动标签页
      rfisData: null,
      statisticsData: null, // 统计数据
      loading: false,
      error: null,
      showRawData: false,
      showConfigPanel: false,
      showRfiDialog: false,
      selectedRfi: null,
      dialogKey: 0,
      currentProject: null,
      // 搜索和筛选
      searchKeyword: '',
      searchDebounceTimer: null,
      showFilters: false,
      activeQuickFilter: 'all',
      filters: {
        status: '',
        priority: '',
        discipline: '',
        category: ''
      },
      disciplineOptions: [],
      categoryOptions: [],
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 50,
        total: 0
      },
      // 用户缓存数据
      userCacheData: {},
      userCacheLoading: false
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          id: 'refresh',
          text: this.$t('rfis.actions.refresh'),
          type: 'primary',
          icon: 'refresh'
        },
        {
          id: 'export',
          text: this.$t('rfis.actions.export'),
          type: 'success',
          icon: 'download'
        },
        {
          id: 'toggle-raw',
          text: this.showRawData ? this.$t('rfis.actions.hideRaw') : this.$t('rfis.actions.showRaw'),
          type: 'info',
          icon: 'code'
        },
        {
          id: 'toggle-config',
          text: this.showConfigPanel ? this.$t('rfis.actions.hideConfig') : this.$t('rfis.actions.showConfig'),
          type: 'warning',
          icon: 'settings'
        }
      ]
    },

    headerStats() {
      if (!this.rfisData?.stats) return []
      
      const stats = this.rfisData.stats
      return [
        {
          id: 'total',
          label: this.$t('rfis.stats.totalRfis'),
          value: stats.total_rfis || 0,
          type: 'primary',
          icon: 'file'
        },
        {
          id: 'open',
          label: this.$t('rfis.stats.openRfis'),
          value: stats.open_rfis || 0,
          type: 'warning',
          icon: 'clock'
        },
        {
          id: 'closed',
          label: this.$t('rfis.stats.closedRfis'),
          value: stats.closed_rfis || 0,
          type: 'success',
          icon: 'check'
        },
        {
          id: 'overdue',
          label: this.$t('rfis.stats.overdueRfis'),
          value: stats.overdue_rfis || 0,
          type: 'danger',
          icon: 'warning'
        },
        {
          id: 'completion_rate',
          label: this.$t('rfis.stats.completionRate'),
          value: `${stats.completion_rate || 0}%`,
          type: 'info',
          icon: 'chart'
        },
        {
          id: 'response_rate',
          label: this.$t('rfis.stats.responseRate'),
          value: `${stats.response_rate || 0}%`,
          type: 'success',
          icon: 'message'
        }
      ]
    },

    quickFilterTags() {
      if (!this.rfisData?.stats) return []
      
      const stats = this.rfisData.stats
      const statusCounts = stats.status_counts || {}
      const priorityCounts = stats.priority_counts || {}
      
      return [
        { 
          id: 'all', 
          label: this.$t('rfis.quickFilters.all'), 
          count: stats.total_rfis || 0, 
          type: 'info',
          filter: {}
        },
        { 
          id: 'draft', 
          label: this.$t('rfis.quickFilters.draft'), 
          count: statusCounts.draft || 0, 
          type: 'info',
          filter: { status: 'draft' }
        },
        { 
          id: 'answered', 
          label: this.$t('rfis.quickFilters.answered'), 
          count: statusCounts.answeredRev1 || 0, 
          type: 'success',
          filter: { status: 'answeredRev1' }
        },
        { 
          id: 'high_priority', 
          label: this.$t('rfis.quickFilters.highPriority'), 
          count: priorityCounts.High || 0, 
          type: 'danger',
          filter: { priority: 'High' }
        },
        { 
          id: 'with_attachments', 
          label: this.$t('rfis.quickFilters.withAttachments'), 
          count: stats.with_attachments || 0, 
          type: 'success',
          filter: { has_attachments: true }
        },
        { 
          id: 'overdue', 
          label: this.$t('rfis.quickFilters.overdue'), 
          count: stats.overdue_rfis || 0, 
          type: 'danger',
          filter: { overdue: true }
        }
      ]
    },

    tableColumns() {
      return [
        {
          prop: 'display_name',
          label: this.$t('rfis.table.columns.title'),
          width: '280px',
          sortable: true,
          fixed: 'left',
          slot: 'display_name'
        },
        {
          prop: 'status',
          label: this.$t('rfis.table.columns.status'),
          width: '120px',
          sortable: true,
          slot: 'status'
        },
        {
          prop: 'priority',
          label: this.$t('rfis.table.columns.priority'),
          width: '100px',
          sortable: true,
          slot: 'priority'
        },
        {
          prop: 'impact',
          label: this.$t('rfis.table.columns.impact'),
          width: '140px',
          slot: 'impact'
        },
        {
          prop: 'discipline',
          label: this.$t('rfis.table.columns.discipline'),
          width: '140px',
          sortable: true,
          slot: 'discipline'
        },
        {
          prop: 'category',
          label: this.$t('rfis.table.columns.category'),
          width: '160px',
          sortable: true,
          slot: 'category'
        },
        {
          prop: 'created_at',
          label: this.$t('rfis.table.columns.createdAt'),
          width: '160px',
          sortable: true,
          slot: 'created_at'
        },
        {
          prop: 'due_date',
          label: this.$t('rfis.table.columns.dueDate'),
          width: '140px',
          sortable: true,
          slot: 'due_date'
        }
      ]
    },

    tableActions() {
      return [
        {
          id: 'export-selected',
          text: this.$t('rfis.tableActions.exportSelected'),
          type: 'success',
          icon: 'download'
        }
      ]
    },

    rowOperations() {
      return [
        {
          id: 'view-detail',
          action: 'view-detail',
          text: this.$t('rfis.tableActions.viewDetail'),
          type: 'primary',
          icon: 'eye'
        }
      ]
    },

    errorSuggestions() {
      return [
        this.$t('rfis.error.suggestions.checkNetwork'),
        this.$t('rfis.error.suggestions.checkProjectId'),
        this.$t('rfis.error.suggestions.checkToken'),
        this.$t('rfis.error.suggestions.checkPermissions')
      ]
    },

    errorButtons() {
      return [
        {
          id: 'retry',
          text: this.$t('rfis.error.buttons.retry'),
          type: 'primary'
        },
        {
          id: 'back',
          text: this.$t('rfis.error.buttons.back'),
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
        this.$message.error(this.$t('rfis.messages.noProjectSelected'))
        this.$router.push('/')
        return
      }
    }

    // 並行加載 RFI 數據、篩選選項、統計數據和用戶緩存
    await Promise.all([
      this.loadRfisData(),
      this.loadFilterOptions(),
      this.loadStatistics(),
      this.loadUserCache()
    ])
  },
  methods: {
    // 标签页切换处理
    handleTabClick(tab) {
      this.activeTab = tab.name
      // 統計數據已在頁面加載時獲取，無需重複加載
      // 如果需要刷新統計數據，用戶可以點擊刷新按鈕
    },

    // 加载统计数据
    async loadStatistics() {
      if (!this.currentProject) {
        this.statisticsError = this.$t('rfis.messages.noProjectSelected')
        return
      }

      this.statisticsLoading = true
      this.statisticsError = null

      try {
        console.log('正在獲取 RFI 統計數據，項目:', this.currentProject.name, this.currentProject.id)
        
        const response = await axios.get('/api/rfis/jarvis/statistics', {
          params: {
            projectId: this.currentProject.id
          }
        })

        console.log('統計 API 響應:', response.data)

        if (response.data.success) {
          this.statisticsData = response.data
          console.log('RFI 統計數據獲取成功:', this.statisticsData)
          this.$message.success(this.$t('rfis.messages.statisticsLoadSuccess'))
        } else {
          throw new Error(response.data.error || this.$t('rfis.messages.statisticsLoadFailed'))
        }
      } catch (error) {
        console.error('獲取 RFI 統計數據失敗:', error)
        this.statisticsError = error.response?.data?.error || error.message || this.$t('rfis.messages.statisticsLoadFailed')
        this.$message.error(this.statisticsError)
      } finally {
        this.statisticsLoading = false
      }
    },

    async loadRfisData() {
      if (!this.currentProject) {
        this.error = this.$t('rfis.messages.noProjectSelected')
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log('正在獲取 RFI 數據，項目:', this.currentProject.name, this.currentProject.id)
        
        // 构建搜索请求体
        const searchPayload = {}
        
        // 添加搜索关键字（如果有）
        if (this.searchKeyword && this.searchKeyword.trim()) {
          searchPayload.search = this.searchKeyword.trim()
        }
        
        // 添加筛选条件
        if (this.filters.status) {
          searchPayload.status = this.filters.status
        }
        if (this.filters.priority) {
          searchPayload.priority = this.filters.priority
        }
        if (this.filters.discipline) {
          searchPayload.discipline = this.filters.discipline
        }
        if (this.filters.category) {
          searchPayload.category = this.filters.category
        }
        
        // 使用 POST 搜索 API
        const response = await axios.post(
          `/api/rfis/${this.currentProject.id}/search`,
          {
            ...searchPayload,
            limit: this.pagination.pageSize,
            offset: (this.pagination.currentPage - 1) * this.pagination.pageSize
          },
          {
            timeout: 30000
          }
        )

        console.log('RFI 數據響應:', response.data)

        if (response.data.success) {
          this.rfisData = response.data
          this.pagination.total = response.data.pagination?.totalResults || response.data.rfis?.length || 0
          
          const displayCount = response.data.rfis?.length || 0
          const totalCount = this.pagination.total
          
          if (this.searchKeyword || Object.values(this.filters).some(v => v)) {
            this.$message.success(this.$t('rfis.messages.searchSuccess', { total: totalCount, display: displayCount }))
          } else {
            this.$message.success(this.$t('rfis.messages.loadSuccess', { count: displayCount }))
          }
        } else {
          throw new Error(response.data.error || this.$t('rfis.messages.loadFailed'))
        }

      } catch (error) {
        console.error('獲取 RFI 數據失敗:', error)
        this.error = error.response?.data?.error || error.message || this.$t('rfis.messages.loadFailed')
        this.$message.error(this.error)
      } finally {
        this.loading = false
      }
    },

    async loadFilterOptions() {
      if (!this.currentProject) return
      
      try {
        // 先加载一次数据以获取选项
        const response = await axios.get('/api/rfis/jarvis', {
          params: {
            projectId: this.currentProject.id,
            limit: 200  // 获取足够多的数据以提取选项
          },
          timeout: 30000
        })
        
        if (response.data.success) {
          const rfis = response.data.rfis || []
          
          // 提取唯一的专业领域和类别
          this.disciplineOptions = [...new Set(rfis.map(r => r.discipline).filter(Boolean))].sort()
          this.categoryOptions = [...new Set(rfis.map(r => r.category).filter(Boolean))].sort()
          
          console.log('筛选选项已加载:', {
            disciplines: this.disciplineOptions.length,
            categories: this.categoryOptions.length
          })
        }
      } catch (error) {
        console.warn('加載篩選選項失敗:', error)
        // 不影响主要功能，只记录警告
      }
    },

    handleSearch() {
      // 防抖处理
      clearTimeout(this.searchDebounceTimer)
      this.searchDebounceTimer = setTimeout(() => {
        this.pagination.currentPage = 1  // 重置到第一页
        this.loadRfisData()
      }, 500)
    },

    applyFilters() {
      this.pagination.currentPage = 1  // 重置到第一页
      this.loadRfisData()
    },

    resetFilters() {
      this.searchKeyword = ''
      this.filters = {
        status: '',
        priority: '',
        discipline: '',
        category: ''
      }
      this.activeQuickFilter = 'all'
      this.pagination.currentPage = 1
      this.loadRfisData()
    },

    applyQuickFilter(tag) {
      // 重置其他筛选条件
      this.searchKeyword = ''
      this.filters = {
        status: '',
        priority: '',
        discipline: '',
        category: ''
      }
      
      // 应用快速筛选
      this.activeQuickFilter = tag.id
      
      if (tag.id !== 'all') {
        // 应用对应的筛选条件
        Object.assign(this.filters, tag.filter || {})
      }
      
      this.pagination.currentPage = 1
      this.loadRfisData()
    },

    getRfisQueryFields() {
      if (!this.rfisData) return []
      
      return [
        { label: 'Project ID', value: this.rfisData.project_id || 'N/A' },
        { label: 'Query Time', value: this.rfisData.timestamp || 'N/A' },
        { label: 'Total RFIs', value: this.rfisData.stats?.total_rfis || 0 },
        { label: 'Current Page Count', value: this.rfisData.stats?.current_page_count || 0 }
      ]
    },

    handleHeaderAction(actionId) {
      switch (actionId) {
        case 'refresh':
          // 同時刷新 RFI 數據和統計數據
          Promise.all([
            this.loadRfisData(),
            this.loadStatistics()
          ]).then(() => {
            this.$message.success(this.$t('rfis.messages.refreshSuccess'))
          }).catch(error => {
            console.error('刷新數據失敗:', error)
            this.$message.error(this.$t('rfis.messages.refreshFailed'))
          })
          break
        case 'export':
          this.exportRfisData()
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
      // 可以根據統計項進行過濾等操作
    },

    handleTableAction(actionId, selectedRows) {
      switch (actionId) {
        case 'export-selected':
          this.exportSelectedRfis(selectedRows)
          break
      }
    },

    handleRowOperation(operationId, button, index) {
      // 從 operationId 中提取實際的操作類型（格式為 "action:index"）
      const actualAction = operationId.split(':')[0]
      const row = button.row // 從 button 對象中獲取行數據
      
      switch (actualAction) {
        case 'view-detail':
          this.viewRfiDetail(row)
          break
      }
    },

    getStatusType(status) {
      const statusTypeMap = {
        'draft': 'info',
        'open': 'warning',
        'answered': 'success',
        'answeredRev1': 'success',
        'answeredRev2': 'success',
        'closed': 'success',
        'void': 'danger',
        'rejected': 'danger'
      }
      return statusTypeMap[status] || 'info'
    },

    getStatusText(status) {
      const statusTextMap = {
        'draft': 'Draft',
        'open': 'Open',
        'answered': 'Answered',
        'answeredRev1': 'Answered',
        'answeredRev2': 'Answered',
        'closed': 'Closed',
        'void': 'Void',
        'rejected': 'Rejected'
      }
      return statusTextMap[status] || status || 'Unknown'
    },


    getPriorityType(priority) {
      const priorityTypeMap = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'info',
        'Normal': 'info'
      }
      return priorityTypeMap[priority] || 'info'
    },


    getWorkflowStatusType(workflowType) {
      const typeMap = {
        'US': 'success',
        'EMEA': 'info',
        'EU': 'info'
      }
      return typeMap[workflowType] || 'info'
    },

    getWorkflowTypeText(workflowType) {
      const textMap = {
        'US': 'Single Reviewer',
        'EMEA': 'Multi Reviewer',
        'EU': 'Multi Reviewer'
      }
      return textMap[workflowType] || workflowType || 'Unknown'
    },

    getImpactType(impact) {
      const impactTypeMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'info',
        'none': 'success'
      }
      return impactTypeMap[impact] || 'info'
    },

    getImpactText(impact) {
      const impactTextMap = {
        'high': 'High Impact',
        'medium': 'Medium Impact',
        'low': 'Low Impact',
        'none': 'No Impact'
      }
      return impactTextMap[impact] || impact || 'Unknown'
    },

    // 使用导入的时间格式化函数
    formatDateTime,

    viewRfiDetail(rfi) {
      // Navigate to RFI detail page instead of opening dialog
      this.$router.push({
        path: '/rfis/detail',
        query: {
          projectId: this.currentProject?.id,
          itemId: rfi.id,
          projectName: this.currentProject?.name
        }
      });
    },


    handleCloseDialog() {
      this.showRfiDialog = false
      this.selectedRfi = null
    },

    handleErrorAction(actionId) {
      switch (actionId) {
        case 'retry':
          this.loadRfisData()
          break
        case 'back':
          this.$router.push('/')
          break
      }
    },

    cancelLoading() {
      this.loading = false
    },

    async exportRfisData() {
      try {
        this.$message.info(this.$t('rfis.messages.exporting'))
        
        const response = await axios.get('/api/rfis/jarvis', {
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
        const fileName = `rfis_${projectName}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(this.$t('rfis.messages.exportSuccess', { fileName }))
      } catch (error) {
        console.error('導出 RFI 數據失敗:', error)
        this.$message.error(this.$t('rfis.messages.exportFailed', { error: error.response?.data?.error || error.message }))
      }
    },

    exportSelectedRfis(selectedRows) {
      if (!selectedRows || selectedRows.length === 0) {
        this.$message.warning(this.$t('rfis.messages.selectForExport'))
        return
      }

      try {
        const exportData = {
          project_id: this.currentProject.id,
          project_name: this.currentProject.name,
          selected_rfis: selectedRows,
          export_time: new Date().toISOString(),
          total_selected: selectedRows.length
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const projectName = this.currentProject.name.replace(/[^a-zA-Z0-9]/g, '_')
        const fileName = `selected_rfis_${projectName}_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success(this.$t('rfis.messages.exportSelectedSuccess', { count: selectedRows.length, fileName }))
      } catch (error) {
        console.error('導出選中 RFI 失敗:', error)
        this.$message.error(this.$t('rfis.messages.exportFailed', { error: error.message }))
      }
    },

    getPercentage(count, total) {
      if (!total || total === 0) return 0
      return Math.round((count / total) * 100)
    },

    getDistributionCount(distribution) {
      if (!distribution || typeof distribution !== 'object') return 0
      return Object.keys(distribution).length
    },

    getStatisticsTableData() {
      if (!this.statisticsData?.statistics) return []
      
      const stats = this.statisticsData.statistics
      const total = stats.overview?.total_rfis || 0
      
      const tableData = []
      
      // 狀態分布
      if (stats.status_distribution) {
        Object.entries(stats.status_distribution).forEach(([status, count]) => {
          tableData.push({
            category: `Status: ${status}`,
            count: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            description: `Number of RFIs with ${status} status`
          })
        })
      }
      
      // 優先級分布
      if (stats.priority_distribution) {
        Object.entries(stats.priority_distribution).forEach(([priority, count]) => {
          tableData.push({
            category: `Priority: ${priority}`,
            count: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            description: `Number of RFIs with ${priority} priority`
          })
        })
      }
      
      // 專業領域分布
      if (stats.discipline_distribution) {
        Object.entries(stats.discipline_distribution).forEach(([discipline, count]) => {
          tableData.push({
            category: `Discipline: ${discipline}`,
            count: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            description: `Number of RFIs in ${discipline} discipline`
          })
        })
      }
      
      // 類別分布
      if (stats.category_distribution) {
        Object.entries(stats.category_distribution).forEach(([category, count]) => {
          tableData.push({
            category: `Category: ${category}`,
            count: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            description: `Number of RFIs in ${category} category`
          })
        })
      }
      
      // 按百分比排序
      return tableData.sort((a, b) => b.percentage - a.percentage)
    },

    handleStatisticRowClick(item) {
      console.log('統計行點擊:', item)
      this.$message.info(this.$t('rfis.messages.statisticsItemClicked', { category: item.category, count: item.count }))
    },

    handleExportStatistics(data) {
      try {
        const csvContent = this.convertToCSV(data)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        
        link.setAttribute('href', url)
        link.setAttribute('download', `RFI_Statistics_Data_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        this.$message.success(this.$t('rfis.messages.statisticsExportSuccess'))
      } catch (error) {
        console.error('導出統計數據失敗:', error)
        this.$message.error(this.$t('rfis.messages.exportFailed', { error: error.message }))
      }
    },

    convertToCSV(data) {
      const headers = ['Category', 'Count', 'Percentage', 'Description']
      const csvRows = [headers.join(',')]
      
      data.forEach(item => {
        const row = [
          `"${item.category}"`,
          item.count,
          `${item.percentage}%`,
          `"${item.description}"`
        ]
        csvRows.push(row.join(','))
      })
      
      return csvRows.join('\n')
    },

    // 加载用户缓存
    async loadUserCache() {
      if (!this.currentProject) return

      try {
        console.log('👥 開始加載用戶緩存數據:', this.currentProject.id)
        this.userCacheLoading = true

        // 强制刷新用户缓存数据
        this.userCacheData = await userCache.getProjectUsers(this.currentProject.id, true)
        
        console.log(`✅ 用戶緩存加載成功: ${Object.keys(this.userCacheData).length} 個用戶`)
      } catch (error) {
        console.error('❌ 加載用戶緩存失敗:', error)
        // 不影响主要功能，只记录错误
      } finally {
        this.userCacheLoading = false
      }
    },

    // 获取用户显示名称
    getUserDisplayName(user) {
      if (!user) return 'Unknown User'
      
      // 如果是字符串，可能是用户ID
      if (typeof user === 'string') {
        const displayName = userCache.getUserDisplayName(user, this.currentProject?.id)
        return displayName || user
      }
      
      // 如果是对象，优先使用缓存中的名称
      if (user.id) {
        const cachedName = userCache.getUserDisplayName(user.id, this.currentProject?.id)
        if (cachedName && cachedName !== user.id) {
          return cachedName
        }
      }
      
      // 回退到对象中的名称字段
      return user.name || user.email || user.id || 'Unknown User'
    },

    // 测试用户缓存功能
    async testUserCache() {
      console.log('🧪 测试用户缓存功能')
      console.log('当前项目:', this.currentProject)
      
      if (!this.currentProject) {
        console.error('❌ 没有当前项目')
        return
      }
      
      // 强制重新加载用户缓存
      console.log('🔄 强制重新加载用户缓存...')
      await userCache.getProjectUsers(this.currentProject.id, true)
      
      // 获取缓存状态
      const cacheStatus = userCache.getCacheStatus(this.currentProject.id)
      console.log('📊 缓存状态:', cacheStatus)
      
      // 测试一些用户ID
      const testUserIds = ['QT725AZVMVUKV69K']
      testUserIds.forEach(userId => {
        const displayName = userCache.getUserDisplayName(userId, this.currentProject.id)
        console.log(`👤 测试用户 ${userId}: ${displayName}`)
      })
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfis {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 搜索和筛选面板样式 */
.filter-card {
  border-radius: var(--border-radius-lg);
}

.search-filter-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.quick-filter-tag {
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.quick-filter-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.filter-form {
  padding: 16px;
  background: var(--color-bg-secondary, #f5f7fa);
  border-radius: var(--border-radius-md, 8px);
}

.dialog-content {
  max-height: 70vh;
  overflow-y: auto;
}

.rfi-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.time-info {
  font-size: 12px;
}

.creator-info {
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.due-date-info .overdue {
  color: var(--color-danger);
  font-weight: 500;
}

.impact-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.overall-impact {
  margin-top: 2px;
}


.response-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.response-status {
  display: flex;
  align-items: center;
}

.response-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.response-count {
  display: flex;
  align-items: center;
}

.response-time {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.2;
}

/* 标签页样式 */
.tabs-card {
  border-radius: var(--border-radius-lg);
}

.rfi-tabs :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid var(--color-border-lighter);
}

.rfi-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tab-content {
  margin-top: 0;
}

/* 统计卡片样式 */
.stat-card {
  text-align: center;
  border-radius: var(--border-radius-lg);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-item {
  padding: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 统计内容区域 */
.statistics-content {
  padding: 0;
}

.statistics-loading,
.statistics-error,
.statistics-no-data {
  padding: 40px;
  text-align: center;
}

/* 配置面板样式 */
.config-card {
  margin-bottom: 24px;
  border-radius: var(--border-radius-lg);
}

.config-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-card .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* 統計卡片樣式優化 */
.primary-stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.warning-stat {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.success-stat {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.info-stat {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.danger-stat {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: white;
}

.gradient-stat {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px !important;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

/* 效率指標卡片 */
.metric-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.metric-item {
  padding: 20px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-title {
  font-weight: 600;
  color: #333;
}

.metric-progress {
  margin-top: 8px;
}

/* 分布統計卡片 */
.distribution-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.distribution-content {
  max-height: 300px;
  overflow-y: auto;
}

.distribution-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.distribution-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 120px;
  margin-right: 12px;
}

.item-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.item-count {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.item-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin: 0 12px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s ease;
}

.status-bar {
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.priority-bar {
  background: linear-gradient(90deg, #f093fb, #f5576c);
}

.discipline-bar {
  background: linear-gradient(90deg, #4facfe, #00f2fe);
}

.item-percentage {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  width: 40px;
  text-align: right;
}

/* 分析卡片 */
.analysis-card {
  border-radius: 12px;
  height: 100%;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.analysis-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.analysis-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cost-impact {
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
}

.schedule-impact {
  background: linear-gradient(135deg, #fd79a8, #e84393);
}

.both-impact {
  background: linear-gradient(135deg, #e17055, #d63031);
}

.no-impact {
  background: linear-gradient(135deg, #00b894, #00cec9);
}

.analysis-icon {
  font-size: 24px;
  margin-right: 12px;
}

.analysis-info {
  flex: 1;
}

.analysis-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.analysis-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

/* 回覆分析 */
.response-analysis {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.response-stats {
  flex: 1;
}

.response-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
}

.response-icon {
  font-size: 20px;
  margin-right: 12px;
}

.response-info {
  flex: 1;
}

.response-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.response-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.response-rate-display {
  text-align: center;
  margin-left: 24px;
}

.rate-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.rate-text {
  font-size: 14px;
  font-weight: 600;
}

/* 附件分析 */
.attachment-card {
  border-radius: 12px;
}

.attachment-analysis {
  padding: 8px 0;
}

.attachment-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  color: white;
  transition: all 0.3s ease;
}

.attachment-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.attachment-item:nth-child(2) {
  background: linear-gradient(135deg, #fd79a8, #e84393);
}

.attachment-item:nth-child(3) {
  background: linear-gradient(135deg, #fdcb6e, #e17055);
}

.attachment-item:nth-child(4) {
  background: linear-gradient(135deg, #00b894, #00cec9);
}

.attachment-icon {
  font-size: 24px;
  margin-right: 12px;
}

.attachment-info {
  flex: 1;
}

.attachment-label {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.attachment-value {
  font-size: 20px;
  font-weight: 700;
}

/* RFI 标题样式 */
.rfi-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
}

.title-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-text {
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.identifier-text {
  flex-shrink: 0;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 13px;
}

.question-preview {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
  font-style: italic;
  margin-top: 2px;
}


/* 状态信息样式 */
.status-info {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Text styles for converted tags */
.status-text,
.priority-text {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 13px;
}

.impact-text-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.impact-text {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--color-bg-secondary);
}

.cost-impact {
  color: #b88230;
  background-color: #fdf6ec;
  border: 1px solid #e6a23c;
}

.schedule-impact {
  color: #c45656;
  background-color: #fef0f0;
  border: 1px solid #f56c6c;
}

.no-impact {
  color: #606266;
  background-color: #f4f4f5;
  border: 1px solid #dcdfe6;
}

.overall-impact-text {
  color: #409eff;
  background-color: #ecf5ff;
  border: 1px solid #b3d8ff;
}

.overdue-text {
  color: #f56c6c;
  font-weight: 500;
  font-size: 12px;
}


/* 优化表格列宽 */
.rfis :deep(.el-table) {
  font-size: 13px;
}

.rfis :deep(.el-table .cell) {
  padding: 8px 12px;
  line-height: 1.4;
}

.rfis :deep(.el-table th) {
  background-color: var(--color-bg-secondary, #f5f7fa);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .attachment-stats {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .rfis {
    padding: var(--spacing-md);
  }
  
  .dialog-content {
    max-height: 60vh;
  }
  
  .response-analysis {
    flex-direction: column;
    gap: 20px;
  }
  
  .response-rate-display {
    margin-left: 0;
  }
  
  .attachment-stats {
    grid-template-columns: 1fr;
  }
}
</style>
