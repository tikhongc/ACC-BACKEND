<template>
  <div class="account-roles-list">
    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="$t('account.roles.loading')"
      :text="$t('account.roles.loadingText')"
      :show-progress="false"
      :show-cancel="false" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error && !loading"
      type="card"
      severity="error"
      :title="$t('account.roles.error')"
      :message="error"
      :action-buttons="[{text: $t('account.roles.actions.retry'), type: 'primary', action: 'retry'}]"
      @action="handleErrorAction" />

    <!-- 角色列表内容 -->
    <div v-if="!loading && !error">
      <!-- 统计信息 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.roles.stats.roleTypes')" :value="statistics.unique_roles">
              <template #prefix>
                <el-icon><UserFilled /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.roles.stats.roleAssignments')" :value="statistics.total_role_assignments">
              <template #prefix>
                <el-icon style="color: #67c23a"><Check /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.roles.stats.usersWithRoles')" :value="statistics.users_with_roles">
              <template #prefix>
                <el-icon style="color: #e6a23c"><User /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="Query Duration" :value="statistics.query_duration_seconds" suffix="s">
              <template #prefix>
                <el-icon style="color: #409eff"><Timer /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 搜索和筛选栏 -->
      <el-card style="margin-bottom: 20px;">
        <el-row :gutter="20" align="middle">
          <el-col :span="12">
            <el-input
              v-model="searchText"
              :placeholder="$t('account.roles.filters.searchPlaceholder')"
              clearable
              @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select 
              v-model="sortBy" 
              :placeholder="$t('account.roles.filters.sortBy')"
              @change="handleSort">
              <el-option :label="$t('account.roles.filters.sortByRoleName')" value="role_name" />
              <el-option :label="$t('account.roles.filters.sortByUserCount')" value="unique_users" />
              <el-option :label="$t('account.roles.filters.sortByProjectCount')" value="unique_projects" />
              <el-option :label="$t('account.roles.filters.sortByAssignmentCount')" value="total_assignments" />
            </el-select>
          </el-col>
          <el-col :span="6" style="text-align: right;">
            <el-button @click="refreshData" :loading="loading" type="primary">
              <el-icon><Refresh /></el-icon>
              {{ $t('account.roles.actions.refreshData') }}
            </el-button>
            <el-button @click="exportData" type="success">
              <el-icon><Download /></el-icon>
              {{ $t('account.roles.actions.exportData') }}
            </el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 角色卡片列表 -->
      <el-row :gutter="20">
        <el-col :span="24" v-for="role in paginatedRoles" :key="role.role_name">
          <el-card class="role-card" style="margin-bottom: 16px;">
            <template #header>
              <div class="role-header">
                <div class="role-title">
                  <el-button 
                    type="text" 
                    @click="toggleRoleExpansion(role.role_name)"
                    class="expand-button">
                    <el-icon>
                      <ArrowDown v-if="!expandedRoles[role.role_name]" />
                      <ArrowUp v-else />
                    </el-icon>
                  </el-button>
                  <el-icon><UserFilled /></el-icon>
                  <span class="role-name">{{ role.role_name }}</span>
                </div>
                <div class="role-stats">
                  <el-tag type="primary" size="small">{{ role.unique_users }} Users</el-tag>
                  <el-tag type="success" size="small">{{ role.unique_projects }} Projects</el-tag>
                  <el-tag type="info" size="small">{{ role.total_assignments }} Assignments</el-tag>
                </div>
              </div>
            </template>

            <div v-if="expandedRoles[role.role_name]" class="role-content">
              <!-- 项目列表 -->
              <div v-if="role.projects && role.projects.length > 0" class="projects-section">
                <h4>Related Projects ({{ role.projects.length }})</h4>
                <div class="projects-list">
                  <el-tag 
                    v-for="project in role.projects.slice(0, showAllProjects[role.role_name] ? role.projects.length : 3)" 
                    :key="project"
                    type="success" 
                    size="small"
                    style="margin: 2px 4px 2px 0;">
                    {{ project }}
                  </el-tag>
                  <el-button 
                    v-if="role.projects.length > 3"
                    type="text" 
                    size="small"
                    @click="toggleShowAllProjects(role.role_name)">
                    {{ showAllProjects[role.role_name] ? $t('account.roles.actions.collapse') : $t('account.roles.actions.showAllProjects', { count: role.projects.length }) }}
                  </el-button>
                </div>
              </div>

              <!-- 用户列表 -->
              <div class="role-users-section">
                <div class="section-header">
                  <el-icon><User /></el-icon>
                  <span>Assigned Users ({{ role.unique_users }})</span>
                </div>
                <div v-if="role.users && role.users.length > 0" class="role-users-list">
                  <div 
                    v-for="user in role.users.slice(0, showAllUsers[role.role_name] ? role.users.length : 5)" 
                    :key="`${user.user_id}-${user.project_id || 'no-project'}`"
                    class="role-user-item">
                    <el-avatar :size="32" class="user-avatar">
                      <template #default>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-avatar>
                    <div class="user-info">
                      <div class="user-name">{{ getUserDisplayName(user) }}</div>
                      <div class="user-email">{{ user.user_email || 'Unknown Email' }}</div>
                      <div v-if="user.user_id" class="user-company">ID: {{ user.user_id }}</div>
                    </div>
                    <div class="user-status">
                      <el-tag 
                        :type="user.status === 'active' ? 'success' : 'warning'" 
                        size="small">
                        {{ user.status === 'active' ? 'Active' : user.status }}
                      </el-tag>
                    </div>
                  </div>
                  <el-button 
                    v-if="role.users.length > 5"
                    type="text" 
                    size="small"
                    @click="toggleShowAllUsers(role.role_name)"
                    style="margin-top: 12px;">
                    {{ showAllUsers[role.role_name] ? $t('account.roles.actions.collapse') : $t('account.roles.actions.showAllAssignments', { count: role.users.length }) }}
                  </el-button>
                </div>
                <div v-else class="no-users">
                  <el-empty :description="$t('account.roles.emptyStates.noUsersForRole')" :image-size="60" />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :total="filteredRoles.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { 
  UserFilled, 
  User,
  Search, 
  Refresh, 
  Download, 
  Timer,
  Check,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import axios from 'axios'
