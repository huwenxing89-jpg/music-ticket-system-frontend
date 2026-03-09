<template>
  <div class="order-detail-page" v-loading="loading">
    <div v-if="orderData" class="detail-content">
      <!-- 页面标题和操作 -->
      <div class="page-header">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h1 class="page-title">📋 订单详情</h1>
      </div>

      <!-- 订单状态卡片 -->
      <el-card class="status-card">
        <div class="status-info">
          <el-tag :type="getStatusType(orderData.status)" size="large" class="status-tag">
            {{ getStatusText(orderData.status) }}
          </el-tag>
          <div class="order-no">订单号：{{ orderData.orderNo }}</div>
        </div>
        <div class="order-actions" v-if="orderData.status === 0">
          <el-button type="primary" @click="payOrder">去支付</el-button>
          <el-button type="danger" @click="cancelOrder">取消订单</el-button>
        </div>
        <div class="order-actions" v-if="orderData.status === 1">
          <el-button type="warning" @click="refundOrder">申请退票</el-button>
        </div>
      </el-card>

      <!-- 剧目信息 -->
      <el-card class="info-card">
        <template #header>
          <h3>🎭 剧目信息</h3>
        </template>
        <div class="show-detail">
          <div class="show-cover" :style="getShowCoverStyle()"></div>
          <div class="show-info">
            <h4>{{ orderData.showTitle }}</h4>
            <p><el-icon><Location /></el-icon> {{ orderData.theaterName }}</p>
            <p><el-icon><Calendar /></el-icon> {{ formatTime(orderData.showTime) }}</p>
          </div>
        </div>
      </el-card>

      <!-- 座位信息 -->
      <el-card class="info-card">
        <template #header>
          <h3>💺 座位信息</h3>
        </template>
        <div class="seats-info">
          <div class="seat-item" v-for="(seat, index) in orderData.seats" :key="seat.id || index">
            <span class="seat-position">{{ seat.seatNumber || `${seat.rowNum}排${seat.colNum}座` }}</span>
            <span class="seat-price">¥{{ seat.price }}</span>
          </div>
        </div>
        <el-divider />
        <div class="price-summary">
          <div class="price-row">
            <span>票价小计</span>
            <span>¥{{ ticketPriceTotal }}</span>
          </div>
          <div class="price-row">
            <span>服务费</span>
            <span>¥{{ serviceFee }}</span>
          </div>
          <div class="price-row total">
            <span>实付金额</span>
            <span class="price">¥{{ orderData.totalPrice }}</span>
          </div>
        </div>
      </el-card>

      <!-- 订单信息 -->
      <el-card class="info-card">
        <template #header>
          <h3>📝 订单信息</h3>
        </template>
        <div class="order-info-list">
          <div class="info-item">
            <span class="label">订单编号</span>
            <span class="value">{{ orderData.orderNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">下单时间</span>
            <span class="value">{{ orderData.createTime }}</span>
          </div>
          <div class="info-item" v-if="orderData.payTime">
            <span class="label">支付时间</span>
            <span class="value">{{ orderData.payTime }}</span>
          </div>
          <div class="info-item" v-if="orderData.payMethod">
            <span class="label">支付方式</span>
            <span class="value">{{ getPayMethodText(orderData.payMethod) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-else-if="!loading" description="订单不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Location, Calendar } from '@element-plus/icons-vue'
import { getOrderDetail, payOrder as payOrderApi, cancelOrder as cancelOrderApi, refundOrder as refundOrderApi } from '@/api/order'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const orderData = ref(null)

// 计算票价小计
const ticketPriceTotal = computed(() => {
  if (!orderData.value || !orderData.value.seats) return 0
  return orderData.value.seats.reduce((sum, seat) => {
    const price = seat.price || 0
    return sum + price
  }, 0)
})

// 计算服务费（假设为0，或者可以设置为固定费用/比例）
const serviceFee = computed(() => {
  // 服务费计算方式：
  // 1. 固定费用：return 5
  // 2. 按比例计算：return ticketPriceTotal.value * 0.05
  // 3. 暂时设为0
  return 0
})

// 加载订单详情
async function loadOrderDetail() {
  loading.value = true
  const orderId = route.params.id

  try {
    const res = await getOrderDetail(orderId)
    if (res.code === 200 && res.data) {
      orderData.value = res.data
    } else {
      ElMessage.error(res.message || '获取订单详情失败')
    }
  } catch (error) {
    console.error('加载订单详情失败：', error)
    ElMessage.error(error.response?.data?.message || error.message || '加载订单详情失败')
  } finally {
    loading.value = false
  }
}

function getStatusType(status) {
  const types = { 0: 'warning', 1: 'success', 2: 'info', 3: 'success', 4: 'warning', 5: 'danger' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已完成', 4: '退款中', 5: '已退款' }
  return texts[status] || '未知'
}

function getPayMethodText(method) {
  const methods = { alipay: '支付宝', wechat: '微信支付', offline: '线下支付' }
  return methods[method] || '未知'
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

async function payOrder() {
  try {
    await ElMessageBox.confirm(`确认支付订单 ¥${orderData.value.totalPrice}？`, '支付确认', {
      type: 'warning'
    })
    const res = await payOrderApi(orderData.value.id, 'alipay')
    if (res.code === 200) {
      ElMessage.success('支付成功')
      loadOrderDetail()
    } else {
      ElMessage.error(res.message || '支付失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败', error)
      ElMessage.error(error.response?.data?.message || error.message || '支付失败')
    }
  }
}

async function cancelOrder() {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      type: 'warning'
    })
    const res = await cancelOrderApi(orderData.value.id)
    if (res.code === 200) {
      ElMessage.success('订单已取消')
      loadOrderDetail()
    } else {
      ElMessage.error(res.message || '取消订单失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败', error)
      ElMessage.error(error.response?.data?.message || error.message || '取消订单失败')
    }
  }
}

async function refundOrder() {
  try {
    await ElMessageBox.confirm('确定要申请退票吗？', '提示', {
      type: 'warning'
    })
    const res = await refundOrderApi(orderData.value.id, '个人原因申请退票')
    if (res.code === 200) {
      ElMessage.success('退票申请已提交，等待审核')
      loadOrderDetail()
    } else {
      ElMessage.error(res.message || '申请退票失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请退票失败', error)
      ElMessage.error(error.response?.data?.message || error.message || '申请退票失败')
    }
  }
}

function goBack() {
  router.back()
}

// 获取剧目封面样式
function getShowCoverStyle() {
  if (!orderData.value || !orderData.value.showCover) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }
  let coverUrl = orderData.value.showCover
  // 如果已经是完整URL，直接使用；否则使用相对路径
  if (!coverUrl.startsWith('http://') && !coverUrl.startsWith('https://')) {
    // 确保路径以 / 开头
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

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped lang="scss">
.order-detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 200px);

  .page-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    .page-title {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }

  .status-card {
    margin-bottom: 20px;

    .status-info {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .status-tag {
        font-size: 18px;
        padding: 10px 20px;
      }

      .order-no {
        font-size: 14px;
        color: #606266;
      }
    }

    .order-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
  }

  .info-card {
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }

    .show-detail {
      display: flex;
      gap: 20px;

      .show-cover {
        width: 120px;
        height: 160px;
        border-radius: 6px;
        background-size: cover;
        background-position: center;
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
        margin-bottom: 10px;

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

    .price-summary {
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
            font-size: 22px;
            color: #F56C6C;
          }
        }
      }
    }

    .order-info-list {
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #909399;
          font-size: 14px;
        }

        .value {
          color: #303133;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
