import { createApp, ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Element Plus 国际化
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import axios from 'axios'
import App from './App.vue'
// 引入事件总线
import eventBus from './utils/eventBus'
// 导入通用样式
import './styles/common.css'
// 引入i18n
import i18n from './i18n'
import Login from './views/Login.vue'
import Home from './views/Home.vue'
import AuthSuccess from './views/AuthSuccess.vue'
import AccountInfo from './views/AccountInfo.vue'
import FormsData from './views/FormsData.vue'
import FormsTemplates from './views/FormsTemplates.vue'
import DataConnectorSync from './views/DataConnectorSync.vue'
// import ProjectInfo from './views/ProjectInfo.vue' // 已整合到AccountInfo页面
import ApprovalWorkflows from './views/ApprovalWorkflows.vue'
import Reviews from './views/Reviews.vue'
import RfisData from './views/RfisData.vue'
import IssuesData from './views/IssuesData.vue'
import AutospecsPackagesData from './views/AutospecsPackagesData.vue'
import SystemStatus from './views/SystemStatus.vue'
import DownloadConfig from './views/DownloadConfig.vue'
import DownloadTasks from './views/DownloadTasks.vue'
import PermissionsSync from './views/PermissionsSync.vue'
import FileBrowser from './views/FileBrowser.vue'
import ProjectUsers from './views/ProjectUsers.vue'
import SubmittalView from './views/SubmittalView.vue'
import SubmittalDetailView from './views/SubmittalDetailView.vue'
import IssueDetailView from './views/IssueDetailView.vue'
import SyncProgress from './views/SyncProgress.vue'
import SyncHistory from './views/SyncHistory.vue'

// 配置axios支持cookies
axios.defaults.withCredentials = true

// 添加axios响应拦截器处理Token过期和401错误
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

axios.interceptors.response.use(
  (response) => {
    // 正常响应直接返回
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 如果是401错误且不是已经重试过的请求，且不是refresh-token请求本身
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/auth/refresh-token')) {
      
      if (isRefreshing) {
        // 如果正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token
          return axios(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        console.log('🔄 Received 401 error, attempting to refresh auth...')
        
        // 尝试刷新Token
        const refreshResponse = await axios.post('/api/auth/refresh-token')
        
        if (refreshResponse.data.status === 'success') {
          console.log('✅ Token refreshed successfully, retrying request...')
          
          // 清除认证缓存，强制重新检查
          clearAuthCache()
          
          // 处理队列中的请求
          processQueue(null, refreshResponse.data.token)
          
          // 重试原始请求
          return axios(originalRequest)
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.message)
        
        // 处理队列中的请求
        processQueue(refreshError, null)
        
        // 如果刷新失败，清除缓存并跳转到登录页
        clearAuthCache()
        
        // 避免在登录页面时无限重定向
        if (window.location.pathname !== '/login') {
          console.log('Redirecting to login due to auth failure')
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    // 其他错误直接抛出
    return Promise.reject(error)
  }
)

// 认证状态缓存
let authCache = {
  isAuthenticated: null,
  lastCheck: 0,
  cacheTimeout: 30000 // 30秒缓存
}

// 检查认证状态的函数
async function checkAuth(forceRefresh = false) {
  const now = Date.now()
  
  // 如果有缓存且未过期，直接返回缓存结果
  if (!forceRefresh && authCache.isAuthenticated !== null && 
      (now - authCache.lastCheck) < authCache.cacheTimeout) {
    console.log('Using cached auth status:', authCache.isAuthenticated)
    return authCache.isAuthenticated
  }
  
  try {
    console.log('Checking auth status from server...')
    const response = await axios.get('/api/auth/check', {
      timeout: 8000 // 增加到8秒超时，给Token刷新更多时间
    })
    
    authCache.isAuthenticated = response.data.authenticated
    authCache.lastCheck = now
    
    console.log('Auth status updated:', authCache.isAuthenticated)
    return response.data.authenticated
  } catch (error) {
    console.log('Auth check failed:', error.message)
    
    // 如果是401错误，说明需要重新认证
    if (error.response?.status === 401) {
      console.log('Auth check returned 401, user needs to login')
      authCache.isAuthenticated = false
      authCache.lastCheck = now
      return false
    }
    
    // 如果是网络错误或超时且有缓存，使用缓存
    if (authCache.isAuthenticated !== null && 
        (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR')) {
      console.log('Using cached auth due to network issue:', error.code)
      return authCache.isAuthenticated
    }
    
    // 其他错误，假设未认证
    authCache.isAuthenticated = false
    authCache.lastCheck = now
    return false
  }
}

// 清除认证缓存的函数
function clearAuthCache() {
  authCache.isAuthenticated = null
  authCache.lastCheck = 0
}

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: Login, meta: { requiresAuth: false } },
  { path: '/api', redirect: '/' },
  { path: '/auth/success', component: AuthSuccess, meta: { requiresAuth: false } },
  { path: '/account-info', component: AccountInfo, meta: { requiresAuth: true } },
  { path: '/project-info', redirect: '/account-info' }, // 重定向到整合的账户信息页面
  { path: '/forms/jarvis', component: FormsData, meta: { requiresAuth: true } },
  { path: '/forms/templates', component: FormsTemplates, meta: { requiresAuth: true } },
  { path: '/data-connector/sync', component: DataConnectorSync, meta: { requiresAuth: true } },
  { path: '/reviews/workflows', component: ApprovalWorkflows, meta: { requiresAuth: true } },
  { path: '/reviews/data', component: Reviews, meta: { requiresAuth: true } },
  { path: '/rfis/data', component: RfisData, meta: { requiresAuth: true } },
  { path: '/rfis/statistics', redirect: '/rfis/data' }, // 重定向到整合的RFI数据页面
  { path: '/issues/data', component: IssuesData, meta: { requiresAuth: true } },
  { path: '/autospecs-packages/data', component: AutospecsPackagesData, meta: { requiresAuth: true } },
  { path: '/system/status', component: SystemStatus, meta: { requiresAuth: true } },
  { path: '/download-config', component: DownloadConfig, meta: { requiresAuth: true } },
  { path: '/download-tasks', component: DownloadTasks, meta: { requiresAuth: true } },
  { path: '/permissions-sync', component: PermissionsSync, meta: { requiresAuth: true } },
  { path: '/file-browser', component: FileBrowser, meta: { requiresAuth: true } },
  { path: '/project-users', component: ProjectUsers, meta: { requiresAuth: true } },
  { path: '/submittals/data', component: SubmittalView, meta: { requiresAuth: true } },
  { path: '/submittals/detail', component: SubmittalDetailView, meta: { requiresAuth: true } },
  { path: '/rfis/detail', component: () => import('./views/RfiDetailView.vue'), meta: { requiresAuth: true } },
  { path: '/issues/detail', component: IssueDetailView, meta: { requiresAuth: true } },
  { path: '/sync-progress/:projectId/:projectName/:syncType', component: SyncProgress, meta: { requiresAuth: true } },
  { path: '/sync-history/:projectId', component: SyncHistory, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  console.log('Navigating to:', to.path, 'from:', from.path)
  
  // 如果路由不需要认证，直接通过
  if (to.meta.requiresAuth === false) {
    console.log('Route does not require auth, proceeding')
    next()
    return
  }

  // 特殊处理：如果从认证成功页面跳转，强制刷新认证状态
  const forceRefresh = from.path === '/auth/success' || to.query.forceAuthCheck === 'true'
  
  // 检查认证状态
  console.log('Checking authentication...', forceRefresh ? '(forced refresh)' : '')
  const isAuthenticated = await checkAuth(forceRefresh)
  console.log('Authentication result:', isAuthenticated)
  
  if (isAuthenticated) {
    // 已认证，允许访问
    next()
  } else {
    // 未认证，跳转到登录页
    if (to.path !== '/login') {
      console.log('Redirecting to login page')
      next('/login')
    } else {
      next()
    }
  }
})

// 获取Element Plus语言包
const getElementLocale = () => {
  const currentLang = i18n.global.locale.value
  return currentLang === 'en' ? en : zhCn
}

const app = createApp(App)
app.use(router)
app.use(i18n)
app.use(ElementPlus, {
  locale: getElementLocale()
})
app.use(ArcoVue)

// 提供Element Plus语言包的响应式引用
const elementLocale = ref(getElementLocale())
app.provide('elementLocale', elementLocale)

// 注册事件总线为全局属性
app.config.globalProperties.$eventBus = eventBus

// 注册 axios 为全局属性
app.config.globalProperties.$axios = axios

// 监听语言切换事件，更新Element Plus语言
window.addEventListener('language-changed', () => {
  // 更新Element Plus语言包
  const newLocale = getElementLocale()
  elementLocale.value = newLocale
  console.log('Updated Element Plus locale to:', newLocale)
})

// 监听页面卸载事件，清理所有异步操作
window.addEventListener('beforeunload', () => {
  console.log('🚫 页面即将卸载，cancel所有异步操作...')
  
  // 导入并调用projectDataStore的清理方法
  import('./utils/projectDataStore.js').then(({ default: projectDataStore }) => {
    if (projectDataStore && typeof projectDataStore.cancelAllAsyncOperations === 'function') {
      projectDataStore.cancelAllAsyncOperations()
    }
  }).catch(error => {
    console.warn('⚠️ 清理异步操作时出错:', error)
  })
})

// 监听页面隐藏事件（用户切换标签页或最小化窗口）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📱 页面已隐藏，暂停非必要的异步操作...')
    
    // 可以在这里添加暂停逻辑
    import('./utils/projectDataStore.js').then(({ default: projectDataStore }) => {
      if (projectDataStore && typeof projectDataStore.cancelAllAsyncOperations === 'function') {
        // 只cancel非关键的异步操作
        console.log('⏸️ 暂停后台异步操作')
      }
    }).catch(error => {
      console.warn('⚠️ 暂停异步操作时出错:', error)
    })
  } else {
    console.log('👁️ 页面已显示，恢复正常操作...')
  }
})

app.mount('#app')
