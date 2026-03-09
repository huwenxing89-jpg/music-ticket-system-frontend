<template>
  <div class="login-log">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="登录状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否异常">
          <el-select v-model="searchForm.isAbnormal" placeholder="请选择" clearable>
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="登录时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column label="登录状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="location" label="登录地点" min-width="150" />
        <el-table-column prop="device" label="设备信息" min-width="200" show-overflow-tooltip />
        <el-table-column label="是否异常" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isAbnormal" type="danger">异常</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="loginTime" label="登录时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="!row.isAbnormal"
              link
              type="warning"
              :icon="Warning"
              @click="handleMarkAbnormal(row)"
            >
              标记异常
            </el-button>
            <el-button
              v-else
              link
              type="success"
              :icon="CircleCheck"
              @click="handleUnmarkAbnormal(row)"
            >
              取消标记
            </el-button>
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
          @size-change="fetchLogList"
          @current-change="fetchLogList"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="登录日志详情" width="700px">
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="登录状态">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="是否异常">
          <el-tag v-if="currentLog.isAbnormal" type="danger">异常</el-tag>
          <span v-else>正常</span>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{ currentLog.location }}</el-descriptions-item>
        <el-descriptions-item label="设备类型" :span="2">{{ currentLog.device }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ currentLog.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ currentLog.browser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="失败原因" :span="2" v-if="currentLog.status === 'failed'">
          {{ currentLog.failReason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="登录时间" :span="2">{{ currentLog.loginTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentLog.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getLoginLogList, exportLoginLogs, markAbnormalLogin } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, View, Warning, CircleCheck } from '@element-plus/icons-vue'

const searchForm = reactive({
  username: '',
  status: '',
  isAbnormal: null,
  dateRange: []
})

const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const currentLog = ref(null)

async function fetchLogList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    delete params.dateRange

    const res = await getLoginLogList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取日志列表失败', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchLogList()
}

function handleReset() {
  Object.assign(searchForm, {
    username: '',
    status: '',
    isAbnormal: null,
    dateRange: []
  })
  pagination.page = 1
  fetchLogList()
}

async function handleExport() {
  try {
    const params = { ...searchForm }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startTime = searchForm.dateRange[0]
      params.endTime = searchForm.dateRange[1]
    }
    delete params.dateRange

    const blob = await exportLoginLogs(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `登录日志_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败', error)
  }
}

function handleView(row) {
  currentLog.value = row
  detailDialogVisible.value = true
}

async function handleMarkAbnormal(row) {
  try {
    const res = await markAbnormalLogin(row.id, true)
    if (res.code === 200) {
      ElMessage.success('已标记为异常登录')
      fetchLogList()
    }
  } catch (error) {
    console.error('标记失败', error)
  }
}

async function handleUnmarkAbnormal(row) {
  try {
    const res = await markAbnormalLogin(row.id, false)
    if (res.code === 200) {
      ElMessage.success('已取消异常标记')
      fetchLogList()
    }
  } catch (error) {
    console.error('取消标记失败', error)
  }
}

onMounted(() => {
  fetchLogList()
})
</script>

<style scoped lang="scss">
.login-log {
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
}
</style>
