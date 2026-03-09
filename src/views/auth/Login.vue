<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-placeholder">🎭</div>
        <h2>音乐剧购票系统 - 管理端</h2>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>预置账号：admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { login } from '@/api/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456',
  remember: true
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 调用登录API
    const res = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (res.code === 200) {
      // 保存token和用户信息
      userStore.setToken(res.data.token)
      userStore.setUserInfo(res.data.userInfo)

      ElMessage.success('登录成功')

      // 判断角色，管理员跳转到管理端，普通用户跳转到首页
      if (res.data.userInfo.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/')
      }
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败', error)
    ElMessage.error(error.response?.data?.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-box {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      .logo-placeholder {
        font-size: 48px;
        margin-bottom: 10px;
      }

      h2 {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }
    }

    .login-form {
      margin-top: 20px;
    }

    .login-footer {
      margin-top: 20px;
      text-align: center;
      color: #909399;
      font-size: 14px;

      p {
        margin: 0;
      }
    }
  }
}
</style>
