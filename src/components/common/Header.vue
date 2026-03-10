<template>
  <header class="header">
    <div class="header-container">
      <!-- Logo -->
      <div class="logo" @click="goHome">
        <img v-if="configStore.logoUrl" :src="configStore.logoUrl" alt="" class="logo-img">
        <h1>{{ configStore.siteName }}</h1>
      </div>

      <!-- 导航菜单 -->
      <nav class="nav">
        <router-link to="/" class="nav-item" :class="{ active: isActiveRoute('/') }">首页</router-link>
        <router-link to="/show" class="nav-item" :class="{ active: isActiveRoute('/show') }">音乐剧</router-link>
        <router-link to="/theater" class="nav-item" :class="{ active: isActiveRoute('/theater') }">剧院</router-link>
      </nav>

      <!-- 用户信息区 -->
      <div class="user-area">
        <!-- 购物车 -->
        <div class="cart-icon" @click="goCart" v-if="userStore.isLogin">
          <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
            <el-icon :size="24">
              <ShoppingCart />
            </el-icon>
          </el-badge>
        </div>

        <!-- 用户信息 -->
        <template v-if="userStore.isLogin">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="getAvatarUrl(userStore.userInfo?.avatar)">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.displayName }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="order">
                  <el-icon><Tickets /></el-icon>
                  我的订单
                </el-dropdown-item>
                <el-dropdown-item command="security" divided>
                  <el-icon><Lock /></el-icon>
                  账户安全
                </el-dropdown-item>
                <el-dropdown-item command="admin" v-if="userStore.isAdmin" divided>
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <!-- 未登录 -->
        <template v-else>
          <el-button type="primary" @click="goLogin">登录</el-button>
          <el-button @click="goRegister">注册</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useCartStore } from '@/store/cart'
import { useConfigStore } from '@/store/config'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  ShoppingCart,
  User,
  Tickets,
  Lock,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const configStore = useConfigStore()

// 判断路由是否激活
const isActiveRoute = (path) => {
  return route.path === path
}

// 跳转首页
const goHome = () => {
  router.push('/')
}

// 跳转购物车
const goCart = () => {
  router.push('/cart')
}

// 跳转登录
const goLogin = () => {
  router.push('/login')
}

// 跳转注册
const goRegister = () => {
  router.push('/register')
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/user/center')
      break
    case 'order':
      router.push('/order/list')
      break
    case 'security':
      router.push('/user/center')
      break
    case 'admin':
      router.push('/admin/dashboard')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    cartStore.clear()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

// 获取用户头像URL
const getAvatarUrl = (avatar) => {
  if (!avatar) return undefined
  // 如果已经是完整URL，直接使用
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // 使用相对路径，处理双斜杠问题
  let avatarUrl = avatar
  // 去除开头的多余斜杠
  while (avatarUrl.startsWith('//')) {
    avatarUrl = avatarUrl.substring(1)
  }
  if (!avatarUrl.startsWith('/')) {
    avatarUrl = '/' + avatarUrl
  }
  return avatarUrl
}
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.logo-img {
  height: 40px;
  max-width: 200px;
  object-fit: contain;
}

.nav {
  flex: 1;
  display: flex;
  gap: 30px;
  margin-left: 60px;
}

.nav-item {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover,
.nav-item.active {
  color: #ffd04b;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ffd04b;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 20px;
}

.cart-icon {
  cursor: pointer;
  color: #fff;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.cart-icon:hover {
  color: #ffd04b;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #fff;
}

.username {
  font-size: 14px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
