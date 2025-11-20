<template>
  <div class="submittal-master-view">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="t('submittal.masterView.title')"
      :description="t('submittal.masterView.description')"
      :icon="IconFile" />

    <!-- 统计卡片 -->
    <SubmittalStats 
      :stats="statistics" 
      :loading="statsLoading"
      @filter-status="filterByStatus"
    />

    <!-- 过滤和搜索栏 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="search-box">
          <i class="icon-search">🔍</i>
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="t('submittal.filters.searchPlaceholder')"
            @input="debouncedSearch"
          />
        </div>
        
        <div class="filter-group">
          <select v-model="filters.statusId" @change="applyFilters" class="filter-select">
            <option value="">{{ t('submittal.filters.allStatus') }}</option>
            <option value="1">{{ t('submittal.status.required') }}</option>
            <option value="2">{{ t('submittal.status.open') }}</option>
            <option value="3">{{ t('submittal.status.closed') }}</option>
            <option value="4">{{ t('submittal.status.void') }}</option>
            <option value="6">{{ t('submittal.status.draft') }}</option>
          </select>

          <select v-model="filters.stateId" @change="applyFilters" class="filter-select">
            <option value="">{{ t('submittal.filters.allStates') }}</option>
            <option value="draft">{{ t('submittal.state.draft') }}</option>
            <option value="sbc-1">{{ t('submittal.state.sbc-1') }}</option>
            <option value="mgr-1">{{ t('submittal.state.mgr-1') }}</option>
            <option value="rev">{{ t('submittal.state.rev') }}</option>
            <option value="mgr-2">{{ t('submittal.state.mgr-2') }}</option>
            <option value="sbc-2">{{ t('submittal.state.sbc-2') }}</option>
            <option value="void">{{ t('submittal.state.void') }}</option>
          </select>

          <select v-model="filters.priority" @change="applyFilters" class="filter-select">
            <option value="">{{ t('submittal.filters.allPriorities') }}</option>
            <option value="High">{{ t('submittal.priority.high') }}</option>
            <option value="Normal">{{ t('submittal.priority.normal') }}</option>
            <option value="Low">{{ t('submittal.priority.low') }}</option>
          </select>
        </div>

        <button v-if="hasActiveFilters" @click="clearFilters" class="btn-clear-filters">
          <i class="icon">✕</i>{{ t('submittal.filters.clearFilters') }}</button>
      </div>
    </div>

    <!-- Submittal 列表 -->
    <div class="content-section">
      <SubmittalList
        :items="filteredItems"
        :loading="loading"
        :selected-item="selectedItem"
        :project="currentProject"
        @select="selectItem"
        @view-detail="viewDetail"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && items.length === 0" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ t('submittal.masterView.loadingSubmittals') }}</p>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>{{ t('submittal.masterView.noSubmittals') }}</h3>
      <p>{{ t('submittal.masterView.noSubmittalsDesc') }}</p>
    </div>

    <!-- JSON 数据查看器 -->
    <div v-if="items.length > 0" class="json-viewer-section" style="margin-top: 24px;">
      <JsonViewer 
        :data="items"
        :title="t('submittal.apiData.basicData')"
        :description="t('submittal.apiData.basicDataDesc')"
        :show-copy="true"
        :show-download="true"
        :collapsible="true"
        :collapsed="true" />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Breadcrumb from '../components/Breadcrumb.vue';
import PageHeader from '../components/PageHeader.vue';
import SubmittalStats from '../components/submittal/SubmittalStats.vue';
import SubmittalList from '../components/submittal/SubmittalList.vue';
import JsonViewer from '../components/JsonViewer.vue';
import { IconFile } from '@arco-design/web-vue/es/icon';
import userCache from '../utils/userCache.js';
import axios from 'axios';

