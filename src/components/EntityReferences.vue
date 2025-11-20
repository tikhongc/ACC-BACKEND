<template>
  <div class="entity-references">
    <!-- 加载状态 -->
    <div v-if="loadingReferences" class="loading-container">
      <el-skeleton :rows="3" animated />
      <div class="loading-text">{{ t('issueDetail.references.loading') }}</div>
    </div>

    <!-- 参照列表 -->
    <div v-else-if="references && references.length > 0" class="references-container">
      <!-- 统计信息 -->
      <div class="references-stats">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-statistic :title="t('issueDetail.references.totalReferences')" :value="referencesStats.total_references" />
          </el-col>
          <el-col :span="6">
            <el-statistic :title="t('issueDetail.references.documentReferences')" :value="referencesStats.document_references" />
          </el-col>
          <el-col :span="6">
            <el-statistic :title="t('issueDetail.references.fileReferences')" :value="referencesStats.file_references" />
          </el-col>
          <el-col :span="6">
            <el-statistic :title="t('issueDetail.references.otherReferences')" :value="referencesStats.other_references" />
          </el-col>
        </el-row>
      </div>

      <!-- 筛选器 -->
      <div class="references-filter">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-select 
              v-model="referenceFilter" 
              :placeholder="t('issueDetail.references.filterPlaceholder')"
              @change="onReferenceFilterChange"
              style="width: 100%;">
              <el-option :label="t('issueDetail.references.allReferences')" value="all" />
              <el-option-group :label="t('issueDetail.references.filterOptions.byRelationType')">
                <el-option :label="t('issueDetail.references.relationshipTypes.xrefs')" value="xrefs" />
                <el-option :label="t('issueDetail.references.relationshipTypes.includes')" value="includes" />
                <el-option :label="t('issueDetail.references.relationshipTypes.dependencies')" value="dependencies" />
                <el-option :label="t('issueDetail.references.relationshipTypes.auxiliary')" value="auxiliary" />
                <el-option :label="t('issueDetail.references.relationshipTypes.derived')" value="derived" />
              </el-option-group>
              <el-option-group :label="t('issueDetail.references.filterOptions.byEntityCategory')">
                <el-option :label="t('issueDetail.references.entityCategories.document')" value="category:document" />
                <el-option :label="t('issueDetail.references.entityCategories.media')" value="category:media" />
                <el-option :label="t('issueDetail.references.entityCategories.workflow')" value="category:workflow" />
                <el-option :label="t('issueDetail.references.entityCategories.management')" value="category:management" />
              </el-option-group>
              <el-option-group :label="t('issueDetail.references.filterOptions.byTargetType')">
                <el-option :label="t('issueDetail.references.targetTypes.document')" value="entity:document" />
                <el-option :label="t('issueDetail.references.targetTypes.file')" value="entity:file" />
                <el-option :label="t('issueDetail.references.targetTypes.document_package')" value="entity:document_package" />
                <el-option :label="t('issueDetail.references.targetTypes.drawing')" value="entity:drawing" />
                <el-option :label="t('issueDetail.references.targetTypes.photo')" value="entity:photo" />
                <el-option :label="t('issueDetail.references.targetTypes.image')" value="entity:image" />
                <el-option :label="t('issueDetail.references.targetTypes.submittal')" value="entity:submittal" />
                <el-option :label="t('issueDetail.references.targetTypes.issue')" value="entity:issue" />
                <el-option :label="t('issueDetail.references.targetTypes.rfi')" value="entity:rfi" />
                <el-option :label="t('issueDetail.references.targetTypes.correspondence')" value="entity:correspondence" />
                <el-option :label="t('issueDetail.references.targetTypes.schedule_activity')" value="entity:schedule_activity" />
                <el-option :label="t('issueDetail.references.targetTypes.specification')" value="entity:specification" />
                <el-option :label="t('issueDetail.references.targetTypes.asset')" value="entity:asset" />
                <el-option :label="t('issueDetail.references.targetTypes.form')" value="entity:form" />
              </el-option-group>
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              :placeholder="t('issueDetail.references.searchPlaceholder')"
              @input="onSearchChange"
              clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="8">
            <el-button-group>
              <el-button 
                :type="viewMode === 'list' ? 'primary' : 'default'"
                @click="viewMode = 'list'">
                <el-icon><List /></el-icon>
                {{ t('issueDetail.references.viewModes.list') }}
              </el-button>
              <el-button 
                :type="viewMode === 'grid' ? 'primary' : 'default'"
                @click="viewMode = 'grid'">
                <el-icon><Grid /></el-icon>
                {{ t('issueDetail.references.viewModes.grid') }}
              </el-button>
              <el-button 
                :type="viewMode === 'category' ? 'primary' : 'default'"
                @click="viewMode = 'category'">
                <el-icon><Menu /></el-icon>
                {{ t('issueDetail.references.viewModes.category') }}
              </el-button>
            </el-button-group>
          </el-col>
        </el-row>
      </div>

      <!-- 参照列表 - 列表视图 -->
      <div v-if="viewMode === 'list'" class="references-list list-view">
        <el-card 
          v-for="reference in filteredReferences" 
          :key="reference.id" 
          class="reference-item"
          :data-markup-type="reference.markup_info?.type"
          shadow="hover">
          <div class="reference-header">
            <div class="reference-info">
              <div class="reference-title">
                <el-icon class="reference-icon" :style="{ color: getTargetTypeCategoryColor(reference.target_type || reference.target?.type) }">
                  <component :is="getTargetTypeIcon(reference.target_type || reference.target?.type)" />
                </el-icon>
                <span class="reference-name">{{ reference.target?.name || reference.id }}</span>
                <span v-if="reference.target_type || reference.target?.type" class="target-type-info">
                  ({{ reference.target_type || reference.target?.type }})
                </span>
              </div>
              <div class="reference-meta">
                <span v-if="reference.target?.file_size" class="file-size">
                  {{ formatFileSize(reference.target.file_size) }}
                </span>
                <span v-if="reference.target?.created_time" class="created-time">
                  {{ formatDateTime(reference.target.created_time) }}
                </span>
              </div>
            </div>
            
            <div class="reference-actions">
              <!-- 下载按钮 -->
              <el-button 
                v-if="canDownload(reference)"
                :loading="downloadingReferences.has(reference.id)"
                type="primary" 
                size="small"
                @click="downloadReference(reference)">
                <el-icon><Download /></el-icon>
                {{ t('issueDetail.references.actions.download') }}
              </el-button>
              
              <!-- 查看按钮 -->
              <el-button 
                v-if="reference.target?.web_view_url"
                type="default" 
                size="small"
                @click="openReference(reference.target.web_view_url)">
                <el-icon><View /></el-icon>
                {{ t('issueDetail.references.actions.view') }}
              </el-button>
              
              <!-- 详情按钮 -->
              <el-button 
                type="info" 
                size="small"
                @click="showReferenceDetails(reference)">
                <el-icon><InfoFilled /></el-icon>
                {{ t('issueDetail.references.actions.details') }}
              </el-button>
            </div>
          </div>

        </el-card>
      </div>

      <!-- 参照列表 - 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="references-list grid-view">
        <el-row :gutter="16">
          <el-col 
            v-for="reference in filteredReferences" 
            :key="reference.id"
            :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
            <el-card class="reference-grid-item" shadow="hover">
              <div class="grid-item-header">
                <el-icon 
                  class="grid-item-icon" 
                  :style="{ color: getTargetTypeCategoryColor(reference.target_type || reference.target?.type) }">
                  <component :is="getTargetTypeIcon(reference.target_type || reference.target?.type)" />
                </el-icon>
                <el-dropdown trigger="click">
                  <el-icon class="grid-item-menu"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        v-if="canDownload(reference)"
                        @click="downloadReference(reference)">
                        <el-icon><Download /></el-icon>
                        {{ t('issueDetail.references.actions.download') }}
                      </el-dropdown-item>
                      <el-dropdown-item 
                        v-if="reference.target?.web_view_url"
                        @click="openReference(reference.target.web_view_url)">
                        <el-icon><View /></el-icon>
                        {{ t('issueDetail.references.actions.view') }}
                      </el-dropdown-item>
                      <el-dropdown-item @click="showReferenceDetails(reference)">
                        <el-icon><InfoFilled /></el-icon>
                        {{ t('issueDetail.references.actions.details') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="grid-item-content">
                <div class="grid-item-title">
                  {{ reference.target?.name || reference.id }}
                  <span v-if="reference.target_type || reference.target?.type" class="target-type-info">
                    ({{ reference.target_type || reference.target?.type }})
                  </span>
                </div>
                <div class="grid-item-meta">
                  <span v-if="reference.target?.file_size">{{ formatFileSize(reference.target.file_size) }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 参照列表 - 分类视图 -->
      <div v-else-if="viewMode === 'category'" class="references-list category-view">
        <div 
          v-for="(categoryRefs, category) in referencesByCategory" 
          :key="category"
          class="category-section">
          <div class="category-header">
            <el-icon :style="{ color: getCategoryColor(category) }">
              <component :is="getCategoryIcon(category)" />
            </el-icon>
            <span class="category-title">{{ getCategoryDisplayName(category) }}</span>
            <el-badge :value="categoryRefs.length" class="category-count" />
          </div>
          <div class="category-items">
            <el-card 
              v-for="reference in categoryRefs" 
              :key="reference.id" 
              class="category-reference-item"
              shadow="hover">
              <div class="category-item-content">
                <div class="category-item-info">
                  <el-icon class="category-item-icon">
                    <component :is="getTargetTypeIcon(reference.target_type || reference.target?.type)" />
                  </el-icon>
                  <div class="category-item-details">
                    <div class="category-item-name">
                      {{ reference.target?.name || reference.id }}
                      <span v-if="reference.target_type || reference.target?.type" class="target-type-info">
                        ({{ reference.target_type || reference.target?.type }})
                      </span>
                    </div>
                  </div>
                </div>
                <div class="category-item-actions">
                  <el-button-group size="small">
                    <el-button 
                      v-if="canDownload(reference)"
                      :loading="downloadingReferences.has(reference.id)"
                      type="primary" 
                      @click="downloadReference(reference)">
                      <el-icon><Download /></el-icon>
                    </el-button>
                    <el-button 
                      v-if="reference.target?.web_view_url"
                      type="default" 
                      @click="openReference(reference.target.web_view_url)">
                      <el-icon><View /></el-icon>
                    </el-button>
                    <el-button 
                      type="info" 
                      @click="showReferenceDetails(reference)">
                      <el-icon><InfoFilled /></el-icon>
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- 无参照状态 -->
    <div v-else class="no-references">
      <el-empty :description="t('issueDetail.references.noReferences')">
        <el-button type="primary" @click="loadReferences">{{ t('issueDetail.references.reloadReferences') }}</el-button>
      </el-empty>
    </div>

    <!-- 参照详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      :title="t('issueDetail.references.detailDialog.title', { name: selectedReference?.target?.name || selectedReference?.id })"
      width="60%"
      destroy-on-close>
      <div v-if="selectedReference" class="reference-details">
        <!-- basicInfo -->
        <div class="basic-info">
          <el-descriptions :title="t('issueDetail.references.detailDialog.basicInfo')" :column="2" border>
            <el-descriptions-item :label="t('issueDetail.references.detailDialog.referenceId')">
              {{ selectedReference.id }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('issueDetail.references.detailDialog.targetName')">
              {{ selectedReference.target?.name || t('issueDetail.references.detailDialog.unknown') }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('issueDetail.references.detailDialog.fileSize')" v-if="selectedReference.target?.file_size">
              {{ formatFileSize(selectedReference.target.file_size) }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('issueDetail.references.detailDialog.createdTime')" v-if="selectedReference.target?.created_time">
              {{ formatDateTime(selectedReference.target.created_time) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 原始数据 -->
        <div class="raw-reference-data">
          <el-collapse>
            <el-collapse-item :title="t('issueDetail.references.detailDialog.rawData')" name="raw">
              <JsonViewer
                :data="selectedReference"
                :title="t('issueDetail.references.detailDialog.rawDataTitle')"
                :description="t('issueDetail.references.detailDialog.rawDataDesc')"
                :show-copy="true"
                :collapsible="true"
                :collapsed="false" />
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailsDialog = false">{{ t('issueDetail.references.actions.close') }}</el-button>
          <el-button 
            v-if="selectedReference?.target?.web_view_url"
            type="primary" 
            @click="openReference(selectedReference.target.web_view_url)">
            {{ t('issueDetail.references.actions.viewInACC') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 调试信息 -->
    <div v-if="referencesRawData && showDebugInfo" class="debug-section" style="margin-top: 24px;">
      <el-collapse>
        <el-collapse-item :title="t('issueDetail.references.debugInfo')" name="debug">
          <JsonViewer
            :data="referencesRawData"
            :title="t('issueDetail.references.apiResponse')"
            :description="t('issueDetail.references.debugDescription')"
            :show-copy="true"
            :collapsible="true"
            :collapsed="false" />
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 参照数据JSON viewer -->
    <JsonViewer
      v-if="references && showJsonViewer"
      :data="references"
      :title="t('issueDetail.references.jsonTitle')"
      :description="t('issueDetail.references.jsonDescription', { entityType: entityTypeDisplayName })"
      :show-copy="true"
      :show-download="true"
      :collapsible="true"
      :collapsed="true"
      style="margin-top: 24px;" />
  </div>
</template>

<script>
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Download, View, InfoFilled, Search, List, Grid, Menu, MoreFilled } from '@element-plus/icons-vue'
import JsonViewer from './JsonViewer.vue'

export default {
  name: 'EntityReferences',
  components: {
    JsonViewer,
    Download,
    View,
    InfoFilled,
    Search,
    List,
    Grid,
    Menu,
    MoreFilled
  },
  props: {
    // 实体信息
    entity: {
      type: Object,
      required: true
    },
    // 项目信息
    project: {
      type: Object,
      required: true
    },
    // 实体类型 (rfi, issue, submittal, etc.)
    entityType: {
      type: String,
      required: true,
      validator: (value) => ['rfi', 'issue', 'submittal', 'document', 'drawing'].includes(value)
    },
    // 是否自动加载
    autoLoad: {
      type: Boolean,
      default: true
    },
    // 是否显示调试信息
    showDebugInfo: {
      type: Boolean,
      default: false
    },
    // 是否显示JSON查看器
    showJsonViewer: {
      type: Boolean,
      default: false
    },
    // 支持的参照类型
    supportedReferenceTypes: {
      type: Array,
      default: () => ['document', 'file', 'auxiliary']
    }
  },
  setup() {
    const { t } = useI18n()
    return { t }
  },
  data() {
    return {
      references: null,
      referencesRawData: null,
      loadingReferences: false,
      referenceFilter: 'all',
      searchKeyword: '',
      viewMode: 'list', // 'list', 'grid', 'category'
      showDetailsDialog: false,
      selectedReference: null,
      downloadingReferences: new Set(),
      entityCategories: null,
      entityTypes: null
    }
  },
  computed: {
    // 实体类型显示名称
    entityTypeDisplayName() {
      const typeMap = {
        'rfi': 'RFI',
        'issue': '问题',
        'submittal': '提交资料',
        'document': '文档',
        'drawing': '图纸'
      }
      return typeMap[this.entityType] || this.entityType.toUpperCase()
    },

    // 参照统计
    referencesStats() {
      if (!this.references) return {}
      
      // 使用过滤后的引用来计算统计信息
      const filteredRefs = this.references.filter(ref => {
        const targetType = ref.target_type || ref.target?.type || ''
        return targetType.toLowerCase() !== 'markupdocument' && targetType.toLowerCase() !== 'markup'
      })
      
      const stats = {
        total_references: filteredRefs.length,
        document_references: 0,
        file_references: 0,
        other_references: 0
      }
      
      filteredRefs.forEach(ref => {
        if (ref.ref_type === 'xrefs' || ref.ref_type === 'includes') {
          if (ref.target?.file_type) {
            stats.file_references++
          } else {
            stats.document_references++
          }
        } else {
          stats.other_references++
        }
      })
      
      return stats
    },
    
    // 根据筛选条件过滤参照
    filteredReferences() {
      if (!this.references) return []
      
      let filtered = [...this.references]
      
      // 过滤掉 MARKUPDOCUMENT 和 markup 类型的引用
      filtered = filtered.filter(ref => {
        const targetType = ref.target_type || ref.target?.type || ''
        return targetType.toLowerCase() !== 'markupdocument' && targetType.toLowerCase() !== 'markup'
      })
      
      // 按筛选条件过滤
      if (this.referenceFilter !== 'all') {
        if (this.referenceFilter.startsWith('category:')) {
          const category = this.referenceFilter.replace('category:', '')
          filtered = filtered.filter(ref => {
            const targetType = ref.target_type || ref.target?.type || 'other'
            return this.getTargetTypeCategory(targetType) === category
          })
        } else if (this.referenceFilter.startsWith('entity:')) {
          const entityType = this.referenceFilter.replace('entity:', '')
          filtered = filtered.filter(ref => {
            const targetType = ref.target_type || ref.target?.type || 'other'
            return targetType === entityType
          })
        } else {
          // 按关系类型过滤
          filtered = filtered.filter(ref => ref.ref_type === this.referenceFilter)
        }
      }
      
      // 按搜索关键词过滤
      if (this.searchKeyword) {
        const keyword = this.searchKeyword.toLowerCase()
        filtered = filtered.filter(ref => {
          const name = (ref.target?.name || ref.id || '').toLowerCase()
          const targetType = (ref.target_type || ref.target?.type || '').toLowerCase()
          const description = (ref.target?.description || '').toLowerCase()
          return name.includes(keyword) || targetType.includes(keyword) || description.includes(keyword)
        })
      }
      
      return filtered
    },

    // 按分类分组的参照
    referencesByCategory() {
      const grouped = {}
      
      this.filteredReferences.forEach(ref => {
        // 使用target_type来确定分类
        const targetType = ref.target_type || ref.target?.type || 'other'
        const category = this.getTargetTypeCategory(targetType)
        
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(ref)
      })
      
      return grouped
    }
  },
  mounted() {
    if (this.autoLoad) {
      this.loadReferences()
    }
  },
  methods: {
    async loadReferences() {
      this.loadingReferences = true
      
      try {
        ElMessage.info(this.t('issueDetail.references.loading'))
        
        // 构建API URL - 使用通用的参照API
        const apiUrl = `/api/relations/references`
        const params = {
          entity_type: this.entityType,
          entity_id: this.entity.id,
          project_id: this.project.id,
          reference_types: this.supportedReferenceTypes.join(',')
        }
        
        console.log('参照API请求:', { apiUrl, params })
        
        const response = await axios.get(apiUrl, { params })
        
        console.log('参照API响应:', response.data)
        
        if (response.data.success) {
          this.references = response.data.references || []
          this.referencesRawData = response.data
          
          const referenceCount = this.references.length
          if (referenceCount > 0) {
            ElMessage.success(this.t('issueDetail.references.loadSuccess', { count: referenceCount }))
          } else {
            ElMessage.info(this.t('issueDetail.references.noReferencesFound'))
          }
          
          // 发出事件通知父组件
          this.$emit('references-loaded', {
            references: this.references,
            stats: this.referencesStats
          })
        } else {
          throw new Error(response.data.error || this.t('issueDetail.references.loadFailed'))
        }
      } catch (error) {
        console.error('获取参照失败:', error)
        this.referencesRawData = {
          error: error.message,
          response: error.response?.data || null,
          timestamp: new Date().toISOString()
        }
        ElMessage.error(error.response?.data?.error || error.message || this.t('issueDetail.references.loadFailed'))
        
        // 发出错误事件
        this.$emit('references-error', error)
      } finally {
        this.loadingReferences = false
      }
    },

    // 参照分类方法
    getDocumentReferences() {
      if (!this.references) return []
      return this.references.filter(ref => 
        (ref.ref_type === 'xrefs' || ref.ref_type === 'includes') && 
        !ref.target?.file_type
      )
    },

    getFileReferences() {
      if (!this.references) return []
      return this.references.filter(ref => 
        (ref.ref_type === 'xrefs' || ref.ref_type === 'includes') && 
        ref.target?.file_type
      )
    },

    getXrefReferences() {
      if (!this.references) return []
      return this.references.filter(ref => ref.ref_type === 'xrefs')
    },

    getOtherReferences() {
      if (!this.references) return []
      const knownTypes = ['xrefs', 'includes']
      return this.references.filter(ref => !knownTypes.includes(ref.ref_type))
    },


    // 检查是否可以下载
    canDownload(reference) {
      // 检查是否有下载相关的URN或链接
      return reference.target?.storage_urn || 
             reference.target?.lineage_urn || 
             reference.target?.version_urn ||
             reference.target?.download_url
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return ''
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    },

    // 格式化日期时间
    formatDateTime(dateString) {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        return dateString
      }
    },

    // 打开参照链接
    openReference(url) {
      if (url) {
        window.open(url, '_blank')
      } else {
        ElMessage.warning(this.t('issueDetail.references.referenceUnavailable'))
      }
    },

    // 显示参照详情
    showReferenceDetails(reference) {
      this.selectedReference = reference
      this.showDetailsDialog = true
    },

    // 筛选变更处理
    onReferenceFilterChange(value) {
      console.log('参照筛选变更:', value)
      this.$emit('filter-changed', value)
    },

    // 搜索变更处理
    onSearchChange(value) {
      console.log('搜索关键词变更:', value)
      this.$emit('search-changed', value)
    },

    // 获取实体图标
    getEntityIcon(entityType) {
      const iconMap = {
        'file': 'Document',
        'document_package': 'FolderOpened',
        'drawing': 'Picture',
        'photo': 'Camera',
        'submittal': 'Upload',
        'issue': 'Warning',
        'rfi': 'QuestionFilled',
        'correspondence': 'Message',
        'schedule_activity': 'Calendar',
        'specification': 'Document',
        'asset': 'Box',
        'form': 'List'
      }
      return iconMap[entityType] || 'Document'
    },

    // 获取实体显示名称
    getEntityDisplayName(entityType) {
      const nameMap = {
        'file': '文件',
        'document_package': '文档包',
        'drawing': '图纸',
        'photo': '照片',
        'submittal': '提交资料',
        'issue': '问题',
        'rfi': 'RFI',
        'correspondence': '函件',
        'schedule_activity': '明细表活动',
        'specification': '规范',
        'asset': '资产',
        'form': '表单'
      }
      return nameMap[entityType] || entityType
    },

    // 获取实体分类颜色
    getEntityCategoryColor(entityType) {
      const categoryColorMap = {
        'file': '#409eff',
        'document_package': '#409eff',
        'drawing': '#409eff',
        'photo': '#67c23a',
        'submittal': '#e6a23c',
        'issue': '#e6a23c',
        'rfi': '#e6a23c',
        'correspondence': '#e6a23c',
        'schedule_activity': '#f56c6c',
        'specification': '#f56c6c',
        'asset': '#f56c6c',
        'form': '#f56c6c'
      }
      return categoryColorMap[entityType] || '#909399'
    },

    // 获取分类图标
    getCategoryIcon(category) {
      const iconMap = {
        'document': 'Folder',
        'media': 'Picture',
        'workflow': 'Operation',
        'management': 'Setting',
        'other': 'More'
      }
      return iconMap[category] || 'More'
    },

    // 获取分类显示名称
    getCategoryDisplayName(category) {
      const translationKey = `issueDetail.references.entityCategories.${category}`
      return this.t(translationKey, category)
    },

    // 获取分类颜色
    getCategoryColor(category) {
      const colorMap = {
        'document': '#409eff',
        'media': '#67c23a',
        'workflow': '#e6a23c',
        'management': '#f56c6c',
        'other': '#909399'
      }
      return colorMap[category] || '#909399'
    },

    // 根据target_type获取分类
    getTargetTypeCategory(targetType) {
      const categoryMap = {
        // 文档类
        'document': 'document',
        'file': 'document', 
        'drawing': 'document',
        'document_package': 'document',
        
        // 媒体类
        'photo': 'media',
        'image': 'media',
        
        // 工作流程类
        'issue': 'workflow',
        'rfi': 'workflow',
        'submittal': 'workflow',
        'correspondence': 'workflow',
        
        // 管理类
        'asset': 'management',
        'form': 'management',
        'specification': 'management',
        'schedule_activity': 'management'
      }
      return categoryMap[targetType] || 'other'
    },

    // 根据target_type获取图标
    getTargetTypeIcon(targetType) {
      const iconMap = {
        'document': 'Document',
        'file': 'Document',
        'document_package': 'FolderOpened',
        'drawing': 'Picture',
        'photo': 'Camera',
        'image': 'Picture',
        'submittal': 'Upload',
        'issue': 'Warning',
        'rfi': 'QuestionFilled',
        'correspondence': 'Message',
        'schedule_activity': 'Calendar',
        'specification': 'Document',
        'asset': 'Box',
        'form': 'List'
      }
      return iconMap[targetType] || 'Document'
    },

    // 根据target_type获取显示名称
    getTargetTypeDisplayName(targetType) {
      const translationKey = `issueDetail.references.targetTypes.${targetType}`
      return this.t(translationKey, targetType)
    },

    // 根据target_type获取分类颜色
    getTargetTypeCategoryColor(targetType) {
      const category = this.getTargetTypeCategory(targetType)
      return this.getCategoryColor(category)
    },

    // 下载参照文档
    async downloadReference(reference) {
      if (!reference || !reference.id) {
        ElMessage.error('参照信息无效')
        return
      }

      // 防止重复下载
      if (this.downloadingReferences.has(reference.id)) {
        return
      }

      this.downloadingReferences.add(reference.id)

      try {
        ElMessage.info(this.t('issueDetail.references.downloadPreparing'))
        
        // 调用通用下载API
        const downloadUrl = `/api/relations/references/${this.project.id}/${this.entityType}/${this.entity.id}/${reference.id}/download`
        
        console.log('下载参照文档:', {
          reference_id: reference.id,
          project_id: this.project.id,
          entity_type: this.entityType,
          entity_id: this.entity.id,
          download_url: downloadUrl
        })
        
        const response = await axios.get(downloadUrl)
        
        console.log('下载API响应:', response.data)
        
        if (response.data.success && response.data.download_url) {
          // 获取文档名称
          const documentName = response.data.document_name || reference.target?.name || `参照文档_${reference.id}`
          
          // 创建临时链接进行下载
          const link = document.createElement('a')
          link.href = response.data.download_url
          link.download = documentName
          link.target = '_blank'
          
          // 触发下载
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          ElMessage.success(this.t('issueDetail.references.downloadStarted', { name: documentName }))
          
          // 发出下载成功事件
          this.$emit('download-success', {
            reference,
            documentName,
            downloadUrl: response.data.download_url
          })
        } else {
          throw new Error(response.data.error || this.t('issueDetail.references.downloadFailed', { error: 'API Error' }))
        }
      } catch (error) {
        console.error('下载参照文档失败:', error)
        
        let errorMessage = this.t('issueDetail.references.downloadFailed', { error: 'Unknown Error' })
        if (error.response?.data?.error) {
          errorMessage = this.t('issueDetail.references.downloadFailed', { error: error.response.data.error })
        } else if (error.message) {
          errorMessage = this.t('issueDetail.references.downloadFailed', { error: error.message })
        }
        
        ElMessage.error(errorMessage)
        
        // 发出下载失败事件
        this.$emit('download-error', {
          reference,
          error: errorMessage
        })
        
        // 如果有调试信息，显示给用户
        if (error.response?.data?.debug_info) {
          console.log('下载失败调试信息:', error.response.data.debug_info)
        }
      } finally {
        this.downloadingReferences.delete(reference.id)
      }
    },

    // 刷新参照数据
    refresh() {
      this.loadReferences()
    },

    // 清空参照数据
    clear() {
      this.references = null
      this.referencesRawData = null
      this.selectedReference = null
      this.showDetailsDialog = false
      this.downloadingReferences.clear()
    }
  }
}
</script>

<style scoped>
.entity-references {
  padding: 16px;
}

.loading-container {
  text-align: center;
  padding: 32px;
}

.loading-text {
  margin-top: 16px;
  color: #666;
}

.references-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.references-stats {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.references-filter {
  display: flex;
  justify-content: flex-end;
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 列表视图样式 */
.list-view .reference-item {
  transition: all 0.3s ease;
}

.list-view .reference-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 网格视图样式 */
.grid-view {
  display: block;
}

.reference-grid-item {
  height: 160px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reference-grid-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.grid-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.grid-item-icon {
  font-size: 24px;
}

.grid-item-menu {
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.grid-item-menu:hover {
  color: #409eff;
}

.grid-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grid-item-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.grid-item-type {
  font-size: 12px;
  color: #666;
}

.grid-item-meta {
  font-size: 11px;
  color: #999;
}

/* 分类视图样式 */
.category-view {
  display: block;
}

.category-section {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid var(--category-color, #409eff);
}

.category-title {
  font-weight: 600;
  font-size: 16px;
  flex: 1;
}

.category-count {
  margin-left: auto;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
}

.category-reference-item {
  transition: all 0.3s ease;
}

.category-reference-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.category-item-icon {
  font-size: 20px;
  color: #666;
}

.category-item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-item-name {
  font-weight: 500;
  font-size: 14px;
}

.category-item-type {
  font-size: 12px;
  color: #666;
}

.category-item-actions {
  flex-shrink: 0;
}

.reference-item {
  transition: all 0.3s ease;
}

.reference-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reference-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.reference-info {
  flex: 1;
}

.reference-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.reference-icon {
  color: #409eff;
}

.reference-name {
  font-weight: 600;
  font-size: 16px;
}

.reference-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.reference-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.reference-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  color: #666;
  font-size: 14px;
}

.no-references {
  text-align: center;
  padding: 64px 32px;
}

.reference-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.debug-section {
  border-top: 1px solid #eee;
  padding-top: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Target Type Tag 優化樣式 */
.target-type-tag {
  display: inline-flex !important;
  align-items: center;
  gap: 4px;
  padding: 4px 10px !important;
  border-radius: 16px !important;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
  border: 1px solid transparent !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--el-tag-bg-color) 0%, rgba(255, 255, 255, 0.8) 100%) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.target-type-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.target-type-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.target-type-tag:hover::before {
  left: 100%;
}

.target-type-tag .tag-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.8;
}

/* 不同分類的特殊樣式 */
.target-type-tag[style*="#409eff"] {
  color: #1d4ed8 !important;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%) !important;
  border-color: #93c5fd !important;
}

.target-type-tag[style*="#67c23a"] {
  color: #166534 !important;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
  border-color: #86efac !important;
}

.target-type-tag[style*="#e6a23c"] {
  color: #d97706 !important;
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%) !important;
  border-color: #fbbf24 !important;
}

.target-type-tag[style*="#f56c6c"] {
  color: #dc2626 !important;
  background: linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%) !important;
  border-color: #f87171 !important;
}

.target-type-tag[style*="#909399"] {
  color: #374151 !important;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
  border-color: #d1d5db !important;
}

/* 標記信息樣式 */
.markup-info-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.markup-explanation p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
}

.markup-explanation .technical-details {
  font-size: 11px;
  color: #999;
  font-family: 'Courier New', monospace;
  margin-top: 8px;
}

.grid-markup-tag {
  margin-top: 8px;
}

.category-markup-info {
  margin-top: 4px;
}

.category-markup-info .el-tag {
  font-size: 11px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 標記相關的特殊樣式 */
.reference-item[data-markup-type="markupdocument"] {
  border-left: 4px solid #67c23a;
}

.reference-item[data-markup-type="markup"] {
  border-left: 4px solid #409eff;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .target-type-tag {
    font-size: 11px;
    padding: 3px 8px !important;
  }
  
  .target-type-tag .tag-icon {
    font-size: 11px;
  }
  
  .markup-explanation p {
    font-size: 12px;
  }
  
  .category-markup-info .el-tag {
    font-size: 10px;
  }
}
</style>
