<template>
  <div class="permissions-sync">
    <!-- 页面标题 -->
    <PageHeader 
      title="Folder Permissions Sync" 
      subtitle="Sync and download folder permission information for ACC projects"
    />

    <!-- 项目选择器 -->
    <BaseCard class="mb-6">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">选择项目</h3>
      </template>
      
      <ProjectSelector 
        v-model="selectedProject"
        @update:modelValue="onProjectChange"
        :disabled="isLoading"
      />
    </BaseCard>

    <!-- 同步配置 -->
    <BaseCard class="mb-6" v-if="selectedProject">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">同步配置</h3>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            最大文件夹深度
          </label>
          <select 
            v-model="syncConfig.maxDepth" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          >
            <option value="3">3层（快速）</option>
            <option value="5">5层（推荐）</option>
            <option value="8">8层（完整）</option>
            <option value="10">10层（深度）</option>
          </select>
        </div>
        
        <div>
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="syncConfig.includeEmptyFolders"
              class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              :disabled="isLoading"
            >
            <span class="text-sm text-gray-700">包含无权限的文件夹</span>
          </label>
        </div>
      </div>
    </BaseCard>

    <!-- 操作按钮 -->
    <BaseCard class="mb-6" v-if="selectedProject">
      <div class="flex flex-wrap gap-4">
        <button
          @click="syncProjectPermissions"
          :disabled="isLoading"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? 'Syncing...' : 'Sync Permissions' }}
        </button>
        
        <button
          @click="downloadPermissions"
          :disabled="isLoading || !permissionsData"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          下载 JSON 数据
        </button>
        
        <button
          @click="clearData"
          :disabled="isLoading"
          class="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          清除数据
        </button>
      </div>
    </BaseCard>

    <!-- 同步进度 -->
    <BaseCard class="mb-6" v-if="syncProgress.show">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">同步进度</h3>
      </template>
      
      <div class="space-y-4">
        <div class="flex justify-between text-sm text-gray-600">
          <span>{{ syncProgress.current }} / {{ syncProgress.total }} 文件夹</span>
          <span>{{ Math.round((syncProgress.current / syncProgress.total) * 100) }}%</span>
        </div>
        
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }"
          ></div>
        </div>
        
        <div class="text-sm text-gray-500">
          {{ syncProgress.message }}
        </div>
      </div>
    </BaseCard>

    <!-- 权限数据统计 -->
    <BaseCard class="mb-6" v-if="permissionsData">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900">权限统计</h3>
      </template>
      
      <StatsSection :stats="permissionStats" />
    </BaseCard>

    <!-- 权限数据表格 -->
    <BaseCard v-if="permissionsData">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">权限详情</h3>
          <div class="flex items-center space-x-4">
            <select 
              v-model="selectedFolderFilter" 
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有文件夹</option>
              <option v-for="folder in uniqueFolders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
            
            <select 
              v-model="selectedPermissionLevel" 
              class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有权限级别</option>
              <option value="0">无权限</option>
              <option value="1">查看</option>
              <option value="2">查看/下载</option>
              <option value="3">查看/下载/标记</option>
              <option value="4">查看/下载/标记/上传</option>
              <option value="5">完全编辑</option>
              <option value="6">完全控制</option>
            </select>
          </div>
        </div>
      </template>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                文件夹路径
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                用户/角色/公司
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                类型
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                权限级别
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                详细权限
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="folder in filteredPermissions" :key="folder.folder_info.id">
              <template v-if="folder.permissions">
                <!-- 用户权限 -->
                <tr v-for="user in folder.permissions.users" :key="`${folder.folder_info.id}-user-${user.subject_id}`" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ folder.folder_info.path }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="user.subject_type" :variant="getSubjectTypeVariant(user.subject_type)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag 
                      :status="user.permission_name" 
                      :variant="getPermissionLevelVariant(user.permission_level)"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="user.subject_status" :variant="getStatusVariant(user.subject_status)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex flex-wrap gap-1">
                      <span v-if="user.detailed_permissions.canView" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        查看
                      </span>
                      <span v-if="user.detailed_permissions.canDownload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        下载
                      </span>
                      <span v-if="user.detailed_permissions.canUpload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        上传
                      </span>
                      <span v-if="user.detailed_permissions.canEdit" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        编辑
                      </span>
                      <span v-if="user.detailed_permissions.canControl" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        控制
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- 角色权限 -->
                <tr v-for="role in folder.permissions.roles" :key="`${folder.folder_info.id}-role-${role.subject_id}`" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ folder.folder_info.path }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ role.name }}</div>
                    <div class="text-sm text-gray-500">角色</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="role.subject_type" :variant="getSubjectTypeVariant(role.subject_type)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag 
                      :status="role.permission_name" 
                      :variant="getPermissionLevelVariant(role.permission_level)"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="role.subject_status" :variant="getStatusVariant(role.subject_status)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex flex-wrap gap-1">
                      <span v-if="role.detailed_permissions.canView" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        查看
                      </span>
                      <span v-if="role.detailed_permissions.canDownload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        下载
                      </span>
                      <span v-if="role.detailed_permissions.canUpload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        上传
                      </span>
                      <span v-if="role.detailed_permissions.canEdit" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        编辑
                      </span>
                      <span v-if="role.detailed_permissions.canControl" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        控制
                      </span>
                    </div>
                  </td>
                </tr>
                
                <!-- 公司权限 -->
                <tr v-for="company in folder.permissions.companies" :key="`${folder.folder_info.id}-company-${company.subject_id}`" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ folder.folder_info.path }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ company.name }}</div>
                    <div class="text-sm text-gray-500">公司</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="company.subject_type" :variant="getSubjectTypeVariant(company.subject_type)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag 
                      :status="company.permission_name" 
                      :variant="getPermissionLevelVariant(company.permission_level)"
                    />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <StatusTag :status="company.subject_status" :variant="getStatusVariant(company.subject_status)" />
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex flex-wrap gap-1">
                      <span v-if="company.detailed_permissions.canView" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        查看
                      </span>
                      <span v-if="company.detailed_permissions.canDownload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        下载
                      </span>
                      <span v-if="company.detailed_permissions.canUpload" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        上传
                      </span>
                      <span v-if="company.detailed_permissions.canEdit" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        编辑
                      </span>
                      <span v-if="company.detailed_permissions.canControl" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        控制
                      </span>
                    </div>
                  </td>
                </tr>
              </template>
              
              <!-- 无权限数据的文件夹 -->
              <tr v-else class="hover:bg-gray-50 bg-red-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ folder.folder_info.path }}
                </td>
                <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  {{ folder.error || 'Unable to get permission information' }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- 错误信息 -->
    <ErrorState 
      v-if="error" 
      :message="error" 
      @retry="syncProjectPermissions"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import BaseCard from '@/components/BaseCard.vue'
import ProjectSelector from '@/components/ProjectSelector.vue'
import StatsSection from '@/components/StatsSection.vue'
import StatusTag from '@/components/StatusTag.vue'
import ErrorState from '@/components/ErrorState.vue'

export default {
  name: 'PermissionsSync',
  components: {
    PageHeader,
    BaseCard,
    ProjectSelector,
    StatsSection,
    StatusTag,
    ErrorState
  },
  setup() {
    // 响应式数据
    const selectedProject = ref(null)
    const isLoading = ref(false)
    const error = ref('')
    const permissionsData = ref(null)
    const selectedFolderFilter = ref('')
    const selectedPermissionLevel = ref('')
    
    // 同步配置
    const syncConfig = ref({
      maxDepth: 5,
      includeEmptyFolders: true
    })
    
    // 同步进度
    const syncProgress = ref({
      show: false,
      current: 0,
      total: 0,
      message: ''
    })
    
    // 计算属性
    const permissionStats = computed(() => {
      if (!permissionsData.value) return []
      
      const stats = permissionsData.value.statistics
      return [
        { label: 'Total Folders', value: stats.total_folders, color: 'blue' },
        { label: 'Successful Syncs', value: stats.successful_syncs, color: 'green' },
        { label: 'Failed Syncs', value: stats.failed_syncs, color: 'red' },
        { label: 'Total Users', value: stats.total_users, color: 'purple' },
        { label: 'Total Roles', value: stats.total_roles, color: 'yellow' },
        { label: 'Total Companies', value: stats.total_companies, color: 'indigo' }
      ]
    })
    
    const uniqueFolders = computed(() => {
      if (!permissionsData.value) return []
      
      return permissionsData.value.folders.map(folder => ({
        id: folder.folder_info.id,
        name: folder.folder_info.name
      }))
    })
    
    const filteredPermissions = computed(() => {
      if (!permissionsData.value) return []
      
      let filtered = permissionsData.value.folders
      
      // 按文件夹过滤
      if (selectedFolderFilter.value) {
        filtered = filtered.filter(folder => 
          folder.folder_info.id === selectedFolderFilter.value
        )
      }
      
      // 按权限级别过滤
      if (selectedPermissionLevel.value !== '') {
        const level = parseInt(selectedPermissionLevel.value)
        filtered = filtered.filter(folder => {
          if (!folder.permissions) return false
          
          const hasMatchingLevel = [
            ...folder.permissions.users,
            ...folder.permissions.roles,
            ...folder.permissions.companies
          ].some(subject => subject.permission_level === level)
          
          return hasMatchingLevel
        })
      }
      
      return filtered
    })
    
    // 方法
    const onProjectChange = (project) => {
      selectedProject.value = project
      permissionsData.value = null
      error.value = ''
    }
    
    const syncProjectPermissions = async () => {
      if (!selectedProject.value) {
        error.value = 'Please select a project first'
        return
      }
      
      isLoading.value = true
      error.value = ''
      syncProgress.value.show = true
      syncProgress.value.current = 0
      syncProgress.value.message = 'Starting permission sync...'
      
      try {
        const params = new URLSearchParams({
          maxDepth: syncConfig.value.maxDepth,
          includeEmptyFolders: syncConfig.value.includeEmptyFolders
        })
        
        const response = await fetch(
          `/api/permissions-sync/project/${selectedProject.value.id}/sync?${params}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
        
        const data = await response.json()
        
        if (response.ok && data.status === 'success') {
          permissionsData.value = data.data
          syncProgress.value.current = data.data.statistics.successful_syncs
          syncProgress.value.total = data.data.statistics.total_folders
          syncProgress.value.message = 'Sync completed!'
          
          setTimeout(() => {
            syncProgress.value.show = false
          }, 2000)
        } else {
          throw new Error(data.error || 'Sync failed')
        }
      } catch (err) {
        error.value = err.message
        syncProgress.value.show = false
      } finally {
        isLoading.value = false
      }
    }
    
    const downloadPermissions = async () => {
      if (!selectedProject.value) {
        error.value = 'Please select a project first'
        return
      }
      
      try {
        const params = new URLSearchParams({
          maxDepth: syncConfig.value.maxDepth,
          includeEmptyFolders: syncConfig.value.includeEmptyFolders
        })
        
        const response = await fetch(
          `/api/permissions-sync/project/${selectedProject.value.id}/download?${params}`,
          {
            method: 'GET'
          }
        )
        
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          
          // 从响应头获取文件名
          const contentDisposition = response.headers.get('Content-Disposition')
          let filename = `project_${selectedProject.value.id}_permissions.json`
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/)
            if (filenameMatch) {
              filename = filenameMatch[1]
            }
          }
          
          a.download = filename
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Download failed')
        }
      } catch (err) {
        error.value = err.message
      }
    }
    
    const clearData = () => {
      permissionsData.value = null
      error.value = ''
      selectedFolderFilter.value = ''
      selectedPermissionLevel.value = ''
      syncProgress.value.show = false
    }
    
    // 辅助方法
    const getSubjectTypeVariant = (type) => {
      const variants = {
        'USER': 'blue',
        'ROLE': 'purple',
        'COMPANY': 'green'
      }
      return variants[type] || 'gray'
    }
    
    const getPermissionLevelVariant = (level) => {
      const variants = {
        0: 'gray',
        1: 'blue',
        2: 'green',
        3: 'yellow',
        4: 'orange',
        5: 'red',
        6: 'purple'
      }
      return variants[level] || 'gray'
    }
    
    const getStatusVariant = (status) => {
      const variants = {
        'ACTIVE': 'green',
        'INACTIVE': 'gray',
        'PENDING': 'yellow',
        'DISABLED': 'red'
      }
      return variants[status] || 'gray'
    }
    
    return {
      selectedProject,
      isLoading,
      error,
      permissionsData,
      selectedFolderFilter,
      selectedPermissionLevel,
      syncConfig,
      syncProgress,
      permissionStats,
      uniqueFolders,
      filteredPermissions,
      onProjectChange,
      syncProjectPermissions,
      downloadPermissions,
      clearData,
      getSubjectTypeVariant,
      getPermissionLevelVariant,
      getStatusVariant
    }
  }
}
</script>

<style scoped>
.permissions-sync {
  @apply p-6 max-w-7xl mx-auto;
}
</style>
