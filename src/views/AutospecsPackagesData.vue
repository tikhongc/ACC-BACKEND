<template>
  <div class="autospecs-packages-data">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      title="Autospecs + Packages 管理"
      description="管理項目 Autospecs 送審記錄和 Packages 文件包"
      :icon="IconFile" />

    <!-- 项目信息显示 -->
    <ProjectInfo v-if="projectId" :project-id="projectId" :project-name="projectName" />

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      
      <!-- 数据概览卡片 -->
      <div class="overview-cards">
        <el-card class="overview-card" v-loading="loading.statistics">
          <div class="overview-content">
            <div class="overview-icon autospecs">
              <icon-file />
            </div>
            <div class="overview-info">
              <h3>{{ statistics.overview.total_versions || 0 }}</h3>
              <p>Autospecs 版本</p>
            </div>
          </div>
        </el-card>

        <el-card class="overview-card" v-loading="loading.statistics">
          <div class="overview-content">
            <div class="overview-icon packages">
              <icon-folder />
            </div>
            <div class="overview-info">
              <h3>{{ statistics.overview.total_packages || 0 }}</h3>
              <p>Packages 文件包</p>
            </div>
          </div>
        </el-card>

        <el-card class="overview-card" v-loading="loading.statistics">
          <div class="overview-content">
            <div class="overview-icon submittals">
              <icon-list />
            </div>
            <div class="overview-info">
              <h3>{{ statistics.overview.total_submittals || 0 }}</h3>
              <p>Autospecs 記錄</p>
            </div>
          </div>
        </el-card>

        <el-card class="overview-card" v-loading="loading.statistics">
          <div class="overview-content">
            <div class="overview-icon resources">
              <icon-attachment />
            </div>
            <div class="overview-info">
              <h3>{{ statistics.overview.total_resources || 0 }}</h3>
              <p>文件資源</p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 数据覆盖率分析 -->
      <el-card class="coverage-card" v-if="statistics.integration_analysis">
        <template #header>
          <div class="card-header">
            <span>
              <icon-dashboard />
              數據覆蓋率分析
            </span>
            <StatusTag 
              :status="getCoverageStatus(statistics.integration_analysis.coverage)" 
              :text="getCoverageText(statistics.integration_analysis.coverage)" 
              size="small" />
          </div>
        </template>
        
        <div class="coverage-content">
          <div class="data-sources">
            <h4>可用數據源</h4>
            <div class="source-tags">
              <el-tag 
                v-for="source in statistics.integration_analysis.data_sources" 
                :key="source"
                :type="getSourceTagType(source)"
                size="large">
                {{ getSourceDisplayName(source) }}
              </el-tag>
              <el-tag v-if="statistics.integration_analysis.data_sources.length === 0" type="info" size="large">
                暫無數據源
              </el-tag>
            </div>
          </div>
          
          <div class="recommendations" v-if="statistics.integration_analysis.recommendations.length > 0">
            <h4>建議</h4>
            <ul>
              <li v-for="(recommendation, index) in statistics.integration_analysis.recommendations" :key="index">
                {{ recommendation }}
              </li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- 主要功能标签页 -->
      <el-card class="main-content">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          
          <!-- Autospecs 标签页 -->
          <el-tab-pane label="Autospecs 送審記錄" name="autospecs">
            <div class="tab-content">
              
              <!-- Autospecs 版本选择 -->
              <div class="version-selector" v-if="autospecsMetadata.versions && autospecsMetadata.versions.length > 0">
                <el-form :inline="true">
                  <el-form-item label="選擇版本:">
                    <el-select 
                      v-model="selectedVersionId" 
                      placeholder="請選擇 Autospecs 版本"
                      @change="handleVersionChange"
                      style="width: 300px">
                      <el-option
                        v-for="version in autospecsMetadata.versions"
                        :key="version.id"
                        :label="`${version.name} (${version.status})`"
                        :value="version.id">
                        <span style="float: left">{{ version.name }}</span>
                        <span style="float: right; color: #8492a6; font-size: 13px">
                          <StatusTag :status="version.status_type" :text="version.status" size="small" />
                        </span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="loadAutospecsMetadata" :loading="loading.metadata">
                      <icon-refresh />
                      刷新版本
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- Autospecs 数据表格 -->
              <div class="data-table" v-loading="loading.submittals">
                <el-table 
                  :data="submittalsData" 
                  stripe 
                  border 
                  style="width: 100%"
                  :default-sort="{ prop: 'target_date', order: 'ascending' }"
                  empty-text="請先選擇版本以載入 Autospecs 記錄">
                  
                  <el-table-column prop="id" label="記錄編號" width="120" sortable />
                  
                  <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                  
                  <el-table-column prop="division_display" label="分項" width="150" sortable />
                  
                  <el-table-column prop="spec_category" label="類型" width="130">
                    <template #default="scope">
                      <StatusTag 
                        :status="scope.row.spec_category_type" 
                        :text="scope.row.spec_category" 
                        size="small" />
                    </template>
                  </el-table-column>
                  
                  <el-table-column prop="target_date" label="目標日期" width="120" sortable>
                    <template #default="scope">
                      <span v-if="scope.row.target_date">
                        {{ formatDate(scope.row.target_date) }}
                      </span>
                      <span v-else class="text-muted">未設定</span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="狀態" width="100">
                    <template #default="scope">
                      <el-tag v-if="scope.row.is_overdue" type="danger" size="small">逾期</el-tag>
                      <el-tag v-else type="success" size="small">正常</el-tag>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="備註" width="80">
                    <template #default="scope">
                      <el-tooltip v-if="scope.row.has_notes" :content="scope.row.user_notes" placement="top">
                        <icon-info-circle style="color: #409eff; cursor: pointer;" />
                      </el-tooltip>
                      <span v-else class="text-muted">-</span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="操作" width="120" fixed="right">
                    <template #default="scope">
                      <el-button type="text" size="small" @click="viewSubmittalDetails(scope.row)">
                        <icon-eye />
                        詳情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

          <!-- Packages 标签页 -->
          <el-tab-pane label="Packages 文件包" name="packages">
            <div class="tab-content">
              
              <!-- 包列表操作栏 -->
              <div class="packages-toolbar">
                <el-form :inline="true">
                  <el-form-item>
                    <el-button type="primary" @click="loadPackagesData" :loading="loading.packages">
                      <icon-refresh />
                      刷新包列表
                    </el-button>
                  </el-form-item>
                  <el-form-item>
                    <el-input 
                      v-model="packagesFilter" 
                      placeholder="搜索包名稱..."
                      style="width: 200px"
                      clearable>
                      <template #prefix>
                        <icon-search />
                      </template>
                    </el-input>
                  </el-form-item>
                </el-form>
              </div>

              <!-- Packages 数据表格 -->
              <div class="data-table" v-loading="loading.packages">
                <el-table 
                  :data="filteredPackagesData" 
                  stripe 
                  border 
                  style="width: 100%"
                  :default-sort="{ prop: 'updated_at', order: 'descending' }"
                  empty-text="暫無 Packages 數據">
                  
                  <el-table-column prop="display_id" label="包編號" width="100" sortable />
                  
                  <el-table-column prop="name" label="包名稱" min-width="200" show-overflow-tooltip />
                  
                  <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
                  
                  <el-table-column prop="resource_count" label="文件數量" width="100" sortable />
                  
                  <el-table-column prop="version_type" label="版本類型" width="120">
                    <template #default="scope">
                      <el-tag :type="scope.row.version_type === 'CURRENT' ? 'success' : 'info'" size="small">
                        {{ scope.row.version_type }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="狀態" width="100">
                    <template #default="scope">
                      <StatusTag 
                        :status="scope.row.status_type" 
                        :text="scope.row.status" 
                        size="small" />
                    </template>
                  </el-table-column>
                  
                  <el-table-column prop="updated_at" label="更新時間" width="150" sortable>
                    <template #default="scope">
                      {{ formatDate(scope.row.updated_at) }}
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="操作" width="150" fixed="right">
                    <template #default="scope">
                      <el-button type="text" size="small" @click="viewPackageResources(scope.row)">
                        <icon-folder />
                        查看文件
                      </el-button>
                      <el-button type="text" size="small" @click="viewPackageDetails(scope.row)">
                        <icon-eye />
                        詳情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-tab-pane>

        </el-tabs>
      </el-card>

    </div>

    <!-- 详情对话框 -->
    <AutospecsPackagesDetailsDialog 
      v-model="showDetailsDialog"
      :data="selectedItem"
      :dialog-type="detailsDialogType" />

    <!-- 包资源对话框 -->
    <PackageResourcesDialog 
      v-model="showResourcesDialog"
      :package-data="selectedPackage"
      :project-id="projectId" />

  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import ProjectInfo from '../components/ProjectInfo.vue'
import StatusTag from '../components/StatusTag.vue'
import AutospecsPackagesDetailsDialog from '../components/AutospecsPackagesDetailsDialog.vue'
import PackageResourcesDialog from '../components/PackageResourcesDialog.vue'
import { formatDate } from '../utils/dateUtils.js'
import { 
  IconFile, 
  IconFolder, 
  IconList, 
  IconAttachment,
  IconDashboard,
  IconRefresh,
  IconSearch,
  IconEye,
  IconInfoCircle
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'AutospecsPackagesData',
  components: {
    Breadcrumb,
    PageHeader,
    ProjectInfo,
    StatusTag,
    AutospecsPackagesDetailsDialog,
    PackageResourcesDialog,
    IconFile,
    IconFolder,
    IconList,
    IconAttachment,
    IconDashboard,
    IconRefresh,
    IconSearch,
    IconEye,
    IconInfoCircle
  },
  data() {
    return {
      projectId: '',
      projectName: '',
      activeTab: 'autospecs',
      
      // 加载状态
      loading: {
        statistics: false,
        metadata: false,
        submittals: false,
        packages: false
      },
      
      // 统计数据
      statistics: {
        overview: {},
        integration_analysis: {}
      },
      
      // Autospecs 数据
      autospecsMetadata: {
        versions: []
      },
      selectedVersionId: '',
      submittalsData: [],
      
      // Packages 数据
      packagesData: [],
      packagesFilter: '',
      
      // 对话框状态
      showDetailsDialog: false,
      showResourcesDialog: false,
      selectedItem: null,
      selectedPackage: null,
      detailsDialogType: 'autospecs'
    }
  },
  computed: {
    filteredPackagesData() {
      if (!this.packagesFilter) {
        return this.packagesData
      }
      
      const filter = this.packagesFilter.toLowerCase()
      return this.packagesData.filter(pkg => 
        pkg.name.toLowerCase().includes(filter) ||
        pkg.description.toLowerCase().includes(filter)
      )
    }
  },
  async mounted() {
    // 从路由参数获取项目信息
    this.projectId = this.$route.query.projectId
    this.projectName = this.$route.query.projectName || '未知项目'
    
    if (!this.projectId) {
      this.$message.error('缺少项目ID参数')
      this.$router.push('/')
      return
    }
    
    // 加载初始数据
    await this.loadInitialData()
  },
  methods: {
    async loadInitialData() {
      try {
        // 并行加载统计数据和 Autospecs 元数据
        await Promise.all([
          this.loadStatistics(),
          this.loadAutospecsMetadata()
        ])
        
        // 如果当前标签是 packages，也加载包数据
        if (this.activeTab === 'packages') {
          await this.loadPackagesData()
        }
      } catch (error) {
        console.error('加载初始数据失败:', error)
        this.$message.error('加载数据失败: ' + error.message)
      }
    },
    
    async loadStatistics() {
      this.loading.statistics = true
      try {
        const response = await axios.get('/api/autospecs-packages/jarvis/statistics', {
          params: { projectId: this.projectId }
        })
        
        if (response.data.success) {
          this.statistics = response.data.statistics
        } else {
          throw new Error(response.data.error || '获取统计数据失败')
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.$message.error('加载统计数据失败: ' + error.message)
      } finally {
        this.loading.statistics = false
      }
    },
    
    async loadAutospecsMetadata() {
      this.loading.metadata = true
      try {
        const response = await axios.get('/api/autospecs-packages/jarvis/autospecs/metadata', {
          params: { projectId: this.projectId }
        })
        
        if (response.data.success) {
          this.autospecsMetadata = response.data
          
          // 自动选择当前版本
          const currentVersion = response.data.versions.find(v => v.is_current)
          if (currentVersion) {
            this.selectedVersionId = currentVersion.id
            await this.loadSmartRegister()
          }
        } else {
          throw new Error(response.data.error || '获取 Autospecs 元数据失败')
        }
      } catch (error) {
        console.error('加载 Autospecs 元数据失败:', error)
        this.$message.error('加载 Autospecs 元数据失败: ' + error.message)
      } finally {
        this.loading.metadata = false
      }
    },
    
    async loadSmartRegister() {
      if (!this.selectedVersionId) {
        this.submittalsData = []
        return
      }
      
      this.loading.submittals = true
      try {
        const response = await axios.get(`/api/autospecs-packages/jarvis/autospecs/${this.selectedVersionId}/smartregister`, {
          params: { projectId: this.projectId }
        })
        
        if (response.data.success) {
          this.submittalsData = response.data.submittals
        } else {
          throw new Error(response.data.error || '获取 Autospecs 记录失败')
        }
      } catch (error) {
        console.error('加载 Autospecs 记录失败:', error)
        this.$message.error('加载 Autospecs 记录失败: ' + error.message)
        this.submittalsData = []
      } finally {
        this.loading.submittals = false
      }
    },
    
    async loadPackagesData() {
      this.loading.packages = true
      try {
        const response = await axios.get('/api/autospecs-packages/jarvis/packages', {
          params: { 
            projectId: this.projectId,
            limit: 100
          }
        })
        
        if (response.data.success) {
          this.packagesData = response.data.packages
        } else {
          throw new Error(response.data.error || '获取 Packages 数据失败')
        }
      } catch (error) {
        console.error('加载 Packages 数据失败:', error)
        this.$message.error('加载 Packages 数据失败: ' + error.message)
        this.packagesData = []
      } finally {
        this.loading.packages = false
      }
    },
    
    async handleTabChange(tabName) {
      if (tabName === 'packages' && this.packagesData.length === 0) {
        await this.loadPackagesData()
      }
    },
    
    async handleVersionChange() {
      await this.loadSmartRegister()
    },
    
    viewSubmittalDetails(submittal) {
      this.selectedItem = submittal
      this.detailsDialogType = 'autospecs'
      this.showDetailsDialog = true
    },
    
    viewPackageDetails(packageData) {
      this.selectedItem = packageData
      this.detailsDialogType = 'package'
      this.showDetailsDialog = true
    },
    
    viewPackageResources(packageData) {
      this.selectedPackage = packageData
      this.showResourcesDialog = true
    },
    
    // 使用导入的formatDate函数
    formatDate,
    
    getCoverageStatus(coverage) {
      const statusMap = {
        'complete': 'success',
        'partial_autospecs': 'warning',
        'partial_packages': 'warning',
        'none': 'danger'
      }
      return statusMap[coverage] || 'info'
    },
    
    getCoverageText(coverage) {
      const textMap = {
        'complete': '完整覆蓋',
        'partial_autospecs': '部分覆蓋 (僅 Autospecs)',
        'partial_packages': '部分覆蓋 (僅 Packages)',
        'none': '無數據覆蓋'
      }
      return textMap[coverage] || '未知狀態'
    },
    
    getSourceTagType(source) {
      const typeMap = {
        'autospecs': 'success',
        'packages': 'primary'
      }
      return typeMap[source] || 'info'
    },
    
    getSourceDisplayName(source) {
      const nameMap = {
        'autospecs': 'Autospecs 送審記錄',
        'packages': 'Packages 文件包'
      }
      return nameMap[source] || source
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.autospecs-packages-data {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.content-wrapper {
  margin-top: var(--spacing-xl);
}

/* 概览卡片样式 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.overview-card {
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-border-light);
  transition: all 0.3s ease;
}

.overview-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.overview-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.overview-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.overview-icon.autospecs {
  background: linear-gradient(135deg, #409eff, #67c23a);
}

.overview-icon.packages {
  background: linear-gradient(135deg, #e6a23c, #f56c6c);
}

.overview-icon.submittals {
  background: linear-gradient(135deg, #909399, #606266);
}

.overview-icon.resources {
  background: linear-gradient(135deg, #67c23a, #409eff);
}

.overview-info h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.overview-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 覆盖率卡片样式 */
.coverage-card {
  margin-bottom: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
}

.coverage-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-xl);
  align-items: start;
}

.data-sources h4,
.recommendations h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.recommendations ul {
  margin: 0;
  padding-left: var(--spacing-lg);
}

.recommendations li {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* 主要内容卡片 */
.main-content {
  border-radius: var(--border-radius-lg);
}

.tab-content {
  padding: var(--spacing-lg);
}

/* 版本选择器样式 */
.version-selector {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

/* 包工具栏样式 */
.packages-toolbar {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

/* 数据表格样式 */
.data-table {
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.text-muted {
  color: var(--color-text-tertiary);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .coverage-content {
    grid-template-columns: 1fr;
  }
  
  .autospecs-packages-data {
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>
