<template>
  <div class="permission-detail-view">
    <div v-if="permissions.status === 'success'" class="permission-success">
      <!-- 权限概览 -->
      <div class="permission-overview">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="Total Subjects">{{ permissions.data.summary.total_subjects }}</el-descriptions-item>
          <el-descriptions-item label="Users">{{ permissions.data.summary.users_count }}</el-descriptions-item>
          <el-descriptions-item label="Roles">{{ permissions.data.summary.roles_count }}</el-descriptions-item>
          <el-descriptions-item label="Companies">{{ permissions.data.summary.companies_count }}</el-descriptions-item>
          <el-descriptions-item label="Data Source">{{ permissions.api_source }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 用户权限详情 -->
      <div v-if="permissions.data.users.length > 0" class="users-detail">
        <h4>User Permission Details</h4>
        <el-table :data="permissions.data.users" border stripe>
          <el-table-column prop="name" label="Username" width="150" />
          <el-table-column prop="email" label="Email" width="200" />
          <el-table-column prop="user_type" label="User Type" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.user_type === 'PROJECT_ADMIN' ? 'danger' : 'primary'" size="small">
                {{ scope.row.user_type === 'PROJECT_ADMIN' ? 'Project Admin' : 'Project Member' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="subject_status" label="Status" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.subject_status)" size="small">
                {{ translateStatus(scope.row.subject_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="permission_level" label="Permission Level" width="140">
            <template #default="scope">
              <div class="permission-level-container">
                <el-tag :type="getPermissionLevelType(scope.row.permission_level)" size="small">
                  Level {{ scope.row.permission_level }}
                </el-tag>
                <SegmentedProgressBar 
                  :level="scope.row.permission_level"
                  size="small"
                  class="permission-progress-inline"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Permission Name" width="120">
            <template #default="scope">
              {{ translatePermissionName(scope.row.permission_name) }}
            </template>
          </el-table-column>
          <el-table-column label="Detailed Permissions" min-width="300">
            <template #default="scope">
              <div class="permission-badges">
                <el-tag 
                  v-for="(value, key) in scope.row.detailed_permissions" 
                  :key="key"
                  :type="value ? 'success' : 'info'"
                  size="mini"
                  class="permission-badge"
                >
                  {{ translatePermissionKey(key) }}: {{ value ? '✓' : '✗' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="100">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary" 
                text 
                @click="showUserDetail(scope.row)"
              >
                Details
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 角色权限详情 -->
      <div v-if="permissions.data.roles.length > 0" class="roles-detail">
        <h4>Role Permission Details</h4>
        <div class="roles-list">
          <div 
            v-for="role in permissions.data.roles" 
            :key="role.subject_id" 
            class="role-item-card"
          >
            <div class="role-header" @click="toggleRoleExpansion(role.subject_id)">
              <div class="role-basic-info">
                <div class="role-icon">
                  <el-icon size="20"><UserFilled /></el-icon>
                </div>
                <div class="role-info">
                  <div class="role-name">{{ role.name }}</div>
                  <div class="role-meta">
                    <el-tag :type="getStatusType(role.subject_status)" size="small">
                      {{ translateStatus(role.subject_status) }}
                    </el-tag>
                    <div class="permission-level-container">
                      <el-tag 
                        :type="getPermissionLevelType(role.permission_level)" 
                        size="small"
                        class="permission-tag"
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
              <div class="role-actions">
                <div class="user-count-badge">
                  <el-badge 
                    :value="getRoleUserCount(role.name)" 
                    :hidden="getRoleUserCount(role.name) === 0"
                    type="primary"
                  >
                    <el-icon><User /></el-icon>
                  </el-badge>
                </div>
                <el-button 
                  size="small" 
                  text 
                  :icon="expandedRoles.has(role.subject_id) ? 'ArrowUp' : 'ArrowDown'"
                  @click.stop="toggleRoleExpansion(role.subject_id)"
                >
                  {{ expandedRoles.has(role.subject_id) ? 'Collapse' : 'Expand' }}
                </el-button>
              </div>
            </div>
            
            <!-- 角色用户列表 -->
            <el-collapse-transition>
              <div v-show="expandedRoles.has(role.subject_id)" class="role-users-section">
                <div class="section-header">
                  <el-icon><User /></el-icon>
                  <span>Users with this role ({{ getRoleUsers(role.name).length }})</span>
                </div>
                <div v-if="getRoleUsers(role.name).length > 0" class="role-users-list">
                  <div 
                    v-for="user in getRoleUsers(role.name)" 
                    :key="user.id || user.autodeskId"
                    class="role-user-item"
                  >
                    <el-avatar :size="32" :src="user.imageUrl">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="user-info">
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email">{{ user.email }}</div>
                      <div v-if="user.companyName" class="user-company">{{ user.companyName }}</div>
                    </div>
                    <div class="user-status">
                      <el-tag :type="getStatusType(user.status)" size="small">
                        {{ translateStatus(user.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-else class="no-users">
                  <el-empty description="No users have this role" :image-size="60" />
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </div>

      <!-- 公司权限详情 -->
      <div v-if="permissions.data.companies.length > 0" class="companies-detail">
        <h4>Company Permission Details</h4>
        <div class="companies-list">
          <div 
            v-for="company in permissions.data.companies" 
            :key="company.subject_id" 
            class="company-item-card"
          >
            <div class="company-header" @click="toggleCompanyExpansion(company.subject_id)">
              <div class="company-basic-info">
                <div class="company-icon">
                  <el-icon size="20"><OfficeBuilding /></el-icon>
                </div>
                <div class="company-info">
                  <div class="company-name">{{ company.name }}</div>
                  <div class="company-meta">
                    <el-tag :type="getStatusType(company.subject_status)" size="small">
                      {{ translateStatus(company.subject_status) }}
                    </el-tag>
                    <div class="permission-level-container">
                      <el-tag 
                        :type="getPermissionLevelType(company.permission_level)" 
                        size="small"
                        class="permission-tag"
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
              <div class="company-actions">
                <div class="user-count-badge">
                  <el-badge 
                    :value="getCompanyUserCount(company.name)" 
                    :hidden="getCompanyUserCount(company.name) === 0"
                    type="success"
                  >
                    <el-icon><User /></el-icon>
                  </el-badge>
                </div>
                <el-button 
                  size="small" 
                  text 
                  :icon="expandedCompanies.has(company.subject_id) ? 'ArrowUp' : 'ArrowDown'"
                  @click.stop="toggleCompanyExpansion(company.subject_id)"
                >
                  {{ expandedCompanies.has(company.subject_id) ? 'Collapse' : 'Expand' }}
                </el-button>
              </div>
            </div>
            
            <!-- 公司用户列表 -->
            <el-collapse-transition>
              <div v-show="expandedCompanies.has(company.subject_id)" class="company-users-section">
                <div class="section-header">
                  <el-icon><User /></el-icon>
                  <span>Users in this company ({{ getCompanyUsers(company.name).length }})</span>
                </div>
                <div v-if="getCompanyUsers(company.name).length > 0" class="company-users-list">
                  <div 
                    v-for="user in getCompanyUsers(company.name)" 
                    :key="user.id || user.autodeskId"
                    class="company-user-item"
                  >
                    <el-avatar :size="32" :src="user.imageUrl">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="user-info">
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-email">{{ user.email }}</div>
                      <div v-if="user.jobTitle" class="user-title">{{ user.jobTitle }}</div>
                    </div>
                    <div class="user-roles">
                      <div v-if="user.roles && user.roles.length > 0" class="roles-tags">
                        <el-tag 
                          v-for="role in user.roles.slice(0, 2)" 
                          :key="role.id"
                          size="mini"
                          type="info"
                        >
                          {{ role.name }}
                        </el-tag>
                        <el-tag v-if="user.roles.length > 2" size="mini" type="info">
                          +{{ user.roles.length - 2 }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="user-status">
                      <el-tag :type="getStatusType(user.status)" size="small">
                        {{ translateStatus(user.status) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <div v-else class="no-users">
                  <el-empty description="No users in this company" :image-size="60" />
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限获取失败 -->
    <div v-else class="permission-error">
      <el-alert
        :title="`Failed to fetch permission info: ${permissions.status}`"
        :description="permissions.error"
        type="error"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="showUserDetailDialog"
      :title="`User Permission Details - ${selectedUser?.name}`"
      width="700px"
      top="10vh"
      draggable
      class="optimized-modal"
    >
      <div v-if="selectedUser" class="user-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="Username">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item label="Email">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="Autodesk ID">{{ selectedUser.autodesk_id }}</el-descriptions-item>
          <el-descriptions-item label="User Type">{{ selectedUser.user_type }}</el-descriptions-item>
          <el-descriptions-item label="Status">{{ selectedUser.subject_status }}</el-descriptions-item>
          <el-descriptions-item label="Permission Level">Level {{ selectedUser.permission_level }} - {{ translatePermissionName(selectedUser.permission_name) }}</el-descriptions-item>
        </el-descriptions>

        <div class="actions-section">
          <h5>Direct Permissions</h5>
          <div class="actions-list">
            <el-tag 
              v-for="action in selectedUser.direct_actions" 
              :key="action"
              type="primary"
              size="small"
            >
              {{ translateAction(action) }}
            </el-tag>
            <span v-if="selectedUser.direct_actions.length === 0" class="no-actions">No direct permissions</span>
          </div>

          <h5>Inherited Permissions</h5>
          <div class="actions-list">
            <el-tag 
              v-for="action in selectedUser.inherit_actions" 
              :key="action"
              type="success"
              size="small"
            >
              {{ translateAction(action) }}
            </el-tag>
            <span v-if="selectedUser.inherit_actions.length === 0" class="no-actions">No inherited permissions</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  UserFilled, 
  OfficeBuilding, 
  User,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import axios from 'axios'
import SegmentedProgressBar from './SegmentedProgressBar.vue'

export default {
  name: 'PermissionDetailView',
  components: {
    UserFilled,
    OfficeBuilding,
    User,
    ArrowUp,
    ArrowDown,
    SegmentedProgressBar
  },
  props: {
    permissions: {
      type: Object,
      required: true
    },
    projectId: {
      type: String,
      required: false
    }
  },
  setup(props) {
    const showUserDetailDialog = ref(false)
    const selectedUser = ref(null)
    const expandedRoles = ref(new Set())
    const expandedCompanies = ref(new Set())
    const projectUsers = ref([])
    const loadingUsers = ref(false)

    // 获取项目用户数据
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

    // 切换角色展开状态
    const toggleRoleExpansion = (roleId) => {
      if (expandedRoles.value.has(roleId)) {
        expandedRoles.value.delete(roleId)
      } else {
        expandedRoles.value.add(roleId)
        // 首次展开时获取用户数据
        if (projectUsers.value.length === 0) {
          fetchProjectUsers()
        }
      }
    }

    // 切换公司展开状态
    const toggleCompanyExpansion = (companyId) => {
      if (expandedCompanies.value.has(companyId)) {
        expandedCompanies.value.delete(companyId)
      } else {
        expandedCompanies.value.add(companyId)
        // 首次展开时获取用户数据
        if (projectUsers.value.length === 0) {
          fetchProjectUsers()
        }
      }
    }

    // 获取拥有指定角色的用户
    const getRoleUsers = (roleName) => {
      return projectUsers.value.filter(user => 
        user.roles && user.roles.some(role => role.name === roleName)
      )
    }

    // 获取指定公司的用户
    const getCompanyUsers = (companyName) => {
      return projectUsers.value.filter(user => 
        user.companyName === companyName
      )
    }

    // 获取角色用户数量
    const getRoleUserCount = (roleName) => {
      return getRoleUsers(roleName).length
    }

    // 获取公司用户数量
    const getCompanyUserCount = (companyName) => {
      return getCompanyUsers(companyName).length
    }

    const showUserDetail = (user) => {
      selectedUser.value = user
      showUserDetailDialog.value = true
    }

    const getStatusType = (status) => {
      const statusMap = {
        'ACTIVE': 'success',
        'INACTIVE': 'warning',
        'PENDING': 'info',
        'DISABLED': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const translateStatus = (status) => {
      const translations = {
        'ACTIVE': 'Active',
        'INACTIVE': 'Inactive',
        'PENDING': 'Pending',
        'DISABLED': 'Disabled'
      }
      return translations[status] || status
    }

    const getPermissionLevelType = (level) => {
      const typeMap = {
        1: 'info',     // 查看
        2: 'primary',  // 查看/下载
        3: 'warning',  // 查看/下载/标记
        4: 'success',  // 查看/下载/标记/上传
        5: 'danger',   // 完全编辑
        6: 'danger'    // 完全控制
      }
      return typeMap[level] || 'info'
    }

    // 获取权限级别百分比（用于进度条）
    const getPermissionLevelPercentage = (level) => {
      // 将权限级别1-6映射到0-100%
      const percentage = Math.min(Math.max((level / 6) * 100, 0), 100)
      return Math.round(percentage)
    }

    // 获取权限级别颜色（用于进度条）
    const getPermissionLevelColor = (level) => {
      const colorMap = {
        1: '#909399',   // 灰色 - 查看
        2: '#409EFF',   // 蓝色 - 查看/下载
        3: '#E6A23C',   // 橙色 - 查看/下载/标记
        4: '#67C23A',   // 绿色 - 查看/下载/标记/上传
        5: '#F56C6C',   // 红色 - 完全编辑
        6: '#F56C6C'    // 红色 - 完全控制
      }
      return colorMap[level] || '#909399'
    }

    const translatePermissionKey = (key) => {
      const translations = {
        'canView': 'View',
        'canDownload': 'Download',
        'canCollaborate': 'Collaborate',
        'canPublishMarkup': 'Markup',
        'canUpload': 'Upload',
        'canEdit': 'Edit',
        'canControl': 'Control'
      }
      return translations[key] || key
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

    // 组件挂载时预加载用户数据（如果有项目ID）
    onMounted(() => {
      if (props.projectId) {
        fetchProjectUsers()
      }
    })

    return {
      showUserDetailDialog,
      selectedUser,
      expandedRoles,
      expandedCompanies,
      projectUsers,
      loadingUsers,
      showUserDetail,
      toggleRoleExpansion,
      toggleCompanyExpansion,
      getRoleUsers,
      getCompanyUsers,
      getRoleUserCount,
      getCompanyUserCount,
      fetchProjectUsers,
      getStatusType,
      translateStatus,
      getPermissionLevelType,
      getPermissionLevelPercentage,
      getPermissionLevelColor,
      translatePermissionKey,
      translateAction,
      translatePermissionName
    }
  }
}
</script>

<style scoped>
.permission-detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.permission-overview {
  margin-bottom: 20px;
}

.permission-detail-view .users-detail,
.permission-detail-view .roles-detail,
.permission-detail-view .companies-detail {
  margin-bottom: 20px !important;
  text-align: left !important;
  width: 100% !important;
}

.permission-detail-view .users-detail h4,
.permission-detail-view .roles-detail h4,
.permission-detail-view .companies-detail h4 {
  margin: 0 0 12px 0 !important;
  color: #303133 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  text-align: left !important;
  display: block !important;
  width: 100% !important;
}

.permission-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-badge {
  margin: 2px;
}

/* 权限级别容器和进度条样式 */
.permission-detail-view .permission-level-container {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  align-items: flex-start !important;
  min-width: 150px !important;
  width: 100% !important;
}

.permission-progress {
  width: 100%;
  margin-top: 2px;
}

.permission-progress-inline {
  width: 120px;
  margin-top: 4px;
}

/* 表格内的紧凑样式 */
.table-compact .segmented-progress-bar {
  margin-top: 2px;
}

.table-compact .segmented-progress-bar .segment {
  height: 4px;
  border-radius: 2px;
}

/* 角色卡片内的进度条样式 */
.permission-progress-inline .segmented-progress-bar {
  width: 100%;
}

.permission-progress-inline .segmented-progress-bar .segment {
  height: 5px;
  border-radius: 2.5px;
}

/* 确保所有权限级别容器的一致性 */
.permission-detail-view .role-meta .permission-level-container,
.permission-detail-view .company-meta .permission-level-container {
  align-self: flex-start !important;
  margin-top: 2px !important;
}

/* 表格中的权限级别容器 */
.permission-detail-view .el-table .permission-level-container {
  width: 100% !important;
  min-width: 120px !important;
}

/* 强制应用进度条样式 */
.permission-detail-view .permission-progress-inline,
.permission-detail-view .permission-progress {
  width: 140px !important;
  margin-top: 4px !important;
}

.permission-detail-view .permission-progress-inline .segmented-progress-bar,
.permission-detail-view .permission-progress .segmented-progress-bar {
  width: 100% !important;
}

.permission-detail-view .permission-progress-inline .segmented-progress-bar .segment,
.permission-detail-view .permission-progress .segmented-progress-bar .segment {
  height: 5px !important;
  border-radius: 2.5px !important;
}

/* 公司权限样式 */
.companies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-item-card {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  overflow: hidden;
  transition: all 0.3s ease;
}

.company-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.company-header:hover {
  background-color: #f8f9fa;
}

.company-basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.company-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f0f9ff;
  border-radius: 8px;
  color: #409EFF;
}

.company-info {
  flex: 1;
}

.company-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.permission-detail-view .company-meta {
  display: flex !important;
  align-items: flex-start !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.company-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.permission-error {
  padding: 20px;
}

.user-detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions-section h5 {
  margin: 16px 0 8px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 600;
}

.actions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.no-actions {
  color: #909399;
  font-style: italic;
  font-size: 14px;
}

/* 角色权限样式 */
.roles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-item-card {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  overflow: hidden;
  transition: all 0.3s ease;
}

.role-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background: #F8F9FA;
  border-bottom: 1px solid #E4E7ED;
  transition: background-color 0.2s ease;
}

.role-header:hover {
  background: #E3F2FD;
}

.role-basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.role-icon {
  color: #67C23A;
  flex-shrink: 0;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.permission-detail-view .role-meta {
  display: flex !important;
  align-items: flex-start !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.permission-tag {
  font-weight: 500;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-count-badge {
  display: flex;
  align-items: center;
}

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

/* 公司权限样式 */
.companies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-item-card {
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  background: #FFFFFF;
  overflow: hidden;
  transition: all 0.3s ease;
}

.company-item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #F57C00;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  background: #F8F9FA;
  border-bottom: 1px solid #E4E7ED;
  transition: background-color 0.2s ease;
}

.company-header:hover {
  background: #FFF8E1;
}

.company-basic-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.company-icon {
  color: #F57C00;
  flex-shrink: 0;
}

.company-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.company-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.company-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.company-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.company-users-section {
  padding: 16px;
  background: #FAFBFC;
}

.company-users-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.company-user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
  transition: all 0.2s ease;
}

.company-user-item:hover {
  border-color: #F57C00;
  box-shadow: 0 2px 8px rgba(245, 124, 0, 0.1);
}

.company-user-item .user-info {
  flex: 1;
  min-width: 0;
}

.company-user-item .user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.company-user-item .user-email {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.company-user-item .user-title {
  font-size: 11px;
  color: #C0C4CC;
}

.user-roles {
  flex-shrink: 0;
  margin-right: 12px;
}

.roles-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.company-user-item .user-status {
  flex-shrink: 0;
}

.no-users {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  color: #909399;
}

/* 组件特定的模态框样式 */

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-badges {
    flex-direction: column;
  }
  
  .actions-list {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .optimized-modal {
    width: 95% !important;
    top: 5vh !important;
  }
  
  /* 角色和公司卡片响应式 */
  .role-header,
  .company-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .role-actions,
  .company-actions {
    align-self: flex-end;
    width: 100%;
    justify-content: space-between;
  }
  
  .role-meta,
  .company-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .role-user-item,
  .company-user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .role-user-item .user-status,
  .company-user-item .user-status {
    align-self: flex-end;
  }
  
  .user-roles {
    margin-right: 0;
    align-self: flex-start;
  }
}
</style>
