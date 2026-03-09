<template>
  <div class="seat-select-page" v-loading="loading">
    <!-- 步骤指示器 -->
    <div class="steps-container">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择场次" />
        <el-step title="选择座位" />
        <el-step title="确认订单" />
        <el-step title="支付完成" />
      </el-steps>
    </div>

    <div v-if="sessionInfo" class="seat-content">
      <!-- 剧目和场次信息 -->
      <el-card class="session-info-card">
        <div class="session-header">
          <h2>{{ sessionInfo.showTitle }}</h2>
          <div class="session-details">
            <p><el-icon><Calendar /></el-icon> {{ formatTime(sessionInfo.showTime) }}</p>
            <p><el-icon><Location /></el-icon> {{ sessionInfo.theaterName }}</p>
          </div>
        </div>
      </el-card>

      <!-- 座位选择区域 -->
      <el-card class="seat-selection-card">
        <template #header>
          <div class="card-header">
            <span>选择座位</span>
            <div class="seat-legend">
              <span class="legend-item">
                <span class="legend-seat available"></span>
                <span class="legend-text">可选</span>
              </span>
              <span class="legend-item">
                <span class="legend-seat selected"></span>
                <span class="legend-text">已选</span>
              </span>
              <span class="legend-item">
                <span class="legend-seat sold"></span>
                <span class="legend-text">已售</span>
              </span>
              <span class="legend-item">
                <span class="legend-seat hot"></span>
                <span class="legend-text">推荐</span>
              </span>
            </div>
          </div>
        </template>

        <!-- 数据来源提示 -->
        <el-alert
          v-if="isMockData"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 15px"
        >
          <template #default>
            当前显示的是模拟数据（API返回空数据或调用失败）。场次ID: {{ route.query.sessionId }}
          </template>
        </el-alert>
        <el-alert
          v-else
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 15px"
        >
          <template #default>
            正在显示真实座位数据 | 场次ID: {{ route.query.sessionId }} | 总座位: {{ seatMap.flat().filter(s => s).length }}
          </template>
        </el-alert>

        <!-- 票价区域说明 -->
        <div class="price-zones">
          <div class="price-zone vip-zone">
            <span class="zone-dot"></span>
            <span class="zone-label">VIP区</span>
            <span class="zone-price">¥{{ priceZone.vip }}</span>
          </div>
          <div class="price-zone normal-zone">
            <span class="zone-dot"></span>
            <span class="zone-label">普通区</span>
            <span class="zone-price">¥{{ priceZone.normal }}</span>
          </div>
          <div class="price-zone student-zone">
            <span class="zone-dot"></span>
            <span class="zone-label">学生区</span>
            <span class="zone-price">¥{{ priceZone.student }}</span>
          </div>
        </div>

        <!-- 舞台指示 -->
        <div class="stage-wrapper">
          <div class="screen-curve"></div>
          <div class="stage-label">舞台方向</div>
        </div>

        <!-- 座位图容器 -->
        <div class="seat-map-container" v-if="seatMap.length > 0">
          <!-- 座位图 -->
          <div class="seat-map">
            <div
              v-for="(row, rowIndex) in seatMap"
              :key="rowIndex"
              class="seat-row"
              :class="{ 'vip-row': rowIndex < 3, 'student-row': rowIndex >= seatMap.length - 2 }"
            >
              <span class="row-label">{{ rowIndex + 1 }}排</span>
              <div class="seats-in-row">
                <div
                  v-for="(seat, seatIndex) in row"
                  :key="seat && seat.id ? seat.id : `empty-${rowIndex}-${seatIndex}`"
                  :class="getSeatClass(seat, rowIndex, seatIndex)"
                  @click="toggleSeat(seat, rowIndex, seatIndex)"
                  @mouseover="hoverSeat = seat"
                  @mouseleave="hoverSeat = null"
                >
                  <template v-if="seat">
                    <!-- 已售座位显示X -->
                    <span v-if="seat.status === 2" class="sold-mark">×</span>
                    <!-- 可选/已选座位显示座位号 -->
                    <span v-else class="seat-number">{{ seatIndex + 1 }}</span>
                    <!-- 热门座位标记 -->
                    <span v-if="isHotSeat(seat) && seat.status !== 2" class="hot-mark">♦</span>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- 座位悬停信息 -->
          <div v-if="hoverSeat && hoverSeat.status !== 2" class="seat-tooltip">
            <div class="tooltip-seat-info">
              <span class="tooltip-position">{{ hoverSeat.rowNum }}排{{ hoverSeat.colNum }}座</span>
              <span class="tooltip-price">¥{{ hoverSeat.price }}</span>
            </div>
            <div v-if="isHotSeat(hoverSeat)" class="tooltip-hot">推荐座位</div>
          </div>
        </div>
        <el-empty v-else description="暂无座位信息" />
      </el-card>

      <!-- 已选座位信息 -->
      <el-card class="selected-seats-card" v-if="selectedSeats.length > 0">
        <template #header>
          <span>已选座位 ({{ selectedSeats.length }}/6)</span>
        </template>
        <div class="selected-seats-list">
          <div v-for="seat in selectedSeats" :key="seat.id" class="selected-seat-item">
            <div class="seat-info">
              <span class="seat-position">{{ seat.rowNum }}排{{ seat.colNum }}座</span>
              <el-tag v-if="seat.seatType === 1" type="warning" size="small">VIP</el-tag>
              <el-tag v-if="seat.seatType === 2" type="info" size="small">学生</el-tag>
              <el-tag v-if="isHotSeat(seat)" type="danger" size="small">推荐</el-tag>
            </div>
            <div class="seat-info-right">
              <span class="seat-price">¥{{ seat.price }}</span>
              <el-button type="danger" size="small" text @click="removeSeat(seat)">删除</el-button>
            </div>
          </div>
        </div>
        <div class="total-section">
          <div class="total-price">
            <span class="label">票价合计</span>
            <span class="price">¥{{ totalPrice }}</span>
          </div>
          <div class="service-fee">
            <span class="label">服务费</span>
            <span class="price">¥{{ selectedSeats.length * 5 }}</span>
          </div>
          <div class="final-total">
            <span class="label">应付金额</span>
            <span class="price">¥{{ totalPrice + selectedSeats.length * 5 }}</span>
          </div>
        </div>
        <div class="action-buttons">
          <el-button size="large" @click="goBack">返回</el-button>
          <el-button type="primary" size="large" @click="addToCart">加入购物车</el-button>
          <el-button type="success" size="large" @click="buyNow">立即下单</el-button>
        </div>
      </el-card>

      <!-- 温馨提示 -->
      <el-alert type="info" :closable="false" show-icon>
        <template #default>
          <div class="tips-content">
            <p>• 每次最多可选6个座位，支持连续座位选择</p>
            <p>• 选座后请在15分钟内完成支付，超时座位将自动释放</p>
            <p>• ♦标记为系统推荐的最佳观影位置</p>
          </div>
        </template>
      </el-alert>
    </div>

    <el-empty v-else-if="!loading" description="场次信息不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Location } from '@element-plus/icons-vue'
