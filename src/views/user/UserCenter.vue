<template>
  <div class="user-center-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="user-card">
          <div class="user-avatar">
            <el-avatar :size="100" :src="getAvatarUrl(userInfo?.avatar)">
              {{ userInfo?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <el-upload
              class="avatar-uploader"
              :action="uploadAction"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              accept="image/*"
            >
              <el-button size="small" type="primary" class="upload-btn">更换头像</el-button>
            </el-upload>
          </div>
          <div class="user-info">
            <h3>{{ userInfo?.nickname || '未设置昵称' }}</h3>
            <p>{{ userInfo?.email || '未设置邮箱' }}</p>
            <el-tag v-if="userInfo?.role === 'admin'" type="danger">管理员</el-tag>
            <el-tag v-else type="success">普通用户</el-tag>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="value">{{ userStats.orderCount }}</span>
              <span class="label">订单数</span>
            </div>
            <div class="stat-item">
              <span class="value">{{ userStats.favoriteCount }}</span>
              <span class="label">收藏数</span>
            </div>
          </div>
        </el-card>

        <el-menu
          :default-active="activeMenu"
          mode="vertical"
          @select="handleMenuSelect"
          class="side-menu"
        >
          <el-menu-item index="profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
          <el-menu-item index="security">
            <el-icon><Lock /></el-icon>
            <span>账户安全</span>
          </el-menu-item>
          <el-menu-item index="orders">
            <el-icon><Ticket /></el-icon>
            <span>我的订单</span>
          </el-menu-item>
          <el-menu-item index="favorites">
            <el-icon><Star /></el-icon>
            <span>我的收藏</span>
          </el-menu-item>
        </el-menu>
      </el-col>

      <el-col :span="18">
        <el-card class="content-card">
          <!-- 个人信息 -->
          <div v-if="activeMenu === 'profile'" class="profile-section">
            <h2>👤 个人信息</h2>
            <el-form :model="profileForm" label-width="100px" class="profile-form">
              <el-form-item label="用户名">
                <el-input v-model="profileForm.username" disabled />
              </el-form-item>
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 账户安全 -->
          <div v-if="activeMenu === 'security'" class="security-section">
            <h2>🔒 账户安全</h2>
            <el-form :model="passwordForm" label-width="100px" class="password-form">
              <el-form-item label="原密码">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
              </el-form-item>
              <el-form-item label="新密码">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
              </el-form-item>
              <el-form-item label="确认密码">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="changePassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 我的订单 -->
          <div v-if="activeMenu === 'orders'" class="orders-section">
            <h2>📋 我的订单</h2>
            <div v-loading="loading" class="orders-container">
              <el-empty v-if="orderList.length === 0 && !loading" description="暂无订单数据" />
              <el-card v-for="order in orderList" :key="order.id" class="order-card" @click="viewOrderDetail(order.id)">
                <div class="order-header">
                  <span class="order-no">订单号：{{ order.orderNo }}</span>
                  <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
                </div>
                <div class="order-content">
                  <div class="order-show">
                    <h3>{{ order.showTitle }}</h3>
                    <p><el-icon><Calendar /></el-icon> {{ formatTime(order.showTime) }}</p>
                    <p><el-icon><Location /></el-icon> {{ order.theaterName }}</p>
                    <p class="order-seats">
                      <span>座位：</span>
                      <span v-for="(seat, index) in order.seats" :key="seat.id || index">
                        {{ seat.seatNumber || `${seat.rowNum}排${seat.colNum}座` }}
                        <span v-if="index < order.seats.length - 1">、</span>
                      </span>
                    </p>
                  </div>
                  <div class="order-footer">
                    <div class="order-price">
                      <span class="label">订单金额：</span>
                      <span class="price">¥{{ order.totalPrice }}</span>
                    </div>
                    <div class="order-time">
                      下单时间：{{ order.createTime }}
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
            <div class="view-all-container">
              <el-button type="primary" @click="goToOrders">查看全部订单</el-button>
            </div>
          </div>

          <!-- 我的收藏 -->
          <div v-if="activeMenu === 'favorites'" class="favorites-section">
            <h2>⭐ 我的收藏</h2>
            <div class="favorites-list" v-loading="loading">
              <el-empty v-if="favoriteList.length === 0 && !loading" description="暂无收藏" />
              <div class="favorite-item" v-for="item in favoriteList" :key="item.id" @click="goToShow(item.showId)">
                <div class="show-cover" :style="getCoverStyle(item)"></div>
                <div class="show-info">
                  <h4>{{ item.showTitle }}</h4>
                  <p>收藏时间：{{ item.createTime }}</p>
                </div>
                <el-button type="danger" size="small" @click.stop="removeFavorite(item.showId)">取消收藏</el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock, Ticket, Star, Calendar, Location } from '@element-plus/icons-vue'
import { updateUserInfo, changePassword as changePwd } from '@/api/user'
import { getFavoriteList, unfavoriteShow } from '@/api/show'
import { getOrderList } from '@/api/order'

const router = useRouter()
const userStore = useUserStore()

const activeMenu = ref('profile')
const loading = ref(false)
const saving = ref(false)

const userInfo = computed(() => userStore.userInfo)

// 头像上传配置
const uploadAction = computed(() => {
  return '/api/user/upload-avatar'
})

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    Authorization: token ? `Bearer ${token}` : ''
  }
})

