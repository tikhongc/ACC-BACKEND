<template>
  <div class="language-switcher">
    <!-- 下拉菜单模式 -->
    <el-dropdown 
      v-if="mode === 'dropdown'"
      @command="handleLanguageChange"
      trigger="click"
      class="language-dropdown"
    >
      <el-button 
        :type="buttonType" 
        :size="size"
        :text="text"
        :bg="bg"
        class="language-button"
      >
        <el-icon class="language-icon">
          <Location />
        </el-icon>
        <span class="language-text">{{ getCurrentLanguageName() }}</span>
        <el-icon class="dropdown-icon">
          <ArrowDown />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-for="lang in availableLanguages"
            :key="lang.code"
            :command="lang.code"
            :disabled="lang.code === currentLanguage"
            class="language-item"
          >
            <div class="language-option">
              <el-icon class="option-icon">
                <Location />
              </el-icon>
              <span class="option-name">{{ lang.nativeName }}</span>
              <span class="option-label">{{ lang.name }}</span>
              <el-icon v-if="lang.code === currentLanguage" class="check-icon">
                <Check />
              </el-icon>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 按钮组模式 -->
    <el-button-group v-else-if="mode === 'buttons'" class="language-buttons">
        <el-button
          v-for="lang in availableLanguages"
          :key="lang.code"
          :type="lang.code === currentLanguage ? 'primary' : 'default'"
          :size="size"
          @click="handleLanguageChange(lang.code)"
          class="language-btn"
        >
          <el-icon class="btn-icon">
            <Location />
          </el-icon>
        <span v-if="showText">{{ lang.nativeName }}</span>
      </el-button>
    </el-button-group>

    <!-- 切换开关模式 -->
    <div v-else-if="mode === 'switch'" class="language-switch">
      <div class="switch-container">
        <span 
          :class="['switch-label', { active: currentLanguage === 'zh' }]"
          @click="handleLanguageChange('zh')"
        >
          <el-icon><Location /></el-icon>
          <span v-if="showText">CN</span>
        </span>
        <el-switch
          :model-value="currentLanguage === 'en'"
          @change="handleSwitchChange"
          :size="size"
          class="lang-switch"
        />
        <span 
          :class="['switch-label', { active: currentLanguage === 'en' }]"
          @click="handleLanguageChange('en')"
        >
          <el-icon><Location /></el-icon>
          <span v-if="showText">EN</span>
        </span>
      </div>
    </div>

    <!-- 图标模式 -->
    <el-tooltip 
      v-else-if="mode === 'icon'"
      :content="$t('languageSwitcher.switchTo') + ' ' + getNextLanguageName()"
      placement="bottom"
    >
      <el-button
        :type="buttonType"
        :size="size"
        :circle="true"
        @click="toggleLanguage"
        class="language-icon-btn"
      >
        <el-icon>
          <Location />
        </el-icon>
      </el-button>
    </el-tooltip>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { 
  ArrowDown, 
  Check,
  Location
} from '@element-plus/icons-vue'
import { switchLanguage, getCurrentLanguage, getAvailableLanguages } from '../i18n'

