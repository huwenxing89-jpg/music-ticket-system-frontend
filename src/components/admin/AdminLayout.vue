<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo-container">
        <span v-if="!isCollapse" class="logo-icon">🎭</span>
        <span v-if="!isCollapse" class="title">音乐剧购票系统</span>
        <el-icon v-else class="logo-icon"><VideoPlay /></el-icon>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :unique-opened="true"
        :collapse-transition="false"
        mode="vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据仪表盘</template>
        </el-menu-item>

        <el-menu-item index="/admin/user">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/show">
          <el-icon><Film /></el-icon>
          <template #title>剧目管理</template>
        </el-menu-item>

        <el-sub-menu index="theater-group">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>剧院与场次</span>
          </template>
          <el-menu-item index="/admin/theater">剧院管理</el-menu-item>
          <el-menu-item index="/admin/session">场次管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/order">
          <el-icon><Tickets /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/comment">
          <el-icon><ChatLineSquare /></el-icon>
          <template #title>评论管理</template>
        </el-menu-item>

        <el-sub-menu index="content-group">
          <template #title>
            <el-icon><Management /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/admin/carousel">轮播图管理</el-menu-item>
          <el-menu-item index="/admin/announcement">公告管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/admin/system">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>

        <el-sub-menu index="log-group">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>日志管理</span>
          </template>
          <el-menu-item index="/admin/operator-log">操作日志</el-menu-item>
          <el-menu-item index="/admin/login-log">登录日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>

          <!-- 面包屑 -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 全屏按钮 -->
          <el-icon class="icon-btn" @click="toggleFullScreen">
            <FullScreen />
          </el-icon>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32">{{ userStore.displayName?.charAt(0) || 'A' }}</el-avatar>
              <span class="username">{{ userStore.displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="password">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changePassword } from '@/api/user'
import {
  DataAnalysis,
  User,
  Film,
  OfficeBuilding,
  Tickets,
  ChatLineSquare,
  Setting,
  Document,
  Management,
  Fold,
  Expand,
  FullScreen,
  ArrowDown,
  Lock,
  SwitchButton,
  VideoPlay
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前路由
const currentRoute = computed(() => route)

// 切换侧边栏折叠
function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

// 全屏切换
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

// 修改密码对话框
const passwordDialogVisible = ref(false)
const passwordFormRef = ref()
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码验证规则
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 处理下拉菜单命令
function handleCommand(command) {
  switch (command) {
    case 'profile':
      router.push('/user/profile')
      break
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('退出登录成功')
  }).catch(() => {})
}

// 提交修改密码
async function handlePasswordSubmit() {
  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await changePassword({
          oldPassword: passwordForm.value.oldPassword,
          newPassword: passwordForm.value.newPassword
        })
        ElMessage.success('密码修改成功，请重新登录')
        passwordDialogVisible.value = false
        passwordForm.value = {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        // 退出登录
        userStore.logout()
        router.push('/login')
      } catch (error) {
        console.error('密码修改失败', error)
        ElMessage.error('密码修改失败，请检查旧密码是否正确')
      }
    }
  })
}
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100%;

  .sidebar {
    background-color: #304156;
    transition: width 0.3s;
    overflow-x: hidden;
    overflow-y: auto;

    .logo-container {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #2b3a4a;

      .logo-icon {
        font-size: 24px;
        margin-right: 8px;
      }

      .title {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    .el-menu {
      border-right: none;
    }
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff;
      border-bottom: 1px solid #e6e6e6;
      padding: 0 20px;

      .header-left {
        display: flex;
        align-items: center;

        .collapse-btn {
          font-size: 20px;
          cursor: pointer;
          margin-right: 20px;
          color: #5a5e66;

          &:hover {
            color: #409EFF;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;

        .icon-btn {
          font-size: 20px;
          cursor: pointer;
          margin-right: 20px;
          color: #5a5e66;

          &:hover {
            color: #409EFF;
          }
        }

        .user-info {
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 0 10px;

          .username {
            margin: 0 8px;
            color: #5a5e66;
          }
        }
      }
    }

    .main-content {
      background-color: #f0f2f5;
      padding: 20px;
      overflow-y: auto;
    }
  }
}

/* 路由过渡动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
