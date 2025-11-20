<template>
  <div class="entity-references-usage-examples">
    <h1>EntityReferences 通用组件使用示例</h1>
    
    <!-- RFI 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>RFI 参照示例</h3>
          <el-tag type="primary">RFI</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="exampleRfi" 
        :project="exampleProject"
        entity-type="rfi"
        :auto-load="false"
        :show-debug-info="true"
        :show-json-viewer="true"
        :supported-reference-types="['document', 'file', 'drawing', 'photo', 'issue', 'specification']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- Issue 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>问题 参照示例</h3>
          <el-tag type="warning">Issue</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="exampleIssue" 
        :project="exampleProject"
        entity-type="issue"
        :auto-load="false"
        :show-debug-info="false"
        :show-json-viewer="false"
        :supported-reference-types="['document', 'file', 'photo', 'drawing', 'rfi']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- Submittal 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>提交资料 参照示例</h3>
          <el-tag type="success">Submittal</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="exampleSubmittal" 
        :project="exampleProject"
        entity-type="submittal"
        :auto-load="false"
        :show-debug-info="false"
        :show-json-viewer="false"
        :supported-reference-types="['document', 'file', 'drawing', 'specification', 'photo']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- Document 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>文档 参照示例</h3>
          <el-tag type="info">Document</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="exampleDocument" 
        :project="exampleProject"
        entity-type="file"
        :auto-load="false"
        :show-debug-info="false"
        :show-json-viewer="false"
        :supported-reference-types="['document', 'version', 'dependency', 'markup']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- Photo 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>照片 参照示例</h3>
          <el-tag type="success">Photo</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="examplePhoto" 
        :project="exampleProject"
        entity-type="photo"
        :auto-load="false"
        :show-debug-info="false"
        :show-json-viewer="false"
        :supported-reference-types="['document', 'file', 'issue', 'rfi']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- Asset 参照示例 -->
    <el-card class="example-card" shadow="hover">
      <template #header>
        <div class="example-header">
          <h3>资产 参照示例</h3>
          <el-tag type="danger">Asset</el-tag>
        </div>
      </template>
      
      <EntityReferences 
        :entity="exampleAsset" 
        :project="exampleProject"
        entity-type="asset"
        :auto-load="false"
        :show-debug-info="false"
        :show-json-viewer="false"
        :supported-reference-types="['document', 'file', 'drawing', 'photo', 'specification']"
        @references-loaded="onReferencesLoaded"
        @references-error="onReferencesError" />
    </el-card>

    <!-- 使用说明 -->
    <el-card class="usage-guide" shadow="never">
      <template #header>
        <h3>使用说明</h3>
      </template>
      
      <div class="usage-content">
        <h4>基本用法</h4>
        <pre><code>&lt;EntityReferences 
  :entity="entityObject" 
  :project="projectObject"
  entity-type="rfi"
  :auto-load="true"
  :show-debug-info="false"
  :show-json-viewer="false"
  :supported-reference-types="['document', 'file']"
  @references-loaded="onReferencesLoaded"
  @references-error="onReferencesError" /&gt;</code></pre>

        <h4>支持的目标类型 (target_type)</h4>
        <p><strong>注意：</strong>组件使用 <code>target_type</code> 字段来进行分类和显示，而不是 <code>entity_type</code>。</p>
        <el-row :gutter="16">
          <el-col :span="6">
            <h5>文档类</h5>
            <ul>
              <li>document - 文档</li>
              <li>file - 文件</li>
              <li>document_package - 文档包</li>
              <li>drawing - 图纸</li>
            </ul>
          </el-col>
          <el-col :span="6">
            <h5>媒体类</h5>
            <ul>
              <li>photo - 照片</li>
              <li>image - 图片</li>
            </ul>
          </el-col>
          <el-col :span="6">
            <h5>工作流程类</h5>
            <ul>
              <li>submittal - 提交资料</li>
              <li>issue - 问题</li>
              <li>rfi - RFI</li>
              <li>correspondence - 函件</li>
            </ul>
          </el-col>
          <el-col :span="6">
            <h5>管理类</h5>
            <ul>
              <li>schedule_activity - 明细表活动</li>
              <li>specification - 规范</li>
              <li>asset - 资产</li>
              <li>form - 表单</li>
            </ul>
          </el-col>
        </el-row>

        <h4>支持的参照类型</h4>
        <ul>
          <li><strong>document</strong> - 文档参照</li>
          <li><strong>file</strong> - 文件参照</li>
          <li><strong>drawing</strong> - 图纸参照</li>
          <li><strong>photo</strong> - 照片参照</li>
          <li><strong>issue</strong> - 问题参照</li>
          <li><strong>rfi</strong> - RFI参照</li>
          <li><strong>specification</strong> - 规范参照</li>
          <li><strong>dependency</strong> - 依赖关系</li>
          <li><strong>auxiliary</strong> - 辅助关系</li>
          <li><strong>derived</strong> - 派生关系</li>
        </ul>

        <h4>视图模式</h4>
        <ul>
          <li><strong>列表视图</strong> - 传统的列表显示，适合详细信息展示</li>
          <li><strong>网格视图</strong> - 卡片网格显示，适合快速浏览</li>
          <li><strong>分类视图</strong> - 按实体分类分组显示，适合分类管理</li>
        </ul>

        <h4>事件</h4>
        <ul>
          <li><strong>@references-loaded</strong> - 参照加载成功时触发</li>
          <li><strong>@references-error</strong> - 参照加载失败时触发</li>
          <li><strong>@download-success</strong> - 下载成功时触发</li>
          <li><strong>@download-error</strong> - 下载失败时触发</li>
          <li><strong>@filter-changed</strong> - 筛选条件变更时触发</li>
          <li><strong>@search-changed</strong> - 搜索关键词变更时触发</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script>
