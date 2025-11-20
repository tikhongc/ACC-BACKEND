<template>
  <div class="i18n-test-page">
    <PageHeader 
      :title="$t('languageSwitcher.title')"
      :subtitle="$t('common.help')" />
    
    <div class="test-container">
      <!-- 语言切换器测试 -->
      <el-card class="test-card">
        <template #header>
          <h3>{{ $t('languageSwitcher.title') }}</h3>
        </template>
        
        <div class="switcher-demos">
          <div class="demo-item">
            <h4>{{ $t('common.mode') }}: Dropdown</h4>
            <LanguageSwitcher mode="dropdown" />
          </div>
          
          <div class="demo-item">
            <h4>{{ $t('common.mode') }}: Buttons</h4>
            <LanguageSwitcher mode="buttons" />
          </div>
          
          <div class="demo-item">
            <h4>{{ $t('common.mode') }}: Switch</h4>
            <LanguageSwitcher mode="switch" />
          </div>
          
          <div class="demo-item">
            <h4>{{ $t('common.mode') }}: Icon</h4>
            <LanguageSwitcher mode="icon" />
          </div>
        </div>
      </el-card>

      <!-- 项目选择器测试 -->
      <el-card class="test-card">
        <template #header>
          <h3>{{ $t('projectSelector.title') }}</h3>
        </template>
        
        <div class="selector-demo">
          <el-button 
            type="primary" 
            @click="showProjectSelector = true">
            {{ $t('common.open') }} {{ $t('projectSelector.title') }}
          </el-button>
          
          <ProjectSelector
            v-model="showProjectSelector"
            :multiple="true"
            :auto-refresh="true"
            @confirm="handleProjectConfirm"
            @cancel="handleProjectCancel" />
        </div>
      </el-card>

      <!-- 文本示例 -->
      <el-card class="test-card">
        <template #header>
          <h3>{{ $t('common.examples') }}</h3>
        </template>
        
        <div class="text-examples">
          <el-row :gutter="20">
            <el-col :span="12">
              <h4>{{ $t('common.common') }}</h4>
              <ul>
                <li>{{ $t('common.confirm') }}</li>
                <li>{{ $t('common.cancel') }}</li>
                <li>{{ $t('common.save') }}</li>
                <li>{{ $t('common.delete') }}</li>
                <li>{{ $t('common.loading') }}</li>
              </ul>
            </el-col>
            
            <el-col :span="12">
              <h4>{{ $t('status.title') }}</h4>
              <ul>
                <li>{{ $t('status.active') }}</li>
                <li>{{ $t('status.inactive') }}</li>
                <li>{{ $t('status.pending') }}</li>
                <li>{{ $t('status.completed') }}</li>
                <li>{{ $t('status.failed') }}</li>
              </ul>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 消息测试 -->
      <el-card class="test-card">
        <template #header>
          <h3>{{ $t('message.title') }}</h3>
        </template>
        
        <div class="message-demo">
          <el-space>
            <el-button @click="showSuccessMessage">
              {{ $t('common.success') }}
            </el-button>
            <el-button @click="showWarningMessage">
              {{ $t('common.warning') }}
            </el-button>
            <el-button @click="showErrorMessage">
              {{ $t('common.error') }}
            </el-button>
            <el-button @click="showInfoMessage">
              {{ $t('common.info') }}
            </el-button>
          </el-space>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PageHeader from '../components/PageHeader.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ProjectSelector from '../components/ProjectSelector.vue'

export default {
  name: 'I18nTest',
  components: {
    PageHeader,
    LanguageSwitcher,
    ProjectSelector
  },
  setup() {
    const { t } = useI18n()
    const showProjectSelector = ref(false)

    const handleProjectConfirm = (projects) => {
      console.log('Selected projects:', projects)
      ElMessage.success(t('message.operationSuccess'))
    }

    const handleProjectCancel = () => {
      console.log('Project selection cancelled')
    }

    const showSuccessMessage = () => {
      ElMessage.success(t('message.saveSuccess'))
    }

    const showWarningMessage = () => {
      ElMessage.warning(t('common.warning'))
    }

    const showErrorMessage = () => {
      ElMessage.error(t('message.networkError'))
    }

    const showInfoMessage = () => {
      ElMessage.info(t('common.info'))
    }

    return {
      showProjectSelector,
      handleProjectConfirm,
      handleProjectCancel,
      showSuccessMessage,
      showWarningMessage,
      showErrorMessage,
      showInfoMessage
    }
  }
}
</script>

<style scoped>
.i18n-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-container {
  margin-top: 20px;
}

.test-card {
  margin-bottom: 20px;
}

.switcher-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.demo-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f8f9fa;
}

.demo-item h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.selector-demo {
  text-align: center;
  padding: 20px;
}

.text-examples ul {
  list-style: none;
  padding: 0;
}

.text-examples li {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.message-demo {
  text-align: center;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .i18n-test-page {
    padding: 10px;
  }
  
  .switcher-demos {
    grid-template-columns: 1fr;
  }
}
</style>
