<template>
  <div class="permission-level-demo">
    <h3>Permission Level Display - Segmented Progress Bar</h3>
    <p class="demo-description">The new segmented progress bar clearly shows different permission levels, with each segment representing a permission tier.</p>
    
    <div class="demo-grid">
      <div 
        v-for="level in permissionLevels" 
        :key="level.level"
        class="demo-item"
      >
        <div class="demo-header">
          <el-tag :type="getPermissionLevelType(level.level)" size="default">
            Level {{ level.level }}
          </el-tag>
          <span class="level-name">{{ level.name }}</span>
        </div>
        
        <div class="demo-progress">
          <SegmentedProgressBar 
            :level="level.level"
            size="medium"
            :show-labels="true"
          />
        </div>
        
        <div class="demo-description-text">
          {{ level.description }}
        </div>
        
        <div class="demo-permissions">
          <el-tag 
            v-for="permission in level.permissions" 
            :key="permission"
            size="small"
            type="success"
            class="permission-tag"
          >
            {{ permission }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div class="comparison-section">
      <h4>Size Comparison</h4>
      <div class="size-comparison">
        <div class="size-demo">
          <span class="size-label">Small:</span>
          <SegmentedProgressBar :level="4" size="small" />
        </div>
        <div class="size-demo">
          <span class="size-label">Medium:</span>
          <SegmentedProgressBar :level="4" size="medium" />
        </div>
        <div class="size-demo">
          <span class="size-label">Large:</span>
          <SegmentedProgressBar :level="4" size="large" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SegmentedProgressBar from './SegmentedProgressBar.vue'

export default {
  name: 'PermissionLevelDemo',
  components: {
    SegmentedProgressBar
  },
  data() {
    return {
      permissionLevels: [
        {
          level: 1,
          name: 'View Permission',
          description: 'Can only view files and folders, no other operations allowed',
          permissions: ['View']
        },
        {
          level: 2,
          name: 'Download Permission',
          description: 'Can view and download files',
          permissions: ['View', 'Download']
        },
        {
          level: 3,
          name: 'Markup Permission',
          description: 'Can view, download files, and add markups and comments',
          permissions: ['View', 'Download', 'Markup']
        },
        {
          level: 4,
          name: 'Upload Permission',
          description: 'Can view, download, markup, and upload new files',
          permissions: ['View', 'Download', 'Markup', 'Upload']
        },
        {
          level: 5,
          name: 'Edit Permission',
          description: 'Has full edit permissions, can modify file content',
          permissions: ['View', 'Download', 'Markup', 'Upload', 'Edit']
        },
        {
          level: 6,
          name: 'Full Control',
          description: 'Has all permissions, including managing other user permissions',
          permissions: ['View', 'Download', 'Markup', 'Upload', 'Edit', 'Control']
        }
      ]
    }
  },
  methods: {
    getPermissionLevelType(level) {
      const typeMap = {
        1: 'info',     // 查看
        2: 'primary',  // 查看/下载
        3: 'warning',  // 查看/下载/标记
        4: 'success',  // 查看/下载/标记/上传
        5: 'danger',   // 完全编辑
        6: 'danger'    // 完全控制
      }
      return typeMap[level] || 'info'
    }
  }
}
</script>

<style scoped>
.permission-level-demo {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.permission-level-demo h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.demo-description {
  margin: 0 0 20px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.demo-item {
  background: white;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.demo-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.level-name {
  font-weight: 600;
  color: #303133;
}

.demo-progress {
  margin-bottom: 12px;
}

.demo-description-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 12px;
}

.demo-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-tag {
  font-size: 11px;
}

.comparison-section {
  border-top: 1px solid #E4E7ED;
  padding-top: 20px;
}

.comparison-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.size-comparison {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.size-demo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #E4E7ED;
  border-radius: 4px;
}

.size-label {
  font-weight: 500;
  color: #606266;
  min-width: 60px;
}

@media (max-width: 768px) {
  .demo-grid {
    grid-template-columns: 1fr;
  }
  
  .size-demo {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