import { getSessionSeatStatus } from '@/api/seat'
import { addToCart as addToCartApi } from '@/api/cart'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentStep = ref(1)
const loading = ref(false)
const sessionInfo = ref(null)
const seatMap = ref([])
const selectedSeats = ref([])
const hoverSeat = ref(null)
const isMockData = ref(false) // 标识是否使用模拟数据

// 票价区域
const priceZone = ref({
  vip: 680,
  normal: 380,
  student: 180
})

// 计算总价（根据每个座位的价格累加）
const totalPrice = computed(() => {
  return selectedSeats.value.reduce((sum, seat) => sum + (seat.price || 0), 0)
})

// 判断是否是热门座位（中间区域）
function isHotSeat(seat) {
  if (!seat) return false
  // 中间区域且为可选座位认为是热门座位
  const rowFromCenter = Math.abs(seat.rowNum - 6)
  const colFromCenter = Math.abs(seat.colNum - 6)
  return rowFromCenter <= 2 && colFromCenter <= 2 && seat.seatType === 0
}

// 获取座位样式类
function getSeatClass(seat) {
  if (!seat) return ['seat', 'seat-empty']

  const classes = ['seat']

  // 基本状态
  if (seat.status === 0) classes.push('seat-available')
  else if (seat.status === 1) classes.push('seat-selected')
  else if (seat.status === 2) classes.push('seat-sold')

  // 座位类型
  if (seat.seatType === 1) classes.push('seat-vip')
  else if (seat.seatType === 2) classes.push('seat-student')
  else classes.push('seat-normal')

  // 热门座位
  if (isHotSeat(seat) && seat.status !== 2) classes.push('seat-hot')

  return classes
}