export default {
  name: 'SubmittalView',
  components: {
    Breadcrumb,
    PageHeader,
    SubmittalStats,
    SubmittalList,
    JsonViewer,
    IconFile
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();

    // 数据状态
    const items = ref([]);
    const selectedItem = ref(null);
    const currentProject = ref(null);
    const statistics = ref({
      total: 0,
      required: 0,
      open: 0,
      closed: 0,
      void: 0,
      draft: 0,
      inReview: 0
    });

    // UI 状态
    const loading = ref(false);
    const statsLoading = ref(false);
    const searchQuery = ref('');

    // 过滤器
    const filters = ref({
      statusId: '',
      stateId: '',
      priority: ''
    });

    // 计算属性
    const hasActiveFilters = computed(() => {
      return Object.values(filters.value).some(v => v !== '') || searchQuery.value !== '';
    });

    const filteredItems = computed(() => {
      let result = [...items.value];

      // 应用搜索
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => 
          item.title?.toLowerCase().includes(query) ||
          item.identifier?.toString().includes(query) ||
          item.customIdentifier?.toLowerCase().includes(query) ||
          item.specIdentifier?.toLowerCase().includes(query)
        );
      }

      // 应用状态过滤
      if (filters.value.statusId) {
        result = result.filter(item => item.statusId === filters.value.statusId);
      }

      // 应用阶段过滤
      if (filters.value.stateId) {
        result = result.filter(item => item.stateId === filters.value.stateId);
      }

      // 应用优先级过滤
      if (filters.value.priority) {
        result = result.filter(item => item.priority === filters.value.priority);
      }

      return result;
    });

    // 方法
    const loadSubmittals = async () => {
      loading.value = true;
      try {
        const projectId = route.query.projectId || localStorage.getItem('currentProjectId');
        const projectName = route.query.projectName;
        
        if (!projectId) {
          throw new Error(t('submittal.messages.noProject'));
        }
        
        // 設置當前項目信息
        currentProject.value = {
          id: projectId,
          name: projectName || projectId
        };
        
        // 預加載用戶緩存
        try {
          console.log('👥 開始預加載用戶緩存數據:', projectId)
          await userCache.getProjectUsers(projectId)
          console.log('✅ 用戶緩存預加載成功')
        } catch (error) {
          console.error('❌ 用戶緩存預加載失敗:', error)
          // 不影響主要功能
        }
        
        // 使用分页加载所有 Submittal 项目
        // 注意：Autodesk API 的 limit 最大值是 50
        let allItems = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(`/api/submittals/${projectId}/items`, {
            params: {
              limit: limit,
              offset: offset,
              sort: 'updatedAt desc'
            }
          });

          const results = response.data.results || [];
          allItems = allItems.concat(results);

          // 检查是否还有更多数据
          const pagination = response.data.pagination || {};
          const totalResults = pagination.totalResults || 0;
          
          offset += results.length;
          hasMore = offset < totalResults && results.length > 0;
        }

        items.value = allItems;
        calculateStatistics();
      } catch (error) {
        console.error('Failed to load submittals:', error);
        const errorMsg = error.response?.data?.error || error.message;
        showError(t('submittal.messages.loadFailed', { error: errorMsg }));
      } finally {
        loading.value = false;
      }
    };

    const calculateStatistics = () => {
      statsLoading.value = true;
      const stats = {
        total: items.value.length,
        required: 0,
        open: 0,
        closed: 0,
        void: 0,
        draft: 0,
        inReview: 0
      };

      items.value.forEach(item => {
        switch (item.statusId) {
          case '1':
            stats.required++;
            break;
          case '2':
            stats.open++;
            break;
          case '3':
            stats.closed++;
            break;
          case '4':
            stats.void++;
            break;
          case '6':
            stats.draft++;
            break;
        }

        if (item.stateId === 'rev') {
          stats.inReview++;
        }
      });

      statistics.value = stats;
      statsLoading.value = false;
    };

    const selectItem = (item) => {
      selectedItem.value = item;
    };

    const viewDetail = (item) => {
      // 跳转到详情页面
      router.push({
        path: '/submittals/detail',
        query: {
          projectId: route.query.projectId,
          itemId: item.id
        }
      });
    };

    const filterByStatus = (statusId) => {
      filters.value.statusId = statusId;
      applyFilters();
    };

    const applyFilters = () => {
      // 过滤在计算属性中自动应用
    };

    const clearFilters = () => {
      filters.value = {
        statusId: '',
        stateId: '',
        priority: ''
      };
      searchQuery.value = '';
    };

    let searchTimeout;
    const debouncedSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        // 搜索在计算属性中自动应用
      }, 300);
    };

    const showError = (message) => {
      // TODO: 使用 Element Plus 的 Message 组件
      alert(message);
    };

    // 生命周期
    onMounted(() => {
      loadSubmittals();
    });

    return {
      t,
      IconFile,
      items,
      selectedItem,
      currentProject,
      statistics,
      loading,
      statsLoading,
      searchQuery,
      filters,
      hasActiveFilters,
      filteredItems,
      selectItem,
      viewDetail,
      filterByStatus,
      applyFilters,
      clearFilters,
      debouncedSearch
    };
  }
};
</script>

<style scoped>
@import '../styles/common.css';

.submittal-master-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  min-height: 100vh;
  background: #f5f7fa;
}

/* 过滤器部分 */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 0 16px;
}

.icon-search {
  font-size: 18px;
  margin-right: 8px;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 0;
  font-size: 14px;
  outline: none;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: white;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #667eea;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-clear-filters {
  padding: 10px 16px;
  background: #fee;
  color: #e53e3e;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-clear-filters:hover {
  background: #e53e3e;
  color: white;
}

/* 内容区域 */
.content-section {
  position: relative;
}

/* 加载和空状态 */
.loading-overlay {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    min-width: 100%;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
