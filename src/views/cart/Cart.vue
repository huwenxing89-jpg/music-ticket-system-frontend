<template>
  <div class="cart-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          购物车
        </h1>
        <label class="select-all-wrapper">
          <input type="checkbox" v-model="selectAll" @change="handleSelectAll" class="checkbox-input">
          <span class="select-all-text">全选</span>
        </label>
        <span class="item-count">{{ cartItems.length }} 个场次</span>
      </div>
      <div class="header-right">
        <div class="total-info">
          <span class="total-label">已选 {{ selectedCount }} 张</span>
          <span class="total-amount">¥{{ selectedPrice }}</span>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- Empty State -->
    <div v-else-if="cartItems.length === 0" class="empty-state">
      <div class="empty-icon">🛒</div>
      <h3 class="empty-title">购物车是空的</h3>
      <p class="empty-desc">快去选择您喜欢的演出吧</p>
      <button class="browse-btn" @click="goToShows">浏览演出</button>
    </div>

    <!-- Cart Content -->
    <div v-else class="cart-content">
      <!-- Cart Items List -->
      <div class="cart-list">
        <div
          v-for="(item, index) in cartItems"
          :key="item.id"
          class="cart-item"
          :style="{ animationDelay: `${index * 0.08}s` }"
        >
          <!-- Cover -->
          <div class="item-cover">
            <div class="cover-image" :style="getShowCoverStyle(item.showCover)"></div>
          </div>

          <!-- Info -->
          <div class="item-info">
            <div class="item-header">
              <h3 class="item-title">{{ item.showTitle }}</h3>
              <label class="item-select-wrapper">
                <input
                  type="checkbox"
                  :checked="isAllSeatsSelected(item)"
                  @change="toggleSessionSeats(item)"
                  class="checkbox-input"
                >
              </label>
            </div>
            <div class="item-meta">
              <div class="meta-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>{{ item.theaterName }}</span>
              </div>
              <div class="meta-row">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>{{ formatTime(item.showTime) }}</span>
              </div>
            </div>
            <div class="item-seats">
              <label
                v-for="seat in item.seats"
                :key="seat.id"
                class="seat-checkbox"
                :class="{ checked: selectedSeatIds.has(seat.id) }"
              >
                <input
                  type="checkbox"
                  :value="seat.id"
                  v-model="selectedSeatIds"
                  class="checkbox-input"
                >
                <span class="seat-tag">
                  {{ seat.rowNum }}排{{ seat.colNum }}座
                  <span class="seat-price">¥{{ seat.price }}</span>
                </span>
              </label>
            </div>
          </div>

          <!-- Price & Actions -->
          <div class="item-actions">
            <div class="item-price">¥{{ item.totalPrice }}</div>
            <button class="delete-btn" @click="removeItem(item.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <div class="summary-card">
          <h3 class="summary-title">订单摘要</h3>
          <div class="summary-list">
            <div class="summary-item">
              <span>已选门票</span>
              <span>{{ selectedCount }} 张</span>
            </div>
            <div class="summary-item">
              <span>场次数量</span>
              <span>{{ selectedSessionCount }} 场</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-item total">
              <span>合计金额</span>
              <span class="total-price">¥{{ selectedPrice }}</span>
            </div>
          </div>
          <button
            class="checkout-btn"
            :disabled="selectedSeatIds.size === 0"
            :class="{ disabled: selectedSeatIds.size === 0 }"
            @click="goToCheckout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="12" y1="9" x2="12" y2="15"/>
            </svg>
            确认订单 ({{ selectedCount }}张)
          </button>
        </div>

        <div class="tips-card">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>15分钟内完成支付，超时将自动取消</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCartList, removeFromCart as removeFromCartApi } from '@/api/cart'

const router = useRouter()
const cartItems = ref([])
const loading = ref(false)

// 选中的座位ID集合
const selectedSeatIds = ref(new Set())