import LoadingState from './LoadingState.vue'
import ErrorState from './ErrorState.vue'

export default {
  name: 'AccountRolesList',
  components: {
    LoadingState,
    ErrorState,
    UserFilled,
    User,
    Search,
    Refresh,
    Download,
    Timer,
    Check,
    ArrowDown,
    ArrowUp
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
    const roleSummary = ref([])
    const userRoleMapping = ref({})
    const statistics = ref({})
    const queryTime = ref('')
    const searchText = ref('')
    const sortBy = ref('role_name')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const showAllProjects = reactive({})
    const showAllUsers = reactive({})
    const expandedRoles = reactive({})

    // 计算属性
    const filteredRoles = computed(() => {
      let filtered = roleSummary.value

      // 搜索过滤
      if (searchText.value) {
        const search = searchText.value.toLowerCase()
        filtered = filtered.filter(role => {
          return role.role_name.toLowerCase().includes(search)
        })
      }

      // 排序
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'unique_users':
            return b.unique_users - a.unique_users
          case 'unique_projects':
            return b.unique_projects - a.unique_projects
          case 'total_assignments':
            return b.total_assignments - a.total_assignments
          case 'role_name':
          default:
            return a.role_name.localeCompare(b.role_name)
        }
      })

      return filtered
    })

    const paginatedRoles = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredRoles.value.slice(start, end)
    })

    // 方法
    const fetchAccountRoles = async () => {
      if (!props.accountId) {
        error.value = 'Missing Account ID'
        return
      }

      loading.value = true
      error.value = ''

      try {
        console.log('🔍 获取账户角色汇总:', props.accountId)
        
        const response = await axios.get(`/api/account/${props.accountId}/roles-summary`)

        if (response.data.status === 'success') {
          const data = response.data.data
          roleSummary.value = data.role_summary || []
          userRoleMapping.value = data.user_role_mapping || {}
          statistics.value = data.statistics || {}
          queryTime.value = data.query_time
          
          console.log('✅ 账户角色汇总获取成功:', roleSummary.value.length, '个角色类型')
          ElMessage.success(t('account.roles.messages.fetchSuccess', { count: roleSummary.value.length }))
        } else {
          throw new Error(response.data.error || t('account.roles.error'))
        }
      } catch (err) {
        console.error('❌ 获取账户角色汇总失败:', err)
        error.value = err.response?.data?.error || err.message || t('account.roles.error')
        ElMessage.error(error.value)
      } finally {
        loading.value = false
      }
    }

    const refreshData = () => {
      fetchAccountRoles()
    }

    const handleSearch = () => {
      currentPage.value = 1
    }

    const handleSort = () => {
      currentPage.value = 1
    }

    const handleSizeChange = (newSize) => {
      pageSize.value = newSize
      currentPage.value = 1
    }

    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage
    }

    const toggleShowAllProjects = (roleName) => {
      showAllProjects[roleName] = !showAllProjects[roleName]
    }

    const toggleShowAllUsers = (roleName) => {
      showAllUsers[roleName] = !showAllUsers[roleName]
    }

    const toggleRoleExpansion = (roleName) => {
      expandedRoles[roleName] = !expandedRoles[roleName]
    }

    const handleErrorAction = (action) => {
      if (action === 'retry') {
        fetchAccountRoles()
      }
    }

    const exportData = () => {
      try {
        const exportData = {
          account_id: props.accountId,
          export_time: new Date().toISOString(),
          role_summary: roleSummary.value,
          user_role_mapping: userRoleMapping.value,
          statistics: statistics.value
        }

        const dataStr = JSON.stringify(exportData, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `account_${props.accountId}_roles_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(t('account.roles.messages.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('account.roles.messages.exportError'))
      }
    }

    const getUserDisplayName = (user) => {
      // 從用戶邮箱中提取姓名
      if (user.user_name && user.user_name.trim()) {
        return user.user_name
      }
      
      if (user.user_email) {
        // 從邮箱中提取用戶名部分
        const emailName = user.user_email.split('@')[0]
        // 將點號替換為空格並首字母大寫
        return emailName.split('.').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ')
      }
      
      return user.user_id || 'Unknown User'
    }

    // 监听账户ID变化
    watch(() => props.accountId, (newAccountId) => {
      if (newAccountId) {
        fetchAccountRoles()
      }
    }, { immediate: true })

    // 生命周期
    onMounted(() => {
      if (props.accountId) {
        fetchAccountRoles()
      }
    })

    return {
      t,
      loading,
      error,
      roleSummary,
      userRoleMapping,
      statistics,
      queryTime,
      searchText,
      sortBy,
      currentPage,
      pageSize,
      showAllProjects,
      showAllUsers,
      expandedRoles,
      filteredRoles,
      paginatedRoles,
      fetchAccountRoles,
      refreshData,
      handleSearch,
      handleSort,
      handleSizeChange,
      handleCurrentChange,
      toggleShowAllProjects,
      toggleShowAllUsers,
      toggleRoleExpansion,
      handleErrorAction,
      exportData,
      getUserDisplayName
    }
  }
}
</script>

<style scoped>
.account-roles-list {
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

.role-card {
  border-radius: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.role-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-button {
  padding: 4px;
  margin-right: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.role-name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.role-stats {
  display: flex;
  gap: 8px;
}

.role-content {
  padding-top: 16px;
}

.projects-section,
.users-section {
  margin-bottom: 20px;
}

.projects-section h4,
.users-section h4 {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.projects-list {
  line-height: 1.8;
}

/* 角色用户列表样式 - 使用权限详情页面的样式 */
.role-users-section {
  padding: 16px;
  background: #FAFBFC;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.role-users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
  transition: all 0.2s ease;
}

.role-user-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.role-user-item .user-info {
  flex: 1;
  min-width: 0;
}

.role-user-item .user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.role-user-item .user-email {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.role-user-item .user-company {
  font-size: 11px;
  color: #C0C4CC;
}

.role-user-item .user-status {
  flex-shrink: 0;
}

.no-users {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .role-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .role-stats {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .role-user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .role-user-item .user-status {
    align-self: flex-start;
  }
  
  .pagination-container {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .role-stats {
    flex-direction: column;
    gap: 4px;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
