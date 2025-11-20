# 国际化功能使用指南

## 概述

本项目已成功集成Vue I18n国际化功能，支持中英文切换。用户可以通过右上角的语言切换器实时切换界面语言，无需刷新页面。

## 功能特性

### ✅ 已实现功能

1. **Vue I18n集成** - 使用Vue I18n 9版本，完全兼容Vue 3
2. **语言切换组件** - 提供4种显示模式的语言切换器
3. **Element Plus国际化** - 自动切换Element Plus组件的语言
4. **本地存储** - 记住用户的语言偏好设置
5. **实时切换** - 无需刷新页面即可切换语言
6. **组件国际化** - 已更新ProjectSelector等核心组件

### 🎨 语言切换器模式

#### 1. 下拉菜单模式 (默认)
```vue
<LanguageSwitcher mode="dropdown" />
```

#### 2. 按钮组模式
```vue
<LanguageSwitcher mode="buttons" />
```

#### 3. 开关模式
```vue
<LanguageSwitcher mode="switch" />
```

#### 4. 图标模式
```vue
<LanguageSwitcher mode="icon" />
```

## 文件结构

```
frontend/src/
├── i18n/
│   ├── index.js          # i18n配置文件
│   └── locales/
│       ├── zh.js         # 中文语言包
│       └── en.js         # 英文语言包
├── components/
│   └── LanguageSwitcher.vue  # 语言切换组件
└── main.js               # 集成i18n插件
```

## 使用方法

### 1. 在组件中使用翻译

#### Composition API方式
```vue
<template>
  <div>
    <h1>{{ $t('common.title') }}</h1>
    <button>{{ $t('common.confirm') }}</button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    
    const showMessage = () => {
      console.log(t('message.saveSuccess'))
    }
    
    return { showMessage }
  }
}
</script>
```

#### Options API方式
```vue
<template>
  <div>
    <h1>{{ $t('common.title') }}</h1>
    <button @click="handleClick">{{ $t('common.confirm') }}</button>
  </div>
</template>

<script>
export default {
  methods: {
    handleClick() {
      this.$message.success(this.$t('message.saveSuccess'))
    }
  }
}
</script>
```

### 2. 带参数的翻译
```vue
<template>
  <div>
    <!-- 使用参数 -->
    <p>{{ $t('projectSelector.selectedCount', { count: 5 }) }}</p>
    <!-- 输出: "已选择 5 个项目" 或 "Selected 5 project(s)" -->
  </div>
</template>
```

### 3. 添加新的翻译文本

#### 在中文语言包中添加 (zh.js)
```javascript
export default {
  // 现有翻译...
  
  // 添加新的翻译
  newFeature: {
    title: '新功能',
    description: '这是一个新功能的描述',
    button: '点击我'
  }
}
```

#### 在英文语言包中添加 (en.js)
```javascript
export default {
  // 现有翻译...
  
  // 添加对应的英文翻译
  newFeature: {
    title: 'New Feature',
    description: 'This is a description of the new feature',
    button: 'Click Me'
  }
}
```

## 语言包结构

### 主要分类

- `common` - 通用文本 (确认、cancel、保存等)
- `nav` - 导航菜单
- `projectSelector` - 项目选择器
- `status` - 状态标签
- `auth` - 认证相关
- `form` - 表单验证
- `table` - 数据表格
- `message` - 消息提示
- `languageSwitcher` - 语言切换器
- `monitoring` - 全局监控
- `dataConnector` - 数据连接器

### 示例翻译键值

```javascript
// 中文 (zh.js)
{
  common: {
    confirm: '确认',
    cancel: 'cancel',
    loading: '加载中...'
  },
  projectSelector: {
    title: '选择项目',
    selectedCount: '已选择 {count} 个项目'
  }
}

// 英文 (en.js)
{
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    loading: 'Loading...'
  },
  projectSelector: {
    title: 'Select Project',
    selectedCount: 'Selected {count} project(s)'
  }
}
```

## 编程式语言切换

