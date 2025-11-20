<template>
  <div class="permission-detail-drawer">
    <!-- 权限详情头部 -->
    <div class="permission-header">
      <div class="header-title">
        <el-icon class="title-icon"><Lock /></el-icon>
        <div class="title-content">
          <h3>Permission Details</h3>
          <p class="node-name">{{ nodeName }}</p>
        </div>
      </div>
      <el-tag :type="nodeType === 'folder' ? 'primary' : 'success'" size="large">
        {{ nodeType === 'folder' ? 'Folder' : 'File' }}
      </el-tag>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-section">
      <el-skeleton :rows="5" animated />
      <div class="loading-text">Fetching Permissions...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-section">
      <el-alert
        title="Failed to fetch permissions"
        :description="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button @click="retryLoad" type="primary" class="retry-button">
        <el-icon><Refresh /></el-icon>
        Retry
      </el-button>
    </div>

    <!-- 权限错误状态 -->
    <div v-else-if="permissions && permissions.status === 'error'" class="error-section">
      <el-alert
        title="Failed to fetch permissions"
        :description="permissions.error || 'Unknown error occurred'"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button @click="retryLoad" type="primary" class="retry-button">
        <el-icon><Refresh /></el-icon>
        Retry
      </el-button>
    </div>

    <!-- 权限内容 -->
    <div v-else-if="permissions && permissions.status === 'success'" class="permission-content">
      <!-- 权限统计概览 -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>Permission Statistics</span>
          </div>
        </template>
        <div class="permission-stats">
          <div class="stat-item">
            <div class="stat-icon user-stat">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ permissions.data.summary.users_count }}</div>
              <div class="stat-label">Users</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon role-stat">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ permissions.data.summary.roles_count }}</div>
              <div class="stat-label">Roles</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon company-stat">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ permissions.data.summary.companies_count }}</div>
              <div class="stat-label">Companies</div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 用户权限详情 -->
      <el-card v-if="permissions.data.users.length > 0" class="users-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>User Permissions ({{ permissions.data.users.length }})</span>
            <div class="header-actions">
              <el-input
                v-model="userSearchText"
                placeholder="Search users..."
                size="small"
                clearable
                style="width: 200px;"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </template>
        
        <div class="users-list">
          <div 
            v-for="user in filteredUsers" 
            :key="user.subject_id" 
            class="user-detail-item"
          >
            <div class="user-avatar">
              <el-avatar :size="40" :src="user.profileImage">
                <el-icon><User /></el-icon>
              </el-avatar>
            </div>
            
            <div class="user-info">
              <div class="user-basic">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div v-if="user.company" class="user-company">{{ user.company }}</div>
              </div>
              
              <div class="user-permissions">
                <div class="permission-level">
                  <div class="permission-level-container">
                    <el-tag 
                      :type="getPermissionLevelType(user.permission_level)" 
                      size="default"
                      class="level-tag"
                    >
                      Level {{ user.permission_level }} - {{ translatePermissionName(user.permission_name) }}
                    </el-tag>
                    <SegmentedProgressBar 
                      :level="user.permission_level"
                      size="small"
                      class="permission-progress-inline"
                    />
                  </div>
                </div>
                
                <div class="permission-actions">
                  <div class="actions-label">Permission Actions:</div>
                  <div class="actions-list">
                    <el-tag 
                      v-for="action in user.all_actions" 
                      :key="action"
                      size="small"
                      :type="getActionType(action)"
                      class="action-tag"
                    >
                      {{ translateAction(action) }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="user-actions">
              <el-tooltip content="View User Details" placement="top">
                <el-button size="small" circle @click="viewUserDetail(user)">
                  <el-icon><View /></el-icon>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Copy User Info" placement="top">
                <el-button size="small" circle @click="copyUserInfo(user)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
        
        <!-- 分页 -->
        <div v-if="filteredUsers.length > pageSize" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredUsers.length"
            layout="prev, pager, next, total"
            small
          />
        </div>
      </el-card>

      <!-- 角色权限详情 -->
      <el-card v-if="permissions.data.roles.length > 0" class="roles-card">
        <template #header>
          <div class="card-header">
            <el-icon><UserFilled /></el-icon>
            <span>Role Permissions ({{ permissions.data.roles.length }})</span>
          </div>
        </template>
        
        <div class="enhanced-roles-list">
          <div 
            v-for="role in permissions.data.roles" 
            :key="role.subject_id" 
            class="enhanced-role-item"
          >
            <div class="role-header-enhanced" @click="toggleRoleExpansion(role.subject_id)">
              <div class="role-main-info">
                <div class="role-icon-enhanced">
                  <el-icon size="20"><UserFilled /></el-icon>
                </div>
                <div class="role-details">
                  <div class="role-name-enhanced">{{ role.name }}</div>
                  <div class="role-permission-level">
                    <div class="permission-level-container">
                      <el-tag 
                        :type="getPermissionLevelType(role.permission_level)" 
                        size="small"
                      >
                        Level {{ role.permission_level }} - {{ translatePermissionName(role.permission_name) }}
                      </el-tag>
                      <SegmentedProgressBar 
                        :level="role.permission_level"
                        size="small"
                        class="permission-progress-inline"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="role-expand-controls">
                <el-badge 
                  :value="getRoleUserCount(role.name)" 
                  :hidden="getRoleUserCount(role.name) === 0"
                  type="primary"
                  class="user-count-indicator"
                >
                  <el-icon><User /></el-icon>
                </el-badge>
                <el-button 
                  size="small" 
                  text 
                  @click.stop="toggleRoleExpansion(role.subject_id)"
                >
                  <el-icon>
                    <component :is="expandedRoles.has(role.subject_id) ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                </el-button>
              </div>
            </div>
            
            <!-- 角色用户展开区域 -->
            <el-collapse-transition>
              <div v-show="expandedRoles.has(role.subject_id)" class="role-users-expanded">
                <div class="users-section-header">
                  <el-icon><User /></el-icon>
                  <span>Users with this role ({{ getRoleUsers(role.name).length }})</span>
                </div>
                <div v-if="getRoleUsers(role.name).length > 0" class="expanded-users-grid">
                  <div 
                    v-for="user in getRoleUsers(role.name)" 
                    :key="user.id || user.autodeskId"
                    class="expanded-user-card"
                  >
                    <el-avatar :size="36" :src="user.imageUrl" class="user-avatar-enhanced">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="user-details-enhanced">
                      <div class="user-name-enhanced">{{ user.name }}</div>
                      <div class="user-email-enhanced">{{ user.email }}</div>
                      <div v-if="user.companyName" class="user-company-enhanced">{{ user.companyName }}</div>
                    </div>
                    <div class="user-status-enhanced">
                      <el-tag :type="getStatusType(user.status)" size="mini">
                        {{ translateStatus(user.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-else class="no-role-users">
                  <el-empty description="No users with this role" :image-size="50" />
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </el-card>

      <!-- 公司权限详情 -->
      <el-card v-if="permissions.data.companies.length > 0" class="companies-card">
        <template #header>
          <div class="card-header">
            <el-icon><OfficeBuilding /></el-icon>
            <span>Company Permissions ({{ permissions.data.companies.length }})</span>
          </div>
        </template>
        
        <div class="enhanced-companies-list">
          <div 
            v-for="company in permissions.data.companies" 
            :key="company.subject_id" 
            class="enhanced-company-item"
          >
            <div class="company-header-enhanced" @click="toggleCompanyExpansion(company.subject_id)">
              <div class="company-main-info">
                <div class="company-icon-enhanced">
                  <el-icon size="20"><OfficeBuilding /></el-icon>
                </div>
                <div class="company-details">
                  <div class="company-name-enhanced">{{ company.name }}</div>
                  <div class="company-permission-level">
                    <div class="permission-level-container">
                      <el-tag 
                        :type="getPermissionLevelType(company.permission_level)" 
                        size="small"
                      >
                        Level {{ company.permission_level }} - {{ translatePermissionName(company.permission_name) }}
                      </el-tag>
                      <SegmentedProgressBar 
                        :level="company.permission_level"
                        size="small"
                        class="permission-progress-inline"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="company-expand-controls">
                <el-badge 
                  :value="getCompanyUserCount(company.name)" 
                  :hidden="getCompanyUserCount(company.name) === 0"
                  type="success"
                  class="user-count-indicator"
                >
                  <el-icon><User /></el-icon>
                </el-badge>
                <el-button 
                  size="small" 
                  text 
                  @click.stop="toggleCompanyExpansion(company.subject_id)"
                >
                  <el-icon>
                    <component :is="expandedCompanies.has(company.subject_id) ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                </el-button>
              </div>
            </div>
            
            <!-- 公司用户展开区域 -->
            <el-collapse-transition>
              <div v-show="expandedCompanies.has(company.subject_id)" class="company-users-expanded">
                <div class="users-section-header">
                  <el-icon><User /></el-icon>
                  <span>Users in this company ({{ getCompanyUsers(company.name).length }})</span>
                </div>
                <div v-if="getCompanyUsers(company.name).length > 0" class="expanded-users-grid">
                  <div 
                    v-for="user in getCompanyUsers(company.name)" 
                    :key="user.id || user.autodeskId"
                    class="expanded-user-card company-user"
                  >
                    <el-avatar :size="36" :src="user.imageUrl" class="user-avatar-enhanced">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="user-details-enhanced">
                      <div class="user-name-enhanced">{{ user.name }}</div>
                      <div class="user-email-enhanced">{{ user.email }}</div>
                      <div v-if="user.jobTitle" class="user-title-enhanced">{{ user.jobTitle }}</div>
                      <div v-if="user.roles && user.roles.length > 0" class="user-roles-enhanced">
                        <el-tag 
                          v-for="role in user.roles.slice(0, 2)" 
                          :key="role.id"
                          size="mini"
                          type="info"
                          class="role-mini-tag"
                        >
                          {{ role.name }}
                        </el-tag>
                        <el-tag v-if="user.roles.length > 2" size="mini" type="info">
                          +{{ user.roles.length - 2 }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="user-status-enhanced">
                      <el-tag :type="getStatusType(user.status)" size="mini">
                        {{ translateStatus(user.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-else class="no-company-users">
                  <el-empty description="No users in this company" :image-size="50" />
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="exportPermissions">
          <el-icon><Download /></el-icon>
          Export Permissions
        </el-button>
        <el-button @click="refreshPermissions">
          <el-icon><Refresh /></el-icon>
          Refresh Permissions
        </el-button>
      </div>
    </div>

    <!-- 无权限数据 -->
    <div v-else class="no-permissions">
      <el-empty description="No permissions data available" />
      <!-- 调试信息 -->
      <div class="debug-info" style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <h4>Debug Information:</h4>
        <p><strong>Permissions object exists:</strong> {{ !!permissions }}</p>
        <p><strong>Permissions status:</strong> {{ permissions?.status || 'undefined' }}</p>
        <p><strong>Loading:</strong> {{ loading }}</p>
        <p><strong>Error:</strong> {{ error || 'none' }}</p>
        <details>
          <summary>Raw permissions data:</summary>
          <pre>{{ JSON.stringify(permissions, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Lock,
  User,
  UserFilled,
  OfficeBuilding,
  DataAnalysis,
  Search,
  View,
  CopyDocument,
  Download,
  Refresh,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import axios from 'axios'
import SegmentedProgressBar from './SegmentedProgressBar.vue'

export default {
  name: 'PermissionDetailDrawer',
  components: {
    Lock,
    User,
    UserFilled,
    OfficeBuilding,
    DataAnalysis,
    Search,
    View,
    CopyDocument,
    Download,
    Refresh,
    ArrowUp,
    ArrowDown,
    SegmentedProgressBar
  },
  props: {
    permissions: {
      type: Object,
      default: null
    },
    nodeName: {
      type: String,
      required: true
    },
    nodeType: {
      type: String,
      required: true,
      validator: (value) => ['file', 'folder'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    projectId: {
      type: String,
      required: false
    }
  },
  emits: ['retry-load', 'refresh-permissions'],
  setup(props, { emit }) {
    
    // 响应式数据
    const userSearchText = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const expandedRoles = ref(new Set())
    const expandedCompanies = ref(new Set())
    const projectUsers = ref([])
    const loadingUsers = ref(false)

    // 计算属性
    const filteredUsers = computed(() => {
      if (!props.permissions?.data?.users) return []
      
      let users = props.permissions.data.users
      
      // 搜索过滤
      if (userSearchText.value) {
        const searchTerm = userSearchText.value.toLowerCase()
        users = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          (user.company && user.company.toLowerCase().includes(searchTerm))
        )
      }
      
      // 分页
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return users.slice(start, end)
    })

    // Get project user data
    const fetchProjectUsers = async () => {
      if (!props.projectId || loadingUsers.value) return
      
      try {
        loadingUsers.value = true
        const response = await axios.get(`/api/users/project/${props.projectId}/users`)
        
        if (response.data.status === 'success') {
          projectUsers.value = response.data.data.users || []
          console.log('Project users data fetched successfully:', projectUsers.value.length)
        }
      } catch (error) {
        console.error('Failed to fetch project users data:', error)
        ElMessage.error('Failed to fetch project users data')
      } finally {
        loadingUsers.value = false
      }
    }

    // Toggle role expansion state
    const toggleRoleExpansion = (roleId) => {
      if (expandedRoles.value.has(roleId)) {
        expandedRoles.value.delete(roleId)
      } else {
        expandedRoles.value.add(roleId)
        // Fetch user data on first expansion
        if (projectUsers.value.length === 0) {
          fetchProjectUsers()
        }
      }
    }

    // Toggle company expansion state
    const toggleCompanyExpansion = (companyId) => {
      if (expandedCompanies.value.has(companyId)) {
        expandedCompanies.value.delete(companyId)
      } else {
        expandedCompanies.value.add(companyId)
        // Fetch user data on first expansion
        if (projectUsers.value.length === 0) {
          fetchProjectUsers()
        }
      }
    }

    // Get users with specified role
    const getRoleUsers = (roleName) => {
      return projectUsers.value.filter(user => 
        user.roles && user.roles.some(role => role.name === roleName)
      )
    }

    // Get users from specified company
    const getCompanyUsers = (companyName) => {
      return projectUsers.value.filter(user => 
        user.companyName === companyName
      )
    }

    // Get role user count
    const getRoleUserCount = (roleName) => {
      return getRoleUsers(roleName).length
    }

    // Get company user count
    const getCompanyUserCount = (companyName) => {
      return getCompanyUsers(companyName).length
    }

    // Get status type (for user status display)
    const getStatusType = (status) => {
      const statusMap = {
        'active': 'success',
        'pending': 'warning',
        'inactive': 'info',
        'disabled': 'danger'
      }
      return statusMap[status?.toLowerCase()] || 'info'
    }

    // Translate status
    const translateStatus = (status) => {
      const translations = {
        'active': 'Active',
        'pending': 'Pending',
        'inactive': 'Inactive',
        'disabled': 'Disabled'
      }
      return translations[status?.toLowerCase()] || status
    }

    // Methods
    const getPermissionLevelType = (level) => {
      const typeMap = {
        1: 'info',     // View
        2: 'primary',  // View/Download
        3: 'warning',  // View/Download/Markup
        4: 'success',  // View/Download/Markup/Upload
        5: 'danger',   // Full Edit
        6: 'danger'    // Full Control
      }
      return typeMap[level] || 'info'
    }

    // Get permission level percentage (for progress bar)
    const getPermissionLevelPercentage = (level) => {
      // Map permission level 1-6 to 0-100%
      const percentage = Math.min(Math.max((level / 6) * 100, 0), 100)
      return Math.round(percentage)
    }

    // Get permission level color (for progress bar)
    const getPermissionLevelColor = (level) => {
      const colorMap = {
        1: '#909399',   // Gray - View
        2: '#409EFF',   // Blue - View/Download
        3: '#E6A23C',   // Orange - View/Download/Markup
        4: '#67C23A',   // Green - View/Download/Markup/Upload
        5: '#F56C6C',   // Red - Full Edit
        6: '#F56C6C'    // Red - Full Control
      }
      return colorMap[level] || '#909399'
    }

    const getActionType = (action) => {
      const actionTypeMap = {
        'VIEW': 'info',
        'DOWNLOAD': 'primary',
        'COLLABORATE': 'success',
        'PUBLISH_MARKUP': 'warning',
        'PUBLISH': 'warning',
        'EDIT': 'danger',
        'CONTROL': 'danger'
      }
      return actionTypeMap[action] || ''
    }

    const translateAction = (action) => {
      const translations = {
        'VIEW': 'View',
        'DOWNLOAD': 'Download',
        'COLLABORATE': 'Collaborate',
        'PUBLISH_MARKUP': 'Markup',
        'PUBLISH': 'Upload',
        'EDIT': 'Edit',
        'CONTROL': 'Control'
      }
      return translations[action] || action
    }

    const translatePermissionName = (permissionName) => {
      const translations = {
        '查看': 'View',
        '查看/下载': 'View/Download',
        '查看/下载/标记': 'View/Download/Markup',
        '查看/下载/标记/上传': 'View/Download/Markup/Upload',
        '完全编辑': 'Full Edit',
        '完全控制': 'Full Control'
      }
      return translations[permissionName] || permissionName
    }

    const viewUserDetail = (user) => {
      // Show user detail dialog or navigate to user detail page
      ElMessage.info(`View details for user: ${user.name}`)
      // TODO: Implement user detail view functionality
    }

    const copyUserInfo = async (user) => {
      const userInfo = `User: ${user.name}\nEmail: ${user.email}\nPermission Level: Level ${user.permission_level} - ${translatePermissionName(user.permission_name)}\nPermission Actions: ${user.all_actions.map(translateAction).join(', ')}`
      
      try {
        await navigator.clipboard.writeText(userInfo)
        ElMessage.success('User information copied to clipboard')
      } catch (error) {
        console.error('Copy failed:', error)
        ElMessage.error('Failed to copy user information')
      }
    }

    const exportPermissions = () => {
      if (!props.permissions?.data) {
        ElMessage.warning('No permission data available to export')
        return
      }

      const dataStr = JSON.stringify(props.permissions.data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = `permissions_${props.nodeName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`
      link.setAttribute('download', fileName)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('Permission data exported successfully')
    }

    const refreshPermissions = () => {
      emit('refresh-permissions')
    }

    const retryLoad = () => {
      emit('retry-load')
    }

    // Watch search text changes, reset page number
    watch(userSearchText, () => {
      currentPage.value = 1
    })

    // Preload user data when component mounts (if project ID exists)
    onMounted(() => {
      if (props.projectId) {
        fetchProjectUsers()
      }
    })

    return {
      userSearchText,
      currentPage,
      pageSize,
      expandedRoles,
      expandedCompanies,
      projectUsers,
      loadingUsers,
      filteredUsers,
      fetchProjectUsers,
      toggleRoleExpansion,
      toggleCompanyExpansion,
      getRoleUsers,
      getCompanyUsers,
      getRoleUserCount,
      getCompanyUserCount,
      getStatusType,
      translateStatus,
      getPermissionLevelType,
      getPermissionLevelPercentage,
      getPermissionLevelColor,
      getActionType,
      translateAction,
      translatePermissionName,
      viewUserDetail,
      copyUserInfo,
      exportPermissions,
      refreshPermissions,
      retryLoad
    }
  }
}
</script>

<style scoped>
.permission-detail-drawer {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

/* 权限详情头部 */
.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 2px solid #E4E7ED;
}

.header-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  color: #E6A23C;
  margin-top: 4px;
}

.title-content h3 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 20px;
}

.node-name {
  margin: 0;
  color: #909399;
  font-size: 14px;
  word-break: break-all;
}

/* 加载和错误状态 */
.loading-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.loading-text {
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.error-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.retry-button {
  align-self: center;
}

/* 卡片头部 */
.permission-detail-drawer .card-header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100% !important;
  justify-content: flex-start !important;
  text-align: left !important;
}

.permission-detail-drawer .header-actions {
  margin-left: auto !important;
  display: flex !important;
  align-items: center !important;
}

/* 权限统计 */
.stats-card {
  margin-bottom: 0;
}

.permission-stats {
  display: flex;
  justify-content: space-around;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F8F9FA;
  border-radius: 8px;
  flex: 1;
  min-width: 0;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-stat {
  background: #E3F2FD;
  color: #1976D2;
}

.role-stat {
  background: #E8F5E8;
  color: #388E3C;
}

.company-stat {
  background: #FFF3E0;
  color: #F57C00;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 用户列表 */
.users-card, .roles-card, .companies-card {
  margin-bottom: 0;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #FAFAFA;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
  transition: all 0.2s ease;
}

.user-detail-item:hover {
  background: #F0F9FF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-basic {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.user-email {
  font-size: 14px;
  color: #606266;
}

.user-company {
  font-size: 12px;
  color: #909399;
}

.user-permissions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-level {
  display: flex;
  align-items: center;
}

.level-tag {
  font-weight: 600;
}

/* 权限级别容器和进度条样式 */
.permission-level-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  width: 100%;
}

.permission-progress {
  width: 100%;
  margin-top: 2px;
}

.permission-progress-inline,
.permission-progress {
  width: 140px !important;
  margin-top: 4px !important;
}

/* 强制统一进度条样式 */
.permission-detail-drawer .permission-progress-inline .segmented-progress-bar,
.permission-detail-drawer .permission-progress .segmented-progress-bar {
  width: 100% !important;
}

.permission-detail-drawer .permission-progress-inline .segmented-progress-bar .segment,
.permission-detail-drawer .permission-progress .segmented-progress-bar .segment {
  height: 5px !important;
  border-radius: 2.5px !important;
}

/* 确保进度条在小空间内正常显示 */
.permission-progress :deep(.el-progress-bar) {
  padding-right: 0;
}

.permission-progress-inline :deep(.el-progress-bar) {
  padding-right: 0;
}

.permission-progress :deep(.el-progress-bar__outer) {
  border-radius: 2px;
}

.permission-progress-inline :deep(.el-progress-bar__outer) {
  border-radius: 2px;
}

.permission-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.actions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-tag {
  font-size: 11px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* 角色和公司列表 */
.roles-list, .companies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.role-detail-item, .company-detail-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #F0F9FF;
  border-radius: 6px;
  border-left: 3px solid #67C23A;
}

.role-icon, .company-icon {
  color: #67C23A;
  flex-shrink: 0;
}

.role-info, .company-info {
  flex: 1;
  min-width: 0;
}

.role-name, .company-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.role-description, .company-description {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.role-permission, .company-permission {
  flex-shrink: 0;
}

/* 分页 */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #E4E7ED;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #E4E7ED;
  margin-top: auto;
}

/* 无权限数据 */
.no-permissions {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 增强的角色权限样式 */
.enhanced-roles-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enhanced-role-item {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  overflow: hidden;
  transition: all 0.3s ease;
}

.enhanced-role-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #67C23A;
}

.role-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  border-bottom: 1px solid #E4E7ED;
  transition: all 0.2s ease;
}

.role-header-enhanced:hover {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
}

.role-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.role-icon-enhanced {
  color: #67C23A;
  flex-shrink: 0;
  padding: 8px;
  background: rgba(103, 194, 58, 0.1);
  border-radius: 50%;
}

.role-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-name-enhanced {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.role-permission-level {
  display: flex;
  align-items: center;
}

.role-expand-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-count-indicator {
  display: flex;
  align-items: center;
}

.role-users-expanded {
  padding: 16px;
  background: #FAFBFC;
  border-top: 1px solid #F0F0F0;
}

.users-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  padding: 8px 12px;
  background: #F5F7FA;
  border-radius: 4px;
}

.expanded-users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.expanded-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
  transition: all 0.2s ease;
  min-height: 60px;
}

.expanded-user-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}

.expanded-user-card.company-user:hover {
  border-color: #F57C00;
  box-shadow: 0 2px 8px rgba(245, 124, 0, 0.15);
}

.user-avatar-enhanced {
  flex-shrink: 0;
}

.user-details-enhanced {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-enhanced {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
}

.user-email-enhanced {
  font-size: 11px;
  color: #909399;
  line-height: 1.2;
}

.user-company-enhanced,
.user-title-enhanced {
  font-size: 10px;
  color: #C0C4CC;
  line-height: 1.2;
}

.user-roles-enhanced {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 2px;
}

.role-mini-tag {
  font-size: 10px;
  height: 16px;
  line-height: 14px;
  padding: 0 4px;
}

.user-status-enhanced {
  flex-shrink: 0;
}

.no-role-users,
.no-company-users {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  color: #909399;
}

/* 增强的公司权限样式 */
.enhanced-companies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enhanced-company-item {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  overflow: hidden;
  transition: all 0.3s ease;
}

.enhanced-company-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #F57C00;
}

.company-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-bottom: 1px solid #E4E7ED;
  transition: all 0.2s ease;
}

.company-header-enhanced:hover {
  background: linear-gradient(135deg, #FFECB3 0%, #FFE082 100%);
}

.company-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.company-icon-enhanced {
  color: #F57C00;
  flex-shrink: 0;
  padding: 8px;
  background: rgba(245, 124, 0, 0.1);
  border-radius: 50%;
}

.company-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.company-name-enhanced {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.company-permission-level {
  display: flex;
  align-items: center;
}

.company-expand-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.company-users-expanded {
  padding: 16px;
  background: #FAFBFC;
  border-top: 1px solid #F0F0F0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-detail-drawer {
    padding: 15px;
  }
  
  .permission-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .permission-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .user-detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .user-actions {
    flex-direction: row;
    align-self: flex-end;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .header-actions {
    margin-left: 0;
    margin-top: 8px;
  }
  
  /* 增强组件的响应式设计 */
  .role-header-enhanced,
  .company-header-enhanced {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
  }
  
  .role-expand-controls,
  .company-expand-controls {
    align-self: flex-end;
    width: 100%;
    justify-content: space-between;
  }
  
  .expanded-users-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .expanded-user-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 10px;
  }
  
  .user-status-enhanced {
    align-self: flex-end;
  }
  
  .users-section-header {
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>
