<template>
  <div class="dashboard">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon user-icon">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalUsers || 0 }}</div>
              <div class="stat-label">总用户数</div>
              <div class="stat-trend">
                <el-icon color="#67C23A"><CaretTop /></el-icon>
                <span>今日新增 {{ statistics.todayNewUsers || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon order-icon">
              <el-icon :size="32"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalOrders || 0 }}</div>
              <div class="stat-label">总订单数</div>
              <div class="stat-trend">
                <el-icon color="#67C23A"><CaretTop /></el-icon>
                <span>今日订单 {{ statistics.todayOrders || 0 }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon sales-icon">
              <el-icon :size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ (statistics.totalSales || 0).toLocaleString() }}</div>
              <div class="stat-label">总销售额</div>
              <div class="stat-trend">
                <el-icon color="#67C23A"><CaretTop /></el-icon>
                <span>今日 ¥{{ (statistics.todaySales || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon online-icon">
              <el-icon :size="32"><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.onlineUsers || 0 }}</div>
              <div class="stat-label">在线用户</div>
              <div class="stat-trend">
                <el-icon color="#409EFF"><VideoPlay /></el-icon>
                <span>实时在线</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 用户注册量折线图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户注册趋势（最近30天）</span>
              <el-button link type="primary" @click="refreshUserTrend">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div ref="userTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 订单量柱状图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单量趋势（最近7天）</span>
              <el-button link type="primary" @click="refreshOrderTrend">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div ref="orderTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 热门剧目排行榜 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>热门剧目 TOP 10</span>
              <el-button link type="primary" @click="refreshHotShows">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div ref="hotShowsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 销售额饼图 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>销售额分布（按剧目）</span>
              <el-button link type="primary" @click="refreshSalesChart">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div ref="salesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 订单状态分布 -->
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单状态分布</span>
              <el-button link type="primary" @click="refreshOrderStatusChart">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div ref="orderStatusChartRef" class="chart-container-large"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { getStatistics, getUserRegisterTrend, getOrderTrend, getHotShows, getSalesStatistics } from '@/api/admin'
import { ElMessage } from 'element-plus'
import {
  User,
  Tickets,
  Money,
  Connection,
  CaretTop,
  Refresh,
  VideoPlay
} from '@element-plus/icons-vue'

// 统计数据
const statistics = ref({
  totalUsers: 0,
  todayNewUsers: 0,
  totalOrders: 0,
  todayOrders: 0,
  totalSales: 0,
  todaySales: 0,
  onlineUsers: 0
})

// 图表实例
let userTrendChart = null
let orderTrendChart = null
let hotShowsChart = null
let salesChart = null
let orderStatusChart = null

// 图表DOM引用
const userTrendChartRef = ref(null)
const orderTrendChartRef = ref(null)
const hotShowsChartRef = ref(null)
const salesChartRef = ref(null)
const orderStatusChartRef = ref(null)

// 获取统计数据
async function fetchStatistics() {
  try {
    const res = await getStatistics()
    if (res.code === 200) {
      statistics.value = res.data
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

// 初始化用户注册趋势图
function initUserTrendChart() {
  if (!userTrendChartRef.value) return

  userTrendChart = echarts.init(userTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        data: [],
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }

  userTrendChart.setOption(option)
}

// 加载用户注册趋势数据
async function loadUserTrendData() {
  try {
    const res = await getUserRegisterTrend(30)
    if (res.code === 200) {
      // 后端返回 { dates: [...], counts: [...] }
      const dates = res.data.dates || []
      const counts = res.data.counts || []

      userTrendChart.setOption({
        xAxis: {
          data: dates
        },
        series: [
          {
            data: counts
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取用户趋势数据失败', error)
  }
}

// 初始化订单趋势图
function initOrderTrendChart() {
  if (!orderTrendChartRef.value) return

  orderTrendChart = echarts.init(orderTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2378f7' },
              { offset: 0.7, color: '#2378f7' },
              { offset: 1, color: '#83bff6' }
            ])
          }
        }
      }
    ]
  }

  orderTrendChart.setOption(option)
}

// 加载订单趋势数据
async function loadOrderTrendData() {
  try {
    const res = await getOrderTrend(7)
    if (res.code === 200) {
      // 后端返回 { dates: [...], counts: [...] }
      const dates = res.data.dates || []
      const counts = res.data.counts || []

      orderTrendChart.setOption({
        xAxis: {
          data: dates
        },
        series: [
          {
            data: counts
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取订单趋势数据失败', error)
  }
}

// 初始化热门剧目排行榜
function initHotShowsChart() {
  if (!hotShowsChartRef.value) return

  hotShowsChart = echarts.init(hotShowsChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: []
    },
    series: [
      {
        name: '票房',
        type: 'bar',
        data: [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#FF6B6B' },
            { offset: 1, color: '#FF8E8E' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          formatter: '¥{c}'
        }
      }
    ]
  }

  hotShowsChart.setOption(option)
}

// 加载热门剧目数据
async function loadHotShowsData() {
  try {
    const res = await getHotShows(10)
    if (res.code === 200) {
      // 后端返回 { hotShows: [{ id, name, poster, rating, type, orderCount }] }
      const hotShows = res.data.hotShows || []
      const shows = hotShows.map(item => item.name)
      const sales = hotShows.map(item => item.orderCount || 0)

      hotShowsChart.setOption({
        yAxis: {
          data: shows
        },
        series: [
          {
            data: sales
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取热门剧目数据失败', error)
  }
}

// 初始化销售额饼图
function initSalesChart() {
  if (!salesChartRef.value) return

  salesChart = echarts.init(salesChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '销售额',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: []
      }
    ]
  }

  salesChart.setOption(option)
}

// 加载销售额数据
async function loadSalesData() {
  try {
    const res = await getSalesStatistics()
    if (res.code === 200) {
      // 后端返回 { todaySales, monthSales, totalSales, dates, sales }
      // 使用今日、本月销售额数据
      const data = [
        { name: '今日销售额', value: res.data.todaySales || 0 },
        { name: '本月销售额', value: res.data.monthSales || 0 }
      ]

      salesChart.setOption({
        series: [
          {
            data: data
          }
        ]
      })
    }
  } catch (error) {
    console.error('获取销售额数据失败', error)
  }
}

// 初始化订单状态分布图
function initOrderStatusChart() {
  if (!orderStatusChartRef.value) return

  orderStatusChart = echarts.init(orderStatusChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['待支付', '已支付', '已取消', '已退款', '已完成']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '订单数量',
        type: 'bar',
        data: [0, 0, 0, 0, 0],
        itemStyle: {
          color: function (params) {
            const colors = ['#E6A23C', '#409EFF', '#F56C6C', '#909399', '#67C23A']
            return colors[params.dataIndex]
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  orderStatusChart.setOption(option)
}

// 刷新图表数据
function refreshUserTrend() {
  loadUserTrendData()
  ElMessage.success('用户趋势数据已刷新')
}

function refreshOrderTrend() {
  loadOrderTrendData()
  ElMessage.success('订单趋势数据已刷新')
}

function refreshHotShows() {
  loadHotShowsData()
  ElMessage.success('热门剧目数据已刷新')
}

function refreshSalesChart() {
  loadSalesData()
  ElMessage.success('销售额数据已刷新')
}

function refreshOrderStatusChart() {
  // TODO: 实现刷新订单状态分布数据
  ElMessage.success('订单状态数据已刷新')
}

// 窗口大小变化时重绘图表
function handleResize() {
  userTrendChart?.resize()
  orderTrendChart?.resize()
  hotShowsChart?.resize()
  salesChart?.resize()
  orderStatusChart?.resize()
}

onMounted(() => {
  // 获取统计数据
  fetchStatistics()

  // 初始化所有图表
  initUserTrendChart()
  initOrderTrendChart()
  initHotShowsChart()
  initSalesChart()
  initOrderStatusChart()

  // 加载图表数据
  loadUserTrendData()
  loadOrderTrendData()
  loadHotShowsData()
  loadSalesData()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // 销毁图表实例
  userTrendChart?.dispose()
  orderTrendChart?.dispose()
  hotShowsChart?.dispose()
  salesChart?.dispose()
  orderStatusChart?.dispose()

  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 20px;
  }

  .charts-row {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;

        &.user-icon {
          background-color: #ecf5ff;
          color: #409EFF;
        }

        &.order-icon {
          background-color: #fdf6ec;
          color: #E6A23C;
        }

        &.sales-icon {
          background-color: #f0f9ff;
          color: #67C23A;
        }

        &.online-icon {
          background-color: #fef0f0;
          color: #F56C6C;
        }
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #67C23A;
          margin-top: 8px;

          .el-icon {
            margin-right: 4px;
          }
        }
      }
    }
  }

  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: #303133;
    }

    .chart-container {
      height: 300px;
    }

    .chart-container-large {
      height: 250px;
    }
  }
}
</style>
