<template>
  <div class="order-confirm-page">
    <h1 class="page-title">📝 确认订单</h1>

    <div v-loading="loading" class="confirm-content">
      <!-- 多场次提示 -->
      <el-alert
        v-if="sessions.length > 1"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          您选择了 {{ sessions.length }} 个场次的演出，将自动为您创建多个订单
        </template>
      </el-alert>

      <el-row :gutter="20">
        <!-- 左侧订单详情 -->
        <el-col :span="16">
          <!-- 多个场次的信息 -->
          <el-card v-for="(session, index) in sessions" :key="session.sessionId" class="info-card session-card">
            <div class="session-header">
              <h3>场次 {{ index + 1 }}</h3>
              <span class="session-badge">{{ session.seats.length }} 张票</span>
            </div>
            <div class="show-detail">
              <div class="show-cover" :style="getShowCoverStyle(session.showCover)"></div>
              <div class="show-info">
                <h4>{{ session.showTitle }}</h4>
                <p><el-icon><Location /></el-icon> {{ session.theaterName }}</p>
                <p><el-icon><Clock /></el-icon> {{ formatTime(session.showTime) }}</p>
              </div>
            </div>
            <div class="seats-info">
              <div class="seat-item" v-for="seat in session.seats" :key="seat.id">
                <span class="seat-position">{{ seat.rowNum }}排{{ seat.colNum }}座</span>
                <span class="seat-price">¥{{ seat.price }}</span>
              </div>
            </div>
            <div class="session-total">
              <span>场次小计</span>
              <span class="amount">¥{{ getSessionTotal(session) }}</span>
            </div>
          </el-card>

          <!-- 联系人信息 -->
          <el-card class="info-card">
            <h3>👤 联系人信息</h3>
            <el-form :model="contactForm" label-width="100px">
              <el-form-item label="姓名">
                <el-input v-model="contactForm.name" placeholder="请输入联系人姓名" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="contactForm.phone" placeholder="请输入手机号" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧支付信息 -->
        <el-col :span="8">
          <el-card class="payment-card">
            <h3>💰 支付信息</h3>
            <div class="price-detail">
              <div class="price-row">
                <span>门票数量</span>
                <span>{{ totalSeats }} 张</span>
              </div>
              <div class="price-row">
                <span>票价小计</span>
                <span>¥{{ totalTicketPrice }}</span>
              </div>
              <div class="price-row">
                <span>服务费</span>
                <span>¥{{ totalServiceFee }}</span>
              </div>
              <div class="price-row total">
                <span>应付金额</span>
                <span class="price">¥{{ finalPrice }}</span>
              </div>
            </div>

            <el-divider />

            <h4>支付方式</h4>
            <el-radio-group v-model="selectedPayMethod" class="pay-methods">
              <el-radio :value="'alipay'" border>
                <span class="pay-icon alipay">支</span>
                支付宝
              </el-radio>
              <el-radio :value="'wechat'" border>
                <span class="pay-icon wechat">微</span>
                微信支付
              </el-radio>
            </el-radio-group>

            <el-divider />

            <div class="confirm-actions">
              <el-checkbox v-model="agreePolicy">
                我已阅读并同意
                <el-link type="primary">《购票协议》</el-link>
              </el-checkbox>
              <el-button
                type="primary"
                size="large"
                :disabled="!agreePolicy || creatingOrders"
                :loading="creatingOrders"
                style="width: 100%; margin-top: 15px"
                @click="submitOrders"
              >
                {{ creatingOrders ? '创建中...' : `提交订单(${sessions.length}个)` }}
              </el-button>
              <el-button size="large" style="width: 100%; margin-top: 10px" @click="goBack">
                返回修改
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Clock } from '@element-plus/icons-vue'
import { createOrder } from '@/api/order'
import { removeFromCart as removeFromCartApi } from '@/api/cart'

const router = useRouter()
const loading = ref(false)
const agreePolicy = ref(false)
const selectedPayMethod = ref('alipay')
const creatingOrders = ref(false)

const sessions = ref([])
const contactForm = reactive({
  name: '',
  phone: ''
})