```javascript
import { switchLanguage, getCurrentLanguage } from '@/i18n'

// 切换到英文
switchLanguage('en')

// 切换到中文
switchLanguage('zh')

// 获取当前语言
const currentLang = getCurrentLanguage()
console.log(currentLang) // 'zh' 或 'en'
```

## 监听语言切换事件

```javascript
// 在组件中监听语言切换
window.addEventListener('language-changed', (event) => {
  console.log('语言已切换到:', event.detail)
  // 执行语言切换后的逻辑
})
```

## 最佳实践

### 1. 翻译键命名规范
- 使用小驼峰命名: `userName`, `projectInfo`
- 按功能模块分组: `auth.login`, `form.required`
- 避免过深的嵌套 (建议不超过3层)

### 2. 翻译文本规范
- 保持简洁明了
- 避免硬编码数字和特殊字符
- 使用参数替换动态内容

### 3. 组件国际化
- 所有用户可见的文本都应使用翻译
- 在组件setup中使用`useI18n()`
- 错误消息和提示信息也要国际化

## 故障排除

### 常见问题

1. **翻译不生效**
   - 检查翻译键是否正确
   - 确认语言包中是否存在对应翻译
   - 检查是否正确导入useI18n
   - 确保组件中使用`$t()`或`t()`函数
   - **⚠️ 重要：确保在setup()函数的return中包含了t函数**

2. **翻译键结构不匹配**
   - **问题描述**: Vue组件中使用了如`issueDetail.sections.basicInfo`的翻译键，但i18n文件中没有对应的`sections`分组结构
   - **解决方案**: 
     - 检查组件中使用的翻译键路径
     - 确保i18n文件中有对应的嵌套结构
     - 常见的缺失分组: `sections`, `fields`, `statusSummary`, `tabs`, `attachments`, `references`
   - **示例修复**:
     ```javascript
     // 组件中使用: t('issueDetail.sections.basicInfo')
     // i18n文件中需要有:
     issueDetail: {
       sections: {
         basicInfo: 'basicInfo'
       }
     }
     ```

3. **Element Plus组件未切换语言**
   - 确认main.js中已正确配置Element Plus语言包
   - 检查语言切换事件是否正确触发
   - 验证provide/inject机制是否正常工作

4. **翻译键前缀问题 - 🚨 CRITICAL**
   - **问题描述**: 页面显示翻译键原始名称而不是翻译文本，如显示`account.accountInfo.title`而不是`账户信息`
   - **常见原因**:
     - **模板语法错误**: 模板中有语法错误导致Vue无法正确解析
     - setup()函数中没有返回`t`函数 (Composition API)
     - 翻译键路径错误或不存在
     - i18n配置问题 (legacy vs composition模式不匹配)
   - **解决方案**:
     
     **🔧 步骤1: 检查模板语法**
     ```vue
     <!-- ❌ 错误：模板中有语法错误 -->
     <PageHeader :title="$t('account.title')"description="test" />
     
     <!-- ✅ 正确：确保属性之间有空格 -->
     <PageHeader :title="$t('account.title')" description="test" />
     ```
     
     **🔧 步骤2: Composition API组件配置**
     ```vue
     <script>
     import { useI18n } from 'vue-i18n'
     
     export default {
       setup() {
         const { t } = useI18n()
         
         // ⚠️ 必须在return中包含t函数
         return {
           t,  // 这一行必不可少！
           // ... 其他返回值
         }
       }
     }
     </script>
     ```
     
     **🔧 步骤3: Options API组件配置**
     ```vue
     <template>
       <!-- 在模板中使用 $t() -->
       <div>{{ $t('common.title') }}</div>
     </template>
     
     <script>
     export default {
       methods: {
         someMethod() {
           // 在JavaScript中使用 this.$t()
           console.log(this.$t('common.message'))
         }
       }
     }
     </script>
     ```
   
   - **检查清单**:
     - ✅ 检查模板语法是否正确 (属性间有空格，引号配对)
     - ✅ `import { useI18n } from 'vue-i18n'` (Composition API)
     - ✅ `const { t } = useI18n()` (Composition API)
     - ✅ `return { t, ... }` (Composition API)
     - ✅ 模板中使用`{{ $t('key') }}`或`:title="$t('key')"`
     - ✅ JavaScript中使用`t('key')`(Composition) 或 `this.$t('key')`(Options)
     - ✅ 翻译键在语言包中存在且路径正确

