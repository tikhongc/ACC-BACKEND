<template>
  <div class="project-users">
    <!-- 面包屑导航 -->
    <Breadcrumb :items="breadcrumbItems" />

    <!-- 主要内容区域 -->
    <div v-if="selectedProject" class="main-content">
      <!-- 加载状态 -->
      <LoadingState 
        v-if="loading" 
        type="card"
        title="Loading User Data"
        text="Loading user data..."
        size="default"
      />
      
      <!-- 项目信息栏 -->
      <el-card v-else class="project-info-card">
        <div class="project-info">
          <div class="project-details">
            <h3>{{ selectedProject.name }}</h3>
            <p class="project-id">Project ID: {{ selectedProject.id }}</p>
          </div>
          <div class="project-actions">
            <el-button @click="forceRefreshData" :loading="loading" type="primary">
              <el-icon><Refresh /></el-icon>
              Force Refresh
            </el-button>
            <el-button @click="downloadFullData">
              <el-icon><Download /></el-icon>
              Download User Data
            </el-button>
            <el-button @click="goToFileBrowser" type="success">
              <el-icon><Folder /></el-icon>
              File Browser
            </el-button>
            <el-button @click="changeProject" type="info">
              <el-icon><Switch /></el-icon>
              Switch Project
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <div v-if="userData" class="statistics-row">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.users?.total_project_users || userData?.statistics?.total_users || 0 }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.users?.active_users || userData?.statistics?.active_users || 0 }}</div>
            <div class="stat-label">Active Users</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.users?.pending_users || userData?.statistics?.pending_users || 0 }}</div>
            <div class="stat-label">Pending Users</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.permissions?.total_companies || userData?.statistics?.companies || 0 }}</div>
            <div class="stat-label">Companies</div>
          </div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">{{ unifiedStats?.permissions?.total_roles || userData?.statistics?.roles || 0 }}</div>
            <div class="stat-label">Roles</div>
          </div>
        </el-card>
      </div>

      <!-- 搜索和筛选 -->
      <el-card v-if="userData" class="filter-card">
        <div class="filter-row">
          <el-input
            v-model="searchName"
            placeholder="Search username"
            :prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearch"
          />
          <el-input
            v-model="searchEmail"
            placeholder="Search email"
            :prefix-icon="Message"
            clearable
            class="search-input"
            @input="handleSearch"
          />
          <el-select
            v-model="statusFilter"
            placeholder="User status"
            clearable
            class="status-filter"
            @change="handleSearch"
          >
            <el-option label="All Status" value="" />
            <el-option label="Active" value="active" />
            <el-option label="Pending" value="pending" />
            <el-option label="Disabled" value="disabled" />
          </el-select>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            Search
          </el-button>
        </div>
      </el-card>

      <!-- 用户列表 -->
      <el-card v-if="userData" class="users-table-card">
        <template #header>
          <div class="card-header">
            <span>User List</span>
            <div class="header-actions">
              <el-button size="small" @click="exportUsers">
                <el-icon><Download /></el-icon>
                Export Users
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredUsers"
          @row-click="handleUserClick"
          highlight-current-row
          class="users-table"
          v-loading="searching"
        >
          <el-table-column prop="imageUrl" label="Avatar" width="80" align="center">
            <template #default="{ row }">
              <el-avatar 
                :src="row.imageUrl" 
                :alt="row.name"
                size="small"
              >
                {{ row.name?.charAt(0) || 'U' }}
              </el-avatar>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="Name" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="user-name">
                <span class="name">{{ row.name }}</span>
                <span v-if="row.jobTitle" class="job-title">{{ translateJobTitle(row.jobTitle) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="email" label="Email" min-width="200" show-overflow-tooltip />

          <el-table-column prop="companyName" label="Company" min-width="150" show-overflow-tooltip />

          <el-table-column prop="roles" label="Roles" min-width="150">
            <template #default="{ row }">
              <div class="roles-container">
                <el-tag 
                  v-for="role in row.roles?.slice(0, 2)" 
                  :key="role.id" 
                  size="small" 
                  class="role-tag"
                >
                  {{ role.name }}
                </el-tag>
                <el-tooltip 
                  v-if="row.roles?.length > 2" 
                  :content="row.roles.slice(2).map(r => r.name).join(', ')"
                  placement="top"
                >
                  <el-tag size="small" type="info">+{{ row.roles.length - 2 }}</el-tag>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="Status" width="100" align="center">
            <template #default="{ row }">
              <StatusTag 
                :status="getUserStatusType(row.status)"
                :text="getUserStatusText(row.status)"
                size="small"
              />
            </template>
          </el-table-column>

          <el-table-column prop="accessLevels" label="Access Levels" width="120" align="center">
            <template #default="{ row }">
              <div class="access-levels">
                <el-tag v-if="row.accessLevels?.accountAdmin" type="danger" size="small">Account Admin</el-tag>
                <el-tag v-else-if="row.accessLevels?.projectAdmin" type="warning" size="small">Project Admin</el-tag>
                <el-tag v-else-if="row.accessLevels?.executive" type="success" size="small">Executive</el-tag>
                <el-tag v-else type="info" size="small">Regular User</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="addedOn" label="Joined Time" width="120" align="center">
            <template #default="{ row }">
              {{ formatDate(row.addedOn) }}
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="100" align="center">
            <template #default="{ row }">
              <el-button 
                size="small" 
                type="primary" 
                text
                @click.stop="handleUserClick(row)"
              >
                Details
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div v-if="userData?.pagination" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="userData.pagination.totalResults || 0"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 用户详情抽屉 -->
    <el-drawer
      v-model="showUserDrawer"
      :title="selectedUser ? selectedUser.name : ''"
      direction="rtl"
      size="50%"
    >
      <UserDetailPanel 
        v-if="selectedUser"
        :user="selectedUser"
        :project-id="selectedProject?.id"
      />
    </el-drawer>

    <!-- 项目选择器对话框 -->
    <ProjectSelector 
      v-model="showProjectSelector"
      @confirm="handleProjectSelected"
      @cancel="handleCancel"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Switch, Search, Message, Folder } from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ProjectSelector from '@/components/ProjectSelector.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusTag from '@/components/StatusTag.vue'
import UserDetailPanel from '@/components/UserDetailPanel.vue'
import projectDataStore from '@/utils/projectDataStore.js'

export default {
  name: 'ProjectUsers',
  components: {
    Breadcrumb,
    ProjectSelector,
    LoadingState,
    StatusTag,
    UserDetailPanel,
    Refresh,
    Download,
    Switch,
    Search,
    Message,
    Folder
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 响应式数据
    const selectedProject = ref(null)
    const userData = ref(null)
    const loading = ref(false)
    const searching = ref(false)
    const showUserDrawer = ref(false)
    const selectedUser = ref(null)
    const showProjectSelector = ref(false)
    
    // 统一统计数据
    const unifiedStats = ref(null)
    
    // 搜索和筛选
    const searchName = ref('')
    const searchEmail = ref('')
    const statusFilter = ref('')
    const currentPage = ref(1)
    const pageSize = ref(20)

    // 面包屑导航
    const breadcrumbItems = computed(() => {
      const items = [
        { text: 'Home', path: '/' },
        { text: 'Project Management', path: '/project-management' }
      ]
      
      // 如果是从文件浏览器跳转过来的，添加文件浏览器链接
      if (route.query.from === 'file-browser' && selectedProject.value) {
        items.push({
          text: 'File Browser',
          path: '/file-browser',
          query: {
            projectId: selectedProject.value.id,
            projectName: selectedProject.value.name
          }
        })
      }
      
      items.push({ text: 'User Management', path: '/project-users' })
      return items
    })

    // 过滤后的用户列表
    const filteredUsers = computed(() => {
      if (!userData.value?.users) return []
      
      let users = userData.value.users
      
      // 按名称搜索
      if (searchName.value) {
        const search = searchName.value.toLowerCase()
        users = users.filter(u => 
          u.name?.toLowerCase().includes(search) ||
          u.firstName?.toLowerCase().includes(search) ||
          u.lastName?.toLowerCase().includes(search)
        )
      }
      
      // 按邮箱搜索
      if (searchEmail.value) {
        const search = searchEmail.value.toLowerCase()
        users = users.filter(u => 
          u.email?.toLowerCase().includes(search)
        )
      }
      
      // 按状态筛选
      if (statusFilter.value) {
        users = users.filter(u => u.status === statusFilter.value)
      }
      
      return users
    })

    // 组件挂载时检查是否有项目信息
    onMounted(async () => {
      // 检查URL参数是否有项目信息
      if (route.query.projectId && route.query.projectName) {
        const projectFromQuery = {
          id: route.query.projectId,
          name: route.query.projectName
        }
        console.log('从URL参数获取项目信息:', projectFromQuery)
        selectedProject.value = projectFromQuery
        await loadUserData()
      } else {
        // 尝试从projectStore获取已选择的项目
        try {
          const { default: projectStore } = await import('../utils/projectStore.js')
          const savedProject = projectStore.getSelectedProject()
          if (savedProject) {
            console.log('从projectStore获取项目信息:', savedProject)
            selectedProject.value = savedProject
            await loadUserData()
          } else {
            // 没有项目信息，显示项目选择器
            showProjectSelector.value = true
          }
        } catch (error) {
          console.error('获取项目信息失败:', error)
          showProjectSelector.value = true
        }
      }
    })

    // 处理项目选择
    const handleProjectSelected = async (project) => {
      console.log('项目选择:', project)
      selectedProject.value = project
      showProjectSelector.value = false
      
      // 保存项目到projectStore
      try {
        const { default: projectStore } = await import('../utils/projectStore.js')
        projectStore.saveSelectedProject(project)
      } catch (error) {
        console.error('保存项目信息失败:', error)
      }
      
      console.log('开始加载用户数据...')
      await loadUserData()
    }

    // 加载用户数据（使用统一数据管理）
    const loadUserData = async (forceRefresh = false) => {
      if (!selectedProject.value) {
        console.log('没有选择项目，跳过加载')
        return
      }

      console.log('加载项目用户数据:', selectedProject.value.id)
      loading.value = true
      
      try {
        // 设置当前项目到数据存储
        projectDataStore.setCurrentProject(selectedProject.value)
        
        // 获取用户数据（优先使用缓存）
        const cachedUserData = await projectDataStore.getUserData(selectedProject.value.id, forceRefresh)
        if (cachedUserData) {
          userData.value = cachedUserData
        }
        
        // 尝试获取文件数据（如果还没有的话）
        await projectDataStore.getFileData(selectedProject.value.id, false)
        
        // 获取统一统计数据
        unifiedStats.value = projectDataStore.getUnifiedStats(selectedProject.value.id)
        
        if (userData.value) {
          ElMessage.success(`User data loaded successfully - found ${userData.value?.users?.length || 0} users`)
        }
        
      } catch (error) {
        console.error('加载用户数据失败:', error)
        ElMessage.error('Failed to load user data: ' + (error.response?.data?.error || error.message))
      } finally {
        loading.value = false
      }
    }

    // 搜索处理
    const handleSearch = async () => {
      if (!selectedProject.value) return
      
      searching.value = true
      try {
        const params = {
          limit: pageSize.value,
          offset: 0,
          sort: 'name'
        }
        
        if (searchName.value) {
          params['filter[name]'] = searchName.value
        }
        if (searchEmail.value) {
          params['filter[email]'] = searchEmail.value
        }
        if (statusFilter.value) {
          params['filter[status]'] = statusFilter.value
        }
        
        const response = await axios.get(`/api/users/project/${selectedProject.value.id}/users`, { params })
        
        let actualData = response.data
        if (response.data.status === 'success' && response.data.data) {
          actualData = response.data.data
        }
        
        userData.value = actualData
        currentPage.value = 1 // 重置到第一页
        
      } catch (error) {
        console.error('搜索用户失败:', error)
        ElMessage.error('Failed to search users: ' + (error.response?.data?.error || error.message))
      } finally {
        searching.value = false
      }
    }

    // 强制刷新数据
    const forceRefreshData = async () => {
      if (selectedProject.value) {
        try {
          ElMessage.info('Force refreshing data...')
          await projectDataStore.refreshProjectData(selectedProject.value.id)
          await loadUserData(true)
          ElMessage.success('Data refresh completed')
        } catch (error) {
          console.error('强制刷新失败:', error)
          ElMessage.error('Data refresh failed: ' + error.message)
        }
      }
    }

    // 下载完整数据
    const downloadFullData = async () => {
      try {
        const response = await axios.get(
          `/api/users/project/${selectedProject.value.id}/download-users`,
          {
            responseType: 'blob'
          }
        )
        
        const blob = new Blob([response.data], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        const projectName = selectedProject.value.name.replace(/[^a-zA-Z0-9]/g, '_')
        const fileName = `project_${projectName}_users_${Date.now()}.json`
        link.setAttribute('download', fileName)
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('User data download successful')
      } catch (error) {
        console.error('下载失败:', error)
        ElMessage.error('Download failed: ' + (error.response?.data?.error || error.message))
      }
    }

    // 切换项目
    const changeProject = () => {
      selectedProject.value = null
      userData.value = null
      showProjectSelector.value = true
    }

    // 跳转到文件浏览器
    const goToFileBrowser = () => {
      if (selectedProject.value) {
        // 保存当前项目到数据存储，确保数据互通
        projectDataStore.setCurrentProject(selectedProject.value)
        
        router.push({
          path: '/file-browser',
          query: {
            projectId: selectedProject.value.id,
            projectName: selectedProject.value.name,
            from: 'project-users'
          }
        })
        
        ElMessage.success('Redirecting to file browser page...')
      } else {
        ElMessage.warning('Please select a project first')
      }
    }

    // 处理cancel选择
    const handleCancel = () => {
      showProjectSelector.value = false
      // 如果没有选择项目，返回主页面
      if (!selectedProject.value) {
        router.push('/')
      }
    }

    // 处理用户点击
    const handleUserClick = (user) => {
      selectedUser.value = user
      showUserDrawer.value = true
    }

    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size
      loadUserData()
    }

    const handleCurrentChange = (page) => {
      currentPage.value = page
      loadUserData()
    }

    // 导出用户
    const exportUsers = () => {
      downloadFullData()
    }

    // 获取用户状态类型
    const getUserStatusType = (status) => {
      const statusMap = {
        'active': 'success',
        'pending': 'warning',
        'disabled': 'danger',
        'deleted': 'info'
      }
      return statusMap[status] || 'info'
    }

    // 获取用户状态文本
    const getUserStatusText = (status) => {
      const statusMap = {
        'active': 'Active',
        'pending': 'Pending',
        'disabled': 'Disabled',
        'deleted': 'Deleted'
      }
      return statusMap[status] || status || 'Unknown'
    }

    // 处理数据刷新
    const handleDataRefresh = () => {
      // 数据同步状态组件触发的刷新
      loadUserData(true)
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US')
      } catch (error) {
        return dateString
      }
    }

    // 翻译职位名称
    const translateJobTitle = (jobTitle) => {
      if (!jobTitle) return ''
      
      const jobTitleMap = {
        '建筑师': 'Architect',
        '设计师': 'Designer',
        '工程师': 'Engineer',
        '项目经理': 'Project Manager',
        '施工经理': 'Construction Manager',
        '监理': 'Supervisor',
        '技术员': 'Technician',
        '绘图员': 'Draftsman',
        '造价师': 'Cost Engineer',
        '结构工程师': 'Structural Engineer',
        '机电工程师': 'MEP Engineer',
        '室内设计师': 'Interior Designer',
        '景观设计师': 'Landscape Designer',
        '规划师': 'Planner',
        '顾问': 'Consultant',
        '总监': 'Director',
        '经理': 'Manager',
        '主管': 'Supervisor',
        '专员': 'Specialist',
        '助理': 'Assistant'
      }
      
      return jobTitleMap[jobTitle] || jobTitle
    }

    return {
      selectedProject,
      userData,
      loading,
      searching,
      showUserDrawer,
      selectedUser,
      showProjectSelector,
      unifiedStats,
      searchName,
      searchEmail,
      statusFilter,
      currentPage,
      pageSize,
      breadcrumbItems,
      filteredUsers,
      handleProjectSelected,
      handleCancel,
      loadUserData,
      handleSearch,
      forceRefreshData,
      downloadFullData,
      changeProject,
      goToFileBrowser,
      handleUserClick,
      handleSizeChange,
      handleCurrentChange,
      exportUsers,
      getUserStatusType,
      getUserStatusText,
      formatDate,
      translateJobTitle
    }
  }
}
</script>

<style scoped>
.project-users {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-info-card {
  margin-bottom: 20px;
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-details h3 {
  margin: 0 0 5px 0;
  color: #303133;
}

.project-id {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.project-actions {
  display: flex;
  gap: 10px;
}

.statistics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.status-filter {
  width: 120px;
}

.users-table-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.users-table {
  margin-bottom: 20px;
}

.user-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-weight: 500;
  color: #303133;
}

.job-title {
  font-size: 12px;
  color: #909399;
}

.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  max-width: 100px;
}

.access-levels {
  display: flex;
  justify-content: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-users {
    padding: 10px;
  }
  
  .project-info {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .project-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .statistics-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .status-filter {
    width: 100%;
  }
}
</style>
