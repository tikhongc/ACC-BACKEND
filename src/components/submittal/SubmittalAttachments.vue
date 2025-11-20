<template>
  <div class="submittal-attachments">
    <!-- 空状态 -->
    <div v-if="!attachments || attachments.length === 0" class="empty-attachments">
      <div class="empty-icon">📎</div>
      <p>{{ t('submittal.attachments.noAttachments') }}</p>
    </div>

    <!-- 附件表格 -->
    <div v-else class="attachments-table-container">
      <table class="attachments-table">
        <thead>
          <tr>
            <th>{{ t('common.fileName') }}</th>
            <th>{{ t('common.fileType') }}</th>
            <th>{{ t('common.uploader') }}</th>
            <th>{{ t('common.uploadTime') }}</th>
            <th>{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attachment in attachments" :key="attachment.id || attachment.urn">
            <td class="file-name">
              <span class="file-icon">{{ getFileIcon(attachment.name) }}</span>
              <span>{{ attachment.name }}</span>
            </td>
            <td class="file-type">
              <span class="type-badge">{{ getFileExtension(attachment.name) }}</span>
            </td>
            <td class="uploader">{{ getUserDisplayName(attachment.createdBy) }}</td>
            <td class="upload-time">{{ formatDateTime(attachment.createdAt) }}</td>
            <td class="actions">
              <button 
                @click="downloadAttachment(attachment)"
                class="btn-download"
                title="Download"
              >
                <span class="icon">⬇️</span>
                Download
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 附件统计 -->
    <div v-if="attachments && attachments.length > 0" class="attachments-summary">
      <div class="summary-item">
        <strong>Total:</strong> {{ attachments.length }} files
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { formatDateTime } from '../../utils/dateUtils.js'
import userCache from '../../utils/userCache.js'
import entityCache from '../../utils/entityCache.js'

export default {
  name: 'SubmittalAttachments',
  setup() {
    const { t } = useI18n()
    return { t }
  },
  props: {
    attachments: {
      type: Array,
      default: () => []
    },
    project: {
      type: Object,
      default: null
    }
  },
  methods: {
    getFileIcon(filename) {
      if (!filename) return '📄';
      const ext = filename.split('.').pop().toLowerCase();
      const iconMap = {
        pdf: '📕',
        doc: '📘',
        docx: '📘',
        xls: '📗',
        xlsx: '📗',
        ppt: '📙',
        pptx: '📙',
        dwg: '📐',
        rvt: '🏗️',
        zip: '🗜️',
        rar: '🗜️',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️'
      };
      return iconMap[ext] || '📄';
    },

    getFileExtension(filename) {
      if (!filename) return '-';
      const ext = filename.split('.').pop().toUpperCase();
      return ext || '-';
    },

    // 使用导入的formatDateTime函数
    formatDateTime,

    async downloadAttachment(attachment) {
      try {
        // TODO: Implement actual download logic
        // Need to use Autodesk Data Management API to get download link from URN
        console.log('Download attachment:', attachment);
        alert('Download function requires backend implementation of URN to download link interface');
      } catch (error) {
        console.error('Failed to download attachment:', error);
        alert('Download failed: ' + error.message);
      }
    },

    getUserDisplayName(userId) {
      if (!userId) return 'Unknown User'
      
      console.log('🔍 SubmittalAttachments获取用户显示名称:', { userId, projectId: this.project?.id });
      
      // 首先尝试使用 entityCache 获取用户显示名称
      const entityDisplayName = entityCache.getUserDisplayName(userId, this.project?.id);
      if (entityDisplayName && entityDisplayName !== userId) {
        console.log('✅ SubmittalAttachments EntityCache用户结果:', { userId, displayName: entityDisplayName });
        return entityDisplayName;
      }
      
      // 回退到原有的 userCache
      const userCacheDisplayName = userCache.getUserDisplayName(userId, this.project?.id);
      if (userCacheDisplayName && userCacheDisplayName !== userId) {
        console.log('✅ SubmittalAttachments UserCache用户结果:', { userId, displayName: userCacheDisplayName });
        return userCacheDisplayName;
      }
      
      // 如果都没有找到，使用简化显示
      let fallbackName;
      if (userId.includes('@')) {
        fallbackName = userId.split('@')[0];
      } else {
        fallbackName = userId.length > 20 ? userId.substring(0, 20) + '...' : userId;
      }
      
      console.log('⚠️ SubmittalAttachments使用回退显示名称:', { userId, fallbackName });
      return fallbackName;
    }
  }
};
</script>

<style scoped>
.submittal-attachments {
  width: 100%;
}

/* 空状态 */
.empty-attachments {
  text-align: center;
  padding: 60px 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-attachments p {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
}

/* 表格容器 */
.attachments-table-container {
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* 附件表格 */
.attachments-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.attachments-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.attachments-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attachments-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s ease;
}

.attachments-table tbody tr:hover {
  background: #f9fafb;
}

.attachments-table td {
  padding: 16px;
  color: #1a1a1a;
}

/* 文件名 */
.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  max-width: 300px;
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-name span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 文件类型 */
.type-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

/* 上传者 */
.uploader {
  color: #374151;
}

/* 上传时间 */
.upload-time {
  color: #9ca3af;
  font-size: 13px;
}

/* 操作按钮 */
.actions {
  white-space: nowrap;
}

.btn-download {
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.btn-download:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-download .icon {
  font-size: 14px;
}

/* 附件统计 */
.attachments-summary {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.summary-item {
  color: #374151;
}

.summary-item strong {
  color: #1a1a1a;
  margin-right: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .attachments-table {
    font-size: 12px;
  }

  .attachments-table th,
  .attachments-table td {
    padding: 10px 12px;
  }

  .file-name {
    max-width: 200px;
  }

  .attachments-summary {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