export default {
  name: 'LanguageSwitcher',
  components: {
    ArrowDown,
    Check,
    Location
  },
  props: {
    // Display mode: dropdown, buttons, switch, icon
    mode: {
      type: String,
      default: 'dropdown',
      validator: (value) => ['dropdown', 'buttons', 'switch', 'icon'].includes(value)
    },
    // Button type
    buttonType: {
      type: String,
      default: 'default'
    },
    // Size
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['large', 'default', 'small'].includes(value)
    },
    // Whether to show text
    showText: {
      type: Boolean,
      default: true
    },
    // 按钮是否为文本按钮
    text: {
      type: Boolean,
      default: false
    },
    // 按钮是否有背景
    bg: {
      type: Boolean,
      default: false
    },
    // 是否显示成功消息
    showMessage: {
      type: Boolean,
      default: true
    }
  },
  emits: ['language-changed'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const currentLanguage = ref(getCurrentLanguage())
    const availableLanguages = ref(getAvailableLanguages())

    // 计算属性
    const getCurrentLanguageName = () => {
      const lang = availableLanguages.value.find(l => l.code === currentLanguage.value)
      return lang ? lang.nativeName : 'Unknown'
    }

    const getNextLanguageName = () => {
      const nextLang = currentLanguage.value === 'zh' ? 'en' : 'zh'
      const lang = availableLanguages.value.find(l => l.code === nextLang)
      return lang ? lang.nativeName : 'Unknown'
    }

    // 方法
    const handleLanguageChange = async (langCode) => {
      if (langCode === currentLanguage.value) {
        return
      }

      try {
        // 切换语言
        switchLanguage(langCode)
        currentLanguage.value = langCode

        // 显示成功消息
        if (props.showMessage) {
          const langName = availableLanguages.value.find(l => l.code === langCode)?.nativeName
          ElMessage.success(t('languageSwitcher.switchSuccess') + `: ${langName}`)
        }

        // 触发事件
        emit('language-changed', {
          from: getCurrentLanguage(),
          to: langCode,
          language: availableLanguages.value.find(l => l.code === langCode)
        })

        console.log(`Language switched to: ${langCode}`)
      } catch (error) {
        console.error('Language switch failed:', error)
        if (props.showMessage) {
          ElMessage.error(t('languageSwitcher.switchFailed'))
        }
      }
    }

    const handleSwitchChange = (value) => {
      const targetLang = value ? 'en' : 'zh'
      handleLanguageChange(targetLang)
    }

    const toggleLanguage = () => {
      const nextLang = currentLanguage.value === 'zh' ? 'en' : 'zh'
      handleLanguageChange(nextLang)
    }

    // 监听全局语言变化事件
    const handleGlobalLanguageChange = (event) => {
      currentLanguage.value = event.detail
    }

    onMounted(() => {
      window.addEventListener('language-changed', handleGlobalLanguageChange)
    })

    onUnmounted(() => {
      window.removeEventListener('language-changed', handleGlobalLanguageChange)
    })

    return {
      currentLanguage,
      availableLanguages,
      getCurrentLanguageName,
      getNextLanguageName,
      handleLanguageChange,
      handleSwitchChange,
      toggleLanguage
    }
  }
}
</script>

<style scoped>
.language-switcher {
  display: inline-block;
}

/* 下拉菜单模式 */
.language-dropdown {
  display: inline-block;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.language-icon {
  font-size: 14px;
}

.language-text {
  font-size: 13px;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  margin-left: 2px;
}

.language-item {
  padding: 0 !important;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  width: 100%;
  min-width: 140px;
}

.option-icon {
  font-size: 14px;
  color: #606266;
}

.option-name {
  font-weight: 500;
  color: #303133;
}

.option-label {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.check-icon {
  font-size: 14px;
  color: #409eff;
}

/* 按钮组模式 */
.language-buttons {
  display: inline-flex;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon {
  font-size: 14px;
}

/* 切换开关模式 */
.language-switch {
  display: inline-block;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
}

.switch-label:hover {
  background: #e6f7ff;
  color: #409eff;
}

.switch-label.active {
  background: #409eff;
  color: white;
}

.lang-switch {
  margin: 0 4px;
}

/* 图标模式 */
.language-icon-btn {
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .language-option {
    min-width: 120px;
    padding: 6px 12px;
  }
  
  .option-label {
    display: none;
  }
  
  .switch-container {
    padding: 2px 6px;
    gap: 6px;
  }
  
  .switch-label {
    padding: 1px 4px;
    font-size: 11px;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .switch-container {
    background: #2d2d2d;
    border-color: #4c4d4f;
  }
  
  .switch-label {
    color: #a3a6ad;
  }
  
  .switch-label:hover {
    background: #1d39c4;
    color: #ffffff;
  }
}
</style>
