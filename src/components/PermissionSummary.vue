<template>
  <div class="permission-summary">
    <div v-if="permissions.status === 'success'" class="permission-content">
      <div class="permission-header">
        <el-icon><Lock /></el-icon>
        <span>Permission Information</span>
        <el-tag size="small" type="success">{{ permissions.data.summary.total_subjects }} Subjects</el-tag>
      </div>
      
      <div class="permission-stats">
        <div class="stat-item">
          <el-icon class="stat-icon user-icon"><User /></el-icon>
          <span class="stat-count">{{ permissions.data.summary.users_count }}</span>
          <span class="stat-label">Users</span>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon role-icon"><UserFilled /></el-icon>
          <span class="stat-count">{{ permissions.data.summary.roles_count }}</span>
          <span class="stat-label">Roles</span>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon company-icon"><OfficeBuilding /></el-icon>
          <span class="stat-count">{{ permissions.data.summary.companies_count }}</span>
          <span class="stat-label">Companies</span>
        </div>
      </div>

      <!-- 用户权限列表 -->
      <div v-if="permissions.data.users.length > 0" class="users-section">
        <div class="section-header">
          <el-icon><User /></el-icon>
          <span>User Permissions</span>
        </div>
        <div class="users-list">
          <div v-for="user in permissions.data.users" :key="user.subject_id" class="user-item">
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-email">{{ user.email }}</div>
            </div>
            <div class="user-permissions">
              <el-tag 
                :type="getPermissionLevelType(user.permission_level)" 
                size="small"
              >
                Level {{ user.permission_level }} - {{ translatePermissionName(user.permission_name) }}
              </el-tag>
              <div class="permission-actions">
                <el-tag 
                  v-for="action in user.all_actions" 
                  :key="action"
                  size="mini"
                  :type="getActionType(action)"
                >
                  {{ translateAction(action) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色权限列表 -->
      <div v-if="permissions.data.roles.length > 0" class="roles-section">
        <div class="section-header">
          <el-icon><UserFilled /></el-icon>
          <span>Role Permissions</span>
        </div>
        <div class="roles-list">
          <div v-for="role in permissions.data.roles" :key="role.subject_id" class="role-item">
            <div class="role-name">{{ role.name }}</div>
            <el-tag 
              :type="getPermissionLevelType(role.permission_level)" 
              size="small"
            >
              Level {{ role.permission_level }} - {{ translatePermissionName(role.permission_name) }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 公司权限列表 -->
      <div v-if="permissions.data.companies.length > 0" class="companies-section">
        <div class="section-header">
          <el-icon><OfficeBuilding /></el-icon>
          <span>Company Permissions</span>
        </div>
        <div class="companies-list">
          <div v-for="company in permissions.data.companies" :key="company.subject_id" class="company-item">
            <div class="company-name">{{ company.name }}</div>
            <el-tag 
              :type="getPermissionLevelType(company.permission_level)" 
              size="small"
            >
              Level {{ company.permission_level }} - {{ translatePermissionName(company.permission_name) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 权限获取失败 -->
    <div v-else class="permission-error">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <span class="error-message">
        Failed to get permission information: {{ permissions.error || 'Unknown error' }}
      </span>
    </div>
  </div>
</template>

<script>
import { Lock, User, UserFilled, OfficeBuilding, WarningFilled } from '@element-plus/icons-vue'

export default {
  name: 'PermissionSummary',
  components: {
    Lock,
    User,
    UserFilled,
    OfficeBuilding,
    WarningFilled
  },
  props: {
    permissions: {
      type: Object,
      required: true
    }
  },
  setup() {
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

    return {
      getPermissionLevelType,
      getActionType,
      translateAction,
      translatePermissionName
    }
  }
}
</script>

<style scoped>
.permission-summary {
  padding: 12px 0;
}

.permission-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.permission-stats {
  display: flex;
  gap: 20px;
  padding: 8px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-icon {
  font-size: 14px;
}

.user-icon {
  color: #409EFF;
}

.role-icon {
  color: #67C23A;
}

.company-icon {
  color: #E6A23C;
}

.stat-count {
  font-weight: bold;
  color: #303133;
}

.stat-label {
  color: #909399;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.users-list, .roles-list, .companies-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px;
  background: #F8F9FA;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.user-email {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.user-permissions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.permission-actions {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.role-item, .company-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #F0F9FF;
  border-radius: 4px;
  border-left: 3px solid #67C23A;
}

.role-name, .company-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.permission-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #FEF0F0;
  border-radius: 4px;
  border-left: 3px solid #F56C6C;
}

.error-icon {
  color: #F56C6C;
  font-size: 16px;
}

.error-message {
  font-size: 12px;
  color: #F56C6C;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .user-permissions {
    align-items: flex-start;
    width: 100%;
  }
  
  .permission-actions {
    justify-content: flex-start;
  }
}
</style>
