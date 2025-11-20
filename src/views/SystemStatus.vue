<template>
  <div class="system-status">
    <!-- 面包屑导航 -->
    <Breadcrumb />
    
    <!-- 页面头部 -->
    <PageHeader
      title="System Status"
      description="ACC data synchronization backend system operation status and API endpoint monitoring"
      :icon="IconZoomOut" />

    <!-- 系统概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            title="System Status" 
            :value="systemHealth.status === 'healthy' ? 'Normal' : 'Abnormal'"
            :value-style="systemHealth.status === 'healthy' ? { color: '#52c41a' } : { color: '#f5222d' }" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="API Modules" :value="apiModules.length" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="API Endpoints" :value="totalEndpoints" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic 
            title="Token Status" 
            :value="tokenStatus.is_valid ? 'Valid' : 'Invalid'"
            :value-style="tokenStatus.is_valid ? { color: '#52c41a' } : { color: '#f5222d' }" />
        </el-card>
      </el-col>
    </el-row>

    <!-- API模块详情 -->
    <el-card class="module-details">
      <template #header>
        <div class="card-header">
          <span>
            <icon-list />
            API模块详情
          </span>
          <el-button type="primary" @click="refreshStatus" :loading="loading">
            <icon-refresh />
            刷新状态
          </el-button>
        </div>
      </template>

      <el-collapse v-model="activeModules">
        <div class="category-divider">🔐 核心认证和系统模块</div>
        
        <!-- 认证模块 -->
        <el-collapse-item title="Authentication Module (auth_api)" name="auth">
          <template #title>
            <div class="module-title">
              <icon-lock />
              <span>认证模块 (auth_api)</span>
              <StatusTag status="success" :text="`${authEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in authEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- 账户管理API模块 -->
        <el-collapse-item title="Account Management API Module (account_api)" name="account">
          <template #title>
            <div class="module-title">
              <icon-user-group />
              <span>账户管理API模块 (account_api)</span>
              <StatusTag status="success" :text="`${accountEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in accountEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- 用户管理API模块 -->
        <el-collapse-item title="User Management API Module (users_api)" name="users">
          <template #title>
            <div class="module-title">
              <icon-user />
              <span>用户管理API模块 (users_api)</span>
              <StatusTag status="info" :text="`${usersEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in usersEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>


        <div class="category-divider">📁 数据管理模块</div>

        <!-- 数据管理API模块 -->
        <el-collapse-item title="Data Management API Module (data_management_api)" name="data_management">
          <template #title>
            <div class="module-title">
              <icon-folder />
              <span>数据管理API模块 (data_management_api)</span>
              <StatusTag status="success" :text="`${dataManagementEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in dataManagementEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- 数据管理关系API模块 -->
        <el-collapse-item title="Data Management Relations API Module (data_management_relations_api)" name="relations">
          <template #title>
            <div class="module-title">
              <icon-relation />
              <span>数据管理关系API模块 (data_management_relations_api)</span>
              <StatusTag status="primary" :text="`${relationsEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in relationsEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>


        <div class="category-divider">🔗 数据连接器模块</div>

        <!-- 数据连接器API模块 -->
        <el-collapse-item title="Data Connector API Module (data_connector_api)" name="data_connector">
          <template #title>
            <div class="module-title">
              <icon-link />
              <span>数据连接器API模块 (data_connector_api)</span>
              <StatusTag status="warning" :text="`${dataConnectorEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in dataConnectorEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <div class="category-divider">📄 文件管理模块</div>

        <!-- 文件同步API模块 -->
        <el-collapse-item title="File Sync API Module (file_sync_api)" name="file_sync">
          <template #title>
            <div class="module-title">
              <icon-folder />
              <span>文件同步API模块 (file_sync_api)</span>
              <StatusTag status="success" :text="`${fileSyncEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in fileSyncEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- 下载配置API模块 -->
        <el-collapse-item title="Download Config API Module (download_config_api)" name="download_config">
          <template #title>
            <div class="module-title">
              <icon-download />
              <span>下载配置API模块 (download_config_api)</span>
              <StatusTag status="primary" :text="`${downloadConfigEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in downloadConfigEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- 权限同步API模块 -->
        <el-collapse-item title="Permissions Sync API Module (permissions_sync_api)" name="permissions_sync">
          <template #title>
            <div class="module-title">
              <icon-lock />
              <span>权限同步API模块 (permissions_sync_api)</span>
              <StatusTag status="warning" :text="`${permissionsSyncEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in permissionsSyncEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- custom attributesAPI模块 -->
        <el-collapse-item title="Custom Attributes API Module (custom_attributes_api)" name="custom_attributes">
          <template #title>
            <div class="module-title">
              <icon-settings />
              <span>custom attributesAPI模块 (custom_attributes_api)</span>
              <StatusTag status="warning" :text="`${customAttributesEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in customAttributesEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <div class="category-divider">🔄 工作流和审批模块</div>

        <!-- Reviews API模块 -->
        <el-collapse-item title="Reviews API Module (reviews_api)" name="reviews">
          <template #title>
            <div class="module-title">
              <icon-branch />
              <span>评审API模块 (reviews_api)</span>
              <StatusTag status="info" :text="`${reviewsEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in reviewsEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>
      
        <!-- 审批工作流API模块 -->
        <el-collapse-item title="Review Workflow API Module (review_workflow_api)" name="review_workflow">
          <template #title>
            <div class="module-title">
              <icon-check-circle />
              <span>审批工作流API模块 (review_workflow_api)</span>
              <StatusTag status="primary" :text="`${reviewWorkflowEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in reviewWorkflowEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <div class="category-divider">📋 项目管理和协作模块</div>

        <!-- 表单API模块 -->
        <el-collapse-item title="Forms API Module (forms_api)" name="forms">
          <template #title>
            <div class="module-title">
              <icon-file />
              <span>表单API模块 (forms_api)</span>
              <StatusTag status="warning" :text="`${formsEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in formsEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- RFIs API模块 -->
        <el-collapse-item title="RFIs API Module (rfis_api)" name="rfis">
          <template #title>
            <div class="module-title">
              <icon-question />
              <span>RFIs API模块 (rfis_api)</span>
              <StatusTag status="warning" :text="`${rfisEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in rfisEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- Issues API模块 -->
        <el-collapse-item title="Issues API Module (issues_api)" name="issues">
          <template #title>
            <div class="module-title">
              <icon-exclamation />
              <span>Issues API模块 (issues_api)</span>
              <StatusTag status="error" :text="`${issuesEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in issuesEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- Submittals API模块 -->
        <el-collapse-item title="Submittals API Module (submittals_api)" name="submittals">
          <template #title>
            <div class="module-title">
              <icon-upload />
              <span>Submittals API模块 (submittals_api)</span>
              <StatusTag status="info" :text="`${submittalsEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in submittalsEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <!-- AutoSpecs包管理API模块 -->
        <el-collapse-item title="AutoSpecs Package Management API Module (autospecs_packages_api)" name="autospecs_packages">
          <template #title>
            <div class="module-title">
              <icon-archive />
              <span>AutoSpecs包管理API模块 (autospecs_packages_api)</span>
              <StatusTag status="info" :text="`${autospecsPackagesEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in autospecsPackagesEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>


        <div class="category-divider">🔔 Webhook通知模块</div>

        <!-- Webhook API模块 -->
        <el-collapse-item title="Webhook API Module (webhook_api)" name="webhook">
          <template #title>
            <div class="module-title">
              <icon-notification />
              <span>Webhook API模块 (webhook_api)</span>
              <StatusTag status="info" :text="`${webhookEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in webhookEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>

        <div class="category-divider">🔧 系统监控和工具模块</div>

        <!-- 系统状态API模块 (新增) -->
        <el-collapse-item title="System Status API Module (system_status_api)" name="system_status">
          <template #title>
            <div class="module-title">
              <icon-dashboard />
              <span>系统状态API模块 (system_status_api)</span>
              <StatusTag status="success" :text="`${systemStatusEndpoints.length} endpoints`" size="small" :show-icon="false" />
            </div>
          </template>
          
           <div class="endpoint-list">
             <div v-for="endpoint in systemStatusEndpoints" :key="endpoint.path" class="endpoint-card">
               <div class="endpoint-header">
                 <div class="endpoint-main">
                   <span class="method-tag" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                   <div class="endpoint-details">
                     <div class="endpoint-path">{{ endpoint.path }}</div>
                     <div class="endpoint-desc">{{ endpoint.description }}</div>
                   </div>
                 </div>
                 <div class="endpoint-actions">
                   <el-button 
                     size="small" 
                     type="primary" 
                     @click="testEndpoint(endpoint)" 
                     :loading="endpoint.testing"
                     class="test-button">
                     <IconPlayArrowFill />
                     测试
                   </el-button>
                 </div>
               </div>
               
               <!-- ACC API信息卡片 -->
               <div v-if="endpoint.accApi" class="acc-api-card">
                 <div class="acc-api-header">
                   <IconLink class="acc-api-icon" />
                   <span class="acc-api-title">对应的 ACC API</span>
                 </div>
                 <div class="acc-api-body">
                   <div class="acc-api-method">{{ endpoint.accApi.split(' ')[0] }}</div>
                   <div class="acc-api-url">{{ endpoint.accApi.split(' ').slice(1).join(' ') }}</div>
                   <div class="acc-api-note">{{ endpoint.note }}</div>
                 </div>
               </div>
             </div>
           </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 测试结果 -->
    <el-card v-if="testResult" class="test-result">
      <template #header>
        <div class="card-header">
          <span>测试结果</span>
          <el-button type="text" @click="clearTestResult">清除</el-button>
        </div>
      </template>
      <div class="result-content">
        <div class="result-info">
          <p><strong>端点:</strong> {{ testResult.endpoint }}</p>
          <p><strong>方法:</strong> {{ testResult.method }}</p>
          <p><strong>状态码:</strong> 
            <span :class="testResult.success ? 'success' : 'error'">
              {{ testResult.status }}
            </span>
          </p>
          <p><strong>响应时间:</strong> {{ testResult.responseTime }}ms</p>
        </div>
        <pre class="result-data">{{ testResult.data }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import Breadcrumb from '../components/Breadcrumb.vue'
import PageHeader from '../components/PageHeader.vue'
import StatusTag from '../components/StatusTag.vue'
import { 
  IconZoomOut,
  IconList,
  IconRefresh,
  IconLock,
  IconFile,
  IconLink,
  IconBranch,
  IconPlayArrowFill,
  IconClose,
  IconFolder,
  IconUser,
  IconSettings,
  IconDownload,
  IconNotification,
  IconDashboard,
  IconQuestion,
  IconExclamation,
  IconUpload,
  IconUserGroup,
  IconRelation,
  IconArchive,
  IconCheckCircle,
  IconBug
} from '@arco-design/web-vue/es/icon'

export default {
  name: 'SystemStatus',
  components: {
    Breadcrumb,
    PageHeader,
    StatusTag,
    IconZoomOut,
    IconList,
    IconRefresh,
    IconLock,
    IconFile,
    IconLink,
    IconBranch,
    IconPlayArrowFill,
    IconClose,
    IconFolder,
    IconUser,
    IconSettings,
    IconDownload,
    IconNotification,
    IconDashboard,
    IconQuestion,
    IconExclamation,
    IconUpload,
    IconUserGroup,
    IconRelation,
    IconArchive,
    IconCheckCircle,
    IconBug
  },
  data() {
    return {
      loading: false,
      activeModules: [], // 默认全部收起
      systemHealth: {},
      tokenStatus: {},
      testResult: null,
      
       // API端点definitions
       authEndpoints: [
         { 
           path: '/api/auth/check', 
           method: 'GET', 
           description: 'Check authentication status', 
           testing: false,
           accApi: null,
           note: 'Local authentication status check'
         },
         { 
           path: '/api/auth/token-info', 
           method: 'GET', 
           description: 'Get Token information', 
           testing: false,
           accApi: null,
           note: 'Local Token information management'
         },
         { 
           path: '/api/auth/refresh-token', 
           method: 'POST', 
           description: 'Refresh Token', 
           testing: false,
           accApi: 'POST https://developer.api.autodesk.com/authentication/v2/token',
           note: 'Call Autodesk OAuth refresh endpoint'
         },
         { 
           path: '/api/auth/logout', 
           method: 'POST', 
           description: 'User logout', 
           testing: false,
           accApi: null,
           note: 'Local logout, clear Token'
         },
         { 
           path: '/api/auth/account-info', 
           method: 'GET', 
           description: 'Get account information', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/userprofile/v1/users/@me',
           note: 'Get user profile and Hub information'
         },
         { 
           path: '/auth/start', 
           method: 'GET', 
           description: 'OAuth authentication entry', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/authentication/v2/authorize',
           note: 'Autodesk OAuth authentication process'
         }
       ],
       
       formsEndpoints: [
         { 
           path: '/api/forms/jarvis', 
           method: 'GET', 
           description: 'Get项目forms data', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/forms/v2/projects/{projectId}/forms',
           note: 'Getall project表单',
         },
         { 
           path: '/api/forms/templates', 
           method: 'GET', 
           description: 'Getform templates', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/forms/v2/projects/{projectId}/form-templates',
           note: 'Get项目form templates',
         },
         { 
           path: '/api/forms/export-json', 
           method: 'GET', 
           description: '导出表单JSON', 
           testing: false,
           accApi: null,
           note: 'localdata export function',
         },
         { 
           path: '/api/forms/templates/export-json', 
           method: 'GET', 
           description: '导出模板JSON', 
           testing: false,
           accApi: null,
           note: 'local模板导出功能',
         }
       ],
       
       dataConnectorEndpoints: [
         { 
           path: '/api/auth/projects', 
           method: 'GET', 
           description: 'Get可用项目', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/hubs/{hubId}/projects',
           note: 'GetHub下的all projects',
         },
         { 
           path: '/api/data-connector/test-format', 
           method: 'POST', 
           description: '测试data request格式', 
           testing: false,
           accApi: null,
           note: 'localdata format validation',
         },
         { 
           path: '/api/data-connector/create-batch-requests', 
           method: 'POST', 
           description: 'batch createdata request', 
           testing: false,
           accApi: 'POST https://developer.api.autodesk.com/construction/dataconnector/v1/exchanges/{exchangeId}/collections/{collectionId}/requests',
           note: '创建Data Connectordata request',
         },
         { 
           path: '/api/data-connector/list-jobs', 
           method: 'GET', 
           description: '列出数据作业', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/dataconnector/v1/exchanges/{exchangeId}/collections/{collectionId}/requests/{requestId}/jobs',
           note: 'Getdata request的job list',
         },
         { 
           path: '/api/data-connector/get-job-data', 
           method: 'GET', 
           description: 'Get作业数据', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/dataconnector/v1/exchanges/{exchangeId}/collections/{collectionId}/requests/{requestId}/jobs/{jobId}/data',
           note: 'Getjob generated的data files',
         }
       ],
       
       reviewsEndpoints: [
         { 
           path: '/api/reviews/jarvis', 
           method: 'GET', 
           description: 'Get项目review data', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/reviews/v1/projects/{projectId}/reviews',
           note: 'Getall project评审',
         },
         { 
           path: '/api/reviews/workflows/jarvis', 
           method: 'GET', 
           description: 'Getworkflow data', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/workflows/v1/projects/{projectId}/workflows',
           note: 'Get项目workflow configuration',
         },
         { 
           path: '/api/reviews/versions/{reviewId}', 
           method: 'GET', 
           description: 'Get评审文件版本', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/reviews/v1/projects/{projectId}/reviews/{reviewId}/versions',
           note: 'Get特定评审的file version history',
         },
         { 
           path: '/api/reviews/history/{reviewId}', 
           method: 'GET', 
           description: 'Get审批历史', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/reviews/v1/projects/{projectId}/reviews/{reviewId}/approvals',
           note: 'Get评审的approval process and history records',
         },
         { 
           path: '/api/reviews/comments/{reviewId}', 
           method: 'GET', 
           description: 'Get评审评论', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/reviews/v1/projects/{projectId}/reviews/{reviewId}/comments',
           note: 'Get评审相关的comments and feedback',
         }
       ],
       
       fileSyncEndpoints: [
         { 
           path: '/api/file-sync/project/{project_id}/tree', 
           method: 'GET', 
           description: 'Get项目文件树结构', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/folders/{folderId}/contents',
           note: '递归获取项目完整文件夹和file structure',
         },
         { 
           path: '/api/file-sync/project/{project_id}/download-with-permissions', 
           method: 'GET', 
           description: '下载项目文件和permission information', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/folders/{folderId}/contents',
           note: 'Getfile information并包含permission data',
         }
       ],
       
       usersEndpoints: [
         { 
           path: '/api/users/project/{project_id}/users', 
           method: 'GET', 
           description: 'Get项目用户列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/projects/{projectId}/users',
           note: 'Getall projectuser information和权限',
         },
         { 
           path: '/api/users/project/{project_id}/download-users', 
           method: 'GET', 
           description: '下载项目user data', 
           testing: false,
           accApi: null,
           note: 'local用户data export function',
         }
       ],
       
       customAttributesEndpoints: [
         { 
           path: '/api/custom-attributes/projects/{project_id}/folders/{folder_id}/definitions', 
           method: 'GET', 
           description: 'Get文件夹custom attributesdefinitions', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/assets/v1/projects/{projectId}/folders/{folderId}/custom-attribute-definitions',
           note: 'Get指定文件夹的custom attributesdefinitions',
         },
         { 
           path: '/api/custom-attributes/projects/{project_id}/folders/{folder_id}/summary', 
           method: 'GET', 
           description: 'Get文件夹custom attributes汇总', 
           testing: false,
           accApi: null,
           note: 'localcustom attributesdata summary',
         },
         { 
           path: '/api/custom-attributes/projects/{project_id}/files/custom-attributes', 
           method: 'POST', 
           description: 'batch get文件custom attributes', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/assets/v1/projects/{projectId}/assets/{assetId}/custom-attributes',
           note: 'batch get多个文件的custom attributes值',
         }
       ],
       
       dataManagementEndpoints: [
         { 
           path: '/api/data-management/hubs', 
           method: 'GET', 
           description: 'Getall Hubs', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/hubs',
           note: 'Get用户可访问的all Hubs',
         },
         { 
           path: '/api/data-management/hubs/{hubId}/projects', 
           method: 'GET', 
           description: 'GetHub项目', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/hubs/{hubId}/projects',
           note: 'Get指定Hub下的all projects',
         },
         { 
           path: '/api/data-management/projects/{projectId}/details', 
           method: 'GET', 
           description: 'Get项目详情', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/projects/{projectId}',
           note: 'Getprojectdetailed information和配置',
         },
         { 
           path: '/api/data-management/projects/{projectId}/folders/{folderId}/metadata', 
           method: 'GET', 
           description: 'Get文件夹元数据', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/folders/{folderId}',
           note: 'Get文件夹的详细metadata information',
         },
         { 
           path: '/api/data-management/projects/{projectId}/items/{itemId}/versions', 
           method: 'GET', 
           description: 'Get文件版本', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/items/{itemId}/versions',
           note: 'Get文件的all versions历史',
         },
         { 
           path: '/api/data-management/search', 
           method: 'GET', 
           description: '搜索项目和文件', 
           testing: false,
           accApi: null,
           note: 'localsearch function，支持项目和文件搜索',
         }
       ],
       
       permissionsSyncEndpoints: [
         { 
           path: '/api/permissions-sync/folder/{project_id}/{folder_id}', 
           method: 'GET', 
           description: 'Get文件夹permission information', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/projects/{projectId}/folders/{folderId}/permissions',
           note: 'Get指定文件夹的permission configuration',
         },
         { 
           path: '/api/permissions-sync/project/{project_id}/sync', 
           method: 'GET', 
           description: '同步项目权限', 
           testing: false,
           accApi: null,
           note: 'batch synchronizationall project文件夹的permission information',
         },
         { 
           path: '/api/permissions-sync/project/{project_id}/download', 
           method: 'GET', 
           description: '下载permission data', 
           testing: false,
           accApi: null,
           note: '导出项目permission data为JSON文件',
         },
         { 
           path: '/api/permissions-sync/permission-levels', 
           method: 'GET', 
           description: 'Getpermission levelsdefinitions', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/projects/{projectId}/permission-levels',
           note: 'Getprojectpermission levels配置',
         }
       ],
       
       downloadConfigEndpoints: [
         { 
           path: '/api/download-config/projects', 
           method: 'GET', 
           description: 'Get可用项目列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/hubs/{hubId}/projects',
           note: 'Get用户可访问的项目列表',
         },
         { 
           path: '/api/download-config/project/{project_id}/folders', 
           method: 'GET', 
           description: 'Get项目文件夹', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/folders/{folderId}/contents',
           note: 'Getproject文件夹结构',
         },
         { 
           path: '/api/download-config/project/{project_id}/files', 
           method: 'GET', 
           description: 'Get项目文件', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/folders/{folderId}/contents',
           note: 'Getproject文件列表',
         },
         { 
           path: '/api/download-config/download', 
           method: 'POST', 
           description: '创建download tasks', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/versions/{versionId}/downloads',
           note: '创建批量文件download tasks',
         },
         { 
           path: '/api/download-config/downloads', 
           method: 'GET', 
           description: 'Getdownload tasks列表', 
           testing: false,
           accApi: null,
           note: 'Get所有download tasks的status and progress',
         }
       ],
       
       webhookEndpoints: [
         { 
           path: '/api/webhook/autodesk', 
           method: 'POST', 
           description: 'Autodesk Webhook接收端点', 
           testing: false,
           accApi: null,
           note: '接收来自Autodesk的Webhookevent notifications',
         },
         { 
           path: '/api/webhook/register', 
           method: 'POST', 
           description: '注册Webhook', 
           testing: false,
           accApi: 'POST https://developer.api.autodesk.com/webhooks/v1/systems/{system}/events/{event}/hooks',
           note: '在Autodesk系统中注册Webhook',
         },
         { 
           path: '/api/webhook/list', 
           method: 'GET', 
           description: 'GetWebhook列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/webhooks/v1/systems/{system}/hooks',
           note: 'Get已注册的Webhook列表',
         },
         { 
           path: '/api/webhook/test', 
           method: 'POST', 
           description: '测试Webhook', 
           testing: false,
           accApi: null,
           note: '测试Webhook端点的connectivity',
         }
       ],
       
       rfisEndpoints: [
         { 
           path: '/api/rfis/jarvis', 
           method: 'GET', 
           description: 'Get项目RFIs数据', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/rfis/v3/projects/{projectId}/rfis',
           note: 'Getall projectRFIs',
         },
         { 
           path: '/api/rfis/{projectId}/search', 
           method: 'POST', 
           description: '搜索RFIs', 
           testing: false,
           accApi: 'POST https://developer.api.autodesk.com/construction/rfis/v3/projects/{projectId}/search:rfis',
           note: '使用搜索条件查找RFIs',
         },
         { 
           path: '/api/rfis/jarvis/{rfiId}', 
           method: 'GET', 
           description: 'Get单个RFI详情', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/rfis/v3/projects/{projectId}/rfis/{rfiId}',
           note: 'Get指定RFI的detailed information',
         },
         { 
           path: '/api/rfis/jarvis/{rfiId}/attachments', 
           method: 'GET', 
           description: 'GetRFI附件', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/rfis/v3/projects/{projectId}/rfis/{rfiId}/attachments',
           note: 'GetRFI相关的attachment files',
         },
         { 
           path: '/api/rfis/jarvis/{rfiId}/comments', 
           method: 'GET', 
           description: 'GetRFI评论', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/rfis/v3/projects/{projectId}/rfis/{rfiId}/comments',
           note: 'GetRFI的comments and replies',
         }
       ],
       
       issuesEndpoints: [
         { 
           path: '/api/issues/projects/{projectId}/list', 
           method: 'GET', 
           description: 'Get项目议题列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/issues/v1/projects/{projectId}/issues',
           note: 'Getall project议题',
         },
         { 
           path: '/api/issues/projects/{projectId}/issues/{issueId}', 
           method: 'GET', 
           description: 'Get单一议题详情', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/issues/v1/projects/{projectId}/issues/{issueId}',
           note: 'Get指定议题的detailed information',
         },
         { 
           path: '/api/issues/projects/{projectId}/issues/{issueId}/comments', 
           method: 'GET', 
           description: 'Get议题留言', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/issues/v1/projects/{projectId}/issues/{issueId}/comments',
           note: 'Get议题的评论和discussion',
         },
         { 
           path: '/api/issues/projects/{projectId}/issues/{issueId}/attachments', 
           method: 'GET', 
           description: 'Get议题附件', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/issues/v1/projects/{projectId}/attachments/{issueId}/items',
           note: 'Get议题相关的attachment files',
         },
         { 
           path: '/api/issues/projects/{projectId}/sync', 
           method: 'GET', 
           description: 'incremental synchronization议题', 
           testing: false,
           accApi: null,
           note: '执行议题数据的incremental synchronization',
         },
         { 
           path: '/api/issues/projects/{projectId}/statistics', 
           method: 'GET', 
           description: 'Get议题统计', 
           testing: false,
           accApi: null,
           note: 'Get议题的statistical analysis数据',
         }
       ],
       
       submittalsEndpoints: [
         { 
           path: '/api/submittals/{projectId}/items', 
           method: 'GET', 
           description: 'Getsubmittals列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/submittals/v3/projects/{projectId}/submittals',
           note: 'Getall projectsubmittals',
         },
         { 
           path: '/api/submittals/{projectId}/items/{itemId}', 
           method: 'GET', 
           description: 'Get单个submittals', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/submittals/v3/projects/{projectId}/submittals/{itemId}',
           note: 'Get指定submittals的detailed information',
         },
         { 
           path: '/api/submittals/{projectId}/packages', 
           method: 'GET', 
           description: 'Getsubmittal packages列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/submittals/v3/projects/{projectId}/packages',
           note: 'Getprojectsubmittal packages信息',
         },
         { 
           path: '/api/submittals/{projectId}/all-data', 
           method: 'GET', 
           description: 'Get所有提交数据', 
           testing: false,
           accApi: null,
           note: 'Get项目completesubmittals数据',
         }
       ],
       
       accountEndpoints: [
         { 
           path: '/api/account/companies', 
           method: 'GET', 
           description: 'Get账户公司列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/accounts/{accountId}/companies',
           note: 'Get账户下的all companies',
         },
         { 
           path: '/api/account/members', 
           method: 'GET', 
           description: 'Get账户成员列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/accounts/{accountId}/users',
           note: 'Get账户的all members',
         },
         { 
           path: '/api/account/roles', 
           method: 'GET', 
           description: 'Get账户角色列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/admin/v1/accounts/{accountId}/roles',
           note: 'Get账户的角色配置',
         }
       ],
       
       relationsEndpoints: [
         { 
           path: '/api/relations/projects/{projectId}/items/{itemId}', 
           method: 'GET', 
           description: 'Get项目条目关系', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/project/v1/projects/{projectId}/items/{itemId}',
           note: 'Get项目条目的associated relationships',
         },
         { 
           path: '/api/relations/references', 
           method: 'GET', 
           description: 'Getreference relationships', 
           testing: false,
           accApi: null,
           note: 'Get实体间的reference relationships',
         },
         { 
           path: '/api/relations/search', 
           method: 'POST', 
           description: '搜索关系数据', 
           testing: false,
           accApi: null,
           note: '搜索和查询关系数据',
         },
         { 
           path: '/api/relations/types', 
           method: 'GET', 
           description: 'Getrelationship types', 
           testing: false,
           accApi: null,
           note: 'Get支持的relationship typesdefinitions',
         },
         { 
           path: '/api/relations/health', 
           method: 'GET', 
           description: '关系APIhealth check', 
           testing: false,
           accApi: null,
           note: '检查关系API的health status',
         }
       ],
       
       autospecsPackagesEndpoints: [
         { 
           path: '/api/autospecs-packages/jarvis/autospecs/metadata', 
           method: 'GET', 
           description: 'GetAutoSpecs元数据', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/autospecs/v1/projects/{projectId}/autospecs/metadata',
           note: 'Get项目AutoSpecsmetadata information',
         },
         { 
           path: '/api/autospecs-packages/jarvis/packages', 
           method: 'GET', 
           description: 'GetAutoSpecs包列表', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/autospecs/v1/projects/{projectId}/packages',
           note: 'GetprojectAutoSpecs包',
         },
         { 
           path: '/api/autospecs-packages/jarvis/packages/{packageId}/resources', 
           method: 'GET', 
           description: 'Get包资源', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/autospecs/v1/projects/{projectId}/packages/{packageId}/resources',
           note: 'Get指定包的资源文件',
         },
         { 
           path: '/api/autospecs-packages/jarvis/statistics', 
           method: 'GET', 
           description: 'GetAutoSpecs统计', 
           testing: false,
           accApi: null,
           note: 'GetAutoSpecs的statistical analysis数据',
         }
       ],
       
       reviewWorkflowEndpoints: [
         { 
           path: '/api/workflows/jarvis', 
           method: 'GET', 
           description: 'Get审批工作流', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/workflows/v1/projects/{projectId}/workflows',
           note: 'Getproject审批workflow configuration',
         },
         { 
           path: '/api/workflows/{projectId}', 
           method: 'GET', 
           description: 'Get项目工作流', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/workflows/v1/projects/{projectId}/workflows',
           note: 'Get指定project工作流',
         },
         { 
           path: '/api/workflows/{projectId}/jarvis', 
           method: 'GET', 
           description: 'Get项目工作流(Jarvis)', 
           testing: false,
           accApi: 'GET https://developer.api.autodesk.com/construction/workflows/v1/projects/{projectId}/workflows',
           note: '通过Jarvis接口获取项目工作流',
         }
       ],
       
       
       systemStatusEndpoints: [
         { 
           path: '/api/system-status/health', 
           method: 'GET', 
           description: '综合health check', 
           testing: false,
           accApi: null,
           note: 'Get系统整体health status和性能指标',
         },
         { 
           path: '/api/system-status/performance', 
           method: 'GET', 
           description: 'Get系统性能指标', 
           testing: false,
           accApi: null,
           note: 'GetCPU、内存、磁盘使用情况',
         },
         { 
           path: '/api/system-status/api-endpoints', 
           method: 'GET', 
           description: 'GetAPI端点状态', 
           testing: false,
           accApi: null,
           note: '检查关键API端点的health status',
         },
         { 
           path: '/api/system-status/token', 
           method: 'GET', 
           description: 'GetToken状态详情', 
           testing: false,
           accApi: null,
           note: 'GetTokenhealth status和监控信息',
         },
         { 
           path: '/api/system-status/modules', 
           method: 'GET', 
           description: 'GetAPI模块状态', 
           testing: false,
           accApi: null,
           note: '检查所有API模块的注册状态',
         },
         { 
           path: '/api/system-status/diagnostics', 
           method: 'GET', 
           description: '运行系统诊断', 
           testing: false,
           accApi: null,
           note: '执行全面的系统诊断检查',
         },
         { 
           path: '/api/system-status/config', 
           method: 'GET', 
           description: 'Get系统配置信息', 
           testing: false,
           accApi: null,
           note: 'Get系统配置和版本信息',
         },
         { 
           path: '/api/system-status/cache/clear', 
           method: 'POST', 
           description: '清除状态缓存', 
           testing: false,
           accApi: null,
           note: '清除系统状态缓存数据',
         }
       ]
    }
  },
  
  computed: {
    apiModules() {
      return [
        { name: 'auth_api', title: '认证模块', endpoints: this.authEndpoints.length },
        { name: 'forms_api', title: '表单API模块', endpoints: this.formsEndpoints.length },
        { name: 'data_connector_api', title: '数据连接器API模块', endpoints: this.dataConnectorEndpoints.length },
        { name: 'reviews_api', title: '评审API模块', endpoints: this.reviewsEndpoints.length },
        { name: 'rfis_api', title: 'RFIs API模块', endpoints: this.rfisEndpoints.length },
        { name: 'issues_api', title: 'Issues API模块', endpoints: this.issuesEndpoints.length },
        { name: 'submittals_api', title: 'Submittals API模块', endpoints: this.submittalsEndpoints.length },
        { name: 'file_sync_api', title: '文件同步API模块', endpoints: this.fileSyncEndpoints.length },
        { name: 'users_api', title: '用户管理API模块', endpoints: this.usersEndpoints.length },
        { name: 'custom_attributes_api', title: 'custom attributesAPI模块', endpoints: this.customAttributesEndpoints.length },
        { name: 'data_management_api', title: '数据管理API模块', endpoints: this.dataManagementEndpoints.length },
        { name: 'permissions_sync_api', title: '权限同步API模块', endpoints: this.permissionsSyncEndpoints.length },
        { name: 'download_config_api', title: '下载配置API模块', endpoints: this.downloadConfigEndpoints.length },
        { name: 'webhook_api', title: 'Webhook API模块', endpoints: this.webhookEndpoints.length },
        { name: 'account_api', title: '账户管理API模块', endpoints: this.accountEndpoints.length },
        { name: 'relations_api', title: '数据管理关系API模块', endpoints: this.relationsEndpoints.length },
        { name: 'autospecs_packages_api', title: 'AutoSpecs包管理API模块', endpoints: this.autospecsPackagesEndpoints.length },
        { name: 'review_workflow_api', title: '审批工作流API模块', endpoints: this.reviewWorkflowEndpoints.length },
        { name: 'system_status_api', title: '系统状态API模块', endpoints: this.systemStatusEndpoints.length }
      ]
    },
    
    totalEndpoints() {
      return this.authEndpoints.length + 
             this.formsEndpoints.length + 
             this.dataConnectorEndpoints.length + 
             this.reviewsEndpoints.length +
             this.rfisEndpoints.length +
             this.issuesEndpoints.length +
             this.submittalsEndpoints.length +
             this.fileSyncEndpoints.length +
             this.usersEndpoints.length +
             this.customAttributesEndpoints.length +
             this.dataManagementEndpoints.length +
             this.permissionsSyncEndpoints.length +
             this.downloadConfigEndpoints.length +
             this.webhookEndpoints.length +
             this.accountEndpoints.length +
             this.relationsEndpoints.length +
             this.autospecsPackagesEndpoints.length +
             this.reviewWorkflowEndpoints.length +
             this.systemStatusEndpoints.length
    }
  },
  
  mounted() {
    this.refreshStatus()
  },
  
  methods: {
    async refreshStatus() {
      this.loading = true
      try {
        // 获取系统health status
        const healthResponse = await axios.get('/health')
        this.systemHealth = healthResponse.data
        
        // 获取Token状态
        const tokenResponse = await axios.get('/api/auth/token-info')
        this.tokenStatus = tokenResponse.data.token_info || {}
        
        this.$message.success('系统状态已刷新')
      } catch (error) {
        this.$message.error('获取系统状态失败: ' + (error.response?.data?.message || error.message))
      } finally {
        this.loading = false
      }
    },
    
    async testEndpoint(endpoint) {
      endpoint.testing = true
      const startTime = Date.now()
      
      try {
        let response
        if (endpoint.method === 'GET') {
          response = await axios.get(endpoint.path)
        } else if (endpoint.method === 'POST') {
          response = await axios.post(endpoint.path, {})
        }
        
        const responseTime = Date.now() - startTime
        
        this.testResult = {
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.status,
          success: response.status >= 200 && response.status < 300,
          responseTime: responseTime,
          data: JSON.stringify(response.data, null, 2)
        }
        
        this.$message.success(`端点测试成功: ${endpoint.path}`)
      } catch (error) {
        const responseTime = Date.now() - startTime
        
        this.testResult = {
          endpoint: endpoint.path,
          method: endpoint.method,
          status: error.response?.status || 'Error',
          success: false,
          responseTime: responseTime,
          data: error.response?.data ? 
                JSON.stringify(error.response.data, null, 2) : 
                error.message
        }
        
        this.$message.error(`端点测试失败: ${endpoint.path}`)
      } finally {
        endpoint.testing = false
      }
    },
    
     clearTestResult() {
       this.testResult = null
     },
     
  }
}
</script>

<style scoped>
@import '../styles/common.css';

.system-status {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.stat-card {
  text-align: center;
}

.module-details {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分类标题样式 */
.category-divider {
  margin: 24px 0 16px 0;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-left: 4px solid #409eff;
  border-radius: 6px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-divider:first-child {
  margin-top: 0;
}

/* 端点列表容器 */
.endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

/* 端点卡片 */
.endpoint-card {
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.endpoint-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.08);
  transform: translateY(-2px);
}

/* 端点头部 */
.endpoint-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8fafc 100%);
  border-bottom: 1px solid #f0f0f0;
}

.endpoint-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.endpoint-details {
  flex: 1;
  min-width: 0;
}

.endpoint-path {
  font-family: 'Monaco', 'Consolas', 'SF Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
  word-break: break-all;
}

.endpoint-desc {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
}

/* HTTP方法标签 */
.method-tag {
  padding: 6px 12px;
  border-radius: 20px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  min-width: 60px;
  text-align: center;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.method-tag.get {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.method-tag.post {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.method-tag.put {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.method-tag.delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

/* 测试按钮 */
.endpoint-actions {
  flex-shrink: 0;
}

.test-button {
  border-radius: 8px !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2) !important;
  transition: all 0.2s !important;
}

.test-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3) !important;
}

/* 优化测试按钮图标大小 */
.test-button .arco-icon {
  font-size: 14px !important;
  margin-right: 4px;
}

/* ACC API 卡片 */
.acc-api-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-top: 1px solid #e0f2fe;
  padding: 16px 20px;
}

.acc-api-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.acc-api-icon {
  color: #0284c7;
  font-size: 16px;
}

.acc-api-title {
  font-weight: 600;
  color: #0369a1;
  font-size: 13px;
}

.acc-api-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acc-api-method {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(3, 105, 161, 0.1);
  color: #0369a1;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
}

.acc-api-url {
  font-family: 'Monaco', 'Consolas', 'SF Mono', monospace;
  font-size: 12px;
  color: #0c4a6e;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(3, 105, 161, 0.1);
  word-break: break-all;
  line-height: 1.4;
}

.acc-api-note {
  color: #64748b;
  font-size: 12px;
  font-style: italic;
  margin-top: 4px;
}

.test-result {
  margin-top: 20px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-info p {
  margin: 4px 0;
}

.result-info .success {
  color: #52c41a;
  font-weight: bold;
}

.result-info .error {
  color: #f5222d;
  font-weight: bold;
}

.result-data {
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.45;
  overflow-x: auto;
}

/* ACC API 信息样式 */
.acc-api-info {
  margin-top: 8px;
  margin-left: 20px;
}

.acc-api-content {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  padding: 12px;
}

.acc-api-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.acc-api-label {
  font-weight: 600;
  color: #1890ff;
  font-size: 13px;
}

.acc-api-url {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  color: #0050b3;
  background: #f0f9ff;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 6px;
  word-break: break-all;
}

.acc-api-note {
  font-size: 12px;
  color: #666;
  font-style: italic;
}
</style>
