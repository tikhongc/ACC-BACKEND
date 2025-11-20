<template>
  <div class="account-members-list">
    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      title="Loading Members"
      text="Loading member data..."
      :show-progress="false"
      :show-cancel="false" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error && !loading"
      type="card"
      severity="error"
      title="Error Loading Members"
      :message="error"
      :action-buttons="[{text: 'Retry', type: 'primary', action: 'retry'}]"
      @action="handleErrorAction" />

    <!-- 成员列表内容 -->
    <div v-if="!loading && !error">
      <!-- 统计信息 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="8">
          <el-card class="stat-card">
            <el-statistic title="Total Members" :value="statistics.total_users">
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <el-statistic title="Query Duration" :value="statistics.query_duration_seconds" suffix="s">
              <template #prefix>
                <el-icon><Timer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <el-statistic title="Last Update" :value="formatTime(queryTime)">
              <template #prefix>
                <el-icon><Refresh /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索和操作栏 -->
      <el-card style="margin-bottom: 20px;">
        <el-row :gutter="20" align="middle">
          <el-col :span="12">
            <el-input
              v-model="searchText"
              placeholder="Search member name, email, company..."
              clearable
              @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="12" style="text-align: right;">
            <el-button @click="refreshData" :loading="loading" type="primary">
              <el-icon><Refresh /></el-icon>
              Refresh Data
            </el-button>
            <el-button @click="exportData" type="success">
              <el-icon><Download /></el-icon>
              Export Data
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 成员表格 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>Account Members List ({{ filteredUsers.length }} members)</span>
          </div>
        </template>

        <el-table 
          :data="paginatedUsers" 
          style="width: 100%" 
          stripe
          v-loading="loading"
          empty-text="No member data">
          
          <!-- 头像和姓名 -->
          <el-table-column label="Member" width="200" show-overflow-tooltip>
            <template #default="scope">
              <div class="user-info">
                <el-avatar 
                  :size="32" 
                  :src="scope.row.profileImages?.sizeX80"
                  class="user-avatar">
                  <template #default>
                    <el-icon><User /></el-icon>
                  </template>
                </el-avatar>
                <div class="user-details">
                  <div class="user-name">{{ getUserDisplayName(scope.row) }}</div>
                  <div class="user-id">{{ scope.row.uid || 'N/A' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 邮箱 -->
          <el-table-column prop="email" label="Email" min-width="200" show-overflow-tooltip>
            <template #default="scope">
              <div class="email-info">
                <span>{{ scope.row.email || 'N/A' }}</span>
                <el-tag v-if="scope.row.emailVerified" type="success" size="small" style="margin-left: 8px">
                  Verified
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <!-- 公司信息 -->
          <el-table-column label="Company Info" width="200" show-overflow-tooltip>
            <template #default="scope">
              <div v-if="scope.row.company_name || scope.row.company">
                <div class="company-name">{{ scope.row.company_name || scope.row.company || 'Not Set' }}</div>
                <div class="job-title">{{ scope.row.job_title || 'No Job Title' }}</div>
              </div>
              <span v-else class="no-data">Not Set</span>
            </template>
          </el-table-column>

        <!-- 预设角色 -->
        <el-table-column label="Default Role" width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-tag v-if="scope.row.default_role" type="primary" size="small">
              {{ scope.row.default_role }}
            </el-tag>
            <span v-else class="no-data">Not Set</span>
          </template>
        </el-table-column>

        <!-- 账户权限 -->
        <el-table-column label="Account Permissions" width="120" show-overflow-tooltip>
          <template #default="scope">
            <el-tag v-if="scope.row.access_level" type="warning" size="small">
              {{ getRoleDisplayName(scope.row.access_level) }}
            </el-tag>
            <span v-else class="no-data">Not Set</span>
          </template>
        </el-table-column>

          <!-- 国家/地区 -->
          <el-table-column prop="country" label="Country/Region" width="120">
            <template #default="scope">
              <el-tag type="info" size="small">
                {{ scope.row.country || 'Unknown' }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 状态 -->
          <el-table-column label="Status" width="100">
            <template #default="scope">
              <el-tag 
                :type="scope.row.status === 'active' ? 'success' : 'warning'" 
                size="small">
                {{ scope.row.status === 'active' ? 'Active' : scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 创建时间 -->
          <el-table-column label="Created At" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.created_at) }}
            </template>
          </el-table-column>

          <!-- 更新时间 -->
          <el-table-column label="Updated At" width="160">
            <template #default="scope">
              {{ formatDate(scope.row.updated_at) }}
            </template>
          </el-table-column>

          <!-- 操作 -->
          <el-table-column label="Actions" width="120" fixed="right">
            <template #default="scope">
              <el-button type="text" size="small" @click="viewUserDetail(scope.row)">
                View Details
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
            :total="filteredUsers.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="showUserDetail"
      :title="`User Details - ${selectedUser?.firstName} ${selectedUser?.lastName}`"
      width="800px"
      :close-on-click-modal="false">
      
      <div v-if="selectedUser" class="user-detail-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="user-avatar-section">
              <el-avatar 
                :size="80" 
                :src="selectedUser.profileImages?.sizeX160"
                class="detail-avatar">
                <template #default>
                  <el-icon size="40"><User /></el-icon>
                </template>
              </el-avatar>
              <h3>{{ getUserDisplayName(selectedUser) }}</h3>
              <p class="user-email">{{ selectedUser.email }}</p>
            </div>
          </el-col>
          <el-col :span="16">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="User ID">
                  <el-tag type="info" size="small">{{ selectedUser.uid || selectedUser.id }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Default Role">
                  <el-tag v-if="selectedUser.default_role" type="primary" size="small">
                    {{ selectedUser.default_role }}
                  </el-tag>
                  <span v-else>Not Set</span>
                </el-descriptions-item>
                <el-descriptions-item label="Account Permissions">
                  <el-tag v-if="selectedUser.access_level" type="warning" size="small">
                    {{ getRoleDisplayName(selectedUser.access_level) }}
                  </el-tag>
                  <span v-else>Not Set</span>
                </el-descriptions-item>
                <el-descriptions-item label="Status">
                  <el-tag :type="selectedUser.status === 'active' ? 'success' : 'warning'" size="small">
                    {{ selectedUser.status === 'active' ? 'Active' : selectedUser.status }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Company Name">
                  {{ selectedUser.company_name || selectedUser.company || 'Not Set' }}
                </el-descriptions-item>
                <el-descriptions-item label="Job Title">
                  {{ selectedUser.job_title || 'Not Set' }}
                </el-descriptions-item>
                <el-descriptions-item label="Industry">
                  {{ selectedUser.industry || 'Not Set' }}
                </el-descriptions-item>
                <el-descriptions-item label="Country/Region">
                  {{ selectedUser.country || 'Not Set' }}
                </el-descriptions-item>
                <el-descriptions-item label="Phone">
                  {{ selectedUser.phone || 'Not Set' }}
                </el-descriptions-item>
                <el-descriptions-item label="Created At">
                  {{ formatDate(selectedUser.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item label="Updated At">
                  {{ formatDate(selectedUser.updated_at) }}
                </el-descriptions-item>
                <el-descriptions-item label="Last Sign In">
                  {{ formatDate(selectedUser.last_sign_in) }}
                </el-descriptions-item>
              </el-descriptions>
          </el-col>
        </el-row>

        <!-- 个人简介 -->
        <div v-if="selectedUser.about_me" style="margin-top: 20px;">
          <h4>About Me</h4>
          <p class="about-me">{{ selectedUser.about_me }}</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showUserDetail = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Search, 
  Refresh, 
  Download, 
  Timer 
} from '@element-plus/icons-vue'
import axios from 'axios'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'

export default {
  name: 'AccountMembersList',
  components: {
    LoadingState,
    ErrorState,
    User,
    Search,
    Refresh,
    Download,
    Timer
  },
  props: {
    accountId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    
    // 响应式数据
    const loading = ref(false)
    const error = ref('')
    const users = ref([])
    const statistics = ref({})
    const queryTime = ref('')
    const searchText = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)
    const showUserDetail = ref(false)
    const selectedUser = ref(null)

    // 计算属性
    const filteredUsers = computed(() => {
      if (!searchText.value) return users.value
      
      const search = searchText.value.toLowerCase()
      return users.value.filter(user => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
        const email = (user.email || '').toLowerCase()
        const company = (user.company || '').toLowerCase()
        
        return name.includes(search) || 
               email.includes(search) || 
               company.includes(search)
      })
    })

    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredUsers.value.slice(start, end)
    })

    // 方法
    const fetchAccountUsers = async () => {
      if (!props.accountId) {
        error.value = 'Missing Account ID'
        return
      }

      loading.value = true
      error.value = ''

      try {
        console.log('🔍 Getting account members list:', props.accountId)
        
        const response = await axios.get(`/api/account/${props.accountId}/users`, {
          params: {
            limit: 100,
            sort: 'firstName'
          }
        })

        if (response.data.status === 'success') {
          const data = response.data.data
          users.value = data.users || []
          statistics.value = data.statistics || {}
          queryTime.value = data.query_time
          
          console.log('✅ Account members list retrieved successfully:', users.value.length, 'members')
          ElMessage.success(`Account members loaded successfully - found ${users.value.length} members`)
        } else {
          throw new Error(response.data.error || 'Failed to load account members')
        }
      } catch (err) {
        console.error('❌ Failed to get account members list:', err)
        error.value = err.response?.data?.error || err.message || 'Failed to load account members'
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      fetchAccountUsers()
    }

    const handleSearch = () => {
      currentPage.value = 1 // Reset to first page
    }

    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }

    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }

    const viewUserDetail = (user) => {
      selectedUser.value = user
      showUserDetail.value = true
    }

    const handleErrorAction = (action) => {
      if (action === 'retry') {
        fetchAccountUsers()
      }
    }

    const exportData = () => {
      try {
        const exportData = {
          account_id: props.accountId,
          export_time: new Date().toISOString(),
          users: users.value,
          statistics: statistics.value
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `account_${props.accountId}_members_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('Member data exported successfully')
      } catch (err) {
        console.error('Export failed:', err)
        ElMessage.error('Export failed')
      }
    }

    const getUserDisplayName = (user) => {
      const firstName = user.first_name || user.firstName || ''
      const lastName = user.last_name || user.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim()
      return fullName || user.name || user.userName || user.email || 'Unknown User'
    }

    const getRoleDisplayName = (accessLevel) => {
      const roleNames = {
        'account_admin': 'Account Admin',
        'project_admin': 'Project Admin',
        'member': 'Member',
        'viewer': 'Viewer',
        'executive': 'Executive'
      }
      return roleNames[accessLevel] || accessLevel || 'Unknown'
    }

    const getCountryName = (countryCode) => {
      const countryNames = {
        'HK': 'Hong Kong',
        'CN': 'China',
        'US': 'United States',
        'GB': 'United Kingdom',
        'JP': 'Japan',
        'KR': 'South Korea',
        'SG': 'Singapore',
        'AU': 'Australia',
        'CA': 'Canada',
        'DE': 'Germany',
        'FR': 'France'
      }
      return countryNames[countryCode] || countryCode || 'Unknown'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
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

    const formatTime = (timeString) => {
      if (!timeString) return '-'
      try {
        const date = new Date(timeString)
        return date.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return timeString
      }
    }

    // 监听账户ID变化
    watch(() => props.accountId, (newAccountId) => {
      if (newAccountId) {
        fetchAccountUsers()
      }
    }, { immediate: true })

    // 生命周期
    onMounted(() => {
      if (props.accountId) {
        fetchAccountUsers()
      }
    })

    return {
      loading,
      error,
      users,
      statistics,
      queryTime,
      searchText,
      currentPage,
      pageSize,
      showUserDetail,
      selectedUser,
      filteredUsers,
      paginatedUsers,
      fetchAccountUsers,
      refreshData,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      viewUserDetail,
      handleErrorAction,
      exportData,
      getUserDisplayName,
      getRoleDisplayName,
      getCountryName,
      formatDate,
      formatTime
    }
  }
}
</script>

<style scoped>
.account-members-list {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-id {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.company-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
  margin-bottom: 2px;
}

.job-title {
  font-size: 12px;
  color: #909399;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

/* 用户详情对话框样式 */
.user-detail-content {
  padding: 10px 0;
}

.user-avatar-section {
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

.user-avatar-section h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.user-email {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.about-me {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #409eff;
  margin: 8px 0 0 0;
  line-height: 1.6;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .user-details {
    text-align: left;
  }
  
  .email-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .pagination-container {
    overflow-x: auto;
  }
  
  .user-avatar-section {
    padding: 15px;
  }
  
  .detail-avatar {
    width: 60px;
    height: 60px;
  }
}
</style>