5. **组件中硬编码文本**
   - **问题描述**: 组件中直接使用中文文本，如`'正在获取参照数据...'`、`'总参照数'`等
   - **解决方案**: 
     - 将所有硬编码文本替换为翻译键
     - 在i18n文件中添加对应翻译
     - 使用`t()`函数包装文本
   - **示例修复**:
     ```vue
     <!-- 修复前 -->
     <div class="loading-text">正在获取参照数据...</div>
     <el-statistic title="总参照数" :value="total" />
     
     <!-- 修复后 -->
     <div class="loading-text">{{ t('issueDetail.references.loading') }}</div>
     <el-statistic :title="t('issueDetail.references.totalReferences')" :value="total" />
     ```

5. **图标显示问题**
   - 确认使用的图标在@element-plus/icons-vue中存在
   - 检查图标组件是否正确导入和注册
   - 使用Location图标替代不存在的Globe图标

6. **页面仍显示中文**
   - 检查页面是否使用了硬编码的中文文本
   - 确保所有文本都使用`$t()`函数包装
   - 验证语言包中是否包含所需的翻译键

### 已修复的问题

- ✅ 语言切换器位置已移至左上角
- ✅ Home页面已完全国际化
- ✅ Element Plus语言包动态切换
- ✅ 图标导入错误已修复
- ✅ 启动脚本编码问题已解决
- ✅ Issue详情页面翻译键结构不匹配问题已修复
- ✅ IssueAttachments组件i18n翻译键已添加
- ✅ EntityReferences组件翻译结构已完善
- ✅ 添加了缺失的sections、fields、statusSummary、tabs等翻译分组
- ✅ **账户管理组件翻译键前缀显示问题已修复** (2024-10-24)
  - 修复了AccountInfo.vue模板语法错误导致的翻译键显示问题
  - 完成了AccountInfo、AccountRolesList、AccountCompaniesList、AccountMembersList组件的完整国际化
  - 添加了完整的account.* 翻译键结构到中英文语言包

## 翻译问题检查清单

### 如何检查组件是否需要国际化

1. **查找硬编码文本**
   ```bash
   # 在组件中搜索中文字符
   grep -r "[\u4e00-\u9fff]" frontend/src/components/
   
   # 搜索可能的硬编码文本
   grep -r "title=\"[^{]" frontend/src/components/
   grep -r "placeholder=\"[^{]" frontend/src/components/
   ```

2. **检查翻译键使用**
   ```bash
   # 搜索使用的翻译键
   grep -r "t('.*')" frontend/src/
   grep -r "\$t('.*')" frontend/src/
   ```

3. **验证翻译键存在**
   - 检查组件中使用的翻译键是否在i18n文件中存在
   - 确保中英文翻译文件都有对应的键值对
   - 验证嵌套结构是否正确

### 修复翻译问题的步骤

1. **识别问题**
   - 页面显示翻译键而不是翻译文本 (如: `issueDetail.sections.basicInfo`)
   - 组件中有硬编码的中文文本
   - 切换语言后某些文本没有变化

2. **定位翻译键**
   - 在组件中找到使用的翻译键
   - 检查翻译键的完整路径

3. **添加翻译内容**
   - 在`frontend/src/i18n/locales/en.js`中添加英文翻译
   - 在`frontend/src/i18n/locales/zh.js`中添加中文翻译
   - 确保嵌套结构正确

4. **测试验证**
   - 重新加载页面
   - 切换语言验证翻译是否生效
   - 检查控制台是否有翻译相关错误

### 常见翻译键命名模式

```javascript
// 按功能模块分组
issueDetail: {
  // 页面结构相关
  sections: { basicInfo: 'basicInfo' },
  tabs: { details: '详情' },
  
  // 字段标签
  fields: { issueId: '议题ID' },
  
  // 状态相关
  statusSummary: { status: '状态' },
  
  // 操作按钮
  actions: { refresh: '刷新' },
  
  // 消息提示
  messages: { loadSuccess: '加载成功' },
  
  // 子组件
  attachments: { /* 附件相关翻译 */ },
  references: { /* 参照相关翻译 */ }
}
```

