<template>
  <div class="issue-metadata-panel">
    <!-- 标签页导航 -->
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 议题类型标签页 -->
      <el-tab-pane :label="t('issues.metadata.issueTypes')" name="types">
        <template #label>
          <span class="tab-label">
            <el-icon><Collection /></el-icon>
            {{ t('issues.metadata.issueTypes') }} ({{ issueTypes.length }})
          </span>
        </template>
        
        <div class="tab-content">
          <!-- 加载状态 -->
          <el-skeleton v-if="loadingTypes" :rows="3" animated />
          
          <!-- 错误状态 -->
          <el-alert
            v-else-if="typesError"
            :title="typesError"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;">
            <template #default>
              <el-button @click="loadIssueTypes" size="small" type="primary">{{ t('common.retry') }}</el-button>
            </template>
          </el-alert>
          
          <!-- 议题类型列表 -->
          <div v-else-if="issueTypes.length > 0" class="types-list">
            <el-card 
              v-for="type in issueTypes" 
              :key="type.id"
              shadow="hover"
              class="type-card">
              <div class="type-header">
                <div class="type-title">
                  <el-icon class="type-icon"><Folder /></el-icon>
                  <span class="type-name">{{ type.title }}</span>
                </div>
                <el-tag :type="type.isActive ? 'success' : 'info'" size="small">
                  {{ type.isActive ? t('issues.metadata.enabled') : t('issues.metadata.disabled') }}
                </el-tag>
              </div>
              
              <!-- 子类型 -->
              <div v-if="type.subtypes && type.subtypes.length > 0" class="subtypes">
                <div class="subtypes-title">{{ t('issues.metadata.subtypes') }}:</div>
                <div class="subtypes-list">
                  <el-tag 
                    v-for="subtype in type.subtypes" 
                    :key="subtype.id"
                    :type="subtype.isActive ? 'primary' : 'info'"
                    size="small"
                    class="subtype-tag">
                    {{ subtype.title }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 类型ID -->
              <div class="type-id">
                <code>{{ type.id }}</code>
              </div>
            </el-card>
          </div>
          
          <!-- 空状态 -->
          <el-empty v-else :description="t('issues.metadata.noIssueTypes')" :image-size="80" />
        </div>
      </el-tab-pane>
      
      <!-- 自定义属性标签页 -->
      <el-tab-pane :label="t('issues.metadata.customAttributes')" name="attributes">
        <template #label>
          <span class="tab-label">
            <el-icon><Setting /></el-icon>
            {{ t('issues.metadata.customAttributes') }} ({{ attributeDefinitions.length }})
          </span>
        </template>
        
        <div class="tab-content">
          <!-- 加载状态 -->
          <el-skeleton v-if="loadingAttributes" :rows="3" animated />
          
          <!-- 错误状态 -->
          <el-alert
            v-else-if="attributesError"
            :title="attributesError"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;">
            <template #default>
              <el-button @click="loadAttributeDefinitions" size="small" type="primary">{{ t('common.retry') }}</el-button>
            </template>
          </el-alert>
          
          <!-- 自定义属性列表 -->
          <div v-else-if="attributeDefinitions.length > 0" class="attributes-list">
            <el-card 
              v-for="attr in attributeDefinitions" 
              :key="attr.id"
              shadow="hover"
              class="attribute-card">
              <div class="attribute-header">
                <div class="attribute-title">
                  <el-icon class="attribute-icon"><Tickets /></el-icon>
                  <span class="attribute-name">{{ attr.title }}</span>
                </div>
                <el-tag :type="getDataTypeColor(attr.dataType)" size="small">
                  {{ getDataTypeLabel(attr.dataType) }}
                </el-tag>
              </div>
              
              <!-- 描述 -->
              <div v-if="attr.description" class="attribute-description">
                {{ attr.description }}
              </div>
              
              <!-- 列表选项 -->
              <div v-if="attr.dataType === 'list' && attr.metadata?.list?.options" class="attribute-options">
                <div class="options-title">{{ t('issues.metadata.optionsTitle') }}:</div>
                <div class="options-list">
                  <el-tag 
                    v-for="option in attr.metadata.list.options" 
                    :key="option.id"
                    type="info"
                    size="small"
                    class="option-tag">
                    {{ option.value }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 属性ID -->
              <div class="attribute-id">
                <code>{{ attr.id }}</code>
              </div>
            </el-card>
          </div>
          
          <!-- 空状态 -->
          <el-empty v-else :description="t('issues.metadata.noCustomAttributes')" :image-size="80" />
        </div>
      </el-tab-pane>
      
      <!-- 根本原因标签页 -->
      <el-tab-pane :label="t('issues.metadata.rootCauses')" name="rootCauses">
        <template #label>
          <span class="tab-label">
            <el-icon><Warning /></el-icon>
            {{ t('issues.metadata.rootCauses') }} ({{ rootCauseCategories.length }})
          </span>
        </template>
        
        <div class="tab-content">
          <!-- 加载状态 -->
          <el-skeleton v-if="loadingRootCauses" :rows="3" animated />
          
          <!-- 错误状态 -->
          <el-alert
            v-else-if="rootCausesError"
            :title="rootCausesError"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;">
            <template #default>
              <el-button @click="loadRootCauseCategories" size="small" type="primary">{{ t('common.retry') }}</el-button>
            </template>
          </el-alert>
          
          <!-- 根本原因列表 -->
          <div v-else-if="rootCauseCategories.length > 0" class="root-causes-list">
            <el-card 
              v-for="category in rootCauseCategories" 
              :key="category.id"
              shadow="hover"
              class="root-cause-card">
              <div class="root-cause-header">
                <div class="root-cause-title">
                  <el-icon class="root-cause-icon"><Flag /></el-icon>
                  <span class="root-cause-name">{{ category.title }}</span>
                </div>
                <el-tag :type="category.isActive ? 'success' : 'info'" size="small">
                  {{ category.isActive ? t('issues.metadata.enabled') : t('issues.metadata.disabled') }}
                </el-tag>
              </div>
              
              <!-- 根本原因详情 -->
              <div v-if="category.rootCauses && category.rootCauses.length > 0" class="root-causes">
                <div class="root-causes-title">{{ t('issues.metadata.specificCauses') }}:</div>
                <div class="root-causes-items">
                  <el-tag 
                    v-for="cause in category.rootCauses" 
                    :key="cause.id"
                    :type="cause.isActive ? 'warning' : 'info'"
                    size="small"
                    class="root-cause-item">
                    {{ cause.title }}
                  </el-tag>
                </div>
              </div>
              
              <!-- 分类ID -->
              <div class="root-cause-id">
                <code>{{ category.id }}</code>
              </div>
            </el-card>
          </div>
          
          <!-- 空状态 -->
          <el-empty v-else :description="t('issues.metadata.noRootCauses')" :image-size="80" />
        </div>
      </el-tab-pane>
      
      <!-- 用户权限标签页 -->
      <el-tab-pane :label="t('issues.metadata.userPermissions')" name="userProfile">
        <template #label>
          <span class="tab-label">
            <el-icon><User /></el-icon>
            {{ t('issues.metadata.userPermissions') }}
          </span>
        </template>
        
        <div class="tab-content">
          <!-- 加载状态 -->
          <el-skeleton v-if="loadingUserProfile" :rows="3" animated />
          
          <!-- 错误状态 -->
          <el-alert
            v-else-if="userProfileError"
            :title="userProfileError"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 16px;">
            <template #default>
              <el-button @click="loadUserProfile" size="small" type="primary">{{ t('common.retry') }}</el-button>
            </template>
          </el-alert>
          
          <!-- 用户权限信息 -->
          <div v-else-if="userProfile" class="user-profile">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="t('issues.metadata.userId')">
                <code>{{ userProfile.id }}</code>
              </el-descriptions-item>
              <el-descriptions-item :label="t('issues.metadata.projectAdmin')">
                <el-tag :type="userProfile.isProjectAdmin ? 'success' : 'info'" size="small">
                  {{ userProfile.isProjectAdmin ? t('issues.metadata.yes') : t('issues.metadata.no') }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="t('issues.metadata.permissionLevel')">
                <div class="permission-levels">
                  <el-tag 
                    v-for="level in userProfile.permissionLevels" 
                    :key="level"
                    type="primary"
                    size="small"
                    class="permission-tag">
                    {{ getPermissionLabel(level) }}
                  </el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item :label="t('issues.metadata.allowedActions')" v-if="userProfile.issues?.new?.permittedActions">
                <div class="permitted-actions">
                  <el-tag 
                    v-for="action in userProfile.issues.new.permittedActions" 
                    :key="action"
                    type="success"
                    size="small"
                    class="action-tag">
                    {{ action }}
                  </el-tag>
                </div>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <!-- 空状态 -->
          <el-empty v-else :description="t('issues.metadata.noUserPermissions')" :image-size="80" />
        </div>
      </el-tab-pane>
    </el-tabs>
    
    <!-- 刷新按钮 -->
    <div class="panel-actions">
      <el-button @click="refreshAll" :loading="isAnyLoading" type="primary">
        <el-icon><Refresh /></el-icon>
        刷新全部
      </el-button>
      <el-button @click="exportAll" type="default">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

// 图标导入
import {
  Collection,
  Setting,
  Warning,
  User,
  Folder,
  Tickets,
  Flag,
  Refresh,
  Download
} from '@element-plus/icons-vue'

export default {
  name: 'IssueMetadataPanel',
  props: {
    projectId: {
      type: String,
      required: true
    },
    autoLoad: {
      type: Boolean,
      default: true
    }
  },
  emits: ['data-loaded', 'data-error'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 响应式数据
    const activeTab = ref('types')
    
    // 议题类型
    const issueTypes = ref([])
    const loadingTypes = ref(false)
    const typesError = ref('')
    
    // 自定义属性
    const attributeDefinitions = ref([])
    const loadingAttributes = ref(false)
    const attributesError = ref('')
    
    // 根本原因
    const rootCauseCategories = ref([])
    const loadingRootCauses = ref(false)
    const rootCausesError = ref('')
    
    // 用户权限
    const userProfile = ref(null)
    const loadingUserProfile = ref(false)
    const userProfileError = ref('')
    
    // 计算属性
    const isAnyLoading = computed(() => {
      return loadingTypes.value || loadingAttributes.value || 
             loadingRootCauses.value || loadingUserProfile.value
    })
    
    // 加载议题类型
    const loadIssueTypes = async () => {
      if (!props.projectId) {
        typesError.value = '缺少项目ID'
        return
      }
      
      loadingTypes.value = true
      typesError.value = ''
      
      try {
        console.log('加载议题类型...')
        
        const response = await axios.get(
          `/api/issues/projects/${props.projectId}/issue-types`,
          {
            timeout: 15000,
            params: {
              includeSubtypes: 'true',
              limit: 100
            }
          }
        )
        
        if (response.data.status === 'success') {
          issueTypes.value = response.data.data.results || []
          console.log(`议题类型加载成功: ${issueTypes.value.length} 个`)
          ElMessage.success(`加载了 ${issueTypes.value.length} 个议题类型`)
        } else {
          throw new Error(response.data.error || '加载议题类型失败')
        }
      } catch (err) {
        console.error('加载议题类型失败:', err)
        typesError.value = err.response?.data?.error || err.message || '加载议题类型失败'
        ElMessage.error(typesError.value)
      } finally {
        loadingTypes.value = false
      }
    }
    
    // 加载自定义属性定义
    const loadAttributeDefinitions = async () => {
      if (!props.projectId) {
        attributesError.value = '缺少项目ID'
        return
      }
      
      loadingAttributes.value = true
      attributesError.value = ''
      
      try {
        console.log('加载自定义属性定义...')
        
        const response = await axios.get(
          `/api/issues/projects/${props.projectId}/attribute-definitions`,
          {
            timeout: 15000,
            params: {
              limit: 200
            }
          }
        )
        
        if (response.data.status === 'success') {
          attributeDefinitions.value = response.data.data.results || []
          console.log(`自定义属性加载成功: ${attributeDefinitions.value.length} 个`)
          ElMessage.success(`加载了 ${attributeDefinitions.value.length} 个自定义属性`)
        } else {
          throw new Error(response.data.error || '加载自定义属性失败')
        }
      } catch (err) {
        console.error('加载自定义属性失败:', err)
        attributesError.value = err.response?.data?.error || err.message || '加载自定义属性失败'
        ElMessage.error(attributesError.value)
      } finally {
        loadingAttributes.value = false
      }
    }
    
    // 加载根本原因类别
    const loadRootCauseCategories = async () => {
      if (!props.projectId) {
        rootCausesError.value = '缺少项目ID'
        return
      }
      
      loadingRootCauses.value = true
      rootCausesError.value = ''
      
      try {
        console.log('加载根本原因类别...')
        
        const response = await axios.get(
          `/api/issues/projects/${props.projectId}/root-cause-categories`,
          {
            timeout: 15000,
            params: {
              includeRootCauses: 'true',
              limit: 100
            }
          }
        )
        
        if (response.data.status === 'success') {
          rootCauseCategories.value = response.data.data.results || []
          console.log(`根本原因类别加载成功: ${rootCauseCategories.value.length} 个`)
          ElMessage.success(`加载了 ${rootCauseCategories.value.length} 个根本原因类别`)
        } else {
          throw new Error(response.data.error || '加载根本原因类别失败')
        }
      } catch (err) {
        console.error('加载根本原因类别失败:', err)
        rootCausesError.value = err.response?.data?.error || err.message || '加载根本原因类别失败'
        ElMessage.error(rootCausesError.value)
      } finally {
        loadingRootCauses.value = false
      }
    }
    
    // 加载用户权限
    const loadUserProfile = async () => {
      if (!props.projectId) {
        userProfileError.value = '缺少项目ID'
        return
      }
      
      loadingUserProfile.value = true
      userProfileError.value = ''
      
      try {
        console.log('加载用户权限...')
        
        const response = await axios.get(
          `/api/issues/projects/${props.projectId}/user-profile`,
          {
            timeout: 15000
          }
        )
        
        if (response.data.status === 'success') {
          userProfile.value = response.data.data
          console.log('用户权限加载成功')
          ElMessage.success('用户权限加载成功')
        } else {
          throw new Error(response.data.error || '加载用户权限失败')
        }
      } catch (err) {
        console.error('加载用户权限失败:', err)
        userProfileError.value = err.response?.data?.error || err.message || '加载用户权限失败'
        ElMessage.error(userProfileError.value)
      } finally {
        loadingUserProfile.value = false
      }
    }
    
    // 刷新全部数据
    const refreshAll = async () => {
      await Promise.all([
        loadIssueTypes(),
        loadAttributeDefinitions(),
        loadRootCauseCategories(),
        loadUserProfile()
      ])
      
      emit('data-loaded', {
        issueTypes: issueTypes.value,
        attributeDefinitions: attributeDefinitions.value,
        rootCauseCategories: rootCauseCategories.value,
        userProfile: userProfile.value
      })
    }
    
    // 导出全部数据
    const exportAll = () => {
      try {
        const data = {
          issueTypes: issueTypes.value,
          attributeDefinitions: attributeDefinitions.value,
          rootCauseCategories: rootCauseCategories.value,
          userProfile: userProfile.value,
          exportedAt: new Date().toISOString(),
          projectId: props.projectId
        }
        
        const dataStr = JSON.stringify(data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `issue-metadata-${props.projectId}-${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        ElMessage.success(t('issues.metadata.exportSuccess'))
      } catch (err) {
        console.error('导出失败:', err)
        ElMessage.error(t('issues.metadata.exportFailed'))
      }
    }
    
    // 工具函数
    const getDataTypeColor = (dataType) => {
      const colorMap = {
        'list': 'primary',
        'text': 'success',
        'paragraph': 'info',
        'numeric': 'warning'
      }
      return colorMap[dataType] || 'default'
    }
    
    const getDataTypeLabel = (dataType) => {
      const translationKey = `issues.metadata.dataTypes.${dataType}`
      return t(translationKey, dataType)
    }
    
    const getPermissionLabel = (permission) => {
      const translationKey = `issues.metadata.permissions.${permission}`
      return t(translationKey, permission)
    }
    
    // 监听项目ID变化
    watch(() => props.projectId, (newId) => {
      if (newId && props.autoLoad) {
        refreshAll()
      }
    })
    
    // 组件挂载时自动加载
    onMounted(() => {
      if (props.autoLoad && props.projectId) {
        refreshAll()
      }
    })
    
    return {
      // i18n
      t,
      
      // 响应式数据
      activeTab,
      issueTypes,
      loadingTypes,
      typesError,
      attributeDefinitions,
      loadingAttributes,
      attributesError,
      rootCauseCategories,
      loadingRootCauses,
      rootCausesError,
      userProfile,
      loadingUserProfile,
      userProfileError,
      isAnyLoading,
      
      // 图标
      Collection,
      Setting,
      Warning,
      User,
      Folder,
      Tickets,
      Flag,
      Refresh,
      Download,
      
      // 方法
      loadIssueTypes,
      loadAttributeDefinitions,
      loadRootCauseCategories,
      loadUserProfile,
      refreshAll,
      exportAll,
      getDataTypeColor,
      getDataTypeLabel,
      getPermissionLabel
    }
  }
}
</script>

<style scoped>
.issue-metadata-panel {
  padding: 0;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-content {
  padding: 16px;
  min-height: 300px;
}

/* 类型列表 */
.types-list,
.attributes-list,
.root-causes-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.type-card,
.attribute-card,
.root-cause-card {
  transition: all 0.3s ease;
}

.type-card:hover,
.attribute-card:hover,
.root-cause-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.type-header,
.attribute-header,
.root-cause-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-title,
.attribute-title,
.root-cause-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon,
.attribute-icon,
.root-cause-icon {
  font-size: 20px;
  color: #409eff;
}

.type-name,
.attribute-name,
.root-cause-name {
  font-weight: 600;
  font-size: 15px;
  color: #2c3e50;
}

.type-id,
.attribute-id,
.root-cause-id {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #6c757d;
}

/* 子类型 */
.subtypes,
.root-causes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e9ecef;
}

.subtypes-title,
.root-causes-title {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
}

.subtypes-list,
.root-causes-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.subtype-tag,
.root-cause-item {
  cursor: default;
}

/* 属性描述 */
.attribute-description {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
  color: #495057;
  line-height: 1.5;
}

/* 属性选项 */
.attribute-options {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e9ecef;
}

.options-title {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 8px;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-tag {
  cursor: default;
}

/* 用户权限 */
.user-profile {
  padding: 0;
}

.permission-levels,
.permitted-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.permission-tag,
.action-tag {
  cursor: default;
}

/* 面板操作 */
.panel-actions {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .types-list,
  .attributes-list,
  .root-causes-list {
    grid-template-columns: 1fr;
  }
  
  .panel-actions {
    flex-direction: column;
  }
  
  .panel-actions .el-button {
    width: 100%;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-tabs--border-card) {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #495057;
}
</style>

