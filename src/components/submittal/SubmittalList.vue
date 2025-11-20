<template>
  <div class="submittal-list">
    <!-- 数据表格 -->
    <DataTable
      :data="items"
      :columns="tableColumns"
      :loading="loading"
      :title="t('submittal.apiData.basicData')"
      :description="t('submittal.apiData.basicDataDesc')"
      :action-buttons="tableActions"
      :operations="rowOperations"
      :show-index="true"
      row-key="id"
      @action="handleTableAction"
      @row-operation="handleRowOperation">
      
      <!-- 状态列 -->
      <template #status="{ row }">
        <div class="status-display">
          <StatusTag
            :status="getStatusType(row.statusId)"
            :text="getStatusText(row.statusId)"
            size="small"
            :show-icon="false" />
          <div v-if="getStateDescription(row.stateId)" class="status-description">
            {{ getStateDescription(row.stateId) }}
          </div>
        </div>
      </template>
      
      <!-- 标识符列 -->
      <template #identifier="{ row }">
        <StatusTag 
          status="info" 
          :text="row.customIdentifierHumanReadable || row.identifier"
          size="small" 
          :show-icon="false" />
      </template>
      
      <!-- 优先级列 -->
      <template #priority="{ row }">
        <StatusTag
          :status="getPriorityType(row.priority)"
          :text="row.priority || '-'"
          size="small"
          :show-icon="false" />
      </template>
      
      <!-- 规格信息列 -->
      <template #spec="{ row }">
        <div v-if="row.specIdentifier" class="spec-info">
          <span class="spec-icon">📄</span>
          <span>{{ row.specIdentifier }}</span>
          <div v-if="row.specTitle" class="spec-title">{{ row.specTitle }}</div>
        </div>
        <span v-else class="no-spec">-</span>
      </template>
      
      <!-- Type 列 -->
      <template #type="{ row }">
        <span>{{ getTypeDisplay(row) }}</span>
      </template>

      <!-- Ball in court 列 -->
      <template #ball-in-court="{ row }">
        <span>{{ getBallInCourtDisplay(row) }}</span>
      </template>

      <!-- Pending action 列 -->
      <template #pending-action="{ row }">
        <span>{{ getPendingActionDisplay(row) }}</span>
      </template>
      
      <!-- 到期日列 -->
      <template #due-date="{ row }">
        <span v-if="getEffectiveDueDate(row)" class="due-date-simple">
          {{ formatDate(getEffectiveDueDate(row)) }}
        </span>
        <span v-else>-</span>
      </template>
      
      <!-- 创建时间列 -->
      <template #created-at="{ row }">
        <span class="timestamp">{{ formatDateTime(row.createdAt) }}</span>
      </template>
      
      <!-- 更新时间列 -->
      <template #updated-at="{ row }">
        <span class="timestamp">{{ formatDateTime(row.updatedAt) }}</span>
      </template>
      
    </DataTable>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate, formatDateTime } from '../../utils/dateUtils.js'
import DataTable from '../DataTable.vue'
import StatusTag from '../StatusTag.vue'
import userCache from '../../utils/userCache.js'
import entityCache from '../../utils/entityCache.js'
import submittalMetadataCache from '../../utils/submittalMetadataCache.js'
import { Search, Filter, View } from '@element-plus/icons-vue'