const userStats = ref({
  orderCount: 0,
  favoriteCount: 0
})

const profileForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const favoriteList = ref([])
const orderList = ref([])

// 订单状态映射
const statusTextMap = {
  0: '待支付',
  1: '已支付',
  2: '已取消',
  3: '已完成',
  4: '退款中',
  5: '已退款'
}

const statusTypeMap = {
  0: 'warning',
  1: 'success',
  2: 'info',
  3: 'success',
  4: 'warning',
  5: 'danger'
}

// 获取用户统计信息
async function loadUserStats() {
  try {
    // TODO: 后端需要添加统计接口
    // const res = await getUserStats()
    // userStats.value = res.data

    // 临时解决方案：从收藏列表获取
    await loadFavorites()

    // 同时加载订单数量
    await loadOrders()
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 获取订单列表
async function loadOrders() {
  if (activeMenu.value !== 'orders') return

  try {
    loading.value = true
    const res = await getOrderList({ current: 1, size: 5 })
    if (res.code === 200) {
      orderList.value = res.data?.records || []
      userStats.value.orderCount = res.data?.total || 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 获取收藏列表
async function loadFavorites() {
  if (activeMenu.value !== 'favorites') return

  try {
    loading.value = true
    const res = await getFavoriteList({ page: 1, size: 20 })
    if (res.code === 200) {
      favoriteList.value = res.data?.records || res.data || []
      userStats.value.favoriteCount = res.data?.total || favoriteList.value.length
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error('获取收藏列表失败')
  } finally {
    loading.value = false
  }
}

function handleMenuSelect(index) {
  activeMenu.value = index

  // 切换到收藏菜单时加载收藏列表
  if (index === 'favorites') {
    loadFavorites()
  }
  // 切换到订单菜单时加载订单列表
  if (index === 'orders') {
    loadOrders()
  }
}

async function saveProfile() {
  // 表单验证
  if (!profileForm.nickname?.trim()) {
    ElMessage.warning('请输入昵称')
    return
  }
  if (!profileForm.email?.trim()) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }
  if (!profileForm.phone?.trim()) {
    ElMessage.warning('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(profileForm.phone)) {
    ElMessage.warning('请输入正确的手机号格式')
    return
  }

  try {
    saving.value = true
    const res = await updateUserInfo({
      nickname: profileForm.nickname,
      email: profileForm.email,
      phone: profileForm.phone
    })

    if (res.code === 200) {
      // 更新store中的用户信息
      await userStore.fetchUserInfo()
      ElMessage.success('保存成功')
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  // 表单验证
  if (!passwordForm.oldPassword?.trim()) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!passwordForm.newPassword?.trim()) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
    ElMessage.warning('新密码长度必须在6-20位之间')
    return
  }
  // 验证密码必须包含字母和数字
  const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword)
  const hasDigit = /\d/.test(passwordForm.newPassword)
  if (!hasLetter || !hasDigit) {
    ElMessage.warning('新密码必须同时包含字母和数字')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  try {
    saving.value = true
    const res = await changePwd({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })

    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''

      // 延迟后退出登录
      setTimeout(() => {
        userStore.logout()
        router.push('/login')
      }, 1500)
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.message || '修改失败，请检查原密码是否正确')
  } finally {
    saving.value = false
  }
}

function goToOrders() {
  router.push('/order/list')
}

function viewOrderDetail(id) {
  router.push(`/order/detail/${id}`)
}

function getStatusText(status) {
  return statusTextMap[status] || '未知'
}

function getStatusType(status) {
  return statusTypeMap[status] || 'info'
}

function formatTime(dateString) {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goToShow(id) {
  router.push(`/show/${id}`)
}

async function removeFavorite(showId) {
  try {
    await ElMessageBox.confirm('确定要取消收藏吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await unfavoriteShow(showId)
    if (res.code === 200) {
      favoriteList.value = favoriteList.value.filter(item => item.showId !== showId)
      userStats.value.favoriteCount = Math.max(0, userStats.value.favoriteCount - 1)
      ElMessage.success('取消收藏成功')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消收藏失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 监听路由变化，如果未登录则跳转到登录页
watch(() => userStore.isLogin, (isLogin) => {
  if (!isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
}, { immediate: true })

// 获取用户头像URL
function getAvatarUrl(avatar) {
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

// 头像上传前验证
function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 头像上传成功
async function handleAvatarSuccess(response) {
  if (response.code === 200) {
    const avatarUrl = response.data.url
    try {
      await updateUserInfo({ avatar: avatarUrl })
      await userStore.fetchUserInfo()
      ElMessage.success('头像上传成功')
    } catch (error) {
      ElMessage.error('头像保存失败')
    }
  } else {
    ElMessage.error(response.message || '头像上传失败')
  }
}

// 获取收藏剧目封面样式
function getCoverStyle(item) {
  const poster = item.poster || item.coverImage
  if (poster && poster.trim()) {
    let posterUrl = poster
    // 如果已经是完整URL，直接使用；否则使用相对路径
    if (!posterUrl.startsWith('http://') && !posterUrl.startsWith('https://')) {
      // 确保路径以 / 开头
      if (!posterUrl.startsWith('/')) {
        posterUrl = '/' + posterUrl
      }
    }
    return {
      backgroundImage: `url(${posterUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  // 默认背景
  return {
    background: '#e0e0e0'
  }
}

onMounted(async () => {
  // 检查登录状态
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 初始化表单数据
  if (userInfo.value) {
    profileForm.username = userInfo.value.username || ''
    profileForm.nickname = userInfo.value.nickname || ''
    profileForm.email = userInfo.value.email || ''
    profileForm.phone = userInfo.value.phone || ''
  }

  // 加载统计信息
  await loadUserStats()
})
</script>

<style scoped lang="scss">
.user-center-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f5f7fa;
  min-height: calc(100vh - 200px);

  .user-card {
    margin-bottom: 20px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;

    :deep(.el-card__body) {
      padding: 30px 20px;
    }

    .user-avatar {
      margin-bottom: 20px;

      :deep(.el-avatar) {
        border: 4px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-size: 40px;
        font-weight: bold;
      }

      .avatar-uploader {
        margin-top: 15px;
        text-align: center;

        :deep(.el-upload) {
          display: block;
        }

        .upload-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 12px;
          padding: 5px 15px;

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
          }
        }
      }
    }

    .user-info {
      margin-bottom: 25px;

      h3 {
        margin: 0 0 10px 0;
        color: white;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        margin: 5px 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
      }

      :deep(.el-tag) {
        margin-top: 10px;
      }
    }

    .user-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .value {
          font-size: 28px;
          font-weight: bold;
          color: white;
        }

        .label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 5px;
        }
      }
    }
  }

  .side-menu {
    border-right: none;
    background: white;
    border-radius: 8px;
    overflow: hidden;

    :deep(.el-menu-item) {
      height: 50px;
      line-height: 50px;
      margin: 5px 10px;
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        background: #f5f7fa;
      }

      &.is-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        .el-icon {
          color: white;
        }
      }

      .el-icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }
  }

  .content-card {
    min-height: 600px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    :deep(.el-card__body) {
      padding: 30px;
    }

    h2 {
      margin: 0 0 30px 0;
      font-size: 22px;
      color: #303133;
      font-weight: 600;
      padding-bottom: 15px;
      border-bottom: 2px solid #667eea;
      display: inline-block;
    }

    .profile-form,
    .password-form {
      max-width: 550px;

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #606266;
      }

      :deep(.el-input__inner) {
        height: 45px;
        border-radius: 6px;
      }

      :deep(.el-form-item) {
        margin-bottom: 25px;
      }

      :deep(.el-button) {
        height: 45px;
        padding: 0 30px;
        font-size: 15px;
        border-radius: 6px;
      }
    }

    .favorites-list {
      .favorite-item {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }

        .show-cover {
          width: 100px;
          height: 140px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          background-color: #e0e0e0;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .show-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 5px 0;

          h4 {
            margin: 0 0 10px 0;
            color: #303133;
            font-size: 18px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 14px;
            color: #909399;
          }
        }

        :deep(.el-button) {
          align-self: center;
          border-radius: 6px;
        }
      }
    }

    :deep(.el-empty) {
      padding: 60px 0;
    }

    .orders-container {
      min-height: 400px;

      .order-card {
        margin-bottom: 20px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
          margin-bottom: 15px;

          .order-no {
            font-size: 14px;
            color: #606266;
          }
        }

        .order-content {
          display: flex;
          justify-content: space-between;

          .order-show {
            flex: 1;

            h3 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #303133;
            }

            p {
              margin: 5px 0;
              font-size: 14px;
              color: #606266;
              display: flex;
              align-items: center;
              gap: 5px;
            }

            .order-seats {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #e0e0e0;
            }
          }

          .order-footer {
            text-align: right;

            .order-price {
              margin-bottom: 10px;

              .label {
                font-size: 14px;
                color: #606266;
              }

              .price {
                font-size: 20px;
                font-weight: bold;
                color: #F56C6C;
              }
            }

            .order-time {
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }
    }

    .view-all-container {
      margin-top: 30px;
      text-align: center;
    }
  }
}
</style>
