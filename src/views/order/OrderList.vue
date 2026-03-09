<template>
  <div class="order-list-page">
    <h1 class="page-title">📋 我的订单</h1>

    <!-- 订单状态筛选 -->
    <div class="order-tabs">
      <el-radio-group v-model="activeTab" @change="handleTabChange">
        <el-radio-button label="">全部订单</el-radio-button>
        <el-radio-button label="0">待支付</el-radio-button>
        <el-radio-button label="1">已支付</el-radio-button>
        <el-radio-button label="2">已取消</el-radio-button>
        <el-radio-button label="3">已完成</el-radio-button>
        <el-radio-button label="4">退款中</el-radio-button>
        <el-radio-button label="5">已退款</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 订单列表 -->
    <div class="order-list" v-loading="loading">
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
            <div class="order-actions">
              <el-button v-if="order.status === 0" type="primary" size="small" @click.stop="payOrder(order)">
                去支付
              </el-button>
              <el-button v-if="order.status === 0" type="danger" size="small" @click.stop="cancelOrder(order)">
                取消订单
              </el-button>
              <el-button v-if="order.status === 1" type="warning" size="small" @click.stop="refundOrder(order)">
                申请退票
              </el-button>
              <el-button size="small" @click.stop="viewOrderDetail(order.id)">查看详情</el-button>
            </div>
          </div>
        </div>
        <div class="order-time">
          下单时间：{{ order.createTime }}
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOrderList"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Location } from '@element-plus/icons-vue'
import { getOrderList, payOrder as payOrderApi, cancelOrder as cancelOrderApi, refundOrder as refundOrderApi } from '@/api/order'

const router = useRouter()

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const activeTab = ref('')

const pagination = reactive({
  page: 1,
  size: 10
})

// 加载订单列表（根据状态筛选）
async function loadOrderList() {
  try {
    loading.value = true
    const params = {
      current: pagination.page,
      size: pagination.size
    }
    if (activeTab.value !== '') {
      params.status = parseInt(activeTab.value)
    }
    const res = await getOrderList(params)
    if (res.code === 200) {
      orderList.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败，请检查后端服务是否启动')
    orderList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  loadOrderList()
}

function getStatusType(status) {
  const types = { 0: 'warning', 1: 'success', 2: 'info', 3: 'success', 4: 'warning', 5: 'danger' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已完成', 4: '退款中', 5: '已退款' }
  return texts[status] || '未知'
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

async function payOrder(order) {
  try {
    await ElMessageBox.confirm(`确认支付订单 ¥${order.totalPrice}？`, '支付确认', {
      type: 'warning'
    })
    await payOrderApi(order.id, 'alipay')
    ElMessage.success('支付成功')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败', error)
      ElMessage.error('支付失败')
    }
  }
}

async function cancelOrder(order) {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      type: 'warning'
    })
    await cancelOrderApi(order.id)
    ElMessage.success('订单已取消')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败', error)
      ElMessage.error('取消订单失败')
    }
  }
}

async function refundOrder(order) {
  try {
    await ElMessageBox.confirm('确定要申请退票吗？', '提示', {
      type: 'warning'
    })
    await refundOrderApi(order.id, '个人原因申请退票')
    ElMessage.success('退票申请已提交，等待审核')
    loadOrderList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请退票失败', error)
      ElMessage.error('申请退票失败')
    }
  }
}

function viewOrderDetail(id) {
  router.push(`/order/detail/${id}`)
}

onMounted(() => {
  loadOrderList()
})
</script>

<style scoped lang="scss">
.order-list-page {
  .page-title {
    margin: 0 0 30px 0;
    font-size: 28px;
    color: #303133;
  }

  .order-tabs {
    margin-bottom: 20px;
  }

  .order-list {
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

          .order-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
        }
      }

      .order-time {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 1px solid #e0e0e0;
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .pagination {
    margin-top: 30px;
    display: flex;
    justify-content: center;
  }
}
</style>