export default {
  name: 'SubmittalList',
  components: {
    DataTable,
    StatusTag
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    selectedItem: {
      type: Object,
      default: null
    },
    project: {
      type: Object,
      default: null
    }
  },
  emits: ['select', 'view-detail'],
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // 表格配置
    const tableColumns = [
      {
        prop: 'title',
        label: t('submittal.columns.title'),
        minWidth: 200,
        sortable: true
      },
      {
        prop: 'identifier',
        label: t('submittal.columns.identifier'),
        width: 120,
        slot: 'identifier'
      },
      {
        prop: 'statusId',
        label: t('submittal.columns.status'),
        width: 100,
        slot: 'status'
      },
      {
        prop: 'priority',
        label: t('submittal.columns.priority'),
        width: 100,
        slot: 'priority'
      },
      {
        prop: 'specIdentifier',
        label: t('submittal.columns.specInfo'),
        width: 180,
        slot: 'spec'
      },
      {
        prop: 'typeId',
        label: t('submittal.columns.type'),
        width: 120,
        slot: 'type'
      },
      {
        prop: 'ballInCourt',
        label: t('submittal.columns.ballInCourt'),
        width: 200,
        slot: 'ball-in-court'
      },
      {
        prop: 'pendingAction',
        label: t('submittal.columns.pendingAction'),
        width: 180,
        slot: 'pending-action'
      },
      {
        prop: 'dueDate',
        label: t('submittal.columns.dueDate'),
        width: 140,
        slot: 'due-date',
        sortable: true
      },
      {
        prop: 'createdAt',
        label: t('submittal.columns.createdAt'),
        width: 160,
        slot: 'created-at',
        sortable: true
      },
      {
        prop: 'updatedAt',
        label: t('submittal.columns.updatedAt'),
        width: 160,
        slot: 'updated-at',
        sortable: true
      }
    ]
    
    const tableActions = [
      {
        text: 'Search',
        type: 'primary',
        icon: Search,
        action: 'search'
      },
      {
        text: 'Filter',
        type: 'default',
        icon: Filter,
        action: 'filter'
      }
    ]
    
    const rowOperations = [
      {
        text: 'View Details',
        type: 'primary',
        icon: View,
        action: 'view-detail'
      }
    ]

    // 事件处理
    const handleTableAction = (action, button, index) => {
      // 可以在这里处理表格级别的操作
      console.log('Table action:', action, button, index)
    }
    
    const handleRowOperation = (action, button, index) => {
      if (action.startsWith('view-detail:')) {
        const rowIndex = parseInt(action.split(':')[1])
        const item = props.items[rowIndex]
        if (item) {
          emit('view-detail', item)
        }
      }
    }

    // 獲取用戶顯示名稱
    const getUserDisplayName = (userId) => {
      if (!userId) return t('common.unknown')
      
      // 使用用戶緩存獲取用戶顯示名稱
      const displayName = userCache.getUserDisplayName(userId, props.project?.id)
      if (displayName && displayName !== userId) {
        return displayName
      }
      
      // 如果緩存中沒有找到，使用簡化顯示
      if (userId.includes('@')) {
        return userId.split('@')[0]
      }
      return userId.length > 20 ? userId.substring(0, 20) + '...' : userId
    }

    // 预加载 submittal metadata
    const preloadMetadata = async () => {
      if (props.project?.id) {
        try {
          console.log('🏢 预加载 submittal metadata:', props.project.id)
          await submittalMetadataCache.getProjectMetadata(props.project.id)
          console.log('✅ Submittal metadata 预加载成功')
        } catch (error) {
          console.error('❌ Submittal metadata 预加载失败:', error)
          // 不影响主要功能
        }
      }
    }

    // 监听项目变化，预加载 metadata
    const currentProjectId = computed(() => props.project?.id)
    let lastProjectId = null
    
    const checkAndPreloadMetadata = () => {
      const projectId = currentProjectId.value
      if (projectId && projectId !== lastProjectId) {
        lastProjectId = projectId
        preloadMetadata()
      }
    }

    // 初始检查
    checkAndPreloadMetadata()

    return {
      t,
      tableColumns,
      tableActions,
      rowOperations,
      handleTableAction,
      handleRowOperation,
      formatDate,
      formatDateTime,
      getUserDisplayName,
      preloadMetadata
    }
  },
  methods: {
    getStatusText(statusId) {
      const statusMap = {
        '1': 'required',
        '2': 'open',
        '3': 'closed',
        '4': 'void',
        '5': 'empty',
        '6': 'draft'
      };
      const mappedStatus = statusMap[statusId] || 'draft';
      return this.t(`submittal.status.${mappedStatus}`);
    },

    getStatusType(statusId) {
      const map = {
        '1': 'warning',  // Required
        '2': 'primary',  // Open
        '3': 'success',  // Closed
        '4': 'danger',   // Void
        '5': 'info',     // Empty
        '6': 'info'      // Draft
      };
      return map[statusId] || 'info';
    },

    getStateDescription(stateId) {
      if (!stateId) return '';
      
      // Closed状态不显示描述
      if (stateId === 'sbc-2') return '';
      
      const stateMap = {
        'sbc-1': this.t('submittal.state.sbc-1'),
        'mgr-1': this.t('submittal.state.mgr-1'),
        'rev': this.t('submittal.state.rev'),
        'mgr-2': this.t('submittal.state.mgr-2'),
        'void': this.t('submittal.state.void'),
        'draft': this.t('submittal.state.draft')
      };
      
      return stateMap[stateId] || '';
    },

    getPriorityType(priority) {
      const map = {
        'High': 'danger',
        'Normal': 'primary',
        'Low': 'info'
      };
      return map[priority] || 'info';
    },

    getDueDateTagType(dueDate) {
      if (!dueDate) return 'info';
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'danger';   // 已过期
      if (diffDays <= 3) return 'warning'; // 即将到期
      return 'success';                     // 正常
    },

    getDueDateStatus(dueDate) {
      if (!dueDate) return '-';
      const due = new Date(dueDate);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return this.t('submittal.dueStatus.overdue');
      if (diffDays <= 3) return this.t('submittal.dueStatus.dueSoon');
      return this.t('submittal.dueStatus.normal');
    },

    // 获取有效的到期日期
    getEffectiveDueDate(row) {
      // 优先级顺序：dueDate -> managerDueDate -> submitterDueDate -> requiredApprovalDate -> requiredDate
      return row.dueDate || 
             row.managerDueDate || 
             row.submitterDueDate || 
             row.requiredApprovalDate || 
             row.requiredDate ||
             row.requiredOnJobDate;
    },

    // 获取日期标签（显示是哪种日期）
    getDueDateLabel(row) {
      if (row.dueDate) return '';
      if (row.managerDueDate) return this.t('submittal.dateLabels.manager');
      if (row.submitterDueDate) return this.t('submittal.dateLabels.submitter');
      if (row.requiredApprovalDate) return this.t('submittal.dateLabels.approval');
      if (row.requiredDate) return this.t('submittal.dateLabels.required');
      if (row.requiredOnJobDate) return this.t('submittal.dateLabels.onSite');
      return '';
    },

    // 获取类型显示 (submittal type)
    getTypeDisplay(row) {
      if (!row.typeId) return '-';
      
      const projectId = this.project?.id;
      if (!projectId) {
        // 如果没有项目ID，显示简化版本
        return row.typeId.substring(0, 8) + '...';
      }
      
      // 使用 metadata 缓存获取类型名称
      const typeName = submittalMetadataCache.getItemTypeDisplayName(row.typeId, projectId);
      return typeName !== row.typeId ? typeName : (row.typeId.substring(0, 8) + '...');
    },

    // 获取Ball in Court显示 (包含角色类型)
    getBallInCourtDisplay(row) {
      const projectId = this.project?.id;
      let displayParts = [];
      
      // 优先处理ballInCourtUsers
      if (row.ballInCourtUsers && row.ballInCourtUsers.length > 0) {
        const userNames = row.ballInCourtUsers.map(userId => 
          entityCache.getUserDisplayName(userId, projectId) || userId
        );
        displayParts.push(userNames.join(', '));
      }
      
      // 其次处理ballInCourtRoles
      if (row.ballInCourtRoles && row.ballInCourtRoles.length > 0) {
        const roleNames = row.ballInCourtRoles.map(roleId => 
          entityCache.getRoleDisplayName(roleId, projectId) || `Role ${roleId}`
        );
        displayParts.push(roleNames.join(', '));
      }
      
      // 最后处理ballInCourtCompanies
      if (row.ballInCourtCompanies && row.ballInCourtCompanies.length > 0) {
        const companyNames = row.ballInCourtCompanies.map(companyId => 
          entityCache.getCompanyDisplayName(companyId, projectId) || `Company ${companyId}`
        );
        displayParts.push(companyNames.join(', '));
      }
      
      // 添加角色类型信息
      if (row.ballInCourtType) {
        const typeMap = {
          'manager': this.t('submittal.ballInCourtTypes.manager'),
          'subcontractor': this.t('submittal.ballInCourtTypes.subcontractor'),
          'reviewer': this.t('submittal.ballInCourtTypes.reviewer')
        };
        const roleType = typeMap[row.ballInCourtType] || row.ballInCourtType;
        
        if (displayParts.length > 0) {
          return `${displayParts.join(', ')} (${roleType})`;
        } else {
          return roleType;
        }
      }
      
      return displayParts.length > 0 ? displayParts.join(', ') : '-';
    },

    // 获取Pending Action显示
    getPendingActionDisplay(row) {
      if (!row.permittedActions || !Array.isArray(row.permittedActions)) {
        return '-';
      }
      
      // 从permittedActions中找到Item::wf_transition操作
      const workflowAction = row.permittedActions.find(action => 
        action.id === 'Item::wf_transition'
      );
      
      if (!workflowAction || !workflowAction.transitions || workflowAction.transitions.length === 0) {
        return '-';
      }
      
      // 获取主要的下一步操作（通常是第一个）
      const primaryTransition = workflowAction.transitions[0];
      return primaryTransition.name || '-';
    }
  }
};
</script>

<style scoped>
.submittal-list {
  position: relative;
}

/* 规格信息样式 */
.spec-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #374151;
}

.spec-icon {
  font-size: 14px;
}

.spec-title {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.no-spec {
  color: #9ca3af;
  font-style: italic;
}


/* 到期日样式 */
.due-date-simple {
  font-size: 13px;
  color: #374151;
}

.due-date-label {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}

/* 时间戳样式 */
.timestamp {
  font-size: 12px;
  color: #6b7280;
}

/* 状态显示样式 */
.status-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-description {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .spec-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  
  .due-date-info {
    align-items: flex-start;
  }
}
</style>
