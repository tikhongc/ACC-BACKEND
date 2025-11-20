<template>
  <div class="login">
    <div class="login-container">
      <div class="login-header">
        <h1>ACC Data Sync Backend</h1>
        <p>Please login to continue using the system</p>
      </div>

      <div class="login-content">
        <div class="feature-list">
          <h3>System Features</h3>
          <ul>
            <li>🔐 OAuth 2.0 Secure Authentication</li>
            <li>📋 Autodesk Construction Cloud API Integration</li>
            <li>🔄 Advanced Data Synchronization & Management</li>
            <li>📊 Comprehensive Data Export & Analytics</li>
            <li>📁 Project File Management & Browser</li>
            <li>⚙️ Workflow Automation & Review Management</li>
          </ul>
        </div>

        <div class="login-actions">
          <el-button type="primary" size="large" @click="startAuth" :loading="loading">
            <i class="el-icon-user"></i>
            Start Autodesk Authentication
          </el-button>
          
          <div class="auth-info">
            <p>Click the button above to redirect to Autodesk official authentication page</p>
            <p>After successful authentication, you will be automatically redirected to the system homepage</p>
          </div>
        </div>
      </div>

      <div class="system-status">
        <el-button type="text" @click="checkHealth" :loading="healthLoading">
          <i class="el-icon-monitor"></i>
          System Status Check
        </el-button>
        <span v-if="healthStatus" :class="healthStatus.class">{{ healthStatus.message }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      healthLoading: false,
      healthStatus: null
    }
  },
  mounted() {
    console.log('Login page mounted - ready for authentication')
        // Initial load does not call any API, waiting for user to click authentication button
  },
  methods: {

    async startAuth() {
      this.loading = true
      try {
        console.log('Starting Autodesk authentication...')
        // Redirect to Flask backend authentication endpoint
        window.location.href = '/auth/start'
      } catch (error) {
        console.error('Authentication start failed:', error)
        this.$message.error('Authentication startup failed: ' + error.message)
        this.loading = false
      }
    },

    async checkHealth() {
      this.healthLoading = true
      try {
        const response = await axios.get('/health')
        this.healthStatus = {
          message: '✅ System running normally',
          class: 'status-success'
        }
        this.$message.success('System running normally')
      } catch (error) {
        this.healthStatus = {
          message: '❌ System connection failed',
          class: 'status-error'
        }
        this.$message.error('System check failed')
      } finally {
        this.healthLoading = false
      }
    }
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.login-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2em;
}

.login-header p {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 1.1em;
}

.login-content {
  margin-bottom: 30px;
}

.feature-list {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: left;
}

.feature-list h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
}

.feature-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 8px 0;
  color: #5a6c7d;
  font-size: 1em;
}

.login-actions {
  text-align: center;
}

.login-actions .el-button {
  width: 280px;
  height: 50px;
  font-size: 16px;
  margin-bottom: 20px;
}

.auth-info {
  background: #e8f4f8;
  border-radius: 8px;
  padding: 15px;
  border-left: 4px solid #409eff;
}

.auth-info p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.system-status {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  text-align: center;
}

.status-success {
  color: #67c23a;
  margin-left: 10px;
}

.status-error {
  color: #f56c6c;
  margin-left: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .login-header h1 {
    font-size: 1.5em;
  }
  
  .login-actions .el-button {
    width: 100%;
  }
}
</style>
