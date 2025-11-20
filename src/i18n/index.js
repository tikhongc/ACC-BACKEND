import { createI18n } from 'vue-i18n'

// 导入语言包
import zh from './locales/zh.js'
import en from './locales/en.js'

// 获取用户语言偏好，默认为中文
const getDefaultLocale = () => {
  // 1. 从localStorage获取用户设置
  const savedLocale = localStorage.getItem('acc-sync-locale')
  if (savedLocale && ['zh', 'en'].includes(savedLocale)) {
    return savedLocale
  }
  
  // 2. 从浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage
  if (browserLang.startsWith('en')) {
    return 'en'
  }
  
  // 3. 默认中文
  return 'zh'
}

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用Composition API模式
  locale: getDefaultLocale(),
  fallbackLocale: 'zh', // 回退语言
  messages: {
    zh,
    en
  },
  // 全局注入属性
  globalInjection: true,
  // 静默警告
  silentTranslationWarn: true,
  silentFallbackWarn: true
})

// 语言切换函数
export const switchLanguage = (locale) => {
  if (['zh', 'en'].includes(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('acc-sync-locale', locale)
    // 触发自定义事件，通知其他组件语言已切换
    window.dispatchEvent(new CustomEvent('language-changed', { detail: locale }))
  }
}

// 获取当前语言
export const getCurrentLanguage = () => {
  return i18n.global.locale.value
}

// 获取可用语言列表
export const getAvailableLanguages = () => {
  return [
    { code: 'zh', name: '中文', nativeName: '中文' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ]
}

export default i18n