// 加载购物车数据
async function loadCartData() {
  loading.value = true
  try {
    const res = await getCartList()
    if (res && res.code === 200) {
      cartItems.value = (res.data || []).map(item => {
        const seats = item.seats.map(seat => ({
          id: seat.seatId,
          cartId: seat.cartId,
          rowNum: parseInt(seat.seatNumber?.split('排')[0]) || 0,
          colNum: parseInt(seat.seatNumber?.split('排')[1]?.replace('座', '')) || 0,
          seatNumber: seat.seatNumber,
          price: seat.price || 0
        }))
        const calculatedTotal = seats.reduce((sum, seat) => sum + (seat.price || 0), 0)
        return {
          id: item.sessionId,
          showId: item.showId,
          showTitle: item.showTitle,
          showCover: item.showCover,
          theaterName: item.theaterName,
          showTime: item.showTime,
          seats: seats,
          totalPrice: calculatedTotal > 0 ? calculatedTotal : (item.totalPrice || 0)
        }
      })
      // 默认选中所有座位
      selectAllSeats()
    }
  } catch (error) {
    console.error('加载购物车失败：', error)
    ElMessage.error('加载购物车失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCartData()
})

// 全选状态
const selectAll = ref(false)

// 监听选中座位变化，更新全选状态
watch(selectedSeatIds, (newVal) => {
  const allSeatIds = cartItems.value.flatMap(item => item.seats.map(s => s.id))
  selectAll.value = allSeatIds.length > 0 && newVal.size === allSeatIds.length
}, { deep: true })

// 监听购物车数据变化，重新选中所有座位
watch(cartItems, () => {
  selectAllSeats()
}, { deep: true })

// 全选/取消全选
function handleSelectAll() {
  if (selectAll.value) {
    selectAllSeats()
  } else {
    selectedSeatIds.value.clear()
  }
}

// 选中所有座位
function selectAllSeats() {
  const allSeatIds = cartItems.value.flatMap(item => item.seats.map(s => s.id))
  selectedSeatIds.value = new Set(allSeatIds)
}

// 判断场次的所有座位是否都被选中
function isAllSeatsSelected(item) {
  return item.seats.every(seat => selectedSeatIds.value.has(seat.id))
}

// 切换场次的所有座位
function toggleSessionSeats(item) {
  const allSelected = isAllSeatsSelected(item)
  if (allSelected) {
    // 取消选中该场次所有座位
    item.seats.forEach(seat => {
      selectedSeatIds.value.delete(seat.id)
    })
  } else {
    // 选中该场次所有座位
    item.seats.forEach(seat => {
      selectedSeatIds.value.add(seat.id)
    })
  }
  // 强制更新响应式
  selectedSeatIds.value = new Set(selectedSeatIds.value)
}

// 已选座位数量
const selectedCount = computed(() => selectedSeatIds.value.size)

// 已选场次数量
const selectedSessionCount = computed(() => {
  const selectedSessions = new Set()
  cartItems.value.forEach(item => {
    item.seats.forEach(seat => {
      if (selectedSeatIds.value.has(seat.id)) {
        selectedSessions.add(item.id)
      }
    })
  })
  return selectedSessions.size
})

// 已选座位总价
const selectedPrice = computed(() => {
  let total = 0
  cartItems.value.forEach(item => {
    item.seats.forEach(seat => {
      if (selectedSeatIds.value.has(seat.id)) {
        total += seat.price || 0
      }
    })
  })
  return total
})

// 总座位数
const totalItems = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.seats.length, 0)
})

// 总价
const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.totalPrice, 0)
})

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

async function removeItem(sessionId) {
  try {
    await ElMessageBox.confirm('确定要删除这个场次的所有座位吗？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })

    const sessionItem = cartItems.value.find(item => item.id === sessionId)
    if (!sessionItem) return

    for (const seat of sessionItem.seats) {
      if (seat.cartId) {
        await removeFromCartApi(seat.cartId)
      }
    }

    await loadCartData()
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error)
      ElMessage.error('删除失败')
    }
  }
}

async function goToCheckout() {
  if (selectedSeatIds.value.size === 0) {
    ElMessage.warning('请先选择要购买的座位')
    return
  }

  // 按场次分组选中的座位
  const sessionGroups = []
  cartItems.value.forEach(item => {
    const selectedSeats = item.seats.filter(seat => selectedSeatIds.value.has(seat.id))
    if (selectedSeats.length > 0) {
      sessionGroups.push({
        sessionId: item.id,
        seats: selectedSeats
      })
    }
  })

  // 传递所有选中场次的信息到订单确认页
  const checkoutData = {
    sessions: sessionGroups.map(g => ({
      showId: cartItems.value.find(item => item.id === g.sessionId)?.showId,
      sessionId: g.sessionId,
      showTitle: cartItems.value.find(item => item.id === g.sessionId)?.showTitle,
      showCover: cartItems.value.find(item => item.id === g.sessionId)?.showCover,
      theaterName: cartItems.value.find(item => item.id === g.sessionId)?.theaterName,
      showTime: cartItems.value.find(item => item.id === g.sessionId)?.showTime,
      seats: g.seats
    })),
    selectedSeatIds: Array.from(selectedSeatIds.value),
    totalSeats: selectedSeatIds.value.size,
    totalPrice: selectedPrice.value
  }

  // 存储到sessionStorage
  sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData))
  router.push('/order/confirm')
}

function goToShows() {
  router.push('/show')
}

function getShowCoverStyle(coverUrl) {
  if (!coverUrl) {
    return {
      background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
    }
  }
  let url = coverUrl
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith('/')) {
      url = '/' + url
    }
  }
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}
</script>

<style scoped lang="scss">
.cart-page {
  min-height: 100vh;
  background: #F5F7FA;
  padding: 24px;
}

// Checkbox Styles
.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3B82F6;
}