## 扩展支持更多语言

要添加新语言支持 (如日文):

1. 创建语言包文件 `frontend/src/i18n/locales/ja.js`
2. 在 `frontend/src/i18n/index.js` 中导入并添加到messages
3. 更新 `getAvailableLanguages()` 函数
4. 添加对应的Element Plus语言包

```javascript
// ja.js
export default {
  common: {
    confirm: '確認',
    cancel: 'キャンセル'
    // ...
  }
  // ...
}
```

## 性能优化

- 语言包采用按需加载，减少初始包大小
- 翻译结果会被缓存，避免重复计算
- 使用localStorage保存用户偏好，减少服务器请求

## 🔧 翻译键前缀显示问题解决方案总结

### 问题现象
页面显示翻译键的完整路径而不是翻译文本，例如：
- 显示: `account.accountInfo.title`
- 期望: `账户信息`

### 根本原因分析
1. **模板语法错误** - Vue模板解析失败
2. **i18n配置不当** - Composition/Options API模式混用
3. **翻译函数未正确暴露** - setup()中未返回t函数

### 完整解决流程

#### 🔍 步骤1: 诊断问题类型
```bash
# 检查模板语法错误
grep -n "\".*\"[a-zA-Z]" frontend/src/views/AccountInfo.vue

# 检查组件API类型
grep -A5 "export default" frontend/src/views/AccountInfo.vue
```

#### 🔧 步骤2: 修复模板语法
```vue
<!-- ❌ 错误示例 -->
<PageHeader :title="$t('account.title')"description="test" />

<!-- ✅ 正确示例 -->
<PageHeader :title="$t('account.title')" description="test" />
```

#### ⚙️ 步骤3: 配置i18n模式
```javascript
// frontend/src/i18n/index.js
const i18n = createI18n({
  legacy: false, // Composition API模式
  globalInjection: true, // 支持Options API中的$t
  // ... 其他配置
})
```

#### 🎯 步骤4: 组件配置对照

**Composition API组件**:
```vue
<template>
  <div>{{ t('common.title') }}</div>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()
    return { t } // 🚨 关键：必须返回t函数
  }
}
</script>
```

**Options API组件**:
```vue
<template>
  <div>{{ $t('common.title') }}</div>
</template>

<script>
export default {
  methods: {
    someMethod() {
      return this.$t('common.message') // 使用this.$t
    }
  }
}
</script>
```

### 🚨 关键提醒

1. **模板语法检查**
   - 确保所有Vue属性之间有空格分隔
   - 检查引号配对和特殊字符

2. **API模式一致性**
   - Composition API: 模板用`t()`, JS用`t()`
   - Options API: 模板用`$t()`, JS用`this.$t()`

3. **翻译键验证**
   - 确保翻译键在语言包中存在
   - 验证嵌套结构路径正确

4. **调试技巧**
   ```javascript
   // 在组件中添加调试代码
   console.log('Current locale:', this.$i18n.locale)
   console.log('Translation test:', this.$t('account.accountInfo.title'))
   ```

### ✅ 验证修复效果

1. **重启开发服务器**
   ```bash
   npm run dev
   ```

2. **检查浏览器控制台**
   - 无i18n相关错误
   - 翻译键正确解析

3. **测试语言切换**
   - 中英文切换正常
   - 所有文本正确翻译

### 📋 预防措施

1. **代码审查清单**
   - [ ] 模板语法正确
   - [ ] 翻译函数正确暴露
   - [ ] 翻译键存在于语言包
   - [ ] API模式使用一致

2. **自动化检查**
   ```bash
   # 检查模板语法错误
   npm run lint
   
   # 检查翻译键完整性
   grep -r "\$t(" frontend/src/ | grep -v "node_modules"
   ```

---

**注意**: 本指南基于Vue 3 + Vue I18n 9 + Element Plus实现。如需更新或扩展功能，请参考对应的官方文档。
