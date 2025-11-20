<template>
  <div class="statistics-table">
    <!-- 表格頭部 -->
    <div class="table-header">
      <div class="header-info">
        <h3 class="table-title">
          <icon-bar-chart />
          {{ title }}
        </h3>
        <span class="table-subtitle">{{ subtitle }}</span>
      </div>
      <div class="header-actions">
        <el-button 
          v-if="showExport"
          type="primary" 
          size="small" 
          @click="exportData">
          <icon-download />
          導出
        </el-button>
        <el-button 
          type="default" 
          size="small" 
          @click="toggleView">
          <icon-apps v-if="viewMode === 'list'" />
          <icon-list v-else />
          {{ viewMode === 'list' ? '卡片視圖' : '列表視圖' }}
        </el-button>
      </div>
    </div>

    <!-- 列表視圖 -->
    <div v-if="viewMode === 'list'" class="list-view">
      <div class="list-container">
        <div class="list-header-row">
          <div class="header-cell category">類別</div>
          <div class="header-cell count">數量</div>
          <div class="header-cell percentage">百分比</div>
          <div class="header-cell description">說明</div>
        </div>
        
        <div class="list-body">
          <div 
            v-for="(item, index) in tableData" 
            :key="index"
            class="list-row"
            :class="{ 'highlight': item.highlight }"
            @click="handleRowClick(item)">
            
            <!-- 類別列 -->
            <div class="list-cell category">
              <div class="category-content">
                <div class="category-icon" :style="{ background: getCategoryColor(item.category) }">
                  <component :is="getCategoryIcon(item.category)" />
                </div>
                <div class="category-info">
                  <span class="category-name">{{ getCategoryName(item.category) }}</span>
                  <span class="category-type">{{ getCategoryType(item.category) }}</span>
                </div>
              </div>
            </div>

            <!-- 數量列 -->
            <div class="list-cell count">
              <div class="count-display">
                <span class="count-number">{{ item.count }}</span>
                <span class="count-unit">項</span>
              </div>
            </div>

            <!-- 百分比列 -->
            <div class="list-cell percentage">
              <div class="percentage-display">
                <div class="percentage-bar">
                  <div 
                    class="percentage-fill" 
                    :style="{ 
                      width: item.percentage + '%',
                      background: getPercentageColor(item.percentage)
                    }">
                  </div>
                </div>
                <span class="percentage-text">{{ item.percentage }}%</span>
              </div>
            </div>

            <!-- 說明列 -->
            <div class="list-cell description">
              <div class="description-content">
                <span class="description-text">{{ item.description }}</span>
                <div class="description-tags">
                  <el-tag 
                    v-if="item.percentage >= 50" 
                    type="success" 
                    size="small">
                    主要
                  </el-tag>
                  <el-tag 
                    v-else-if="item.percentage >= 20" 
                    type="warning" 
                    size="small">
                    重要
                  </el-tag>
                  <el-tag 
                    v-else 
                    type="info" 
                    size="small">
                    次要
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡片視圖 -->
    <div v-else class="card-view">
      <div class="cards-grid">
        <div 
          v-for="(item, index) in tableData" 
          :key="index"
          class="stat-card"
          :class="{ 'highlight': item.highlight }"
          @click="handleRowClick(item)">
          
          <div class="card-header">
            <div class="card-icon" :style="{ background: getCategoryColor(item.category) }">
              <component :is="getCategoryIcon(item.category)" />
            </div>
            <div class="card-info">
              <h4 class="card-title">{{ getCategoryName(item.category) }}</h4>
              <span class="card-type">{{ getCategoryType(item.category) }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-metrics">
              <div class="metric-item">
                <span class="metric-label">數量</span>
                <span class="metric-value">{{ item.count }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">佔比</span>
                <span class="metric-value">{{ item.percentage }}%</span>
              </div>
            </div>

            <div class="card-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: item.percentage + '%',
                    background: getPercentageColor(item.percentage)
                  }">
                </div>
              </div>
            </div>

            <div class="card-description">
              <p>{{ item.description }}</p>
            </div>
          </div>

          <div class="card-footer">
            <el-tag 
              :type="getImportanceType(item.percentage)" 
              size="small">
              {{ getImportanceText(item.percentage) }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-if="!tableData || tableData.length === 0" class="empty-state">
      <icon-empty />
      <h3>暫無數據</h3>
      <p>目前沒有可顯示的統計數據</p>
    </div>
  </div>
</template>

<script>
import { 
  IconBarChart, 
  IconDownload, 
  IconApps, 
  IconList,
  IconEmpty,
  IconUser,
  IconStar,
  IconTool,
  IconTag,
  IconExclamationCircle
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'StatisticsTable',
  components: {
    IconBarChart,
    IconDownload,
    IconApps,
    IconList,
    IconEmpty,
    IconUser,
    IconStar,
    IconTool,
    IconTag,
    IconExclamationCircle
  },
  props: {
    title: {
      type: String,
      default: '統計數據'
    },
    subtitle: {
      type: String,
      default: '詳細的數據分布統計'
    },
    data: {
      type: Array,
      default: () => []
    },
    showExport: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      viewMode: 'list' // 'list' or 'card'
    }
  },
  computed: {
    tableData() {
      return this.data.map(item => ({
        ...item,
        highlight: item.percentage >= 50
      }))
    }
  },
  methods: {
    toggleView() {
      this.viewMode = this.viewMode === 'list' ? 'card' : 'list'
    },

    handleRowClick(item) {
      this.$emit('row-click', item)
    },

    exportData() {
      this.$emit('export', this.tableData)
    },

    getCategoryName(category) {
      const parts = category.split(': ')
      return parts.length > 1 ? parts[1] : category
    },

    getCategoryType(category) {
      const parts = category.split(': ')
      return parts.length > 1 ? parts[0] : '其他'
    },

    getCategoryIcon(category) {
      const type = this.getCategoryType(category)
      const iconMap = {
        '狀態': 'IconExclamationCircle',
        '優先級': 'IconStar',
        '專業': 'IconTool',
        '類別': 'IconTag',
        '其他': 'IconUser'
      }
      return iconMap[type] || 'IconUser'
    },

    getCategoryColor(category) {
      const type = this.getCategoryType(category)
      const colorMap = {
        '狀態': 'linear-gradient(135deg, #667eea, #764ba2)',
        '優先級': 'linear-gradient(135deg, #f093fb, #f5576c)',
        '專業': 'linear-gradient(135deg, #4facfe, #00f2fe)',
        '類別': 'linear-gradient(135deg, #43e97b, #38f9d7)',
        '其他': 'linear-gradient(135deg, #fa709a, #fee140)'
      }
      return colorMap[type] || colorMap['其他']
    },

    getPercentageColor(percentage) {
      if (percentage >= 50) {
        return 'linear-gradient(90deg, #00b894, #00cec9)'
      } else if (percentage >= 20) {
        return 'linear-gradient(90deg, #fdcb6e, #e17055)'
      } else {
        return 'linear-gradient(90deg, #74b9ff, #0984e3)'
      }
    },

    getImportanceType(percentage) {
      if (percentage >= 50) return 'success'
      if (percentage >= 20) return 'warning'
      return 'info'
    },

    getImportanceText(percentage) {
      if (percentage >= 50) return '主要'
      if (percentage >= 20) return '重要'
      return '次要'
    }
  }
}
</script>

<style scoped>
.statistics-table {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 表格頭部 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.table-subtitle {
  font-size: 14px;
  color: #666;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 列表視圖 */
.list-view {
  padding: 0;
}

.list-container {
  width: 100%;
}

.list-header-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2.5fr;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%);
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.header-cell {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.list-body {
  max-height: 500px;
  overflow-y: auto;
}

.list-body::-webkit-scrollbar {
  width: 6px;
}

.list-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.list-body::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 3px;
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 2.5fr;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.list-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.list-row:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.list-row:hover::before {
  transform: scaleY(1);
}

.list-row.highlight {
  background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%);
  border-left: 4px solid #ff9800;
}

.list-cell {
  display: flex;
  align-items: center;
}

/* 類別列 */
.category-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.category-type {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 數量列 */
.count-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.count-number {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.count-unit {
  font-size: 12px;
  color: #666;
}

/* 百分比列 */
.percentage-display {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.percentage-bar {
  flex: 1;
  height: 12px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.percentage-fill {
  height: 100%;
  border-radius: 6px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.percentage-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.percentage-text {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  min-width: 45px;
  text-align: right;
}

/* 說明列 */
.description-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.description-text {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.description-tags {
  display: flex;
  gap: 6px;
}

/* 卡片視圖 */
.card-view {
  padding: 24px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.stat-card:hover::before {
  transform: scaleX(1);
}

.stat-card.highlight {
  border-color: #ff9800;
  background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-info {
  flex: 1;
}

.card-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.card-type {
  font-size: 12px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-body {
  padding: 20px;
}

.card-metrics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-progress {
  margin-bottom: 16px;
}

.progress-bar {
  height: 8px;
  background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-description {
  margin-bottom: 16px;
}

.card-description p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

/* 空狀態 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  color: #333;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    justify-content: center;
  }

  .list-header-row,
  .list-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .list-cell {
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .list-cell:last-child {
    border-bottom: none;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .percentage-display {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .percentage-text {
    text-align: center;
  }
}
</style>