// Header
.page-header {
  max-width: 1200px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #1F2937;
      display: flex;
      align-items: center;
      gap: 10px;

      svg {
        color: #3B82F6;
      }
    }

    .select-all-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;

      .select-all-text {
        font-size: 14px;
        color: #4B5563;
      }
    }

    .item-count {
      padding: 4px 12px;
      background: #EFF6FF;
      color: #3B82F6;
      font-size: 13px;
      border-radius: 12px;
      font-weight: 500;
    }
  }

  .header-right {
    .total-info {
      text-align: right;

      .total-label {
        display: block;
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 2px;
      }

      .total-amount {
        display: block;
        font-size: 24px;
        font-weight: 700;
        color: #EF4444;
      }
    }
  }
}

// Loading
.loading-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  padding: 24px;
  border-radius: 12px;
}

// Empty State
.empty-state {
  max-width: 400px;
  margin: 60px auto;
  text-align: center;
  background: white;
  padding: 48px 32px;
  border-radius: 12px;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }

  .empty-title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: #1F2937;
  }

  .empty-desc {
    margin: 0 0 24px;
    font-size: 14px;
    color: #6B7280;
  }

  .browse-btn {
    padding: 12px 24px;
    background: #3B82F6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #2563EB;
    }
  }
}

// Cart Content
.cart-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}

// Cart List
.cart-list {
  .cart-item {
    display: flex;
    gap: 20px;
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    opacity: 0;
    animation: fadeInUp 0.4s ease forwards;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .item-cover {
      position: relative;
      flex-shrink: 0;

      .cover-image {
        width: 120px;
        height: 150px;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .item-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1F2937;
          line-height: 1.4;
        }

        .item-select-wrapper {
          cursor: pointer;
          padding: 4px;
        }
      }

      .item-meta {
        margin-bottom: 12px;

        .meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-size: 13px;
          color: #6B7280;

          svg {
            color: #9CA3AF;
            flex-shrink: 0;
          }
        }
      }

      .item-seats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding-top: 12px;
        border-top: 1px dashed #E5E7EB;

        .seat-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.2s;

          &:hover {
            background: #F9FAFB;
          }

          &.checked {
            .seat-tag {
              background: #EFF6FF;
              border-color: #3B82F6;
              color: #1D4ED8;
            }
          }

          .seat-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            transition: all 0.2s;

            .seat-price {
              color: #EF4444;
              font-weight: 600;
            }
          }
        }
      }
    }

    .item-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      padding-left: 16px;
      border-left: 1px solid #E5E7EB;

      .item-price {
        font-size: 20px;
        font-weight: 700;
        color: #6B7280;
      }

      .delete-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 14px;
        background: #FEF2F2;
        color: #DC2626;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #FEE2E2;
        }
      }
    }
  }
}

// Order Summary
.order-summary {
  position: sticky;
  top: 24px;

  .summary-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .summary-title {
      margin: 0 0 20px;
      font-size: 16px;
      font-weight: 600;
      color: #1F2937;
    }

    .summary-list {
      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        font-size: 14px;
        color: #6B7280;

        &.total {
          padding-top: 16px;
          margin-top: 8px;
          border-top: 1px solid #E5E7EB;
          font-size: 15px;
          font-weight: 600;
          color: #1F2937;

          .total-price {
            font-size: 26px;
            font-weight: 700;
            color: #EF4444;
          }
        }
      }

      .summary-divider {
        height: 1px;
        background: #E5E7EB;
        margin: 8px 0;
      }
    }

    .checkout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
      padding: 16px;
      background: #10B981;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

      &:hover:not(.disabled) {
        background: #059669;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        transform: translateY(-1px);
      }

      &:active:not(.disabled) {
        transform: translateY(0);
      }

      &.disabled {
        background: #D1D5DB;
        box-shadow: none;
        cursor: not-allowed;
      }

      svg {
        flex-shrink: 0;
      }
    }
  }

  .tips-card {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px 16px;
    background: #FFFBEB;
    border-radius: 8px;
    font-size: 12px;
    color: #92400E;

    svg {
      color: #F59E0B;
      flex-shrink: 0;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive
@media (max-width: 1024px) {
  .cart-page {
    padding: 16px;
  }

  .cart-content {
    grid-template-columns: 1fr;

    .order-summary {
      position: static;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-left {
      flex-wrap: wrap;
      gap: 12px;

      .page-title {
        font-size: 18px;
      }
    }

    .header-right .total-info {
      text-align: left;
    }
  }

  .cart-list .cart-item {
    flex-direction: column;

    .item-cover .cover-image {
      width: 100%;
      height: 160px;
    }

    .item-actions {
      flex-direction: row;
      width: 100%;
      padding-left: 0;
      padding-top: 12px;
      border-left: none;
      border-top: 1px solid #E5E7EB;
      align-items: center;
    }
  }

  .empty-state {
    padding: 32px 20px;
  }
}
</style>