// 计算某个场次的总价
function getSessionTotal(session) {
  return session.seats.reduce((sum, seat) => sum + (seat.price || 0), 0)
}

// 总座位数
const totalSeats = computed(() => {
  return sessions.value.reduce((sum, session) => sum + session.seats.length, 0)
})

// 总票价
const totalTicketPrice = computed(() => {
  return sessions.value.reduce((sum, session) => sum + getSessionTotal(session), 0)
})

// 总服务费（每张票5元）
const totalServiceFee = computed(() => totalSeats.value * 5)

// 应付金额
const finalPrice = computed(() => totalTicketPrice.value + totalServiceFee.value)

// 加载订单信息
function loadOrderInfo() {
  const checkoutDataStr = sessionStorage.getItem('checkoutData')

  if (!checkoutDataStr) {
    // 尝试读取旧格式的pendingOrder
    const pendingOrderStr = sessionStorage.getItem('pendingOrder')
    if (pendingOrderStr) {
      try {
        const pendingOrder = JSON.parse(pendingOrderStr)
        // 转换为新的sessions格式
        sessions.value = [{
          showId: pendingOrder.showId,
          sessionId: pendingOrder.sessionId,
          showTitle: pendingOrder.showTitle,
          showCover: pendingOrder.showCover,
          theaterName: pendingOrder.theaterName,
          showTime: pendingOrder.showTime,
          seats: pendingOrder.seats || []
        }]
        sessionStorage.removeItem('pendingOrder')
        return
      } catch (e) {
        console.error('解析订单信息失败', e)
      }
    }

    ElMessage.error('订单信息不存在，请重新选座')
    router.push('/cart')
    return
  }

  try {
    const checkoutData = JSON.parse(checkoutDataStr)
    sessions.value = checkoutData.sessions || []
  } catch (error) {
    console.error('解析订单信息失败', error)
    ElMessage.error('订单信息格式错误')
    router.push('/cart')
  }
}

function formatTime(dateString) {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
}

async function submitOrders() {
  if (!contactForm.name || !contactForm.phone) {
    ElMessage.warning('请填写联系人信息')
    return
  }

  if (sessions.value.length === 0) {
    ElMessage.warning('没有可购买的座位')
    return
  }

  try {
    loading.value = true
    creatingOrders.value = true

    const successOrders = []
    const failedOrders = []

    // 为每个场次创建订单
    for (const session of sessions.value) {
      try {
        const orderData = {
          showId: session.showId,
          sessionId: session.sessionId,
          seats: session.seats.map(seat => ({
            rowNum: seat.rowNum,
            colNum: seat.colNum,
            price: seat.price
          })),
          contactName: contactForm.name,
          contactPhone: contactForm.phone
        }

        const res = await createOrder(orderData)

        if (res.code === 200) {
          successOrders.push({
            sessionId: session.sessionId,
            orderId: res.data.orderId,
            seats: session.seats
          })
        } else {
          failedOrders.push({
            sessionId: session.sessionId,
            showTitle: session.showTitle,
            message: res.message || '创建失败'
          })
        }
      } catch (error) {
        console.error('创建订单失败', error)
        failedOrders.push({
          sessionId: session.sessionId,
          showTitle: session.showTitle,
          message: error.message || '创建失败'
        })
      }
    }

    // 处理结果
    if (successOrders.length > 0) {
      // 从购物车中删除已下单成功的座位
      for (const order of successOrders) {
        try {
          for (const seat of order.seats) {
            if (seat.cartId) {
              await removeFromCartApi(seat.cartId)
            }
          }
        } catch (e) {
          console.warn('删除购物车座位失败：', e)
        }
      }

      // 清除sessionStorage
      sessionStorage.removeItem('checkoutData')

      if (failedOrders.length === 0) {
        // 全部成功
        if (successOrders.length === 1) {
          ElMessage.success('订单创建成功，即将跳转支付...')
          setTimeout(() => {
            router.push(`/order/detail/${successOrders[0].orderId}`)
          }, 1500)
        } else {
          ElMessage.success(`成功创建 ${successOrders.length} 个订单，即将跳转到订单列表...`)
          setTimeout(() => {
            router.push('/order/list')
          }, 1500)
        }
      } else {
        // 部分成功
        ElMessageBox.alert(
          `成功创建 ${successOrders.length} 个订单，${failedOrders.length} 个场次失败。失败场次：${failedOrders.map(f => f.showTitle).join('、')}`,
          '订单结果',
          { type: 'warning' }
        ).then(() => {
          if (successOrders.length === 1) {
            router.push(`/order/detail/${successOrders[0].orderId}`)
          } else {
            router.push('/order/list')
          }
        })
      }
    } else {
      // 全部失败
      ElMessage.error(failedOrders.map(f => `${f.showTitle}: ${f.message}`).join('；'))
    }
  } catch (error) {
    console.error('提交订单失败', error)
    ElMessage.error(error.message || '提交订单失败')
  } finally {
    loading.value = false
    creatingOrders.value = false
  }
}

