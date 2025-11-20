<template>
  <div id="app">
    <!-- 语言切换器 - 固定在右上角 -->
    <div v-if="showTokenStatus" class="language-switcher-container">
      <LanguageSwitcher 
        mode="dropdown" 
        size="small" 
        :text="true"
        @language-changed="handleLanguageChanged" />
    </div>
    
    <router-view />
    <!-- Token状态监控组件 -->
    <TokenStatus 
      v-if="showTokenStatus" 
      @token-refreshed="handleTokenRefreshed"
      @logged-out="handleLoggedOut" />
    <!-- 全局监测面板 -->
    <GlobalMonitoringPanel v-if="showTokenStatus" />
    <!-- 下载进度组件 - 在所有页面显示 -->
    <DownloadProgress />
  </div>
</template>

<script>
import TokenStatus from './components/TokenStatus.vue'
import GlobalMonitoringPanel from './components/GlobalMonitoringPanel.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import DownloadProgress from './components/DownloadProgress.vue'
import axios from 'axios'

export default {
  name: 'App',
  components: {
    TokenStatus,
    GlobalMonitoringPanel,
    LanguageSwitcher,
    DownloadProgress
  },
  data() {
    return {
      showTokenStatus: false,
      projectsCache: {},
      projectsCacheLoaded: false,
      authCheckTimeout: null,
      loadingAccountInfo: false
    }
  },
  async mounted() {
    // 检查是否已认证，如果已认证则显示Token状态组件
    await this.checkAuthStatus()
    
    // 监听路由变化，在认证相关页面更新后重新检查状态
    this.$router.afterEach((to, from) => {
      if (from.path === '/auth/success' || to.query.forceAuthCheck === 'true') {
        // 防止重复调用，使用防抖
        if (this.authCheckTimeout) {
          clearTimeout(this.authCheckTimeout)
        }
        this.authCheckTimeout = setTimeout(() => {
          this.checkAuthStatus()
        }, 1000) // 延迟1秒检查，确保token已保存
      }
    })
  },
  methods: {
    async checkAuthStatus() {
      try {
        console.log('🔐 检查认证状态...')
        const response = await axios.get('/api/auth/check')
        console.log('🔐 认证检查响应:', response.data)
        
        this.showTokenStatus = response.data.authenticated
        
        // 如果认证成功，自动获取项目信息和账户信息
        if (response.data.authenticated) {
          console.log('✅ 用户已认证，开始加载用户数据')
          await this.loadUserDataAfterAuth()
        } else {
          console.log('❌ 用户未认证')
        }
      } catch (error) {
        console.error('❌ 认证状态检查失败:', error)
        this.showTokenStatus = false
      }
    },

    // 认证成功后自动加载用户数据
    async loadUserDataAfterAuth() {
      try {
        console.log('🔄 认证成功，开始加载用户数据...')
        
        // 并行加载账户信息和项目信息
        const promises = [
          this.loadAccountInfo(),
          this.loadProjectsInfo()
        ]
        
        await Promise.allSettled(promises)
        console.log('✅ 用户数据加载完成')
        
        // 通知监测中心项目信息已更新
        console.log('🔄 准备通知监测中心项目缓存更新...')
        if (this.$eventBus) {
          console.log('📡 发送项目缓存更新事件')
          this.$eventBus.emit('projects-cache-updated', this.projectsCache)
        } else {
          console.error('❌ 事件总线未初始化')
        }
        
      } catch (error) {
        console.error('❌ 加载用户数据失败:', error)
      }
    },

    // 加载账户信息
    async loadAccountInfo() {
      // 防止重复调用
      if (this.loadingAccountInfo) {
        console.log('📋 账户信息正在加载中，跳过重复请求')
        return
      }
      
      // 检查缓存是否有效（5分钟内）
      const cachedInfo = localStorage.getItem('acc_account_info')
      if (cachedInfo) {
        try {
          const parsed = JSON.parse(cachedInfo)
          const cacheTime = new Date(parsed.loadedAt)
          const now = new Date()
          const diffMinutes = (now - cacheTime) / (1000 * 60)
          
          if (diffMinutes < 5) {
            console.log('📋 使用缓存的账户信息 (缓存时间:', diffMinutes.toFixed(1), '分钟)')
            return
          }
        } catch (e) {
          console.warn('⚠️ 解析缓存的账户信息失败:', e)
        }
      }
      
      this.loadingAccountInfo = true
      try {
        console.log('📋 正在获取账户信息...')
        const response = await axios.get('/api/auth/account-info', {
          timeout: 15000 // 增加超时时间到15秒
        })
        console.log('📋 账户信息API响应:', response.data)
        
        if (response.data && response.data.status === 'success' && response.data.user) {
          const user = response.data.user
          console.log(`👤 账户信息已加载: ${user.userName}`)
          
          // 保存账户信息到localStorage
          const accountInfo = {
            userName: user.userName,
            emailId: user.emailId,
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            loadedAt: new Date().toISOString()
          }
          localStorage.setItem('acc_account_info', JSON.stringify(accountInfo))
          console.log('💾 账户信息已保存到localStorage')
        } else {
          console.warn('⚠️ 账户信息响应格式异常:', response.data)
        }
      } catch (error) {
        console.error('❌ 获取账户信息失败:', error)
        console.error('错误详情:', error.response?.data || error.message)
      } finally {
        this.loadingAccountInfo = false
      }
    },

    // 加载项目信息
    async loadProjectsInfo() {
      // 检查缓存是否有效（10分钟内）
      const cachedData = localStorage.getItem('global_monitoring_projects_cache')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          const cacheTime = new Date(parsed.timestamp)
          const now = new Date()
          const diffMinutes = (now - cacheTime) / (1000 * 60)
          
          if (diffMinutes < 10) {
            console.log('📋 使用缓存的项目信息 (缓存时间:', diffMinutes.toFixed(1), '分钟)')
            this.projectsCache = parsed.projects || {}
            this.projectsCacheLoaded = true
            return
          }
        } catch (e) {
          console.warn('⚠️ 解析缓存的项目信息失败:', e)
        }
      }
      
      try {
        console.log('📋 正在获取项目信息...')
        const response = await axios.get('/api/auth/projects')
        console.log('📋 项目信息API响应:', response.data)
        
         if (response.data.status === 'success') {
           const projectsData = response.data.projects
           let projects = []
           
           // 检查是否有警告信息（权限不足等）
           if (response.data.warning) {
             console.warn('⚠️ 项目获取警告:', response.data.warning)
             if (this.$message) {
               this.$message.warning(`项目获取警告: ${response.data.warning}`)
             }
           }
           
           // 处理不同的数据格式
           if (Array.isArray(projectsData)) {
             projects = projectsData
           } else if (projectsData && typeof projectsData === 'object') {
             // 检查是否有list字段（ACC API的标准格式）
             if (projectsData.list && Array.isArray(projectsData.list)) {
               projects = projectsData.list
             } else if (projectsData.results && Array.isArray(projectsData.results)) {
               projects = projectsData.results
             } else {
               projects = Object.values(projectsData)
             }
           }
          
          // 构建项目ID到名称的映射
          this.projectsCache = {}
          
          projects.forEach((project) => {
            if (project && project.id && project.name) {
              this.projectsCache[project.id] = project.name
            }
          })
          
          // 保存到localStorage，带时间戳
          const cacheData = {
            projects: this.projectsCache,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem('global_monitoring_projects_cache', JSON.stringify(cacheData))
          this.projectsCacheLoaded = true
          
          if (projects.length === 0 && response.data.warning) {
            console.log(`⚠️ 项目信息加载完成但没有可访问的项目: ${response.data.warning}`)
          } else {
            console.log(`✅ 项目信息加载完成: ${projects.length} 个项目已缓存`)
          }
        } else {
          console.warn('⚠️ 项目信息API响应状态异常:', response.data)
        }
      } catch (error) {
        console.error('❌ 获取项目信息失败:', error)
        console.error('错误详情:', error.response?.data || error.message)
      }
    },

    handleTokenRefreshed() {
      console.log('Token已刷新')
      // 可以在这里执行一些刷新后的操作
    },

    handleLoggedOut() {
      this.showTokenStatus = false
      console.log('用户已登出')
    },

    handleLanguageChanged(event) {
      console.log('语言已切换:', event)
      // 可以在这里添加语言切换后的额外处理逻辑
      // 例如重新加载某些数据、更新页面标题等
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  position: relative;
}

/* 语言切换器样式 */
.language-switcher-container {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .language-switcher-container {
    background: rgba(30, 30, 30, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .language-switcher-container {
    top: 10px;
    left: 10px;
    padding: 6px;
  }
}
</style>

