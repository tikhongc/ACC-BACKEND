<template>
  <div class="rfi-config-panel">
    
    <!-- 用戶權限信息 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-user />
            {{ $t('rfiConfig.userPermissions.title') }}
          </span>
          <el-button 
            type="primary" 
            size="small"
            :loading="loadingUserPermissions"
            @click="loadUserPermissions">
            {{ userPermissions ? $t('rfiConfig.userPermissions.reload') : $t('rfiConfig.userPermissions.load') }}
          </el-button>
        </div>
      </template>
      
      <div v-if="userPermissions" class="user-permissions">
        <div class="permission-grid">
          <div class="permission-item">
            <label>{{ $t('rfiConfig.userPermissions.userId') }}:</label>
            <span>{{ userPermissions.user?.id || $t('rfiConfig.userPermissions.unknown') }}</span>
          </div>
          <div class="permission-item">
            <label>{{ $t('rfiConfig.userPermissions.userName') }}:</label>
            <span>{{ userPermissions.user?.name || $t('rfiConfig.userPermissions.unknown') }}</span>
          </div>
          <div class="permission-item">
            <label>{{ $t('rfiConfig.userPermissions.userRole') }}:</label>
            <span>{{ userPermissions.user?.role || $t('rfiConfig.userPermissions.unknown') }}</span>
          </div>
          <div class="permission-item">
            <label>{{ $t('rfiConfig.userPermissions.workflowType') }}:</label>
            <StatusTag 
              :status="userPermissions.workflow?.type === 'US' ? 'success' : 'info'" 
              :text="userPermissions.workflow?.type || 'Unknown'" 
              size="small" />
          </div>
        </div>

        <!-- 工作流角色 -->
        <div v-if="userPermissions.workflow?.roles" class="workflow-roles">
          <h4>{{ $t('rfiConfig.userPermissions.workflowRoles') }}:</h4>
          <div class="roles-list">
            <el-tag 
              v-for="role in userPermissions.workflow.roles" 
              :key="role"
              type="success" 
              size="small"
              style="margin: 2px;">
              {{ formatRoleName(role) }}
            </el-tag>
          </div>
        </div>

        <!-- 允許的操作 -->
        <div v-if="userPermissions.permittedActions" class="permitted-actions">
          <h4>{{ $t('rfiConfig.userPermissions.permittedActions') }}:</h4>
          <div class="actions-list">
            <div v-if="userPermissions.permittedActions.createRfi" class="action-item">
              <StatusTag status="success" :text="$t('rfiConfig.userPermissions.actions.createRfi')" size="small" />
              <span class="action-desc">{{ $t('rfiConfig.userPermissions.actions.createRfiDesc') }}</span>
            </div>
            <div v-if="userPermissions.permittedActions.updateRfi" class="action-item">
              <StatusTag status="info" :text="$t('rfiConfig.userPermissions.actions.updateRfi')" size="small" />
              <span class="action-desc">{{ $t('rfiConfig.userPermissions.actions.updateRfiDesc') }}</span>
            </div>
            <div v-if="userPermissions.permittedActions.createComment" class="action-item">
              <StatusTag status="warning" :text="$t('rfiConfig.userPermissions.actions.createComment')" size="small" />
              <span class="action-desc">{{ $t('rfiConfig.userPermissions.actions.createCommentDesc') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loadingUserPermissions" class="no-data">
        <el-empty :description="$t('rfiConfig.userPermissions.clickToLoad')" />
      </div>
    </el-card>

    <!-- RFI 類型配置 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-apps />
            {{ $t('rfiConfig.rfiTypes.title') }}
          </span>
          <el-button 
            type="primary" 
            size="small"
            :loading="loadingRfiTypes"
            @click="loadRfiTypes">
            {{ rfiTypes ? $t('rfiConfig.rfiTypes.reload') : $t('rfiConfig.rfiTypes.load') }}
          </el-button>
        </div>
      </template>
      
      <div v-if="rfiTypes && rfiTypes.results" class="rfi-types">
        <div class="types-summary">
          <div class="summary-item">
            <label>總類型數:</label>
            <span>{{ rfiTypes.results.length }}</span>
          </div>
          <div class="summary-item">
            <label>默認類型:</label>
            <span>{{ defaultRfiType?.name || '未設置' }}</span>
          </div>
        </div>

        <div class="types-list">
          <div 
            v-for="rfiType in rfiTypes.results" 
            :key="rfiType.id"
            class="type-item"
            :class="{ 'is-default': rfiType.isDefault }">
            <div class="type-header">
              <span class="type-name">{{ rfiType.name }}</span>
              <div class="type-tags">
                <el-tag v-if="rfiType.isDefault" type="success" size="small">Default</el-tag>
                <StatusTag 
                  :status="rfiType.status === 'active' ? 'success' : 'info'" 
                  :text="rfiType.status" 
                  size="small" />
                <el-tag type="info" size="small">{{ rfiType.wfType }}</el-tag>
              </div>
            </div>
            
            <div class="type-details">
              <div class="detail-item" v-if="rfiType.dueDateOffset">
                <label>Due Date Offset:</label>
                <span>{{ rfiType.dueDateOffset }} days</span>
              </div>
              <div class="detail-item" v-if="rfiType.priority">
                <label>Default Priority:</label>
                <StatusTag 
                  :status="getPriorityStatus(rfiType.priority)" 
                  :text="rfiType.priority" 
                  size="small" />
              </div>
              <div class="detail-item" v-if="rfiType.discipline && rfiType.discipline.length > 0">
                <label>Disciplines:</label>
                <div class="discipline-tags">
                  <el-tag 
                    v-for="discipline in rfiType.discipline" 
                    :key="discipline"
                    type="info" 
                    size="small"
                    style="margin: 1px;">
                    {{ discipline }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loadingRfiTypes" class="no-data">
        <el-empty description="點擊上方按鈕加載 RFI 類型配置" />
      </div>
    </el-card>

    <!-- 自定義屬性 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-settings />
            自定義屬性
          </span>
          <el-button 
            type="primary" 
            size="small"
            :loading="loadingCustomAttributes"
            @click="loadCustomAttributes">
            {{ customAttributes ? '重新加載' : '加載屬性' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="customAttributes && customAttributes.results" class="custom-attributes">
        <div class="attributes-summary">
          <div class="summary-item">
            <label>總屬性數:</label>
            <span>{{ customAttributes.results.length }}</span>
          </div>
          <div class="summary-item">
            <label>活躍屬性:</label>
            <span>{{ activeAttributesCount }}</span>
          </div>
        </div>

        <div class="attributes-list">
          <div 
            v-for="attribute in customAttributes.results" 
            :key="attribute.id"
            class="attribute-item">
            <div class="attribute-header">
              <span class="attribute-name">{{ attribute.name }}</span>
              <div class="attribute-tags">
                <StatusTag 
                  :status="attribute.status === 'active' ? 'success' : 'info'" 
                  :text="attribute.status" 
                  size="small" />
                <el-tag type="info" size="small">{{ attribute.type }}</el-tag>
                <el-tag v-if="attribute.multipleChoice" type="warning" size="small">Multiple Choice</el-tag>
              </div>
            </div>
            
            <div class="attribute-description" v-if="attribute.description">
              {{ attribute.description }}
            </div>

            <div v-if="attribute.possibleValues && attribute.possibleValues.length > 0" class="possible-values">
              <label>Options:</label>
              <div class="values-list">
                <el-tag 
                  v-for="value in attribute.possibleValues" 
                  :key="value.id"
                  type="info" 
                  size="small"
                  style="margin: 1px;">
                  {{ value.name }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loadingCustomAttributes" class="no-data">
        <el-empty description="點擊上方按鈕加載自定義屬性配置" />
      </div>
    </el-card>

    <!-- 工作流配置 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-branch />
            工作流配置
          </span>
          <el-button 
            type="primary" 
            size="small"
            :loading="loadingWorkflow"
            @click="loadWorkflow">
            {{ workflow ? '重新加載' : '加載工作流' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="workflow" class="workflow-config">
        <div class="workflow-info">
          <div class="info-item">
            <label>工作流類型:</label>
            <StatusTag 
              :status="workflow.workflowType === 'US' ? 'success' : 'info'" 
              :text="workflow.workflowType" 
              size="default" />
          </div>
          <div class="info-item full-width" v-if="workflow.description">
            <label>描述:</label>
            <div class="description-text">{{ workflow.description }}</div>
          </div>
        </div>

        <div v-if="workflow.projectRolesMapping" class="roles-mapping">
          <h4>項目角色映射:</h4>
          <div class="mapping-list">
            <div 
              v-for="roleMapping in workflow.projectRolesMapping" 
              :key="roleMapping.name"
              class="mapping-item">
              <div class="role-header">
                <span class="role-name">{{ formatRoleName(roleMapping.name) }}</span>
                <el-tag type="info" size="small">
                  {{ roleMapping.permittedAssignees?.length || 0 }} 個指派人
                </el-tag>
              </div>
              
              <div v-if="roleMapping.permittedAssignees && roleMapping.permittedAssignees.length > 0" class="assignees-list">
                <div 
                  v-for="assignee in roleMapping.permittedAssignees.slice(0, 5)" 
                  :key="assignee.id"
                  class="assignee-item">
                  <span class="assignee-id">{{ assignee.id }}</span>
                  <span class="assignee-type">({{ assignee.type }})</span>
                </div>
                <div v-if="roleMapping.permittedAssignees.length > 5" class="more-assignees">
                  還有 {{ roleMapping.permittedAssignees.length - 5 }} 個...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="!loadingWorkflow" class="no-data">
        <el-empty description="點擊上方按鈕加載工作流配置" />
      </div>
    </el-card>

    <!-- 自定義標識符 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <icon-tag />
            自定義標識符
          </span>
          <el-button 
            type="primary" 
            size="small"
            :loading="loadingCustomIdentifier"
            @click="loadCustomIdentifier">
            {{ customIdentifier ? '重新加載' : '加載標識符' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="customIdentifier" class="custom-identifier">
        <div class="identifier-info">
          <div class="info-item">
            <label>當前標識符:</label>
            <span class="identifier-value">{{ customIdentifier.current || '無' }}</span>
          </div>
          <div class="info-item">
            <label>下一個標識符:</label>
            <span class="identifier-value next">{{ customIdentifier.next }}</span>
          </div>
        </div>
        
        <div class="identifier-actions">
          <el-button type="success" size="small">
            使用下一個標識符創建 RFI
          </el-button>
        </div>
      </div>
      
      <div v-else-if="!loadingCustomIdentifier" class="no-data">
        <el-empty description="點擊上方按鈕加載自定義標識符信息" />
      </div>
    </el-card>

  </div>
</template>

<script>
import axios from 'axios'
import StatusTag from './StatusTag.vue'
import { 
  IconUser, 
  IconApps, 
  IconSettings, 
  IconBranch, 
  IconTag 
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'RfiConfigPanel',
  components: {
    StatusTag,
    IconUser,
    IconApps,
    IconSettings,
    IconBranch,
    IconTag
  },
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      // 用戶權限
      userPermissions: null,
      loadingUserPermissions: false,
      
      // RFI 類型
      rfiTypes: null,
      loadingRfiTypes: false,
      
      // 自定義屬性
      customAttributes: null,
      loadingCustomAttributes: false,
      
      // 工作流配置
      workflow: null,
      loadingWorkflow: false,
      
      // 自定義標識符
      customIdentifier: null,
      loadingCustomIdentifier: false
    }
  },
  computed: {
    defaultRfiType() {
      if (!this.rfiTypes?.results) return null
      return this.rfiTypes.results.find(type => type.isDefault)
    },
    
    activeAttributesCount() {
      if (!this.customAttributes?.results) return 0
      return this.customAttributes.results.filter(attr => attr.status === 'active').length
    }
  },
  methods: {
    async loadUserPermissions() {
      if (this.loadingUserPermissions) return
      
      this.loadingUserPermissions = true
      
      try {
        this.$message.info('正在獲取用戶權限...')
        
        const response = await axios.get('/api/rfis/jarvis/users/me', {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.userPermissions = response.data.user_permissions
          this.$message.success('用戶權限加載成功')
        } else {
          throw new Error(response.data.error || '獲取用戶權限失敗')
        }
      } catch (error) {
        console.error('獲取用戶權限失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取用戶權限失敗')
      } finally {
        this.loadingUserPermissions = false
      }
    },

    async loadRfiTypes() {
      if (this.loadingRfiTypes) return
      
      this.loadingRfiTypes = true
      
      try {
        this.$message.info('正在獲取 RFI 類型配置...')
        
        const response = await axios.get('/api/rfis/jarvis/rfi-types', {
          params: {
            projectId: this.project.id,
            limit: 50
          }
        })

        if (response.data.success) {
          this.rfiTypes = response.data.rfi_types
          this.$message.success(`RFI 類型配置加載成功 (${this.rfiTypes.results?.length || 0} 個類型)`)
        } else {
          throw new Error(response.data.error || '獲取 RFI 類型配置失敗')
        }
      } catch (error) {
        console.error('獲取 RFI 類型配置失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取 RFI 類型配置失敗')
      } finally {
        this.loadingRfiTypes = false
      }
    },

    async loadCustomAttributes() {
      if (this.loadingCustomAttributes) return
      
      this.loadingCustomAttributes = true
      
      try {
        this.$message.info('正在獲取自定義屬性...')
        
        const response = await axios.get('/api/rfis/jarvis/attributes', {
          params: {
            projectId: this.project.id,
            limit: 50
          }
        })

        if (response.data.success) {
          this.customAttributes = response.data.custom_attributes
          this.$message.success(`Custom attributes loaded successfully (${this.customAttributes.results?.length || 0} attributes)`)
        } else {
          throw new Error(response.data.error || '獲取自定義屬性失敗')
        }
      } catch (error) {
        console.error('獲取自定義屬性失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取自定義屬性失敗')
      } finally {
        this.loadingCustomAttributes = false
      }
    },

    async loadWorkflow() {
      if (this.loadingWorkflow) return
      
      this.loadingWorkflow = true
      
      try {
        this.$message.info('正在獲取工作流配置...')
        
        const response = await axios.get('/api/rfis/jarvis/workflow', {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.workflow = response.data.workflow
          this.$message.success('工作流配置加載成功')
        } else {
          throw new Error(response.data.error || '獲取工作流配置失敗')
        }
      } catch (error) {
        console.error('獲取工作流配置失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取工作流配置失敗')
      } finally {
        this.loadingWorkflow = false
      }
    },

    async loadCustomIdentifier() {
      if (this.loadingCustomIdentifier) return
      
      this.loadingCustomIdentifier = true
      
      try {
        this.$message.info('正在獲取自定義標識符...')
        
        const response = await axios.get('/api/rfis/jarvis/custom-identifier', {
          params: {
            projectId: this.project.id
          }
        })

        if (response.data.success) {
          this.customIdentifier = response.data.custom_identifier
          this.$message.success('自定義標識符加載成功')
        } else {
          throw new Error(response.data.error || '獲取自定義標識符失敗')
        }
      } catch (error) {
        console.error('獲取自定義標識符失敗:', error)
        this.$message.error(error.response?.data?.error || error.message || '獲取自定義標識符失敗')
      } finally {
        this.loadingCustomIdentifier = false
      }
    },

    formatRoleName(role) {
      const roleMap = {
        'projectSC': '創建者 (Subcontractor)',
        'projectGC': '管理者 (General Contractor)',
        'projectCoordinator': '協調員 (Construction Manager)',
        'projectReviewer': '審閱者 (Architect)'
      }
      return roleMap[role] || role
    },

    getPriorityStatus(priority) {
      const priorityMap = {
        'High': 'danger',
        'Normal': 'info',
        'Low': 'success'
      }
      return priorityMap[priority] || 'info'
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.rfi-config-panel {
  padding: var(--spacing-lg);
}

.config-card {
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-lg);
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

.no-data {
  padding: var(--spacing-xl);
  text-align: center;
}

/* 用戶權限樣式 */
.user-permissions {
  margin-top: var(--spacing-md);
}

.permission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.permission-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.permission-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.workflow-roles,
.permitted-actions {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.workflow-roles h4,
.permitted-actions h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
}

.action-desc {
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

/* RFI 類型樣式 */
.rfi-types {
  margin-top: var(--spacing-md);
}

.types-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.summary-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.types-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.type-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
}

.type-item.is-default {
  border-color: var(--color-success);
  background: var(--color-success-light);
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.type-name {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 1.1em;
}

.type-tags {
  display: flex;
  gap: var(--spacing-xs);
}

.type-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.discipline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* 自定義屬性樣式 */
.custom-attributes {
  margin-top: var(--spacing-md);
}

.attributes-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-md);
}

.attributes-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.attribute-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.attribute-name {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 1.1em;
}

.attribute-tags {
  display: flex;
  gap: var(--spacing-xs);
}

.attribute-description {
  color: var(--color-text-secondary);
  font-size: 0.9em;
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.possible-values {
  margin-top: var(--spacing-sm);
}

.possible-values label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
  display: block;
  margin-bottom: var(--spacing-xs);
}

.values-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* 工作流配置樣式 */
.workflow-config {
  margin-top: var(--spacing-md);
}

.workflow-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.description-text {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  line-height: 1.6;
}

.roles-mapping {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-lighter);
}

.roles-mapping h4 {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mapping-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-lighter);
  border-radius: var(--border-radius-md);
  background: var(--color-bg-secondary);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.role-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.assignees-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.assignee-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg-primary);
  border-radius: var(--border-radius-sm);
  font-size: 0.9em;
}

.assignee-id {
  font-family: monospace;
  color: var(--color-text-primary);
}

.assignee-type {
  color: var(--color-text-secondary);
}

.more-assignees {
  color: var(--color-text-tertiary);
  font-size: 0.85em;
  font-style: italic;
}

/* 自定義標識符樣式 */
.custom-identifier {
  margin-top: var(--spacing-md);
}

.identifier-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.identifier-value {
  font-family: monospace;
  font-size: 1.2em;
  font-weight: 500;
  color: var(--color-text-primary);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-sm);
  text-align: center;
}

.identifier-value.next {
  color: var(--color-success);
  background: var(--color-success-light);
  border: 1px solid var(--color-success);
}

.identifier-actions {
  text-align: center;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .permission-grid,
  .types-summary,
  .attributes-summary,
  .workflow-info,
  .identifier-info {
    grid-template-columns: 1fr;
  }
  
  .type-details {
    grid-template-columns: 1fr;
  }
  
  .type-header,
  .attribute-header,
  .role-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>
