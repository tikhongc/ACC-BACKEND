<template>
  <div class="account-info">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      :title="$t('account.accountInfo.title')"
      :description="$t('account.accountInfo.description')"
      :icon="IconUser"
      :action-buttons="headerButtons"
      @action="handleHeaderAction" />

    <!-- 加载状态 -->
    <LoadingState 
      v-if="loading"
      type="card"
      :title="$t('account.accountInfo.loading')"
      :text="$t('account.accountInfo.loadingText')"
      :show-progress="false"
      :show-cancel="false" />

    <!-- 错误状态 -->
    <ErrorState
      v-if="error"
      type="card"
      severity="error"
      :title="$t('account.accountInfo.error')"
      :message="error"
      :suggestions="errorSuggestions"
      :action-buttons="errorButtons"
      @action="handleErrorAction" />

    <!-- 成功状态指示器 -->
    <StatusIndicator
      v-if="accountData && !loading && !error"
      status="success"
      :title="$t('account.accountInfo.success')"
      :description="$t('account.accountInfo.successDescription', { name: getFullName() })"
      :details="$t('account.accountInfo.successDetails', { hub: accountData.hub?.hubName || 'N/A', count: getProjectCount() })"
      size="default"
      :auto-hide="true"
      :auto-hide-delay="2000"
      style="margin-bottom: 24px;" />

    <!-- 账户信息内容 -->
    <div v-if="accountData && !loading && !error">

      <!-- 用户头像和basicInfo卡片 -->
      <el-card class="user-profile-card" style="margin-bottom: 20px;">
        <div class="user-profile-header">
          <div class="user-avatar">
            <el-avatar 
              :size="80" 
              :src="getUserAvatar()" 
              :alt="getFullName()"
              class="profile-avatar">
              <template #default>
                <el-icon size="40"><IconUser /></el-icon>
              </template>
            </el-avatar>
          </div>
          <div class="user-basic-info">
            <h2 class="user-name">{{ getFullName() }}</h2>
            <p class="user-title">{{ getUserJobTitle() }}</p>
            <p class="user-company">{{ getUserCompany() }}</p>
            <div class="user-badges">
              <el-tag v-if="accountData.user?.emailVerified" type="success" size="small">
                <el-icon><IconCheck /></el-icon> {{ $t('account.accountInfo.badges.emailVerified') }}
              </el-tag>
              <el-tag v-if="accountData.user?.['2FaEnabled']" type="warning" size="small">
                <el-icon><IconLock /></el-icon> {{ $t('account.accountInfo.badges.twoFactorAuth') }}
              </el-tag>
              <el-tag type="info" size="small">
                <el-icon><IconLocation /></el-icon> {{ getCountryName() }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计卡片 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.accountInfo.stats.totalProjects')" :value="getProjectCount()">
              <template #prefix>
                <el-icon><IconFolder /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.accountInfo.stats.activeProjects')" :value="getActiveProjectCount()">
              <template #prefix>
                <el-icon style="color: #67c23a"><IconPlayArrow /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.accountInfo.stats.adminProjects')" :value="getAdminProjectCount()">
              <template #prefix>
                <el-icon style="color: #e6a23c"><IconHeart /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic :title="$t('account.accountInfo.stats.accountAge')" :value="getAccountAge()" :suffix="$t('account.accountInfo.stats.daysUnit')">
              <template #prefix>
                <el-icon style="color: #409eff"><IconCalendar /></el-icon>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细信息标签页 -->
      <el-tabs v-model="activeTab" type="card" class="info-tabs">
        <!-- 个人信息标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.personal')" name="personal">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="info-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><IconUser /></el-icon>
                    <span>{{ $t('account.accountInfo.basicInfo') }}</span>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.userId')">
                    <el-tag type="info" size="small">{{ accountData.user?.userId || 'N/A' }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.userName')">{{ accountData.user?.userName || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.email')">
                    <div class="email-info">
                      {{ accountData.user?.emailId || 'N/A' }}
                      <el-tag v-if="accountData.user?.emailVerified" type="success" size="small" style="margin-left: 8px">{{ $t('account.accountInfo.badges.verified') }}</el-tag>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.fullName')">{{ getFullName() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.language')">{{ getLanguageName() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.country')">{{ getCountryName() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.createdDate')">{{ formatDate(accountData.user?.createdDate) }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.lastLogin')">{{ formatDate(accountData.user?.lastLoginDate) }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="info-card">
                <template #header>
                  <div class="card-header">
                    <el-icon><IconFolder /></el-icon>
                    <span>{{ $t('account.accountInfo.professionalInfo') }}</span>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.company')">{{ getUserCompany() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.jobTitle')">{{ getUserJobTitle() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.industry')">{{ getUserIndustry() }}</el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.aboutMe')">
                    <span v-if="getUserAboutMe()">{{ getUserAboutMe() }}</span>
                    <span v-else class="no-data">{{ $t('account.accountInfo.common.notSet') }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
              
              <el-card class="info-card" style="margin-top: 20px;">
                <template #header>
                  <div class="card-header">
                    <el-icon><IconPhone /></el-icon>
                    <span>{{ $t('account.accountInfo.contactInfo') }}</span>
                  </div>
                </template>
                <el-descriptions :column="1" border>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.contactEmail')">
                    <span v-if="getProfileEmail()">{{ getProfileEmail() }}</span>
                    <span v-else class="no-data">{{ $t('account.accountInfo.common.notSet') }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.phoneNumber')">
                    <div v-if="getPhoneNumbers().length > 0">
                      <div v-for="(phone, index) in getPhoneNumbers()" :key="index" class="phone-item">
                        <el-tag size="small">{{ phone.number }}</el-tag>
                        <span class="phone-type">{{ getPhoneTypeName(phone.phoneType) }}</span>
                      </div>
                    </div>
                    <span v-else class="no-data">{{ $t('account.accountInfo.common.notSet') }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.userProfile.address')">
                    <div v-if="getFullAddress()">{{ getFullAddress() }}</div>
                    <span v-else class="no-data">{{ $t('account.accountInfo.common.notSet') }}</span>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>

        <!-- 安全设置标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.security')" name="security">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <el-icon><IconLock /></el-icon>
                <span>{{ $t('account.accountInfo.security.title') }}</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-descriptions :column="1" border>
                  <el-descriptions-item :label="$t('account.accountInfo.security.twoFactor')">
                    <el-tag :type="accountData.user?.['2FaEnabled'] ? 'success' : 'warning'">
                      {{ accountData.user?.['2FaEnabled'] ? $t('account.accountInfo.security.enabled') : $t('account.accountInfo.security.disabled') }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.security.backupCode')">
                    <el-tag :type="accountData.user?.hasBackupCode ? 'success' : 'info'">
                      {{ accountData.user?.hasBackupCode ? $t('account.accountInfo.security.configured') : $t('account.accountInfo.security.notConfigured') }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.security.ldapIntegration')">
                    <el-tag :type="accountData.user?.ldapInfo?.ldapEnabled ? 'success' : 'info'">
                      {{ accountData.user?.ldapInfo?.ldapEnabled ? $t('account.accountInfo.security.enabled') : $t('account.accountInfo.security.disabled') }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item :label="$t('account.accountInfo.security.marketingSubscription')">
                    <el-tag :type="accountData.user?.optin ? 'success' : 'info'">
                      {{ accountData.user?.optin ? $t('account.accountInfo.security.subscribed') : $t('account.accountInfo.security.notSubscribed') }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-col>
              <el-col :span="12">
                <div class="security-tips">
                  <h4>{{ $t('account.accountInfo.securityAdvice.title') }}</h4>
                  <ul>
                    <li v-if="!accountData.user?.['2FaEnabled']" class="tip-warning">
                      <el-icon><IconExclamationCircle /></el-icon>
                      {{ $t('account.accountInfo.securityAdvice.enable2fa') }}
                    </li>
                    <li v-if="!accountData.user?.hasBackupCode" class="tip-info">
                      <el-icon><IconInfoCircle /></el-icon>
                      {{ $t('account.accountInfo.securityAdvice.setupBackup') }}
                    </li>
                    <li class="tip-success">
                      <el-icon><IconCheck /></el-icon>
                      {{ $t('account.accountInfo.securityAdvice.strongPassword') }}
                    </li>
                  </ul>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-tab-pane>

        <!-- 项目信息标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.projects')" name="projects">
          <!-- Hub 信息 -->
          <el-card class="info-card" style="margin-bottom: 20px;">
            <template #header>
              <div class="card-header">
                <el-icon><IconCloud /></el-icon>
                <span>Hub Information</span>
              </div>
            </template>
            <el-descriptions :column="3" border>
              <el-descriptions-item :label="$t('account.accountInfo.hub.hubId')">
                <el-tag type="info" size="small">{{ accountData.hub?.hubId || 'N/A' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('account.accountInfo.hub.hubName')">{{ accountData.hub?.hubName || 'N/A' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('account.accountInfo.hub.realAccountId')">
                <el-tag type="warning" size="small">{{ accountData.hub?.realAccountId || 'N/A' }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 项目列表 -->
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <el-icon><IconFolder /></el-icon>
                <span>{{ $t('account.accountInfo.common.projectListTitle') }} ({{ getProjectCount() }})</span>
              </div>
            </template>
            <div v-if="accountData.projects && accountData.projects.data && accountData.projects.data.length > 0">
              <el-table :data="accountData.projects.data" style="width: 100%" stripe>
                <el-table-column prop="id" :label="$t('account.accountInfo.projects.table.projectId')" width="280" show-overflow-tooltip>
                  <template #default="scope">
                    <el-tag type="info" size="small">{{ formatProjectId(scope.row.id) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('account.accountInfo.projects.table.projectName')" min-width="200" show-overflow-tooltip>
                  <template #default="scope">
                    {{ scope.row.attributes?.name || 'Unknown Project' }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('account.accountInfo.projects.table.permissions')" width="180">
                  <template #default="scope">
                    <div class="permission-info">
                      <el-tag 
                        :type="getPermissionTagType(scope.row.attributes?.permissions?.level)"
                        size="small">
                        {{ scope.row.attributes?.permissions?.scope || $t('account.accountInfo.projects.defaultPermission') }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('account.accountInfo.projects.table.status')" width="100">
                  <template #default="scope">
                    <el-tag 
                      :type="getStatusTagType(scope.row.attributes?.status)"
                      size="small">
                      {{ getStatusText(scope.row.attributes?.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('account.accountInfo.projects.table.projectType')" width="120" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="project-type">{{ scope.row.attributes?.projectType || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('account.accountInfo.projects.table.actions')" width="120">
                  <template #default="scope">
                    <el-button type="text" size="small" @click="toggleProjectExpand(scope.row.id)">
                      {{ expandedProjects.includes(scope.row.id) ? $t('account.accountInfo.projects.actions.collapse') : $t('account.accountInfo.projects.actions.details') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 展开的项目详情 -->
              <div v-for="project in accountData.projects.data" :key="project.id">
                <el-collapse-transition>
                  <div v-if="expandedProjects.includes(project.id)" class="project-details-expanded">
                    <el-card class="project-detail-card" shadow="never">
                      <template #header>
                        <div class="project-detail-header">
                          <el-icon><IconInfoCircle /></el-icon>
                          Project Details - {{ project.attributes?.name || 'Unknown Project' }}
                        </div>
                      </template>
                      <el-row :gutter="20">
                        <el-col :span="12">
                          <el-descriptions :column="1" size="small" border>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.fullProjectId')">
                              <el-tag type="info" size="small">{{ project.id }}</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.jobNumber')">
                              {{ project.attributes?.jobNumber || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.projectType')">
                              {{ project.attributes?.projectType || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.startDate')">
                              {{ formatDate(project.attributes?.startDate) }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.endDate')">
                              {{ formatDate(project.attributes?.endDate) }}
                            </el-descriptions-item>
                          </el-descriptions>
                        </el-col>
                        <el-col :span="12">
                          <el-descriptions :column="1" size="small" border>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.permissionLevel')">
                              <el-tag 
                                :type="getPermissionTagType(project.attributes?.permissions?.level)"
                                size="small">
                                {{ project.attributes?.permissions?.level || 'member' }}
                              </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.permissionDescription')">
                              {{ project.attributes?.permissions?.description || $t('account.accountInfo.projects.defaultPermissionDescription') }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.currency')">
                              {{ project.attributes?.currency || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.timezone')">
                              {{ project.attributes?.timezone || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('account.accountInfo.projects.details.language')">
                              {{ project.attributes?.language || '-' }}
                            </el-descriptions-item>
                          </el-descriptions>
                        </el-col>
                      </el-row>
                    </el-card>
                  </div>
                </el-collapse-transition>
              </div>
            </div>
            <div v-else>
              <el-empty :description="$t('account.accountInfo.projects.noData')" />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 成员列表标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.members')" name="members">
          <AccountMembersList 
            v-if="accountData?.hub?.realAccountId"
            :account-id="accountData.hub.realAccountId" />
          <el-empty v-else :description="$t('account.accountInfo.errors.missingAccountId')" />
        </el-tab-pane>

        <!-- 公司列表标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.companies')" name="companies">
          <AccountCompaniesList 
            v-if="accountData?.hub?.realAccountId"
            :account-id="accountData.hub.realAccountId" />
          <el-empty v-else :description="$t('account.accountInfo.errors.missingAccountId')" />
        </el-tab-pane>

        <!-- 角色列表标签页 -->
        <el-tab-pane :label="$t('account.accountInfo.tabs.roles')" name="roles">
          <AccountRolesList 
            v-if="accountData?.hub?.realAccountId"
            :account-id="accountData.hub.realAccountId" />
          <el-empty v-else :description="$t('account.accountInfo.errors.missingAccountId')" />
        </el-tab-pane>
      </el-tabs>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><IconRefresh /></el-icon>
          Refresh Data
        </el-button>
        <el-button @click="$router.push('/forms/jarvis')">
          <el-icon><IconFile /></el-icon>
          View Forms Data
        </el-button>
        <el-button @click="$router.push('/')">
          <el-icon><IconHome /></el-icon>
          Back to Home
        </el-button>
      </div>

      <!-- 详细数据折叠面板 -->
      <el-collapse style="margin-top: 20px;">
        <el-collapse-item :title="$t('account.accountInfo.debug.rawUserData')" name="user">
          <pre class="json-display">{{ JSON.stringify(accountData.user, null, 2) }}</pre>
        </el-collapse-item>
        <el-collapse-item :title="$t('account.accountInfo.debug.rawProjectData')" name="projects">
          <pre class="json-display">{{ JSON.stringify(accountData.projects, null, 2) }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingState from '../components/LoadingState.vue'
import ErrorState from '../components/ErrorState.vue'
import StatusIndicator from '../components/StatusIndicator.vue'
import AccountMembersList from '../components/AccountMembersList.vue'
import AccountCompaniesList from '../components/AccountCompaniesList.vue'
import AccountRolesList from '../components/AccountRolesList.vue'
import { 
  IconUser, 
  IconArrowLeft, 
  IconCheck, 
  IconLock, 
  IconLocation,
  IconPlayArrow,
  IconHeart,
  IconCalendar,
  IconFolder,
  IconPhone,
  IconExclamationCircle,
  IconInfoCircle,
  IconCloud,
  IconRefresh,
  IconFile,
  IconHome
} from '@arco-design/web-vue/es/icon'
import { Refresh } from '@element-plus/icons-vue'

export default {
  name: 'AccountInfo',
  components: {
    Breadcrumb,
    PageHeader,
    LoadingState,
    ErrorState,
    StatusIndicator,
    AccountMembersList,
    AccountCompaniesList,
    AccountRolesList,
    IconUser,
    IconArrowLeft,
    IconCheck,
    IconLock,
    IconLocation,
    IconFolder,
    IconPlayArrow,
    IconHeart,
    IconCalendar,
    IconPhone,
    IconExclamationCircle,
    IconInfoCircle,
    IconCloud,
    IconRefresh,
    IconFile,
    IconHome
  },
  data() {
    return {
      loading: false,
      error: null,
      accountData: null,
      fetchingData: false,
      activeTab: 'personal',
      expandedProjects: []
    }
  },
  computed: {
    headerButtons() {
      return [
        {
          text: this.$t('account.accountInfo.actions.backToHome'),
          type: 'default',
          icon: 'ArrowLeft',
          action: 'home'
        },
        {
          text: this.$t('account.accountInfo.actions.refreshData'),
          type: 'primary',
          icon: Refresh,
          loading: this.loading,
          action: 'refresh'
        }
      ]
    },
    
    errorSuggestions() {
      return [
        this.$t('account.accountInfo.errors.suggestions.checkNetwork'),
        this.$t('account.accountInfo.errors.suggestions.confirmAuth'),
        this.$t('account.accountInfo.errors.suggestions.verifyToken'),
        this.$t('account.accountInfo.errors.suggestions.contactAdmin')
      ]
    },
    
    errorButtons() {
      return [
        {
          text: this.$t('account.accountInfo.actions.reauth'),
          type: 'primary',
          action: 'auth'
        },
        {
          text: this.$t('account.accountInfo.actions.retry'),
          type: 'default',
          action: 'retry'
        }
      ]
    }
  },
  mounted() {
    this.fetchAccountInfo()
  },
  methods: {
    async fetchAccountInfo() {
      // 防止重复调用
      if (this.fetchingData) {
        console.log('📋 Account information is being retrieved, skipping duplicate request')
        return
      }
      
      this.fetchingData = true
      this.loading = true
      this.error = null
      
      try {
        console.log('📋 Starting to retrieve account information...')
        const response = await axios.get('/api/auth/account-info', {
          timeout: 20000 // Increase timeout to 20 seconds
        })
        
        console.log('📋 Account info API response:', response.status, response.data)
        
        // Check response type
        if (response.headers['content-type']?.includes('application/json')) {
          this.accountData = response.data
          console.log('✅ Account information retrieved successfully')
        } else {
          // If HTML is returned, re-authentication is required
          throw new Error(this.$t('account.accountInfo.errors.needReauth'))
        }
      } catch (error) {
        console.error('❌ Failed to retrieve account information:', error)
        
        if (error.code === 'ECONNABORTED') {
          this.error = this.$t('account.accountInfo.errors.timeout')
        } else if (error.response?.status === 401) {
          this.error = this.$t('account.accountInfo.errors.noToken')
        } else if (error.message === 'Network Error') {
          this.error = this.$t('account.accountInfo.errors.networkError')
        } else {
          this.error = this.$t('account.accountInfo.errorMessage', { message: error.response?.data?.message || error.message })
        }
      } finally {
        this.loading = false
        this.fetchingData = false
      }
    },
    
    getFullName() {
      const user = this.accountData?.user
      if (!user) return 'N/A'
      const firstName = user.firstName || ''
      const lastName = user.lastName || ''
      return `${firstName} ${lastName}`.trim() || 'N/A'
    },

    // 获取用户头像
    getUserAvatar() {
      const profileImages = this.accountData?.user?.profileImages
      if (profileImages) {
        // Prefer larger sized avatars
        return profileImages.sizeX160 || profileImages.sizeX120 || profileImages.sizeX80 || null
      }
      return null
    },

    // 获取用户职位
    getUserJobTitle() {
      return this.accountData?.user?.userProfessionalInfo?.jobTitle || this.$t('account.accountInfo.fields.notSet')
    },

    // 获取用户公司
    getUserCompany() {
      return this.accountData?.user?.userProfessionalInfo?.company || this.$t('account.accountInfo.fields.notSet')
    },

    // 获取用户行业
    getUserIndustry() {
      const industry = this.accountData?.user?.userProfessionalInfo?.industry
      return industry || this.$t('account.accountInfo.fields.notSet')
    },

    // 获取用户简介
    getUserAboutMe() {
      return this.accountData?.user?.userProfessionalInfo?.aboutMe || ''
    },

    // 获取联系邮箱
    getProfileEmail() {
      return this.accountData?.user?.contact?.profileEmail || ''
    },

    // 获取电话号码列表
    getPhoneNumbers() {
      return this.accountData?.user?.contact?.phones || []
    },

    // 获取电话类型名称
    getPhoneTypeName(phoneType) {
      const types = {
        0: this.$t('account.accountInfo.phoneTypes.mobile'),
        1: this.$t('account.accountInfo.phoneTypes.office'),
        2: this.$t('account.accountInfo.phoneTypes.home'),
        3: this.$t('account.accountInfo.phoneTypes.fax')
      }
      return types[phoneType] || this.$t('account.accountInfo.phoneTypes.other')
    },

    // 获取完整地址
    getFullAddress() {
      const contact = this.accountData?.user?.contact
      if (!contact) return ''
      
      const parts = [
        contact.address1,
        contact.address2,
        contact.city,
        contact.state,
        contact.zipcode,
        contact.country
      ].filter(part => part && part.trim())
      
      return parts.length > 0 ? parts.join(', ') : ''
    },

    // 获取国家名称
    getCountryName() {
      const countryCode = this.accountData?.user?.countryCode
      const countryNames = {
        'HK': this.$t('account.accountInfo.countries.HK'),
        'CN': this.$t('account.accountInfo.countries.CN'),
        'US': this.$t('account.accountInfo.countries.US'),
        'GB': this.$t('account.accountInfo.countries.GB'),
        'JP': this.$t('account.accountInfo.countries.JP'),
        'KR': this.$t('account.accountInfo.countries.KR'),
        'SG': this.$t('account.accountInfo.countries.SG'),
        'AU': this.$t('account.accountInfo.countries.AU'),
        'CA': this.$t('account.accountInfo.countries.CA'),
        'DE': this.$t('account.accountInfo.countries.DE'),
        'FR': this.$t('account.accountInfo.countries.FR')
      }
      return countryNames[countryCode] || countryCode || this.$t('account.accountInfo.countries.unknown')
    },

    // 获取语言名称
    getLanguageName() {
      const language = this.accountData?.user?.language
      const languageNames = {
        'en': this.$t('account.accountInfo.languages.en'),
        'zh': this.$t('account.accountInfo.languages.zh'),
        'zh-CN': this.$t('account.accountInfo.languages.zhCN'),
        'zh-TW': this.$t('account.accountInfo.languages.zhTW'),
        'ja': this.$t('account.accountInfo.languages.ja'),
        'ko': this.$t('account.accountInfo.languages.ko'),
        'fr': this.$t('account.accountInfo.languages.fr'),
        'de': this.$t('account.accountInfo.languages.de'),
        'es': this.$t('account.accountInfo.languages.es')
      }
      return languageNames[language] || language || this.$t('account.accountInfo.fields.notSet')
    },

    // 获取账户年龄（天数）
    getAccountAge() {
      const createdDate = this.accountData?.user?.createdDate
      if (!createdDate) return 0
      
      try {
        const created = new Date(createdDate)
        const now = new Date()
        const diffTime = Math.abs(now - created)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
      } catch (e) {
        return 0
      }
    },

    // 获取项目总数
    getProjectCount() {
      return this.accountData?.projects?.data?.length || 0
    },

    // 获取活跃项目数
    getActiveProjectCount() {
      if (!this.accountData?.projects?.data) return 0
      return this.accountData.projects.data.filter(
        project => project.attributes?.status === 'active'
      ).length
    },

    // 获取管理员权限项目数
    getAdminProjectCount() {
      if (!this.accountData?.projects?.data) return 0
      return this.accountData.projects.data.filter(
        project => project.attributes?.permissions?.level === 'admin'
      ).length
    },

    // 格式化项目ID显示
    formatProjectId(id) {
      if (!id) return ''
      // If ID is too long, only show first 8 and last 8 characters
      if (id.length > 20) {
        return `${id.substring(0, 8)}...${id.substring(id.length - 8)}`
      }
      return id
    },

    // 获取权限标签类型
    getPermissionTagType(level) {
      switch (level) {
        case 'admin':
          return 'danger'
        case 'member':
          return 'success'
        case 'viewer':
          return 'warning'
        case 'none':
          return 'danger'
        case 'unknown':
          return 'info'
        default:
          return 'info'
      }
    },

    // 获取状态标签类型
    getStatusTagType(status) {
      switch (status) {
        case 'active':
          return 'success'
        case 'inactive':
          return 'warning'
        case 'archived':
          return 'info'
        case 'suspended':
          return 'danger'
        default:
          return 'info'
      }
    },

    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 'active':
          return this.$t('account.accountInfo.projectStatus.active')
        case 'inactive':
          return this.$t('account.accountInfo.projectStatus.inactive')
        case 'archived':
          return this.$t('account.accountInfo.projectStatus.archived')
        case 'suspended':
          return this.$t('account.accountInfo.projectStatus.suspended')
        default:
          return status || this.$t('account.accountInfo.projectStatus.unknown')
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return dateString
      }
    },

    // 切换项目展开状态
    toggleProjectExpand(projectId) {
      const index = this.expandedProjects.indexOf(projectId)
      if (index > -1) {
        this.expandedProjects.splice(index, 1)
      } else {
        this.expandedProjects.push(projectId)
      }
    },
    
    startAuth() {
      window.location.href = '/auth/start'
    },

    handleHeaderAction(action) {
      switch (action) {
        case 'home':
          this.$router.push('/')
          break
        case 'refresh':
          this.fetchAccountInfo()
          break
      }
    },
    
    refreshData() {
      this.fetchAccountInfo()
    },
    
    handleErrorAction(action) {
      switch(action) {
        case 'auth':
          this.startAuth()
          break
        case 'retry':
          this.fetchAccountInfo()
          break
      }
    }
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.account-info {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 用户头像和basicInfo卡片 */
.user-profile-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
}

.user-avatar {
  flex-shrink: 0;
}

.profile-avatar {
  border: 3px solid #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.user-basic-info {
  flex: 1;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.user-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.user-company {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #909399;
}

.user-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-badges .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 统计卡片 */
.stat-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

/* 信息卡片 */
.info-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e8e8e8;
  background: white;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

/* 标签页样式 */
.info-tabs {
  margin-bottom: 20px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}

/* 邮箱信息 */
.email-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

/* 电话信息 */
.phone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.phone-type {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 无数据样式 */
.no-data {
  color: #c0c4cc;
  font-style: italic;
}

/* 安全建议样式 */
.security-tips {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.security-tips h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.security-tips ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.security-tips li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.tip-warning {
  color: #e6a23c;
}

.tip-info {
  color: #409eff;
}

.tip-success {
  color: #67c23a;
}

/* 项目详情展开区域 */
.project-details-expanded {
  margin-top: 10px;
  margin-bottom: 10px;
}

.project-detail-card {
  border-left: 4px solid #409eff;
  background-color: #f8f9fa;
}

.project-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.project-type {
  color: #606266;
  font-size: 13px;
}

.permission-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  text-align: center;
  margin: 20px 0;
}

.action-buttons .el-button {
  margin: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* JSON显示 */
.json-display {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .account-info {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .account-info {
    padding: 10px;
  }
  
  .user-profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .user-basic-info {
    text-align: center;
  }
  
  .user-badges {
    justify-content: center;
  }
  
  .action-buttons .el-button {
    margin: 5px;
    width: calc(50% - 10px);
  }
  
  /* 移动端表格调整 */
  :deep(.el-table .el-table__cell) {
    padding: 8px 4px;
  }
  
  .project-detail-card {
    margin: 5px 0;
  }
  
  .permission-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  
  .security-tips {
    padding: 12px;
  }
  
  .phone-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .user-name {
    font-size: 20px;
  }
  
  .user-title {
    font-size: 14px;
  }
  
  .user-company {
    font-size: 12px;
  }
  
  .action-buttons .el-button {
    width: calc(100% - 10px);
    margin: 5px;
  }
}
</style>
