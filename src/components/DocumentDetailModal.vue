<template>
  <el-dialog
    v-model="visible"
    :title="t('issueDetail.linkedDocuments.documentDetails')"
    width="80%"
    max-width="1200px"
    :before-close="handleClose"
    class="document-detail-modal">
    
    <div v-if="document" class="document-detail-content">
      <!-- 文档basicInfo -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Document /></el-icon>
          {{ t('issueDetail.linkedDocuments.basicInfo') }}
        </h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">{{ t('issueDetail.linkedDocuments.documentType') }}</span>
            <el-tag :type="getDocumentTypeColor(document.type)" size="small">
              {{ getDocumentTypeText(document.type) }}
            </el-tag>
          </div>
          <div class="info-item" v-if="document.enhanced_info?.file_type">
            <span class="label">{{ t('common.fileType') }}</span>
            <el-tag :type="getFileTypeTagType(document.enhanced_info.file_type)" size="small">
              {{ document.enhanced_info.file_type.toUpperCase() }}
            </el-tag>
          </div>
          <div class="info-item" v-if="document.enhanced_info?.file_size">
            <span class="label">{{ t('issueDetail.linkedDocuments.fileSize') }}</span>
            <span class="value">{{ formatFileSize(document.enhanced_info.file_size) }}</span>
          </div>
          <div class="info-item" v-if="document.enhanced_info?.version_number">
            <span class="label">{{ t('issueDetail.linkedDocuments.version') }}</span>
            <span class="value">v{{ document.enhanced_info.version_number }}</span>
          </div>
        </div>
      </div>

      <!-- URN 信息 -->
      <div class="detail-section">
        <h3 class="section-title">
          <el-icon><Link /></el-icon>
          {{ t('issueDetail.linkedDocuments.urn') }}
        </h3>
        <div class="urn-container">
          <code class="urn-code">{{ document.urn }}</code>
          <el-button 
            @click="copyToClipboard(document.urn)" 
            type="primary" 
            size="small" 
            :icon="CopyDocument">
            {{ t('issueDetail.linkedDocuments.copy') }}
          </el-button>
        </div>
      </div>

      <!-- 视图信息 -->
      <div v-if="document.details?.viewable" class="detail-section">
        <h3 class="section-title">
          <el-icon><View /></el-icon>
          {{ t('issueDetail.linkedDocuments.viewableInfo') }}
        </h3>
        <div class="viewable-details">
          <div class="viewable-header">
            <span class="viewable-name">{{ document.details.viewable.name }}</span>
            <el-tag :type="document.details.viewable.is3D ? 'success' : 'primary'" size="small">
              {{ document.details.viewable.is3D ? t('issueDetail.linkedDocuments.threeDView') : t('issueDetail.linkedDocuments.twoDView') }}
            </el-tag>
          </div>
          <div class="viewable-info-grid">
            <div class="info-item">
              <span class="label">GUID</span>
              <code class="guid-code">{{ document.details.viewable.guid }}</code>
            </div>
            <div class="info-item" v-if="document.details.viewable.viewableId">
              <span class="label">Viewable ID</span>
              <code class="id-code">{{ document.details.viewable.viewableId }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 位置信息 -->
      <div v-if="document.details?.position && Object.keys(document.details.position).length > 0" class="detail-section">
        <h3 class="section-title">
          <el-icon><Location /></el-icon>
          {{ t('issueDetail.linkedDocuments.positionInfo') }}
        </h3>
        <div class="position-container">
          <pre class="position-data">{{ JSON.stringify(document.details.position, null, 2) }}</pre>
        </div>
      </div>

      <!-- 元数据 -->
      <div v-if="document.enhanced_info" class="detail-section">
        <h3 class="section-title">
          <el-icon><InfoFilled /></el-icon>
          {{ t('issueDetail.linkedDocuments.metadata') }}
        </h3>
        <div class="metadata-grid">
          <div class="info-item" v-if="document.enhanced_info.create_time">
            <span class="label">{{ t('issueDetail.linkedDocuments.createTime') }}</span>
            <span class="value">{{ formatDateTime(document.enhanced_info.create_time) }}</span>
          </div>
          <div class="info-item" v-if="document.enhanced_info.last_modified_time">
            <span class="label">{{ t('issueDetail.linkedDocuments.modifiedTime') }}</span>
            <span class="value">{{ formatDateTime(document.enhanced_info.last_modified_time) }}</span>
          </div>
          <div class="info-item" v-if="document.enhanced_info.mime_type">
            <span class="label">{{ t('issueDetail.linkedDocuments.mimeType') }}</span>
            <code class="mime-type">{{ document.enhanced_info.mime_type }}</code>
          </div>
          <div class="info-item" v-if="document.createdAt">
            <span class="label">{{ t('issueDetail.fields.createdAt') }}</span>
            <span class="value">{{ formatDateTime(document.createdAt) }}</span>
          </div>
          <div class="info-item" v-if="document.createdAtVersion">
            <span class="label">{{ t('issueDetail.linkedDocuments.version') }}</span>
            <el-tag type="warning" size="small">v{{ document.createdAtVersion }}</el-tag>
          </div>
          <div class="info-item" v-if="document.closedAt">
            <span class="label">{{ t('issueDetail.fields.closedAt') }}</span>
            <span class="value">{{ formatDateTime(document.closedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 位置描述信息 -->
      <div v-if="getDocumentLocationInfo(document)" class="detail-section">
        <h3 class="section-title">
          <el-icon><MapLocation /></el-icon>
          {{ t('issueDetail.linkedDocuments.locationInfo') }}
        </h3>
        <div class="location-description">
          {{ getDocumentLocationInfo(document) }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ t('common.close') }}</el-button>
        <el-button type="primary" @click="copyAllInfo">
          <el-icon><CopyDocument /></el-icon>
          {{ t('issueDetail.linkedDocuments.copy') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Document, Link, View, Location, InfoFilled, MapLocation, CopyDocument } from '@element-plus/icons-vue';

export default {
  name: 'DocumentDetailModal',
  components: {
    Document,
    Link,
    View,
    Location,
    InfoFilled,
    MapLocation,
    CopyDocument
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    document: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n();

    const visible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    });

    const handleClose = () => {
      visible.value = false;
    };

    // 辅助方法
    const getDocumentTypeColor = (type) => {
      const typeMap = {
        'TwoDRasterPushpin': 'primary',
        'ThreeDPushpin': 'success',
        'TwoDVectorPushpin': 'warning',
        'default': 'info'
      };
      return typeMap[type] || typeMap.default;
    };

    const getDocumentTypeText = (type) => {
      const typeMap = {
        'TwoDRasterPushpin': '2D栅格标记',
        'ThreeDPushpin': '3D标记',
        'TwoDVectorPushpin': '2D矢量标记',
        'default': '未知类型'
      };
      return typeMap[type] || typeMap.default;
    };

    const getFileTypeTagType = (fileType) => {
      const typeMap = {
        'pdf': 'danger',
        'dwg': 'primary',
        'dxf': 'primary',
        'rvt': 'success',
        'ifc': 'success',
        'nwd': 'warning',
        'nwc': 'warning',
        'jpg': 'info',
        'jpeg': 'info',
        'png': 'info',
        'gif': 'info',
        'doc': 'primary',
        'docx': 'primary',
        'xls': 'success',
        'xlsx': 'success'
      };
      return typeMap[fileType?.toLowerCase()] || '';
    };

    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('zh-CN');
    };

    const getDocumentLocationInfo = (doc) => {
      if (!doc.details?.viewable) return null;
      
      const viewable = doc.details.viewable;
      
      if (viewable.is3D) {
        if (doc.details.position && Object.keys(doc.details.position).length > 0) {
          const pos = doc.details.position;
          if (pos.x !== undefined && pos.y !== undefined && pos.z !== undefined) {
            return `3D坐标: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
          } else {
            return '3D视图 - 坐标信息不完整';
          }
        } else {
          return '3D视图 - 无具体坐标';
        }
      } else {
        let locationInfo = '2D视图';
        
        if (viewable.name && viewable.viewableId) {
          const pageMatch = viewable.name.match(/^\((\d+)\)$/);
          if (pageMatch) {
            locationInfo += ` - 第${pageMatch[1]}页`;
          } else if (viewable.name !== viewable.viewableId) {
            locationInfo += ` - ${viewable.name}`;
          }
        }
        
        if (doc.details.position && Object.keys(doc.details.position).length > 0) {
          const pos = doc.details.position;
          if (pos.x !== undefined && pos.y !== undefined) {
            locationInfo += ` (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`;
          }
        }
        
        return locationInfo;
      }
    };

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        ElMessage.success(t('issueDetail.linkedDocuments.copySuccess'));
      } catch (error) {
        console.error('Copy failed:', error);
        ElMessage.error(t('issueDetail.linkedDocuments.copyFailed'));
      }
    };

    const copyAllInfo = async () => {
      if (!props.document) return;
      
      const info = {
        name: props.document.enhanced_info?.name || props.document.name || 'Unknown Document',
        urn: props.document.urn,
        type: props.document.type,
        fileType: props.document.enhanced_info?.file_type,
        fileSize: props.document.enhanced_info?.file_size,
        version: props.document.enhanced_info?.version_number,
        createTime: props.document.enhanced_info?.create_time,
        modifiedTime: props.document.enhanced_info?.last_modified_time,
        mimeType: props.document.enhanced_info?.mime_type,
        locationInfo: getDocumentLocationInfo(props.document),
        viewable: props.document.details?.viewable,
        position: props.document.details?.position
      };
      
      const text = JSON.stringify(info, null, 2);
      await copyToClipboard(text);
    };

    return {
      t,
      visible,
      handleClose,
      getDocumentTypeColor,
      getDocumentTypeText,
      getFileTypeTagType,
      formatFileSize,
      formatDateTime,
      getDocumentLocationInfo,
      copyToClipboard,
      copyAllInfo,
      CopyDocument
    };
  }
};
</script>

<style scoped>
.document-detail-modal {
  --el-dialog-border-radius: 12px;
}

.document-detail-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

.detail-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.info-grid,
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.viewable-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.urn-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.urn-code {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #374151;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.4;
}

.viewable-details {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #d1d5db;
}

.viewable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.viewable-name {
  font-weight: 500;
  color: #1e40af;
  font-size: 14px;
}

.guid-code,
.id-code {
  background: #e0f2fe;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #0369a1;
}

.position-container {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #d1d5db;
}

.position-data {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 11px;
  color: #374151;
  background: #fffbeb;
  padding: 12px;
  border-radius: 4px;
  margin: 0;
  overflow-x: auto;
  border: 1px solid #fde047;
}

.mime-type {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 3px;
  color: #374151;
}

.location-description {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #d1d5db;
  color: #1e40af;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid,
  .metadata-grid {
    grid-template-columns: 1fr;
  }
  
  .viewable-info-grid {
    grid-template-columns: 1fr;
  }
  
  .urn-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .viewable-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
