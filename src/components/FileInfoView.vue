<template>
  <div class="file-info-view">
    <!-- 文件信息头部 -->
    <div class="info-header">
      <span>File Information</span>
    </div>
    
    <!-- 文件信息表格 -->
    <el-descriptions :column="2" border class="file-descriptions">
      <!-- basicInfo -->
      <el-descriptions-item label="Display Name">
        <span>{{ attributes.displayName }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="Version">
        <span>{{ attributes.versionNumber || 1 }}</span>
      </el-descriptions-item>
      
      <!-- 文件大小信息 -->
      <el-descriptions-item label="File Size">
        <span>{{ formatFileSize(attributes.fileSize) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="Storage Size">
        <span>{{ formatFileSize(attributes.storageSize) }}</span>
      </el-descriptions-item>
      
      <!-- Review State -->
      <el-descriptions-item v-if="getReviewState()" label="Review State">
        <span>{{ translateReviewState(getReviewState()) }}</span>
      </el-descriptions-item>
      
      <!-- 时间信息 -->
      <el-descriptions-item label="Created Time">
        <span>{{ formatDateTime(attributes.createTime) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="Modified Time">
        <span>{{ formatDateTime(attributes.lastModifiedTime) }}</span>
      </el-descriptions-item>
      
      <!-- 用户信息 -->
      <el-descriptions-item label="Creator">
        <div class="user-info">
          <div class="user-name">{{ getUserDisplayName(attributes.createUserName, attributes.createUserId) }}</div>
          <div class="user-id" v-if="attributes.createUserId">ID: {{ attributes.createUserId }}</div>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="Modifier">
        <div class="user-info">
          <div class="user-name">{{ getUserDisplayName(attributes.lastModifiedUserName, attributes.lastModifiedUserId) }}</div>
          <div class="user-id" v-if="attributes.lastModifiedUserId">ID: {{ attributes.lastModifiedUserId }}</div>
        </div>
      </el-descriptions-item>
      
      <!-- 扩展信息 -->
      <el-descriptions-item v-if="attributes.extension" label="Extension Type">
        <span>{{ attributes.extension.type }}</span>
      </el-descriptions-item>
      <el-descriptions-item v-if="attributes.extension" label="Extension Version">
        <span>{{ attributes.extension.version }}</span>
      </el-descriptions-item>
      
      <!-- Source File Name -->
      <el-descriptions-item v-if="attributes.extension?.data?.sourceFileName" label="Source File Name" :span="2">
        <span>{{ attributes.extension.data.sourceFileName }}</span>
      </el-descriptions-item>
      
      
      <!-- Download Link -->
      <el-descriptions-item v-if="attributes.downloadUrl" label="Download Link" :span="2">
        <el-link :href="attributes.downloadUrl" target="_blank">
          {{ attributes.downloadUrl }}
        </el-link>
      </el-descriptions-item>
    </el-descriptions>

    <!-- 处理状态信息 - 移除此部分，因为通常不需要显示处理状态 -->
    <!-- 
    <div v-if="hasProcessingInfo" class="processing-section">
      <div class="section-title">
        <el-icon><Setting /></el-icon>
        <span>处理状态</span>
      </div>
      <div class="processing-badges">
        <el-tag 
          v-if="processingInfo.processState"
          :type="getProcessingStatusType(processingInfo.processState)"
          size="small"
        >
          <el-icon><Tools /></el-icon>
          处理: {{ translateProcessingState(processingInfo.processState) }}
        </el-tag>
        <el-tag 
          v-if="processingInfo.extractionState"
          :type="getProcessingStatusType(processingInfo.extractionState)"
          size="small"
        >
          <el-icon><FolderOpened /></el-icon>
          提取: {{ translateExtractionState(processingInfo.extractionState) }}
        </el-tag>
        <el-tag 
          v-if="processingInfo.reviewState"
          :type="getProcessingStatusType(processingInfo.reviewState)"
          size="small"
        >
          <el-icon><View /></el-icon>
          审查: {{ translateReviewState(processingInfo.reviewState) }}
        </el-tag>
      </div>
    </div>
    -->

    <!-- Custom Attributes Information - Integrated into File Information -->
    <div v-if="showCustomAttributes && shouldShowCustomAttributesSection" class="custom-attributes-integrated">
      <div class="section-divider">
        <el-icon><Management /></el-icon>
        <span>Custom Attributes</span>
      </div>
      
      <!-- Show attribute list when custom attributes exist -->
      <el-descriptions v-if="hasCustomAttributes" :column="2" border class="custom-attributes-descriptions">
        <el-descriptions-item 
          v-for="(attr, attrId) in attributes.customAttributes" 
          :key="attrId"
          :label="attr.name"
          :label-class-name="'custom-attr-label'"
        >
          <div class="custom-attr-value">
            <span class="attr-value-text">{{ attr.displayValue || attr.value || '未设置' }}</span>
            <el-tag 
              :type="getAttributeTagType(attr.type)" 
              size="small" 
              class="attr-type-tag"
              effect="light"
            >
              {{ getAttributeTypeLabel(attr.type) }}
            </el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      
      <!-- Show message when no custom attributes exist -->
      <div v-else class="no-custom-attributes-inline">
        <el-empty
          :description="getNoCustomAttributesMessage()"
          :image-size="60"
        >
          <template #image>
            <el-icon size="60" color="#C0C4CC">
              <Management />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </div>

    <!-- Folder Custom Attribute Definitions (if exist) -->
    <div v-if="showCustomAttributes && hasCustomAttributeDefinitions" class="folder-custom-attributes-section">
      <div class="section-title">
        <el-icon><Setting /></el-icon>
        <span>Folder Custom Attribute Definitions</span>
        <el-button 
          size="small" 
          text 
          type="primary"
          @click="toggleCustomAttributes"
        >
          {{ customAttributesExpanded ? 'Collapse' : 'Expand' }}
        </el-button>
      </div>
      
      <el-collapse-transition>
        <div v-show="customAttributesExpanded" class="custom-attributes-content">
          <div class="definitions-header">
            <el-icon><Setting /></el-icon>
            <span>This folder has {{ attributes.totalCustomAttributeDefinitions || Object.keys(attributes.customAttributeDefinitions || {}).length }} custom attribute definitions configured</span>
          </div>
          
          <div class="custom-attributes-grid">
            <div 
              v-for="(def, defId) in attributes.customAttributeDefinitions" 
              :key="defId"
              class="custom-attribute-item definition-item"
            >
              <div class="attribute-header">
                <span class="attribute-name">{{ def.displayName || def.name }}</span>
                <div class="attribute-tags">
                  <el-tag 
                    :type="getAttributeTagType(def.type)" 
                    size="small" 
                    class="attribute-type-tag"
                    effect="light"
                  >
                    {{ getAttributeTypeLabel(def.type) }}
                  </el-tag>
                  <el-tag 
                    v-if="def.required" 
                    type="danger" 
                    size="small" 
                    effect="light"
                  >
                    Required
                  </el-tag>
                </div>
              </div>
              
              <div class="attribute-definition-content">
                <div v-if="def.description" class="attribute-description">
                  {{ def.description }}
                </div>
                
                <div v-if="def.arrayValues && def.arrayValues.length > 0" class="attribute-options">
                  <span class="options-label">Options:</span>
                  <el-tag 
                    v-for="option in def.arrayValues" 
                    :key="option"
                    size="small"
                    class="option-tag"
                  >
                    {{ option }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-collapse-transition>
    </div>


  </div>
</template>

<script>
import { computed, ref } from 'vue'
import axios from 'axios'
import { 
  Document, 
  Clock, 
  User, 
  Download, 
  Setting, 
  Tools, 
  FolderOpened, 
  View,
  Management,
  InfoFilled,
  Loading
} from '@element-plus/icons-vue'
import JsonViewer from './JsonViewer.vue'

export default {
  name: 'FileInfoView',
  components: {
    Document,
    Clock,
    User,
    Download,
    Setting,
    Tools,
    FolderOpened,
    View,
    Management,
    InfoFilled,
    Loading,
    JsonViewer
  },
  props: {
    attributes: {
      type: Object,
      required: true
    },
    projectId: {
      type: String,
      default: ''
    },
    parentFolderId: {
      type: String,
      default: ''
    },
    showCustomAttributes: {
      type: Boolean,
      default: true
    }
  },
  emits: ['custom-attributes-loaded'],
  setup(props, { emit }) {
    // 自定义属性相关状态
    const customAttributesExpanded = ref(false)
    const customAttributesData = ref(null)
    const customAttributesLoading = ref(false)

    // 检查是否有自定义属性
    const hasCustomAttributes = computed(() => {
      return props.attributes.hasCustomAttributes && 
             props.attributes.customAttributes && 
             Object.keys(props.attributes.customAttributes).length > 0
    })

    // 检查是否有自定义属性定义（文件夹）
    const hasCustomAttributeDefinitions = computed(() => {
      return props.attributes.hasCustomAttributeDefinitions && 
             props.attributes.customAttributeDefinitions && 
             Object.keys(props.attributes.customAttributeDefinitions).length > 0
    })

    // 是否应该显示自定义属性区域
    const shouldShowCustomAttributesSection = computed(() => {
      // 如果showCustomAttributes为true，总是显示自定义属性区域
      if (props.showCustomAttributes) {
        return true
      }
      // 如果有任何自定义属性相关的字段，都显示这个区域
      return props.attributes.hasCustomAttributes !== undefined || 
             props.attributes.hasCustomAttributeDefinitions !== undefined ||
             props.attributes.customAttributes !== undefined ||
             props.attributes.customAttributeDefinitions !== undefined
    })

    // 获取区域标题
    const getSectionTitle = () => {
      if (hasCustomAttributes.value && hasCustomAttributeDefinitions.value) {
        return 'Custom Attributes Information'
      } else if (hasCustomAttributes.value) {
        return 'Custom Attribute Values'
      } else if (hasCustomAttributeDefinitions.value) {
        return 'Custom Attribute Definitions'
      } else {
        return 'Custom Attributes'
      }
    }

    // 获取无属性时的消息
    const getNoCustomAttributesMessage = () => {
      // 检查是否正在加载自定义属性
      if (customAttributesLoading.value) {
        return 'Loading custom attributes...'
      }
      
      // 检查是否有明确的自定义属性状态
      const hasCustomAttrs = props.attributes.hasCustomAttributes
      const hasCustomAttrDefs = props.attributes.hasCustomAttributeDefinitions
      
      // 如果两个状态都明确为false
      if (hasCustomAttrs === false && hasCustomAttrDefs === false) {
        return 'No custom attributes configured for this project'
      } 
      // 如果只有文件自定义属性为false
      else if (hasCustomAttrs === false) {
        return 'No custom attribute values set for this file'
      } 
      // 如果只有文件夹自定义属性定义为false
      else if (hasCustomAttrDefs === false) {
        return 'No custom attribute definitions configured for this folder'
      }
      // 如果状态未定义，尝试加载自定义属性
      else if (hasCustomAttrs === undefined && hasCustomAttrDefs === undefined) {
        // 触发自定义属性加载
        loadFileCustomAttributes()
        return 'Loading custom attributes...'
      }
      // 其他情况显示检查中
      else {
        return 'Checking custom attributes...'
      }
    }

    // 检查是否有处理信息
    const hasProcessingInfo = computed(() => {
      return props.attributes.extension?.data?.processState ||
             props.attributes.extension?.data?.extractionState ||
             props.attributes.extension?.data?.reviewState
    })

    const processingInfo = computed(() => {
      return props.attributes.extension?.data || {}
    })

    // 切换自定义属性展开状态
    const toggleCustomAttributes = () => {
      customAttributesExpanded.value = !customAttributesExpanded.value
    }

    // 处理自定义属性加载完成
    const handleCustomAttributesLoaded = (data) => {
      customAttributesData.value = data
    }

    // 处理自定义属性加载错误
    const handleCustomAttributesError = (error) => {
      console.error('Custom attributes loading error:', error)
    }

    // 加载文件自定义属性
    const loadFileCustomAttributes = async () => {
      if (customAttributesLoading.value || !props.projectId) {
        return
      }

      // 检查是否有文件版本信息
      const versions = props.attributes.versions
      if (!versions || !Array.isArray(versions) || versions.length === 0) {
        console.log('📝 文件没有版本信息，跳过自定义属性加载')
        return
      }

      customAttributesLoading.value = true

      try {
        // 获取最新版本的ID
        const latestVersion = versions[0] // 假设第一个是最新版本
        let versionId = latestVersion?.id || latestVersion?.urn
        
        // 如果没有找到版本ID，尝试从文件属性中获取
        if (!versionId && props.attributes.id) {
          versionId = props.attributes.id
        }
        
        console.log('📝 版本信息:', { latestVersion, versionId, allVersions: versions })
        
        if (!versionId) {
          console.warn('📝 无法获取文件版本ID，跳过自定义属性加载')
          return
        }

        console.log('📝 开始加载文件自定义属性:', versionId)

        // 调用API获取文件自定义属性
        const response = await axios.post(
          `/api/custom-attributes/projects/${props.projectId}/files/custom-attributes`,
          {
            version_ids: [versionId]
          }
        )

        if (response.data.error) {
          throw new Error(response.data.error)
        }

        const customAttributesData = response.data.results || {}
        const fileCustomAttrs = customAttributesData[versionId]

        if (fileCustomAttrs) {
          // 更新文件属性（这里我们需要通过事件通知父组件更新）
          console.log('✅ 文件自定义属性加载成功:', fileCustomAttrs)
          
          // 发出事件通知父组件更新文件属性
          emit('custom-attributes-loaded', {
            versionId,
            customAttributes: fileCustomAttrs.customAttributes || {},
            hasCustomAttributes: fileCustomAttrs.hasCustomAttributes || false
          })
        } else {
          console.log('📝 文件没有自定义属性')
          emit('custom-attributes-loaded', {
            versionId,
            customAttributes: {},
            hasCustomAttributes: false
          })
        }

      } catch (error) {
        console.error('❌ 加载文件自定义属性失败:', error)
        handleCustomAttributesError(error)
      } finally {
        customAttributesLoading.value = false
      }
    }

    // 获取属性类型标签类型
    const getAttributeTagType = (type) => {
      const typeMap = {
        'string': 'primary',
        'number': 'success',
        'date': 'warning',
        'array': 'info',
        'boolean': 'danger'
      }
      return typeMap[type] || 'default'
    }

    // 获取属性类型标签文本
    const getAttributeTypeLabel = (type) => {
      const typeMap = {
        'string': 'Text',
        'number': 'Number',
        'date': 'Date',
        'array': 'Options',
        'boolean': 'Boolean'
      }
      return typeMap[type] || type
    }

    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // 格式化日期时间
    const formatDateTime = (dateString) => {
      if (!dateString) return '未知'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    // 获取用户显示名称
    const getUserDisplayName = (userName, userId) => {
      if (userName && userName.trim() !== '') {
        return userName
      }
      if (userId && userId.trim() !== '') {
        return `User ${userId.substring(0, 8)}...` // 显示用户ID的前8位
      }
      return '未知用户'
    }

    // 获取处理状态类型
    const getProcessingStatusType = (state) => {
      const statusMap = {
        'PROCESSING_COMPLETE': 'success',
        'SUCCESS': 'success',
        'NOT_IN_REVIEW': 'info',
        'PROCESSING': 'warning',
        'FAILED': 'danger',
        'UNSUPPORTED': 'warning'
      }
      return statusMap[state] || 'info'
    }

    // 翻译处理状态
    const translateProcessingState = (state) => {
      const translations = {
        'PROCESSING_COMPLETE': '处理完成',
        'PROCESSING': '处理中',
        'FAILED': '处理失败',
        'PENDING': '等待处理'
      }
      return translations[state] || state
    }

    // 翻译提取状态
    const translateExtractionState = (state) => {
      const translations = {
        'SUCCESS': '提取成功',
        'FAILED': '提取失败',
        'UNSUPPORTED': '不支持',
        'PROCESSING': '提取中'
      }
      return translations[state] || state
    }

    // 翻译审查状态
    const translateReviewState = (state) => {
      const translations = {
        'NOT_IN_REVIEW': 'Not in Review',
        'IN_REVIEW': 'In Review',
        'REVIEWED': 'Reviewed',
        'PENDING': 'Pending Review',
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected',
        'COMPLETED': 'Completed'
      }
      return translations[state] || state
    }

    // 获取审查状态类型
    const getReviewStateType = (state) => {
      const statusMap = {
        'NOT_IN_REVIEW': 'info',
        'IN_REVIEW': 'warning',
        'REVIEWED': 'success',
        'PENDING': 'warning',
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'COMPLETED': 'success'
      }
      return statusMap[state] || 'info'
    }

    // 获取reviewState - 从版本数据或属性扩展数据中获取
    const getReviewState = () => {
      console.log('🔍 FileInfoView - 检查reviewState数据结构:')
      console.log('props.attributes:', props.attributes)
      console.log('props.attributes.versions:', props.attributes.versions)
      console.log('props.attributes.extension:', props.attributes.extension)
      
      // 首先尝试从版本数据中获取reviewState
      if (props.attributes.versions && props.attributes.versions.length > 0) {
        const latestVersion = props.attributes.versions[0]
        console.log('📄 最新版本数据:', latestVersion)
        console.log('📄 版本扩展数据:', latestVersion.attributes?.extension?.data)
        
        if (latestVersion.attributes?.extension?.data?.reviewState) {
          const reviewState = latestVersion.attributes.extension.data.reviewState
          console.log('✅ 从版本数据中找到reviewState:', reviewState)
          return reviewState
        }
      }
      
      // 其次尝试从属性扩展数据中获取
      if (props.attributes.extension?.data?.reviewState) {
        const reviewState = props.attributes.extension.data.reviewState
        console.log('✅ 从属性扩展数据中找到reviewState:', reviewState)
        return reviewState
      }
      
      console.log('❌ 未找到reviewState数据')
      return null
    }

    return {
      hasProcessingInfo,
      hasCustomAttributes,
      hasCustomAttributeDefinitions,
      shouldShowCustomAttributesSection,
      processingInfo,
      customAttributesExpanded,
      customAttributesData,
      customAttributesLoading,
      formatFileSize,
      formatDateTime,
      getUserDisplayName,
      getProcessingStatusType,
      translateProcessingState,
      translateExtractionState,
      translateReviewState,
      getReviewStateType,
      getReviewState,
      toggleCustomAttributes,
      handleCustomAttributesLoaded,
      handleCustomAttributesError,
      loadFileCustomAttributes,
      getAttributeTagType,
      getAttributeTypeLabel,
      getSectionTitle,
      getNoCustomAttributesMessage
    }
  }
}
</script>

<style scoped>
.file-info-view {
  width: 100%;
}

.info-header {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #E4E7ED;
}

.file-descriptions {
  width: 100%;
  margin-bottom: 16px;
}

.file-descriptions :deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
}

.file-descriptions :deep(.el-descriptions__content) {
  color: #303133;
}




.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: #303133;
}

.user-id {
  font-size: 12px;
  color: #909399;
}


.processing-section {
  margin-top: 16px;
  padding: 12px;
  background: #F0F9FF;
  border-radius: 6px;
  border-left: 4px solid #409EFF;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.processing-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.processing-badges .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 整合的自定义属性样式 */
.custom-attributes-integrated {
  margin-top: 16px;
}

.section-divider {
  display: flex;
  align-items: center;
  margin: 16px 0 12px 0;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  border-bottom: 1px solid #E4E7ED;
  padding-bottom: 8px;
}

.section-divider .el-icon {
  margin-right: 8px;
  color: #409EFF;
}

.custom-attributes-descriptions {
  margin-top: 8px;
}

.custom-attr-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.attr-value-text {
  flex: 1;
  word-break: break-word;
}

.attr-type-tag {
  flex-shrink: 0;
}

/* 文件夹自定义属性区域 */
.folder-custom-attributes-section {
  margin-top: 20px;
  border-top: 1px solid #E4E7ED;
  padding-top: 16px;
}

.custom-attributes-section {
  margin-top: 16px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 6px;
  border-left: 4px solid #67C23A;
}

.no-custom-attributes {
  margin-top: 16px;
}

.no-custom-attributes-inline {
  padding: 20px;
  text-align: center;
  background: #FAFAFA;
  border-radius: 6px;
  border: 1px dashed #E4E7ED;
  margin-top: 8px;
}

.custom-attributes-content {
  margin-top: 12px;
  padding: 8px 0;
}

.custom-attributes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.custom-attribute-item {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}

.custom-attribute-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.attribute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attribute-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.attribute-type-tag {
  flex-shrink: 0;
}

.attribute-value-container {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
}

.attribute-value {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  word-break: break-all;
}

.no-attributes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #909399;
  font-style: italic;
}

.custom-attributes-values {
  margin-bottom: 16px;
}

.values-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #67c23a;
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.custom-attributes-definitions {
  margin-top: 16px;
}

.definitions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.loading-attributes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #409eff;
  font-size: 14px;
}

.definition-item {
  border-left: 3px solid #409eff;
}

.definition-item:hover {
  border-color: #67c23a;
}

.attribute-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

.attribute-definition-content {
  margin-top: 8px;
}

.attribute-description {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.4;
}

.attribute-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.options-label {
  font-size: 12px;
  color: #909399;
  margin-right: 4px;
}

.option-tag {
  font-size: 11px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-descriptions {
    :deep(.el-descriptions__body) {
      .el-descriptions__table {
        .el-descriptions__cell {
          padding: 8px !important;
        }
      }
    }
  }
  
  .processing-badges {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .processing-section {
    background: #1A1A1A;
    border-left-color: #409EFF;
  }
  
  .custom-attributes-section {
    background: #1A1A1A;
    border-left-color: #67C23A;
  }
  
  .custom-attribute-item {
    background: #2D2D2D;
    border-color: #4C4D4F;
  }
  
  .custom-attribute-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  }
  
  .attribute-name {
    color: #E4E7ED;
  }
  
  .attribute-value-container {
    background: #1A1A1A;
    border-left-color: #67c23a;
  }
  
  .attribute-value {
    color: #E4E7ED;
  }
  
  .no-attributes {
    color: #909399;
  }
  
  .definitions-header {
    background: #1a2332;
    border-left-color: #409eff;
    color: #409eff;
  }
  
  .definition-item {
    border-left-color: #409eff;
  }
  
  .definition-item:hover {
    border-left-color: #67c23a;
  }
  
  .attribute-description {
    color: #909399;
  }
  
  .options-label {
    color: #606266;
  }
  
  .source-filename {
    background: #2D2D2D;
    color: #E6A23C;
  }
}
</style>