function goBack() {
  router.push('/cart')
}

function getShowCoverStyle(showCover) {
  if (showCover && showCover.trim()) {
    let coverUrl = showCover
    if (!coverUrl.startsWith('http://') && !coverUrl.startsWith('https://')) {
      if (!coverUrl.startsWith('/')) {
        coverUrl = '/' + coverUrl
      }
    }
    return {
      backgroundImage: `url(${coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

onMounted(() => {
  loadOrderInfo()
})
</script>

<style scoped lang="scss">
.order-confirm-page {
  .page-title {
    margin: 0 0 30px 0;
    font-size: 28px;
    color: #303133;
  }

  .confirm-content {
    .session-card {
      margin-bottom: 20px;

      .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h3 {
          margin: 0;
          font-size: 16px;
          color: #303133;
        }

        .session-badge {
          padding: 4px 12px;
          background: #EFF6FF;
          color: #3B82F6;
          font-size: 12px;
          border-radius: 12px;
          font-weight: 500;
        }
      }

      .session-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #F5F7FA;
        border-radius: 6px;
        margin-top: 16px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;

        .amount {
          font-size: 18px;
          font-weight: bold;
          color: #F56C6C;
        }
      }
    }

    .info-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        color: #303133;
      }

      .show-detail {
        display: flex;
        gap: 20px;
        margin-bottom: 16px;

        .show-cover {
          width: 120px;
          height: 160px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          background-color: #f5f7fa;
          flex-shrink: 0;
        }

        .show-info {
          h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #303133;
          }

          p {
            margin: 8px 0;
            font-size: 14px;
            color: #606266;
            display: flex;
            align-items: center;
            gap: 5px;
          }
        }
      }

      .seats-info {
        .seat-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 15px;
          background: #f5f7fa;
          border-radius: 4px;
          margin-bottom: 8px;

          .seat-position {
            font-size: 14px;
            color: #303133;
          }

          .seat-price {
            font-size: 16px;
            font-weight: bold;
            color: #F56C6C;
          }
        }
      }
    }

    .payment-card {
      position: sticky;
      top: 20px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 16px;
        color: #303133;
      }

      h4 {
        margin: 15px 0 10px 0;
        font-size: 14px;
        color: #606266;
      }

      .price-detail {
        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #606266;

          &.total {
            padding-top: 10px;
            border-top: 1px dashed #e0e0e0;
            font-size: 16px;
            font-weight: bold;
            color: #303133;

            .price {
              font-size: 24px;
              color: #F56C6C;
            }
          }
        }
      }

      .pay-methods {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;

        :deep(.el-radio) {
          display: flex;
          align-items: center;
          margin-right: 0;
        }

        .pay-icon {
          display: inline-block;
          width: 24px;
          height: 24px;
          line-height: 24px;
          text-align: center;
          border-radius: 4px;
          margin-right: 8px;
          font-weight: bold;
          color: white;

          &.alipay {
            background: linear-gradient(135deg, #1677ff 0%, #00a6ff 100%);
          }

          &.wechat {
            background: linear-gradient(135deg, #07c160 0%, #1aad19 100%);
          }
        }
      }

      .confirm-actions {
        margin-top: 15px;
      }
    }
  }
}
</style>
