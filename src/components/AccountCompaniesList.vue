<template>
  <div class="account-companies-list">
    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="$t('account.companies.loading')"
      :text="$t('account.companies.loadingText')"
      :show-progress="false"
      :show-cancel="false" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error && !loading"
      type="card"
      severity="error"
      :title="$t('account.companies.error')"
      :message="error"
      :action-buttons="[{text: $t('account.companies.actions.retry'), type: 'primary', action: 'retry'}]"
      @action="handleErrorAction" />

    <!-- 公司列表内容 -->
    <div v-if="!loading && !error">
      <!-- 统计信息 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.companies.stats.totalCompanies')" :value="statistics.total_companies">
              <template #prefix>
                <el-icon><OfficeBuilding /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.companies.stats.activeCompanies')" :value="statistics.active_companies">
              <template #prefix>
                <el-icon style="color: #67c23a"><Check /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.companies.stats.industryCount')" :value="statistics.trades">
              <template #prefix>
                <el-icon style="color: #e6a23c"><Collection /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.companies.stats.totalUsers')" :value="statistics.total_users_in_companies">
              <template #prefix>
                <el-icon style="color: #409eff"><User /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索和筛选栏 -->
      <el-card style="margin-bottom: 20px;">
        <el-row :gutter="20" align="middle">
          <el-col :span="8">
            <el-input
              v-model="searchText"
              :placeholder="$t('account.companies.filters.searchPlaceholder')"
              clearable
              @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="selectedTrade"
              :placeholder="$t('account.companies.filters.filterByIndustry')"
              clearable
              @change="handleTradeFilter">
              <el-option
                v-for="trade in availableTrades"
                :key="trade"
                :label="trade"
                :value="trade" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="selectedStatus"
              :placeholder="$t('account.companies.filters.filterByStatus')"
              clearable
              @change="handleStatusFilter">
              <el-option :label="$t('account.companies.status.active')" value="active" />
              <el-option :label="$t('account.companies.status.inactive')" value="inactive" />
              <el-option :label="$t('account.companies.status.suspended')" value="suspended" />
            </el-select>
          </el-col>
          <el-col :span="4" style="text-align: right;">
            <el-button @click="refreshData" :loading="loading" type="primary">
              <el-icon><Refresh /></el-icon>
              {{ $t('account.companies.actions.refreshData') }}
            </el-button>
            <el-button @click="exportData" type="success">
              <el-icon><Download /></el-icon>
              {{ $t('account.companies.actions.exportData') }}
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 公司表格 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ $t('account.companies.table.title', { count: filteredCompanies.length }) }}</span>
          </div>
        </template>

        <el-table 
          :data="paginatedCompanies" 
          style="width: 100%" 
          stripe
          v-loading="loading"
          :empty-text="$t('account.companies.table.noData')">
          
          <!-- 公司名称和图标 -->
          <el-table-column :label="$t('account.companies.table.company')" width="280" show-overflow-tooltip>
            <template #default="scope">
              <div class="company-info">
                <el-avatar 
                  :size="32" 
                  :src="scope.row.imageUrl"
                  class="company-avatar">
                  <template #default>
                    <el-icon><OfficeBuilding /></el-icon>
                  </template>
                </el-avatar>
                <div class="company-details">
                  <div class="company-name">{{ scope.row.name || 'Unknown Company' }}</div>
                  <div class="company-id">ID: {{ scope.row.id.substring(0, 8) }}...</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 行业 -->
          <el-table-column prop="trade" :label="$t('account.companies.table.industry')" width="120" show-overflow-tooltip>
            <template #default="scope">
              <el-tag v-if="scope.row.trade && scope.row.trade.trim()" type="info" size="small">
                {{ scope.row.trade }}
              </el-tag>
              <span v-else class="no-data">{{ $t('account.companies.fields.notSet') }}</span>
            </template>
          </el-table-column>

          <!-- 状态 -->
          <el-table-column prop="status" :label="$t('account.companies.table.status')" width="100">
            <template #default="scope">
              <el-tag 
                :type="getStatusTagType(scope.row.status)"
                size="small">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 用户数量 -->
          <el-table-column prop="userSize" :label="$t('account.companies.table.userCount')" width="100" sortable>
            <template #default="scope">
              <el-tag type="primary" size="small">
                {{ scope.row.userSize || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 项目数量 -->
          <el-table-column prop="projectSize" :label="$t('account.companies.table.projectCount')" width="100" sortable>
            <template #default="scope">
              <el-tag type="success" size="small">
                {{ scope.row.projectSize || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- ERP ID -->
          <el-table-column prop="erpId" :label="$t('account.companies.table.erpId')" width="120" show-overflow-tooltip>
            <template #default="scope">
              <el-tag v-if="scope.row.erpId && scope.row.erpId.trim()" type="warning" size="small">
                {{ scope.row.erpId }}
              </el-tag>
              <span v-else class="no-data">{{ $t('account.companies.fields.notSet') }}</span>
            </template>
          </el-table-column>

          <!-- 税务ID -->
          <el-table-column prop="taxId" :label="$t('account.companies.table.taxId')" width="120" show-overflow-tooltip>
            <template #default="scope">
              <el-tag v-if="scope.row.taxId && scope.row.taxId.trim()" type="info" size="small">
                {{ scope.row.taxId }}
              </el-tag>
              <span v-else class="no-data">{{ $t('account.companies.fields.notSet') }}</span>
            </template>
          </el-table-column>

          <!-- 创建时间 -->
          <el-table-column :label="$t('account.companies.table.createdAt')" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>

          <!-- 更新时间 -->
          <el-table-column :label="$t('account.companies.table.updatedAt')" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.updatedAt) }}
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column :label="$t('account.companies.table.actions')" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" size="small" @click="viewCompanyDetail(scope.row)">
                {{ $t('account.companies.actions.viewDetail') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredCompanies.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <!-- 公司详情对话框 -->
    <el-dialog
      v-model="showCompanyDetail"
      :title="$t('account.companies.companyDetail.title', { name: selectedCompany?.name || selectedCompany?.originalName })"
      width="900px"
      :close-on-click-modal="false">
      
      <div v-if="selectedCompany" class="company-detail-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="company-avatar-section">
              <el-avatar 
                :size="80" 
                :src="selectedCompany.imageUrl"
                class="detail-avatar">
                <template #default>
                  <el-icon size="40"><OfficeBuilding /></el-icon>
                </template>
              </el-avatar>
              <h3>{{ selectedCompany.name || selectedCompany.originalName }}</h3>
              <p class="company-trade">{{ selectedCompany.trade || $t('account.companies.fields.industryNotSet') }}</p>
              <el-tag 
                :type="getStatusTagType(selectedCompany.status)"
                size="small">
                {{ getStatusText(selectedCompany.status) }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="16">
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('account.companies.companyDetail.companyId')">
                  <el-tag type="info" size="small">{{ selectedCompany.id }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.accountId')">
                  <el-tag type="warning" size="small">{{ selectedCompany.accountId }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.erpId')">
                  {{ (selectedCompany.erpId && selectedCompany.erpId.trim()) ? selectedCompany.erpId : $t('account.companies.fields.notSet') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.taxId')">
                  {{ (selectedCompany.taxId && selectedCompany.taxId.trim()) ? selectedCompany.taxId : $t('account.companies.fields.notSet') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.website')">
                  <a v-if="selectedCompany.websiteUrl && selectedCompany.websiteUrl.trim()" 
                     :href="selectedCompany.websiteUrl" 
                     target="_blank" 
                     class="website-link">
                    {{ selectedCompany.websiteUrl }}
                  </a>
                  <span v-else>{{ $t('account.companies.fields.notSet') }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.industry')">
                  {{ (selectedCompany.trade && selectedCompany.trade.trim()) ? selectedCompany.trade : $t('account.companies.fields.notSet') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.userCount')">
                  <el-tag type="primary" size="small">{{ selectedCompany.userSize || 0 }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.projectCount')">
                  <el-tag type="success" size="small">{{ selectedCompany.projectSize || 0 }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.createdAt')">
                  {{ formatDate(selectedCompany.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('account.companies.companyDetail.updatedAt')">
                  {{ formatDate(selectedCompany.updatedAt) }}
                </el-descriptions-item>
              </el-descriptions>
          </el-col>
        </el-row>

        <!-- 公司描述 -->
        <div v-if="selectedCompany.description && selectedCompany.description.trim()" style="margin-top: 20px;">
          <h4>{{ $t('account.companies.companyDetail.description') }}</h4>
          <p class="company-description">{{ selectedCompany.description }}</p>
        </div>

        <!-- 地址信息 -->
        <div v-if="selectedCompany.addresses && selectedCompany.addresses.length > 0" style="margin-top: 20px;">
          <h4>{{ $t('account.companies.companyDetail.addressInfo') }}</h4>
          <div v-for="(address, index) in selectedCompany.addresses" :key="index" class="address-item">
            <el-card shadow="never" class="address-card">
              <p><strong>{{ $t('account.companies.companyDetail.address', { index: index + 1 }) }}:</strong></p>
              <p>{{ formatAddress(address) }}</p>
            </el-card>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showCompanyDetail = false">{{ $t('account.companies.actions.close') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { 
  OfficeBuilding, 
  Search, 
  Refresh, 
  Download, 
  User,
  Check,
  Collection
} from '@element-plus/icons-vue'
import axios from 'axios'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'

export default {
  name: 'AccountCompaniesList',
  components: {
    LoadingState,
    ErrorState,
    OfficeBuilding,
    Search,
    Refresh,
    Download,
    User,
    Check,
    Collection
  },
  props: {
    accountId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // i18n
    const { t } = useI18n()
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const companies = ref([])
    const statistics = ref({})
    const queryTime = ref('')
    const searchText = ref('')
    const selectedTrade = ref('')
    const selectedStatus = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const showCompanyDetail = ref(false)
    const selectedCompany = ref(null)

    // 计算属性
    const availableTrades = computed(() => {
      const trades = [...new Set(companies.value
        .map(company => company.trade)
        .filter(trade => trade))]
      return trades.sort()
    })

    const filteredCompanies = computed(() => {
      let filtered = companies.value

      // 搜索过滤
      if (searchText.value) {
        const search = searchText.value.toLowerCase()
        filtered = filtered.filter(company => {
          const name = (company.name || company.originalName || '').toLowerCase()
          const description = (company.description || '').toLowerCase()
          
          return name.includes(search) || description.includes(search)
        })
      }

      // 行业过滤
      if (selectedTrade.value) {
        filtered = filtered.filter(company => company.trade === selectedTrade.value)
      }

      // 状态过滤
      if (selectedStatus.value) {
        filtered = filtered.filter(company => company.status === selectedStatus.value)
      }

      return filtered
    })

    const paginatedCompanies = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredCompanies.value.slice(start, end)
    })

    // 方法
    const fetchAccountCompanies = async () => {
      if (!props.accountId) {
        error.value = 'Missing Account ID'
        return
      }

      loading.value = true
      error.value = ''

      try {
        console.log('🔍 获取账户公司列表:', props.accountId)
        
        const response = await axios.get(`/api/account/${props.accountId}/companies`, {
          params: {
            limit: 200,
            sort: 'name'
          }
        })

        if (response.data.status === 'success') {
          const data = response.data.data
          companies.value = data.companies || []
          statistics.value = data.statistics || {}
          queryTime.value = data.query_time
          
          console.log('✅ 账户公司列表获取成功:', companies.value.length, '个公司')
          ElMessage.success(t('account.companies.messages.fetchSuccess', { count: companies.value.length }))
        } else {
          throw new Error(response.data.error || t('account.companies.error'))
        }
      } catch (err) {
        console.error('❌ 获取账户公司列表失败:', err)
        error.value = err.response?.data?.error || err.message || t('account.companies.error')
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      fetchAccountCompanies()
    }

    const handleSearch = () => {
      currentPage.value = 1
    }

    const handleTradeFilter = () => {
      currentPage.value = 1
    }

    const handleStatusFilter = () => {
      currentPage.value = 1
    }

    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }

    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }

    const viewCompanyDetail = (company) => {
      selectedCompany.value = company
      showCompanyDetail.value = true
    }

    const handleErrorAction = (action) => {
      if (action === 'retry') {
        fetchAccountCompanies()
      }
    }

    const exportData = () => {
      try {
        const exportData = {
          account_id: props.accountId,
          export_time: new Date().toISOString(),
          companies: companies.value,
          statistics: statistics.value
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `account_${props.accountId}_companies_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(t('account.companies.messages.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('account.companies.messages.exportError'))
      }
    }

    const getStatusTagType = (status) => {
      switch (status) {
        case 'active':
          return 'success'
        case 'inactive':
          return 'warning'
        case 'suspended':
          return 'danger'
        default:
          return 'info'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'active':
          return 'Active'
        case 'inactive':
          return 'Inactive'
        case 'suspended':
          return 'Suspended'
        default:
          return status || 'Unknown'
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return dateString
      }
    }

    const formatAddress = (address) => {
      if (!address) return ''
      
      const parts = [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.stateOrProvince,
        address.postalCode,
        address.country
      ].filter(part => part && part.trim())
      
      return parts.length > 0 ? parts.join(', ') : 'Incomplete address information'
    }

    // 监听账户ID变化
    watch(() => props.accountId, (newAccountId) => {
      if (newAccountId) {
        fetchAccountCompanies()
      }
    }, { immediate: true })

    // 生命周期
    onMounted(() => {
      if (props.accountId) {
        fetchAccountCompanies()
      }
    })

    return {
      t,
      loading,
      error,
      companies,
      statistics,
      queryTime,
      searchText,
      selectedTrade,
      selectedStatus,
      currentPage,
      pageSize,
      showCompanyDetail,
      selectedCompany,
      availableTrades,
      filteredCompanies,
      paginatedCompanies,
      fetchAccountCompanies,
      refreshData,
      handleSearch,
      handleTradeFilter,
      handleStatusFilter,
      handleSizeChange,
      handleCurrentChange,
      viewCompanyDetail,
      handleErrorAction,
      exportData,
      getStatusTagType,
      getStatusText,
      formatDate,
      formatAddress
    }
  }
}
</script>

<style scoped>
.account-companies-list {
  padding: 0;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-avatar {
  flex-shrink: 0;
}

.company-details {
  flex: 1;
  min-width: 0;
}

.company-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-id {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.website-link {
  color: #409eff;
  text-decoration: none;
}

.website-link:hover {
  text-decoration: underline;
}

.no-data {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 公司详情对话框样式 */
.company-detail-content {
  padding: 10px 0;
}

.company-avatar-section {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-avatar {
  margin-bottom: 16px;
  border: 3px solid #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.company-avatar-section h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.company-trade {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
}

.company-description {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  margin: 8px 0 0 0;
  line-height: 1.6;
  color: #606266;
}

.address-item {
  margin-bottom: 10px;
}

.address-card {
  background: #f8f9fa;
  border-left: 4px solid #67c23a;
}

.address-card p {
  margin: 4px 0;
  color: #606266;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .company-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .company-details {
    text-align: left;
  }
  
  .pagination-container {
    overflow-x: auto;
  }
  
  .company-avatar-section {
    padding: 15px;
  }
  
  .detail-avatar {
    width: 60px;
    height: 60px;
  }
}
</style>
