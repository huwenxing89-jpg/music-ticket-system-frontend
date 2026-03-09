<template>
  <div class="order-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="剧目名称">
          <el-input v-model="searchForm.showName" placeholder="请输入剧目名称" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="待支付" value="0" />
            <el-option label="已支付" value="1" />
            <el-option label="已取消" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="退款中" value="4" />
            <el-option label="已退款" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <span>订单列表</span>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="showTitle" label="剧目名称" min-width="150" />
        <el-table-column prop="theaterName" label="剧院" min-width="120" />
        <el-table-column prop="showTime" label="演出时间" width="160" />
        <el-table-column prop="seats" label="座位" width="150">
          <template #default="{ row }">
            <span v-for="(seat, index) in row.seats" :key="seat.id || index">
              {{ seat.seatNumber || `${seat.rowNum}排${seat.colNum}座` }}
              <span v-if="index < row.seats.length - 1">、</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="订单金额" width="120">
          <template #default="{ row }">¥{{ row.totalPrice }}</template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusType(row.status)">
              {{ getOrderStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="success"
              :icon="Tickets"
              @click="handleIssueTicket(row)"
            >
              出票
            </el-button>
            <el-button
              v-if="row.status === 'paid'"
              link
              type="warning"
              :icon="RefreshLeft"
              @click="handleRefund(row)"
            >
              退票
            </el-button>
            <el-button link type="primary" :icon="Edit" @click="handleUpdateStatus(row)">状态</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchOrderList"
          @current-change="fetchOrderList"
        />
      </div>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px">
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="用户手机">{{ currentOrder.userPhone }}</el-descriptions-item>
        <el-descriptions-item label="剧目名称" :span="2">{{ currentOrder.showTitle }}</el-descriptions-item>
        <el-descriptions-item label="剧院">{{ currentOrder.theaterName }}</el-descriptions-item>
        <el-descriptions-item label="演出时间">{{ formatTime(currentOrder.showTime) }}</el-descriptions-item>
        <el-descriptions-item label="座位信息" :span="2">
          <el-tag v-for="(seat, index) in currentOrder.seats" :key="seat.id || index" style="margin: 2px;">
            {{ seat.seatNumber || `${seat.rowNum}排${seat.colNum}座` }} (¥{{ seat.price }})
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="票数">{{ currentOrder.seatCount }}张</el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ currentOrder.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ getPaymentMethodText(currentOrder.payMethod) }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getOrderStatusType(currentOrder.status)">
            {{ getOrderStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentOrder?.status === 1" type="primary" @click="handleIssueTicket(currentOrder)">
          手动出票
        </el-button>
      </template>
    </el-dialog>

    <!-- 退票对话框 -->
    <el-dialog v-model="refundDialogVisible" title="处理退票申请" width="500px">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="退票原因" prop="reason">
          <el-select v-model="refundForm.reason" placeholder="请选择退票原因" style="width: 200px">
            <el-option label="行程冲突" value="conflict" />
            <el-option label="生病/紧急情况" value="emergency" />
            <el-option label="演出取消/改期" value="show_cancelled" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input
            v-model="refundForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细说明"
          />
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="refundForm.amount" :min="0" :precision="2" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleRefundSubmit">确认退款</el-button>
      </template>
    </el-dialog>

    <!-- 更新状态对话框 -->
    <el-dialog v-model="statusDialogVisible" title="更新订单状态" width="400px">
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="订单状态">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 150px">
            <el-option label="待支付" value="0" />
            <el-option label="已支付" value="1" />
            <el-option label="已取消" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="退款中" value="4" />
            <el-option label="已退款" value="5" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, getOrderDetail, updateOrderStatus, issueTicket, handleRefund as handleRefundApi, exportOrders } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, View, Tickets, RefreshLeft, Edit } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  username: '',
  showName: '',
  status: null,
  dateRange: []
})

// 表格数据
const loading = ref(false)
const tableData = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const currentOrder = ref(null)

// 退票对话框
const refundDialogVisible = ref(false)
const refundFormRef = ref()
const refundForm = reactive({
  orderId: null,
  reason: '',
  description: '',
  amount: 0
})

// 状态对话框
const statusDialogVisible = ref(false)
const statusForm = reactive({
  orderId: null,
  status: null
})

// 表单验证规则
const refundRules = {
  reason: [{ required: true, message: '请选择退票原因', trigger: 'change' }]
}

// 获取订单列表
async function fetchOrderList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    delete params.dateRange
    // 转换状态为数字
    if (searchForm.status !== null && searchForm.status !== undefined && searchForm.status !== '') {
      params.status = parseInt(searchForm.status, 10)
    }

    const res = await getOrderList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取订单列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchOrderList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    orderNo: '',
    username: '',
    showName: '',
    status: null,
    dateRange: []
  })
  pagination.page = 1
  fetchOrderList()
}

// 导出订单
async function handleExport() {
  try {
    const params = { ...searchForm }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    delete params.dateRange

    const blob = await exportOrders(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `订单列表_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败', error)
  }
}

// 查看详情
async function handleView(row) {
  try {
    const res = await getOrderDetail(row.id)
    if (res.code === 200) {
      currentOrder.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败', error)
  }
}

// 手动出票
async function handleIssueTicket(row) {
  try {
    await ElMessageBox.confirm(`确定要为订单 "${row.orderNo}" 手动出票吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await issueTicket(row.id)
    if (res.code === 200) {
      ElMessage.success('出票成功')
      fetchOrderList()
      detailDialogVisible.value = false
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('出票失败', error)
    }
  }
}

// 退票
function handleRefund(row) {
  refundForm.orderId = row.id
  refundForm.reason = ''
  refundForm.description = ''
  refundForm.amount = row.totalPrice
  refundDialogVisible.value = true
}

// 提交退票
async function handleRefundSubmit() {
  try {
    await refundFormRef.value.validate()
    const res = await handleRefundApi(refundForm.orderId, true, refundForm.reason)
    if (res.code === 200) {
      ElMessage.success('退款处理成功')
      refundDialogVisible.value = false
      fetchOrderList()
      detailDialogVisible.value = false
    }
  } catch (error) {
    console.error('退款处理失败', error)
  }
}

// 更新状态
function handleUpdateStatus(row) {
  statusForm.orderId = row.id
  statusForm.status = String(row.status)
  statusDialogVisible.value = true
}

// 提交状态更新
async function handleStatusSubmit() {
  try {
    const res = await updateOrderStatus(statusForm.orderId, parseInt(statusForm.status, 10))
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
      statusDialogVisible.value = false
      fetchOrderList()
    }
  } catch (error) {
    console.error('状态更新失败', error)
  }
}

// 获取订单状态类型
function getOrderStatusType(status) {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'success',
    4: 'warning',
    5: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
function getOrderStatusText(status) {
  const textMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已完成',
    4: '退款中',
    5: '已退款'
  }
  return textMap[status] || '未知'
}

// 获取支付方式文本
function getPaymentMethodText(method) {
  const methodMap = {
    alipay: '支付宝',
    wechat: '微信支付',
    offline: '线下支付'
  }
  return methodMap[method] || '未知'
}

// 格式化时间
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

onMounted(() => {
  fetchOrderList()
})
</script>

<style scoped lang="scss">
.order-manage {
  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .unit {
    margin-left: 8px;
    color: #909399;
  }
}
</style>
