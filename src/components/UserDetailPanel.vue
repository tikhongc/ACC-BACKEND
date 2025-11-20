<template>
  <div class="user-detail-panel">
    <!-- 用户basicInfo -->
    <div class="user-header">
      <div class="user-avatar">
        <el-avatar 
          :src="user.imageUrl" 
          :alt="user.name"
          :size="80"
        >
          {{ user.name?.charAt(0) || 'U' }}
        </el-avatar>
      </div>
      <div class="user-title">
        <h3>{{ user.name }}</h3>
        <p class="user-email">{{ user.email }}</p>
        <p v-if="user.jobTitle" class="job-title">{{ translateJobTitle(user.jobTitle) }}</p>
        <StatusTag 
          :status="getUserStatusType(user.status)"
          :text="getUserStatusText(user.status)"
          size="large"
        />
      </div>
    </div>

    <!-- 用户ID信息 -->
    <el-card class="info-card">
      <template #header>
        <span>Identity Information</span>
      </template>
      <div class="id-info">
        <div class="id-item">
          <span class="id-label">User ID:</span>
          <el-input 
            :model-value="user.id" 
            readonly 
            size="small"
          >
            <template #append>
              <el-button @click="copyToClipboard(user.id)" size="small">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
        <div v-if="user.autodeskId" class="id-item">
          <span class="id-label">Autodesk ID:</span>
          <el-input 
            :model-value="user.autodeskId" 
            readonly 
            size="small"
          >
            <template #append>
              <el-button @click="copyToClipboard(user.autodeskId)" size="small">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-card>

    <!-- basicInfo -->
    <el-card class="info-card">
      <template #header>
        <span>Basic Information</span>
      </template>
      <div class="basic-info">
        <div class="info-row" v-if="user.firstName || user.lastName">
          <span class="info-label">Full Name:</span>
          <span class="info-value">{{ `${user.firstName || ''} ${user.lastName || ''}`.trim() }}</span>
        </div>
        <div class="info-row" v-if="user.email">
          <span class="info-label">Email:</span>
          <span class="info-value">{{ user.email }}</span>
        </div>
        <div class="info-row" v-if="user.phone?.number">
          <span class="info-label">Phone:</span>
          <span class="info-value">
            {{ user.phone.number }}
            <span v-if="user.phone.extension"> Ext. {{ user.phone.extension }}</span>
            <el-tag v-if="user.phone.phoneType" size="small" class="phone-type">{{ user.phone.phoneType }}</el-tag>
          </span>
        </div>
        <div class="info-row" v-if="user.jobTitle">
          <span class="info-label">Job Title:</span>
          <span class="info-value">{{ translateJobTitle(user.jobTitle) }}</span>
        </div>
        <div class="info-row" v-if="user.industry">
          <span class="info-label">Industry:</span>
          <span class="info-value">{{ user.industry }}</span>
        </div>
        <div class="info-row" v-if="user.aboutMe">
          <span class="info-label">About Me:</span>
          <span class="info-value">{{ user.aboutMe }}</span>
        </div>
        <div class="info-row" v-if="user.addedOn">
          <span class="info-label">Joined Date:</span>
          <span class="info-value">{{ formatDateTime(user.addedOn) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 公司信息 -->
    <el-card v-if="user.companyName || user.companyId" class="info-card">
      <template #header>
        <span>Company Information</span>
      </template>
      <div class="company-info">
        <div class="info-row" v-if="user.companyName">
          <span class="info-label">Company Name:</span>
          <span class="info-value">{{ user.companyName }}</span>
        </div>
        <div class="info-row" v-if="user.companyId">
          <span class="info-label">Company ID:</span>
          <span class="info-value">{{ user.companyId }}</span>
        </div>
      </div>
    </el-card>

    <!-- 地址信息 -->
    <el-card v-if="hasAddressInfo" class="info-card">
      <template #header>
        <span>Address Information</span>
      </template>
      <div class="address-info">
        <div class="info-row" v-if="user.addressLine1">
          <span class="info-label">Address Line 1:</span>
          <span class="info-value">{{ user.addressLine1 }}</span>
        </div>
        <div class="info-row" v-if="user.addressLine2">
          <span class="info-label">Address Line 2:</span>
          <span class="info-value">{{ user.addressLine2 }}</span>
        </div>
        <div class="info-row" v-if="user.city">
          <span class="info-label">City:</span>
          <span class="info-value">{{ user.city }}</span>
        </div>
        <div class="info-row" v-if="user.stateOrProvince">
          <span class="info-label">State/Province:</span>
          <span class="info-value">{{ user.stateOrProvince }}</span>
        </div>
        <div class="info-row" v-if="user.postalCode">
          <span class="info-label">Postal Code:</span>
          <span class="info-value">{{ user.postalCode }}</span>
        </div>
        <div class="info-row" v-if="user.country">
          <span class="info-label">Country:</span>
          <span class="info-value">{{ user.country }}</span>
        </div>
      </div>
    </el-card>

    <!-- 权限级别 -->
    <el-card class="info-card">
      <template #header>
        <span>Access Levels</span>
      </template>
      <div class="access-levels">
        <div class="access-item">
          <span class="access-label">Account Admin:</span>
          <el-tag :type="user.accessLevels?.accountAdmin ? 'success' : 'info'">
            {{ user.accessLevels?.accountAdmin ? 'Yes' : 'No' }}
          </el-tag>
        </div>
        <div class="access-item">
          <span class="access-label">Project Admin:</span>
          <el-tag :type="user.accessLevels?.projectAdmin ? 'success' : 'info'">
            {{ user.accessLevels?.projectAdmin ? 'Yes' : 'No' }}
          </el-tag>
        </div>
        <div class="access-item">
          <span class="access-label">Executive:</span>
          <el-tag :type="user.accessLevels?.executive ? 'success' : 'info'">
            {{ user.accessLevels?.executive ? 'Yes' : 'No' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 角色信息 -->
    <el-card v-if="user.roles && user.roles.length > 0" class="info-card">
      <template #header>
        <span>Role Information ({{ user.roles.length }})</span>
      </template>
      <div class="roles-info">
        <div class="roles-grid">
          <el-tag 
            v-for="role in user.roles" 
            :key="role.id" 
            size="large"
            class="role-tag"
          >
            {{ role.name }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 产品权限 -->
    <el-card v-if="user.products && user.products.length > 0" class="info-card">
      <template #header>
        <span>Product Permissions ({{ user.products.length }})</span>
      </template>
      <div class="products-info">
        <div class="products-grid">
          <div 
            v-for="product in user.products" 
            :key="product.key" 
            class="product-item"
          >
            <div class="product-name">{{ getProductDisplayName(product.key) }}</div>
            <el-tag 
              :type="getAccessType(product.access)" 
              size="small"
            >
              {{ getAccessDisplayName(product.access) }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="downloadUserData">
        <el-icon><Download /></el-icon>
        Download User Data
      </el-button>
      <el-button @click="copyUserInfo">
        <el-icon><CopyDocument /></el-icon>
        Copy User Info
      </el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  CopyDocument, 
  Download
} from '@element-plus/icons-vue'
import StatusTag from './StatusTag.vue'

export default {
  name: 'UserDetailPanel',
  components: {
    CopyDocument,
    Download,
    StatusTag
  },
  props: {
    user: {
      type: Object,
      required: true
    },
    projectId: {
      type: String,
      required: false
    }
  },
  setup(props) {
    // 检查是否有地址信息
    const hasAddressInfo = computed(() => {
      return props.user.addressLine1 || 
             props.user.addressLine2 || 
             props.user.city || 
             props.user.stateOrProvince || 
             props.user.postalCode || 
             props.user.country
    })

    // 复制到剪贴板
    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        ElMessage.success('Copied to clipboard')
      } catch (error) {
        console.error('Copy failed:', error)
        ElMessage.error('Copy failed')
      }
    }

    // 下载用户数据
    const downloadUserData = () => {
      const dataStr = JSON.stringify(props.user, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = `user_${props.user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown'}_${Date.now()}.json`
      link.setAttribute('download', fileName)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('User data download successful')
    }

    // 复制用户信息
    const copyUserInfo = () => {
      const info = {
        name: props.user.name,
        email: props.user.email,
        id: props.user.id,
        autodeskId: props.user.autodeskId,
        company: props.user.companyName,
        jobTitle: props.user.jobTitle,
        status: props.user.status
      }
      
      const infoText = Object.entries(info)
        .filter(([key, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
      
      copyToClipboard(infoText)
    }

    // 格式化日期时间
    const formatDateTime = (dateTimeString) => {
      if (!dateTimeString) return 'N/A'
      try {
        const date = new Date(dateTimeString)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return dateTimeString
      }
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

    // 获取产品显示名称
    const getProductDisplayName = (key) => {
      const productMap = {
        'projectAdministration': 'Project Administration',
        'designCollaboration': 'Design Collaboration',
        'build': 'Build',
        'cost': 'Cost Management',
        'modelCoordination': 'Model Coordination',
        'docs': 'Document Management',
        'insight': 'Insight',
        'takeoff': 'Takeoff',
        'accountAdministration': 'Account Administration',
        'field': 'Field',
        'plan': 'Plan',
        'quantification': 'Quantification'
      }
      return productMap[key] || key
    }

    // 获取访问权限类型
    const getAccessType = (access) => {
      const accessMap = {
        'administrator': 'danger',
        'member': 'success',
        'viewer': 'info'
      }
      return accessMap[access] || 'info'
    }

    // 获取访问权限显示名称
    const getAccessDisplayName = (access) => {
      const accessMap = {
        'administrator': 'Administrator',
        'member': 'Member',
        'viewer': 'Viewer'
      }
      return accessMap[access] || access
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
      hasAddressInfo,
      copyToClipboard,
      downloadUserData,
      copyUserInfo,
      formatDateTime,
      getUserStatusType,
      getUserStatusText,
      getProductDisplayName,
      getAccessType,
      getAccessDisplayName,
      translateJobTitle
    }
  }
}
</script>

<style scoped>
.user-detail-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.user-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 2px solid #E4E7ED;
}

.user-avatar {
  flex-shrink: 0;
}

.user-title h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.user-email {
  margin: 0 0 4px 0;
  color: #606266;
  font-size: 16px;
}

.job-title {
  margin: 0 0 12px 0;
  color: #909399;
  font-size: 14px;
}

.info-card {
  margin-bottom: 0;
}

.id-info,
.basic-info,
.company-info,
.address-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.id-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.id-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #606266;
  min-width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
  text-align: right;
  word-break: break-all;
  flex: 1;
}

.phone-type {
  margin-left: 8px;
}

.access-levels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.access-label {
  font-weight: 500;
  color: #606266;
}

.roles-info {
  padding: 10px 0;
}

.roles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  margin: 0;
}

.products-info {
  padding: 10px 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #F5F7FA;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
}

.product-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 1px solid #E4E7ED;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-detail-panel {
    padding: 15px;
  }
  
  .user-header {
    flex-direction: column;
    gap: 15px;
    align-items: center;
    text-align: center;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-value {
    text-align: left;
  }
  
  .access-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