import EntityReferences from '../EntityReferences.vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'EntityReferencesUsage',
  components: {
    EntityReferences
  },
  data() {
    return {
      // 示例项目数据
      exampleProject: {
        id: 'b.1eea4119-3553-4167-b93d-3a3d5d07d33d',
        name: '示例项目',
        account_id: 'example-account'
      },

      // 示例RFI数据
      exampleRfi: {
        id: 'e8e14f60-9f94-4557-aa55-ef4a0f0dcb25',
        title: '示例RFI - 结构设计问题',
        display_name: 'RFI-001',
        status: 'open'
      },

      // 示例Issue数据
      exampleIssue: {
        id: 'c495486f-0004-4d70-b72a-5fd29545b7db',
        title: '示例问题 - 施工质量问题',
        display_name: 'ISSUE-001',
        status: 'open'
      },

      // 示例Submittal数据
      exampleSubmittal: {
        id: 'submittal-example-id',
        title: '示例提交资料 - 材料规格书',
        display_name: 'SUB-001',
        status: 'pending'
      },

      // 示例Document数据
      exampleDocument: {
        id: 'document-example-id',
        name: '示例文档 - 设计图纸',
        display_name: 'DOC-001',
        file_type: 'dwg'
      },

      // 示例Photo数据
      examplePhoto: {
        id: 'photo-example-id',
        name: '示例照片 - 现场施工照片',
        display_name: 'PHOTO-001',
        file_type: 'jpg'
      },

      // 示例Asset数据
      exampleAsset: {
        id: 'asset-example-id',
        name: '示例资产 - 空调设备',
        display_name: 'ASSET-001',
        category: 'HVAC'
      }
    }
  },
  methods: {
    onReferencesLoaded(data) {
      console.log('参照加载成功:', data)
      ElMessage.success(`成功加载 ${data.references.length} 个参照`)
    },

    onReferencesError(error) {
      console.error('参照加载失败:', error)
      ElMessage.error('参照加载失败')
    }
  }
}
</script>

<style scoped>
.entity-references-usage-examples {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-card {
  margin-bottom: 24px;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.example-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.usage-guide {
  margin-top: 32px;
}

.usage-content h4 {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #409eff;
  font-size: 16px;
  font-weight: 600;
}

.usage-content h5 {
  margin-bottom: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 600;
}

.usage-content pre {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.usage-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.usage-content li {
  margin-bottom: 4px;
  line-height: 1.5;
}
</style>
