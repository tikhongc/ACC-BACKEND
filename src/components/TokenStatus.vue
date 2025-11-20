<template>
  <div class="token-status-widget">
    <!-- Token状态指示器 -->
    <div class="token-indicator" :class="statusClass" @click="showDetails = !showDetails">
      <div class="status-dot" :class="statusClass"></div>
      <span class="status-text">{{ statusText }}</span>
      <span class="expires-text" v-if="tokenInfo.expires_in_minutes">
        ({{ formatExpiresIn(tokenInfo.expires_in_minutes) }})
      </span>
      <icon-down v-if="!showDetails" />
      <icon-up v-if="showDetails" />
    </div>

    <!-- 详细信息面板 -->
    <div class="token-details" v-if="showDetails">
      <div class="detail-row">
        <span class="label">Access Token:</span>
        <span class="value">{{ tokenInfo.has_access_token ? '✅ Valid' : '❌ Invalid' }}</span>
        <el-button 
          v-if="tokenInfo.has_access_token"
          size="mini" 
          type="text" 
          @click="copyToken"
          :loading="copyingToken"
          class="copy-token-btn">
          <icon-copy />
          Copy
        </el-button>
      </div>
      <div class="detail-row">
        <span class="label">Refresh Token:</span>
        <span class="value">{{ tokenInfo.has_refresh_token ? '✅ Available' : '❌ Unavailable' }}</span>
      </div>
      <div class="detail-row" v-if="tokenInfo.expires_at">
        <span class="label">Expires At:</span>
        <span class="value">{{ formatDate(tokenInfo.expires_at) }}</span>
      </div>
      <div class="detail-row" v-if="tokenInfo.updated_at">
        <span class="label">Updated At:</span>
        <span class="value">{{ formatDate(tokenInfo.updated_at) }}</span>
      </div>
      <div class="detail-row" v-if="tokenInfo.refresh_attempts > 0">
        <span class="label">Refresh Attempts:</span>
        <span class="value">{{ tokenInfo.refresh_attempts }} times</span>
      </div>
      <div class="detail-row" v-if="tokenInfo.next_auto_refresh_at">
        <span class="label">Next Auto Refresh:</span>
        <span class="value">{{ formatDate(tokenInfo.next_auto_refresh_at) }}</span>
      </div>
      <div class="detail-row" v-if="tokenInfo.next_auto_refresh_in_minutes !== null && tokenInfo.next_auto_refresh_in_minutes >= 0">
        <span class="label">Next Refresh In:</span>
        <span class="value" :class="getRefreshTimeClass(tokenInfo.next_auto_refresh_in_minutes)">
          {{ formatRefreshTime(tokenInfo.next_auto_refresh_in_minutes, tokenInfo.next_auto_refresh_in_seconds) }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="token-actions">
        <el-button 
          size="small" 
          type="primary" 
          @click="refreshToken"
          :loading="refreshing"
          :disabled="!tokenInfo.has_refresh_token">
          <icon-refresh />
          Manual Refresh
        </el-button>
        <el-button 
          size="small" 
          type="danger" 
          @click="logout"
          :loading="loggingOut">
          <icon-logout />
          Logout
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { IconDown, IconUp, IconRefresh, IconExport, IconCopy } from '@arco-design/web-vue/es/icon'

export default {
  name: 'TokenStatus',
  components: {
    IconDown,
    IconUp,
    IconRefresh,
    IconExport,
    IconCopy
  },
  data() {
    return {
      tokenInfo: {},
      showDetails: false,
      refreshing: false,
      loggingOut: false,
      copyingToken: false,
      updateTimer: null,
      lastCheckTime: null
    }
  },
  computed: {
    statusClass() {
      if (!this.tokenInfo.is_valid) return 'invalid'
      if (this.tokenInfo.needs_refresh) return 'warning'
      return 'valid'
    },
    statusText() {
      if (!this.tokenInfo.is_valid) return 'Token Invalid'
      if (this.tokenInfo.needs_refresh) return 'Token Expiring'
      return 'Token Normal'
    }
  },
  mounted() {
    this.loadTokenInfo()
    // 每5分钟更新一次token状态（进一步减少频率）
    this.updateTimer = setInterval(() => {
      // 只有在token即将过期时才频繁检查
      if (this.tokenInfo.expires_in_minutes && this.tokenInfo.expires_in_minutes < 30) {
        this.loadTokenInfo()
      } else if (!this.lastCheckTime || (Date.now() - this.lastCheckTime) > 300000) {
        // 超过5分钟才检查一次
        this.loadTokenInfo()
      }
    }, 120000)
  },
  beforeUnmount() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
    }
  },
  methods: {
    async loadTokenInfo() {
      try {
        const response = await axios.get('/api/auth/token-info')
        this.tokenInfo = response.data.token_info || {}
        this.lastCheckTime = Date.now()
      } catch (error) {
        console.error('Failed to get Token info:', error)
        this.tokenInfo = { is_valid: false }
        this.lastCheckTime = Date.now()
      }
    },

    async refreshToken() {
      this.refreshing = true
      try {
        const response = await axios.post('/api/auth/refresh-token')
        
        if (response.data.status === 'success') {
          this.$message.success(response.data.message)
          this.tokenInfo = response.data.token_info || {}
          this.$emit('token-refreshed')
        } else {
          throw new Error(response.data.message || 'Token refresh failed')
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.$message.error('Token refresh failed: ' + (error.response?.data?.message || error.message))
      } finally {
        this.refreshing = false
      }
    },

    async logout() {
      this.$confirm('Are you sure you want to logout? This will clear all tokens.', 'Confirm Logout', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(async () => {
        this.loggingOut = true
        try {
          await axios.post('/api/auth/logout')
          this.$message.success('Successfully logged out')
          this.tokenInfo = { is_valid: false }
          this.$emit('logged-out')
          
          // Refresh page or redirect to login page
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } catch (error) {
          console.error('Logout failed:', error)
          this.$message.error('Logout failed: ' + (error.response?.data?.message || error.message))
        } finally {
          this.loggingOut = false
        }
      }).catch(() => {
        // User cancelled logout
      })
    },

    async copyToken() {
      this.copyingToken = true
      try {
        const response = await axios.get('/api/auth/get-token')
        
        if (response.data.status === 'success') {
          const token = response.data.access_token
          
          // 使用现代的 Clipboard API
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(token)
          } else {
            // 回退到传统方法
            const textArea = document.createElement('textarea')
            textArea.value = token
            textArea.style.position = 'fixed'
            textArea.style.left = '-999999px'
            textArea.style.top = '-999999px'
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()
            document.execCommand('copy')
            textArea.remove()
          }
          
          this.$message.success('Token已复制到剪贴板')
        } else {
          this.$message.error('获取Token失败: ' + response.data.message)
        }
      } catch (error) {
        console.error('Copy token failed:', error)
        this.$message.error('复制Token失败: ' + (error.response?.data?.message || error.message))
      } finally {
        this.copyingToken = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        return new Date(dateString).toLocaleString('zh-CN')
      } catch (e) {
        return dateString
      }
    },

    formatExpiresIn(minutes) {
      if (minutes < 60) {
        return `${minutes} minutes later expires`
      } else if (minutes < 1440) { // 24 hours
        return `${Math.floor(minutes / 60)} hours later expires`
      } else {
        return `${Math.floor(minutes / 1440)} days later expires`
      }
    },

    formatRefreshTime(minutes, seconds) {
      if (minutes === null || minutes === undefined) {
        return '-'
      }
      
      if (minutes < 0) {
        return 'Refreshing soon'
      } else if (minutes === 0) {
        return `${seconds || 0} seconds`
      } else if (minutes < 60) {
        return `${minutes} minutes`
      } else if (minutes < 1440) { // 24 hours
        return `${Math.floor(minutes / 60)} hours ${minutes % 60} minutes`
      } else {
        return `${Math.floor(minutes / 1440)} days`
      }
    },

    getRefreshTimeClass(minutes) {
      if (minutes === null || minutes === undefined) return ''
      if (minutes <= 5) return 'refresh-urgent'
      if (minutes <= 15) return 'refresh-warning'
      return 'refresh-normal'
    }
  }
}
</script>

<style scoped>
.token-status-widget {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
}

.token-indicator {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.token-indicator:hover {
  background-color: #f5f5f5;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-dot.valid {
  background-color: #52c41a;
}

.status-dot.warning {
  background-color: #faad14;
}

.status-dot.invalid {
  background-color: #f5222d;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  margin-right: 8px;
}

.expires-text {
  font-size: 12px;
  color: #666;
  margin-right: 8px;
}

.token-details {
  border-top: 1px solid #f0f0f0;
  padding: 12px;
  background-color: #fafafa;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
}

/* 刷新时间状态样式 */
.refresh-normal {
  color: #52c41a;
}

.refresh-warning {
  color: #faad14;
}

.refresh-urgent {
  color: #ff4d4f;
  font-weight: 700;
}

.token-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.token-actions .el-button {
  flex: 1;
}

.copy-token-btn {
  margin-left: 8px !important;
  padding: 2px 6px !important;
  font-size: 11px !important;
  color: #1890ff !important;
}

.copy-token-btn:hover {
  background-color: #f0f8ff !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .token-status-widget {
    position: static;
    margin: 10px;
    width: auto;
  }
}
</style>
