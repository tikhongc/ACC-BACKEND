<template>
  <div class="auth-success">
    <el-card class="success-card">
      <div class="success-content">
        <!-- 成功状态 -->
        <template v-if="isSuccess">
          <el-icon class="success-icon" size="48px">
            <CircleCheck />
          </el-icon>
          <h2>认证成功！</h2>
          <p>{{ statusMessage }}</p>
          <p v-if="countdown > 0" class="countdown">{{ countdown }} 秒后自动跳转到主页...</p>
        </template>

        <!-- 失败状态 -->
        <template v-else>
          <el-icon class="error-icon" size="48px">
            <CircleClose />
          </el-icon>
          <h2>认证失败</h2>
          <p class="error-message">{{ statusMessage }}</p>
        </template>
      </div>
    </el-card>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <el-button v-if="isSuccess" type="primary" @click="goToMainPage">🏠 进入主页面</el-button>
      <el-button v-else type="primary" @click="goToLogin">🔄 重新登录</el-button>
    </div>

  </div>
</template>

<script>
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'

export default {
  name: 'AuthSuccess',
  components: {
    CircleCheck,
    CircleClose
  },
  data() {
    return {
      isSuccess: true,
      statusMessage: '✅ Token 已保存到会话',
      countdown: 5
    }
  },
  mounted() {
    // 从URL参数判断认证状态
    this.checkAuthStatus()

    // 成功时自动跳转
    if (this.isSuccess) {
      setTimeout(() => {
        this.goToMainPage()
      }, 5000)

      this.startCountdown()
    }
  },
  methods: {
    checkAuthStatus() {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (error) {
        this.isSuccess = false
        this.statusMessage = errorDescription || error || '认证过程中发生错误'
      }
    },

    startCountdown() {
      const timer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    },

    goToMainPage() {
      this.$router.push({ path: '/', query: { forceAuthCheck: 'true' } })
    },

    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.auth-success {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.success-card {
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
}

.success-content {
  text-align: center;
  padding: 40px 20px;
}

.success-icon {
  color: #67c23a;
  margin-bottom: 15px;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 15px;
}

.success-content h2 {
  color: #2c3e50;
  margin: 15px 0 10px 0;
}

.success-content p {
  color: #7f8c8d;
  font-size: 1.1em;
}

.error-message {
  color: #f56c6c !important;
}

.countdown {
  color: #409eff !important;
  font-weight: 600;
  margin-top: 15px;
}

.bottom-nav {
  text-align: center;
}

.bottom-nav .el-button {
  min-width: 150px;
}

@media (max-width: 768px) {
  .success-card {
    margin: 10px;
  }
}
</style>