// 加载场次座位信息
async function loadSessionSeats() {
  try {
    loading.value = true
    const sessionId = route.query.sessionId

    console.log('🎯 开始加载座位信息，sessionId:', sessionId)

    if (!sessionId) {
      ElMessage.error('缺少场次信息')
      router.back()
      return
    }

    // 调用API获取场次和座位信息
    console.log('📡 调用API: getSessionSeatStatus(', sessionId, ')')
    const res = await getSessionSeatStatus(sessionId)
    console.log('📦 API返回结果:', res)

    if (res && res.code === 200) {
      console.log('✅ API调用成功，解析数据...')
      sessionInfo.value = res.data.session
      console.log('📋 场次信息:', sessionInfo.value)

      // 将一维座位数组转换为二维数组用于显示
      const seats = res.data.seats || []
      console.log('💺 座位数据数量:', seats.length)

      if (seats.length > 0) {
        console.log('🔄 转换座位数据为二维数组...')
        // 标记使用真实数据
        isMockData.value = false
        // 找出最大的行号和列号
        const maxRowNum = Math.max(...seats.map(s => s.rowNum))
        const maxColNum = Math.max(...seats.map(s => s.colNum))
        console.log('📐 座位布局:', { rows: maxRowNum, cols: maxColNum })

        // 创建二维数组
        const newSeatMap = []
        for (let row = 1; row <= maxRowNum; row++) {
          const rowSeats = []
          for (let col = 1; col <= maxColNum; col++) {
            const seat = seats.find(s => s.rowNum === row && s.colNum === col)
            if (seat) {
              rowSeats.push({
                id: seat.id,
                rowNum: seat.rowNum,
                colNum: seat.colNum,
                seatNumber: seat.seatNumber,
                seatType: seat.seatType,
                price: seat.price,
                status: seat.status,
                rowIndex: row - 1,
                colIndex: col - 1
              })
            } else {
              rowSeats.push(null)
            }
          }
          newSeatMap.push(rowSeats)
        }
        seatMap.value = newSeatMap
        console.log('✅ 座位图转换完成，行数:', seatMap.value.length)

        // 自动将已锁定座位添加到已选列表
        const lockedSeats = seats.filter(s => s.status === 1)
        if (lockedSeats.length > 0) {
          console.log('🔒 发现已锁定座位:', lockedSeats.length)
          selectedSeats.value = lockedSeats.map(seat => ({
            id: seat.id,
            rowNum: seat.rowNum,
            colNum: seat.colNum,
            seatNumber: seat.seatNumber,
            seatType: seat.seatType,
            price: seat.price,
            status: seat.status
          }))
          console.log('✅ 已自动选中锁定座位，总价:', totalPrice.value)
        }

        // 更新票价区域
        updatePriceZone(seats)
      } else {
        console.warn('⚠️ 座位数据为空，调用generateMockSeats')
        generateMockSeats()
      }
    } else {
      console.error('❌ API调用失败，res:', res)
      ElMessage.error(res?.message || '获取座位信息失败')
      generateMockSeats()
    }
  } catch (error) {
    console.error('❌ 加载座位信息失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    ElMessage.error('加载座位信息失败: ' + error.message)
    generateMockSeats()
  } finally {
    loading.value = false
    console.log('✨ 座位加载完成')
  }
}

// 更新票价区域
function updatePriceZone(seats) {
  const vipSeats = seats.filter(s => s.seatType === 1)
  const normalSeats = seats.filter(s => s.seatType === 0)
  const studentSeats = seats.filter(s => s.seatType === 2)

  if (vipSeats.length > 0) priceZone.value.vip = vipSeats[0].price
  if (normalSeats.length > 0) priceZone.value.normal = normalSeats[0].price
  if (studentSeats.length > 0) priceZone.value.student = studentSeats[0].price
}

// 生成模拟座位数据
function generateMockSeats() {
  console.log('🎭 使用模拟数据生成座位图')
  isMockData.value = true

  sessionInfo.value = {
    id: route.query.sessionId,
    showTitle: '音乐剧《猫》',
    showTime: '2026-03-15 19:30:00',
    theaterName: '上海大剧院',
    showId: 1
  }

  // 生成模拟座位图 10行 x 12列
  // 注意：模拟数据不包含已售座位，所有座位都是可选的
  seatMap.value = Array.from({ length: 10 }, (_, rowIndex) =>
    Array.from({ length: 12 }, (_, seatIndex) => {
      let price = 380
      let seatType = 0

      if (rowIndex < 3) {
        price = 680
        seatType = 1 // VIP
      } else if (rowIndex >= 8) {
        price = 180
        seatType = 2 // 学生票
      }

      return {
        id: `seat-${rowIndex}-${seatIndex}`,
        rowNum: rowIndex + 1,
        colNum: seatIndex + 1,
        seatNumber: `${rowIndex + 1}排${seatIndex + 1}座`,
        seatType,
        price,
        rowIndex,
        colIndex: seatIndex,
        status: 0 // 所有座位初始状态为0-可选，不生成已售座位
      }
    })
  )
}

// 切换座位选择状态
function toggleSeat(seat, rowIndex, seatIndex) {
  if (!seat || seat.status === 2) {
    if (seat) ElMessage.warning('该座位已售出')
    return
  }

  const seatKey = `${seat.rowNum}-${seat.colNum}`
  const isSelected = selectedSeats.value.some(s => `${s.rowNum}-${s.colNum}` === seatKey)

  if (isSelected) {
    seat.status = 0
    selectedSeats.value = selectedSeats.value.filter(s => `${s.rowNum}-${s.colNum}` !== seatKey)
  } else {
    if (selectedSeats.value.length >= 6) {
      ElMessage.warning('每次最多选择6个座位')
      return
    }

    seat.status = 1
    selectedSeats.value.push({
      ...seat,
      rowIndex,
      colIndex: seatIndex
    })
  }
}

// 移除已选座位
function removeSeat(seat) {
  seat.status = 0
  selectedSeats.value = selectedSeats.value.filter(s => s.id !== seat.id)
}

// 加入购物车
async function addToCart() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (selectedSeats.value.length === 0) {
    ElMessage.warning('请先选择座位')
    return
  }

  const loading = ElMessage({
    message: '正在添加到购物车...',
    type: 'info',
    duration: 0
  })

  try {
    // 逐个添加座位到购物车（座位已在点击时锁定，后端会验证锁定状态）
    for (const seat of selectedSeats.value) {
      await addToCartApi({
        sessionId: sessionInfo.value.id,
        seatId: seat.id
      })
    }

    loading.close()
    ElMessage.success(`成功添加${selectedSeats.value.length}个座位到购物车`)

    // 清空已选座位（但保持座位图中的锁定状态显示）
    selectedSeats.value = []

    // 跳转到购物车页面
    setTimeout(() => {
      router.push('/cart')
    }, 1000)
  } catch (error) {
    loading.close()
    console.error('加入购物车失败：', error)
    const errorMsg = error.response?.data?.message || error.message || '操作失败'
    ElMessage.error(errorMsg)

    // 刷新座位状态以显示最新的锁定信息
    await loadSessionSeats()
  }
}

// 立即下单
async function buyNow() {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (selectedSeats.value.length === 0) {
    ElMessage.warning('请先选择座位')
    return
  }

  // 准备订单数据（座位已在点击时锁定，后端会验证锁定状态）
  const orderData = {
    showId: sessionInfo.value.showId,
    sessionId: sessionInfo.value.id,
    showTitle: sessionInfo.value.showTitle,
    showCover: sessionInfo.value.showCover,
    showTime: sessionInfo.value.showTime,
    theaterId: sessionInfo.value.theaterId,
    theaterName: sessionInfo.value.theaterName,
    seats: selectedSeats.value.map(seat => ({
      id: seat.id,
      rowNum: seat.rowNum,
      colNum: seat.colNum,
      price: seat.price
    })),
    totalPrice: totalPrice.value
  }

  sessionStorage.setItem('pendingOrder', JSON.stringify(orderData))
  router.push('/order/confirm')
}

function goBack() {
  router.back()
}

function formatTime(dateString) {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
}

onMounted(() => {
  loadSessionSeats()
})
</script>

<style scoped lang="scss">
.seat-select-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 200px);

  .steps-container {
    margin-bottom: 30px;
  }

  .seat-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .session-info-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .session-header {
      h2 {
        margin: 0 0 15px 0;
        color: white;
        font-size: 24px;
      }

      .session-details {
        p {
          margin: 5px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;

          .el-icon {
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }
  }

  .seat-selection-card {
    :deep(.el-card__header) {
      padding: 15px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      .seat-legend {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #606266;

          .legend-seat {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            flex-shrink: 0;

            &.available {
              background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
              border: 2px solid #e0e0e0;
            }

            &.selected {
              background: #67c23a;
              border: 2px solid #529b2e;
            }

            &.sold {
              background: #e8e8e8;
              border: 2px solid #ccc;
              position: relative;

              &::after {
                content: '×';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #ccc;
                font-size: 14px;
              }
            }

            &.hot {
              background: white;
              border: 2px solid #f56c6c;
              position: relative;

              &::after {
                content: '♦';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #f56c6c;
                font-size: 10px;
              }
            }
          }

          .legend-text {
            white-space: nowrap;
          }
        }
      }
    }

    .price-zones {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;

      .price-zone {
        display: flex;
        align-items: center;
        gap: 8px;

        .zone-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .zone-label {
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }

        .zone-price {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
        }

        &.vip-zone .zone-dot {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        }

        &.normal-zone .zone-dot {
          background: white;
          border: 2px solid #ddd;
        }

        &.student-zone .zone-dot {
          background: linear-gradient(135deg, #87ceeb 0%, #add8e6 100%);
        }
      }
    }

    .stage-wrapper {
      position: relative;
      text-align: center;
      margin-bottom: 30px;
      padding: 0 40px;

      .screen-curve {
        height: 4px;
        background: linear-gradient(90deg,
          transparent 0%,
          #667eea 20%,
          #764ba2 50%,
          #667eea 80%,
          transparent 100%);
        border-radius: 50%;
        margin-bottom: 8px;
      }

      .stage-label {
        font-size: 13px;
        color: #909399;
        letter-spacing: 2px;
      }
    }

    .seat-map-container {
      position: relative;
      display: flex;
      justify-content: center;
    }

    .seat-map {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 30px 40px;
      background: linear-gradient(180deg, #fafbfc 0%, #f5f7fa 100%);
      border-radius: 12px;
      position: relative;

      .seat-row {
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s;

        &.vip-row {
          margin-bottom: 8px;
        }

        &.student-row {
          margin-top: 8px;
        }

        .row-label {
          min-width: 45px;
          text-align: right;
          font-size: 12px;
          color: #909399;
          font-weight: 500;
          padding-right: 8px;
        }

        .seats-in-row {
          display: flex;
          gap: 6px;
        }
      }
    }

    .seat {
      width: 32px;
      height: 32px;
      border-radius: 6px 6px 10px 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      position: relative;

      // 座位靠背效果
      border-top-left-radius: 6px;
      border-top-right-radius: 6px;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;

      &.seat-empty {
        visibility: hidden;
        pointer-events: none;
      }

      // 可选座位 - 白色/灰色渐变（与管理端一致）
      &.seat-available {
        background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
        border: 1px solid #e0e0e0;
        color: #606266;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
          z-index: 10;
        }

        // VIP可选座位
        &.seat-vip {
          background: linear-gradient(180deg, #fff9e6 0%, #ffe4b5 100%);
          border: 1px solid #daa520;
          color: #8b4513;
          font-weight: 600;

          &:hover {
            border-color: #ff8c00;
            box-shadow: 0 4px 12px rgba(255, 140, 0, 0.4);
          }
        }

        // 学生票可选座位
        &.seat-student {
          background: linear-gradient(180deg, #e6f7ff 0%, #cce5ff 100%);
          border: 1px solid #5f9ea0;
          color: #2f4f4f;

          &:hover {
            border-color: #4682b4;
            box-shadow: 0 4px 12px rgba(70, 130, 180, 0.3);
          }
        }

        // 普通可选座位
        &.seat-normal {
          background: linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
          border: 1px solid #ddd;
          color: #606266;

          &:hover {
            border-color: #409EFF;
            color: #409EFF;
          }
        }

        // 热门座位
        &.seat-hot {
          position: relative;

          &::before {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #f56c6c;
          }
        }
      }

      // 已选座位
      &.seat-selected {
        background: linear-gradient(180deg, #67c23a 0%, #529b2e 100%);
        border: 1px solid #529b2e;
        color: white;
        box-shadow: 0 2px 8px rgba(103, 194, 58, 0.4);
        transform: scale(1.05);

        &:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        &.seat-vip {
          background: linear-gradient(180deg, #ffa500 0%, #ff6347 100%);
          border-color: #ff4500;
        }

        &.seat-student {
          background: linear-gradient(180deg, #4682b4 0%, #5f9ea0 100%);
          border-color: #4682b4;
        }
      }

      // 已售座位 - 最底层
      &.seat-sold {
        background: #e8e8e8 !important;
        border: 1px solid #d0d0d0 !important;
        color: #bbb !important;
        cursor: not-allowed;
        position: relative;
        z-index: 1;

        // 确保已售座位显示在最底层
        transform: none !important;
        box-shadow: none !important;

        .sold-mark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 20px;
          line-height: 1;
          font-weight: bold;
        }

        &:hover {
          transform: none !important;
        }
      }

      .seat-number {
        font-size: 11px;
        line-height: 1;
      }

      .hot-mark {
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 8px;
        color: #f56c6c;
      }
    }

    .seat-tooltip {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;

      .tooltip-seat-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .tooltip-position {
          font-weight: 500;
        }

        .tooltip-price {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
        }
      }

      .tooltip-hot {
        font-size: 12px;
        color: #ffd700;
        margin-top: 4px;
      }
    }
  }

  .selected-seats-card {
    .selected-seats-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
      max-height: 300px;
      overflow-y: auto;

      .selected-seat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #f5f7fa 0%, #fafafa 100%);
        border-radius: 8px;
        border-left: 3px solid #409EFF;
        transition: all 0.2s;

        &:hover {
          background: #f0f0f0;
        }

        .seat-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .seat-position {
            font-weight: 500;
            color: #303133;
            font-size: 14px;
          }
        }

        .seat-info-right {
          display: flex;
          align-items: center;
          gap: 16px;

          .seat-price {
            font-size: 18px;
            font-weight: 600;
            color: #f56c6c;
          }
        }
      }
    }

    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-top: 1px dashed #e0e0e0;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;

      > div {
        display: flex;
        flex-direction: column;
        align-items: flex-end;

        .label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .price {
          font-size: 16px;
          font-weight: 600;
        }
      }

      .total-price .price {
        color: #606266;
      }

      .service-fee .price {
        color: #909399;
      }

      .final-total {
        .label {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }

        .price {
          font-size: 24px;
          color: #f56c6c;
        }
      }
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;

      .el-button {
        min-width: 120px;
      }
    }
  }

  .tips-content {
    p {
      margin: 4px 0;
      color: #606266;
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .seat-select-page {
    padding: 10px;

    .seat-selection-card {
      .price-zones {
        gap: 15px;
        flex-wrap: wrap;
      }

      .seat-map {
        padding: 15px 10px;

        .seat {
          width: 28px;
          height: 28px;
          font-size: 10px;
        }
      }

      .selected-seats-card {
        .total-section {
          flex-direction: column;
          align-items: stretch;
          gap: 15px;
        }

        .action-buttons {
          flex-direction: column;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
