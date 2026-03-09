<template>
  <div class="session-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="剧目名称">
          <el-select v-model="searchForm.showId" placeholder="请选择剧目" clearable filterable style="width: 200px">
            <el-option
              v-for="show in showOptions"
              :key="show.id"
              :label="show.name"
              :value="show.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="剧院">
          <el-select v-model="searchForm.theaterId" placeholder="请选择剧院" clearable filterable style="width: 200px">
            <el-option
              v-for="theater in theaterOptions"
              :key="theater.id"
              :label="theater.name"
              :value="theater.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="演出时间">
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
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 场次列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>场次列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加场次</el-button>
        </div>
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
        <el-table-column prop="showName" label="剧目名称" min-width="180" />
        <el-table-column prop="theaterName" label="剧院" min-width="150" />
        <el-table-column prop="showTime" label="演出时间" width="180" />
        <el-table-column label="座位情况" width="200">
          <template #default="{ row }">
            <div class="seat-info">
              <span>总计: {{ row.totalSeats }}</span>
              <span style="color: #67C23A;">已售: {{ row.soldSeats }}</span>
              <span style="color: #909399;">剩余: {{ row.availableSeats }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="销售进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="getSalePercentage(row)"
              :color="getProgressColor(getSalePercentage(row))"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getSessionStatusType(row.status)">
              {{ getSessionStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status !== 2 && row.status !== 3"
              link
              type="warning"
              :icon="CircleClose"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button link type="primary" :icon="Grid" @click="handleSeatStatus(row)">座位</el-button>
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
          @size-change="fetchSessionList"
          @current-change="fetchSessionList"
        />
      </div>
    </el-card>

    <!-- 场次详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="场次详情" width="700px">
      <el-descriptions v-if="currentSession" :column="2" border>
        <el-descriptions-item label="场次ID">{{ currentSession.id }}</el-descriptions-item>
        <el-descriptions-item label="剧目名称">{{ currentSession.showName }}</el-descriptions-item>
        <el-descriptions-item label="剧院">{{ currentSession.theaterName }}</el-descriptions-item>
        <el-descriptions-item label="演出时间">{{ currentSession.showTime }}</el-descriptions-item>
        <el-descriptions-item label="座位数">{{ currentSession.totalSeats }}</el-descriptions-item>
        <el-descriptions-item label="已售座位">{{ currentSession.soldSeats }}</el-descriptions-item>
        <el-descriptions-item label="剩余座位">{{ currentSession.availableSeats }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getSessionStatusType(currentSession.status)">
            {{ getSessionStatusText(currentSession.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentSession.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑场次对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑场次' : '添加场次'"
      width="600px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="剧目" prop="showId">
          <el-select v-model="editForm.showId" placeholder="请选择剧目" filterable>
            <el-option
              v-for="show in showOptions"
              :key="show.id"
              :label="show.name"
              :value="show.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="剧院" prop="theaterId">
          <el-select v-model="editForm.theaterId" placeholder="请选择剧院" filterable>
            <el-option
              v-for="theater in theaterOptions"
              :key="theater.id"
              :label="theater.name"
              :value="theater.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="演出日期" prop="showDate">
          <el-date-picker
            v-model="editForm.showDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="演出时间" prop="showTime">
          <el-time-picker
            v-model="editForm.showTime"
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="票价设置">
          <div class="price-setting">
            <el-checkbox-group v-model="editForm.priceTypes" @change="handlePriceTypesChange">
              <el-checkbox label="vip">VIP票</el-checkbox>
              <el-checkbox label="normal">普通票</el-checkbox>
              <el-checkbox label="student">学生票</el-checkbox>
              <el-checkbox label="discount">优惠票</el-checkbox>
            </el-checkbox-group>

            <el-button
              type="primary"
              link
              size="small"
              @click="useShowPrice"
              :disabled="!editForm.showId"
              style="margin-left: 10px;">
              使用剧目价格
            </el-button>
          </div>

          <!-- 价格输入区域 -->
          <div class="price-inputs" v-if="editForm.priceTypes.length > 0" style="margin-top: 15px;">
            <el-row :gutter="10">
              <el-col :span="12" v-if="editForm.priceTypes.includes('vip')">
                <el-input-number
                  v-model="editForm.vipPrice"
                  :min="0"
                  :max="9999"
                  :precision="2"
                  :step="10"
                  placeholder="VIP票价"
                  controls-position="right"
                  style="width: 100%"
                >
                  <template #prepend>VIP票</template>
                </el-input-number>
              </el-col>
              <el-col :span="12" v-if="editForm.priceTypes.includes('normal')">
                <el-input-number
                  v-model="editForm.normalPrice"
                  :min="0"
                  :max="9999"
                  :precision="2"
                  :step="10"
                  placeholder="普通票价"
                  controls-position="right"
                  style="width: 100%"
                >
                  <template #prepend>普通票</template>
                </el-input-number>
              </el-col>
              <el-col :span="12" v-if="editForm.priceTypes.includes('student')">
                <el-input-number
                  v-model="editForm.studentPrice"
                  :min="0"
                  :max="9999"
                  :precision="2"
                  :step="10"
                  placeholder="学生票价"
                  controls-position="right"
                  style="width: 100%"
                >
                  <template #prepend>学生票</template>
                </el-input-number>
              </el-col>
              <el-col :span="12" v-if="editForm.priceTypes.includes('discount')">
                <el-input-number
                  v-model="editForm.discountPrice"
                  :min="0"
                  :max="9999"
                  :precision="2"
                  :step="10"
                  placeholder="优惠票价"
                  controls-position="right"
                  style="width: 100%"
                >
                  <template #prepend>优惠票</template>
                </el-input-number>
              </el-col>
            </el-row>
          </div>

          <!-- 剧目价格参考 -->
          <div v-if="showPriceHint" class="price-hint" style="margin-top: 10px; color: #909399; font-size: 12px;">
            <el-icon><InfoFilled /></el-icon>
            {{ showPriceHint }}
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 座位状态对话框 -->
    <el-dialog v-model="seatStatusDialogVisible" title="座位销售情况" width="900px">
      <div class="seat-status-container" v-loading="seatLoading">
        <!-- 统计信息 -->
        <div class="seat-statistics">
          <el-statistic title="总座位数" :value="seatStats.total" />
          <el-statistic title="已售座位" :value="seatStats.sold">
            <template #suffix>
              <span style="color: #909399; font-size: 12px;">座</span>
            </template>
          </el-statistic>
          <el-statistic title="可选座位" :value="seatStats.available" />
          <el-statistic title="锁定座位" :value="seatStats.locked" />
        </div>
        <el-divider />

        <!-- 图例 -->
        <div class="seat-legend">
          <span class="legend-item">
            <span class="legend-seat available"></span>
            <span class="legend-text">可选</span>
          </span>
          <span class="legend-item">
            <span class="legend-seat locked"></span>
            <span class="legend-text">锁定</span>
          </span>
          <span class="legend-item">
            <span class="legend-seat sold"></span>
            <span class="legend-text">已售</span>
          </span>
        </div>

        <!-- 座位图 -->
        <div class="seat-map-wrapper">
          <div class="stage">舞台</div>
          <div class="seat-grid" v-if="seatMap.length > 0">
            <div v-for="(row, rowIndex) in seatMap" :key="rowIndex" class="seat-row">
              <span class="row-label">{{ rowIndex + 1 }}排</span>
              <div class="seats-in-row">
                <div
                  v-for="(seat, seatIndex) in row"
                  :key="seat && seat.id ? seat.id : `empty-${rowIndex}-${seatIndex}`"
                  :class="getSeatClass(seat)"
                  :title="seat ? `${seat.rowNum}排${seat.colNum}座 - ¥${seat.price}` : ''"
                >
                  <span v-if="seat">{{ seatIndex + 1 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 销售进度 -->
        <div class="seat-progress">
          <div>销售进度</div>
          <el-progress
            :percentage="seatStats.total > 0 ? Math.round((seatStats.sold / seatStats.total) * 100) : 0"
            :color="[
              { color: '#f56c6c', percentage: 20 },
              { color: '#e6a23c', percentage: 40 },
              { color: '#409eff', percentage: 60 },
              { color: '#67c23a', percentage: 80 }
            ]"
          />
        </div>

        <!-- 已售座位列表 -->
        <div v-if="soldSeatsList.length > 0" class="sold-seats-section">
          <h4>已售座位详情 ({{ soldSeatsList.length }}个)</h4>
          <el-table :data="soldSeatsList" size="small" max-height="200">
            <el-table-column prop="seatNumber" label="座位号" width="120" />
            <el-table-column prop="rowNum" label="排号" width="80" />
            <el-table-column prop="colNum" label="列号" width="80" />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="seatType" label="类型" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.seatType === 1" type="warning" size="small">VIP</el-tag>
                <el-tag v-else-if="row.seatType === 2" type="info" size="small">学生</el-tag>
                <el-tag v-else type="info" size="small">普通</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lockedUser" label="锁定用户" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import { getSessionList, getSessionDetail, createSession, updateSession, cancelSession, getSessionSeatStatus } from '@/api/admin'
import { getShowList } from '@/api/show'
import { getTheaterList } from '@/api/theater'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, View, Edit, Grid, CircleClose, InfoFilled } from '@element-plus/icons-vue'

// 剧目和剧院选项
const showOptions = ref([])
const theaterOptions = ref([])

// 获取剧目选项
async function fetchShowOptions() {
  try {
    const res = await getShowList({ page: 1, size: 1000 })
    if (res.code === 200) {
      showOptions.value = res.data?.records || res.data || []
    }
  } catch (error) {
    console.error('获取剧目列表失败', error)
  }
}

// 获取剧院选项
async function fetchTheaterOptions() {
  try {
    const res = await getTheaterList({ page: 1, size: 1000 })
    if (res.code === 200) {
      theaterOptions.value = res.data?.records || res.data || []
    }
  } catch (error) {
    console.error('获取剧院列表失败', error)
  }
}

// 搜索表单
const searchForm = reactive({
  showId: null,
  theaterId: null,
  status: '',
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
const currentSession = ref(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  showId: null,
  theaterId: null,
  showDate: '',
  showTime: '',
  priceTypes: [],
  vipPrice: null,
  normalPrice: null,
  studentPrice: null,
  discountPrice: null
})

// 当前选中的剧目信息（用于显示价格参考）
const currentShow = ref(null)

// 座位状态对话框
const seatStatusDialogVisible = ref(false)
const seatLoading = ref(false)
const seatMap = ref([])
const soldSeatsList = ref([])
const seatStats = reactive({
  total: 0,
  sold: 0,
  locked: 0,
  available: 0
})

// 表单验证规则
const editRules = {
  showId: [{ required: true, message: '请选择剧目', trigger: 'change' }],
  theaterId: [{ required: true, message: '请选择剧院', trigger: 'change' }],
  showDate: [{ required: true, message: '请选择演出日期', trigger: 'change' }],
  showTime: [{ required: true, message: '请选择演出时间', trigger: 'change' }]
}

// 获取场次列表
async function fetchSessionList() {
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

    const res = await getSessionList(params)
    if (res.code === 200) {
      // 处理数据，添加剧目名称和剧院名称
      tableData.value = (res.data.records || []).map(item => {
        const show = showOptions.value.find(s => s.id === item.showId)
        const theater = theaterOptions.value.find(t => t.id === item.theaterId)
        return {
          ...item,
          showName: show?.name || item.showName || '未知剧目',
          theaterName: theater?.name || item.theaterName || '未知剧院',
          // 确保座位情况字段有默认值
          totalSeats: item.totalSeats || item.total_seats || 0,
          soldSeats: item.soldSeats || item.sold_seats || 0,
          availableSeats: item.availableSeats || item.available_seats || 0
        }
      })
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取场次列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchSessionList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    showId: null,
    theaterId: null,
    status: '',
    dateRange: []
  })
  pagination.page = 1
  fetchSessionList()
}

// 查看详情
async function handleView(row) {
  try {
    const res = await getSessionDetail(row.id)
    if (res.code === 200) {
      currentSession.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取场次详情失败', error)
  }
}

// 添加场次
function handleAdd() {
  currentShow.value = null
  Object.assign(editForm, {
    id: null,
    showId: null,
    theaterId: null,
    showDate: '',
    showTime: '',
    priceTypes: [],
    vipPrice: null,
    normalPrice: null,
    studentPrice: null,
    discountPrice: null
  })
  editDialogVisible.value = true
}

// 编辑场次
async function handleEdit(row) {
  try {
    const res = await getSessionDetail(row.id)
    if (res.code === 200) {
      const data = res.data
      // 解析 showTime，分离日期和时间
      let showDate = ''
      let showTime = ''
      if (data.showTime) {
        // showTime 格式类似: 2026-03-07T19:50:00
        const dateTime = data.showTime.toString()
        if (dateTime.includes('T')) {
          const [datePart, timePart] = dateTime.split('T')
          showDate = datePart // YYYY-MM-DD
          showTime = timePart.substring(0, 5) // HH:mm (去掉秒数)
        } else {
          // 如果是其他格式，尝试直接使用
          showDate = dateTime.substring(0, 10)
          showTime = dateTime.substring(11, 16)
        }
      }

      // 解析 priceTypes（从逗号分隔的字符串转为数组）
      let priceTypes = [] // 默认为空数组
      if (data.priceTypes) {
        if (typeof data.priceTypes === 'string') {
          // 从数据库读取的是字符串，分割成数组
          priceTypes = data.priceTypes.split(',').filter(t => t.trim())
        } else if (Array.isArray(data.priceTypes)) {
          priceTypes = data.priceTypes
        }
      }

      // 如果没有 priceTypes，根据已设置的价格推断
      if (priceTypes.length === 0) {
        priceTypes = []
        if (data.vipPrice) priceTypes.push('vip')
        if (data.normalPrice) priceTypes.push('normal')
        if (data.studentPrice) priceTypes.push('student')
        if (data.discountPrice) priceTypes.push('discount')
      }

      Object.assign(editForm, {
        id: data.id,
        showId: data.showId,
        theaterId: data.theaterId,
        showDate: showDate,
        showTime: showTime,
        priceTypes: priceTypes,
        vipPrice: data.vipPrice,
        normalPrice: data.normalPrice,
        studentPrice: data.studentPrice,
        discountPrice: data.discountPrice
      })

      // 更新当前剧目信息
      if (data.showId) {
        currentShow.value = showOptions.value.find(s => s.id === data.showId)
      }

      editDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取场次详情失败', error)
    ElMessage.error('获取场次详情失败')
  }
}

// 提交编辑
async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()

    // 获取剧院的座位数
    const theater = theaterOptions.value.find(t => t.id === editForm.theaterId)
    const totalSeats = theater?.seatCount || theater?.totalSeats || 500

    // 格式化日期 (从 YYYY-MM-DD 格式)
    const formatDate = (date) => {
      if (!date) return ''
      // 如果已经是 YYYY-MM-DD 格式的字符串，直接返回
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      // 否则从 Date 对象格式化
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 格式化时间 (从 HH:mm 格式字符串转为 HH:mm:ss)
    const formatTime = (time) => {
      if (!time) return '00:00:00'
      // 如果已经是 HH:mm:ss 格式，直接返回
      if (typeof time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return time
      }
      // 如果是 HH:mm 格式，添加 :00
      if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
        return `${time}:00`
      }
      // 从 Date 对象获取
      const t = new Date(time)
      const hours = String(t.getHours()).padStart(2, '0')
      const minutes = String(t.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}:00`
    }

    // 构建提交数据，包含价格字段
    const data = {
      showId: editForm.showId,
      theaterId: editForm.theaterId,
      showTime: `${formatDate(editForm.showDate)}T${formatTime(editForm.showTime)}`,
      totalSeats: totalSeats,
      priceTypes: Array.isArray(editForm.priceTypes) ? editForm.priceTypes.join(',') : editForm.priceTypes,
      status: 0
    }

    // 添加价格字段（只有勾选了对应类型才发送价格）
    if (editForm.priceTypes.includes('vip') && editForm.vipPrice !== null) {
      data.vipPrice = editForm.vipPrice
    }
    if (editForm.priceTypes.includes('normal') && editForm.normalPrice !== null) {
      data.normalPrice = editForm.normalPrice
    }
    if (editForm.priceTypes.includes('student') && editForm.studentPrice !== null) {
      data.studentPrice = editForm.studentPrice
    }
    if (editForm.priceTypes.includes('discount') && editForm.discountPrice !== null) {
      data.discountPrice = editForm.discountPrice
    }

    console.log('提交场次数据:', data)

    let res
    if (editForm.id) {
      res = await updateSession(editForm.id, data)
    } else {
      res = await createSession(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '添加成功')
      editDialogVisible.value = false
      fetchSessionList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败', error)
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('提交失败，请检查输入信息')
    }
  }
}

// 取消场次
async function handleCancel(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消场次', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '取消原因不能为空'
    })

    const res = await cancelSession(row.id, value)
    if (res.code === 200) {
      ElMessage.success('取消成功')
      fetchSessionList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消失败', error)
    }
  }
}

// 座位状态
async function handleSeatStatus(row) {
  try {
    seatLoading.value = true
    const res = await getSessionSeatStatus(row.id)
    if (res.code === 200) {
      const data = res.data
      const seats = data.seats || []

      // 更新统计信息
      seatStats.total = seats.length
      seatStats.sold = seats.filter(s => s.status === 2).length
      seatStats.locked = seats.filter(s => s.status === 1).length
      seatStats.available = seats.filter(s => s.status === 0).length

      // 构建已售座位列表
      soldSeatsList.value = seats.filter(s => s.status === 2).map(seat => ({
        seatNumber: seat.seatNumber,
        rowNum: seat.rowNum,
        colNum: seat.colNum,
        price: seat.price,
        seatType: seat.seatType,
        lockedUser: seat.lockedUserId
      }))

      // 将一维座位数组转换为二维数组用于显示
      if (seats.length > 0) {
        const maxRowNum = Math.max(...seats.map(s => s.rowNum))
        const maxColNum = Math.max(...seats.map(s => s.colNum))

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
                lockedUserId: seat.lockedUserId
              })
            } else {
              rowSeats.push(null)
            }
          }
          newSeatMap.push(rowSeats)
        }
        seatMap.value = newSeatMap
      } else {
        seatMap.value = []
      }

      seatStatusDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取座位状态失败', error)
    ElMessage.error('获取座位状态失败')
  } finally {
    seatLoading.value = false
  }
}

// 获取座位样式类
function getSeatClass(seat) {
  if (!seat) return ['seat-item', 'seat-empty']

  const classes = ['seat-item']

  if (seat.status === 0) classes.push('available')
  else if (seat.status === 1) classes.push('locked')
  else if (seat.status === 2) classes.push('sold')

  return classes
}

// 禁用过去的日期
function disabledDate(time) {
  return time.getTime() < Date.now() - 8.64e7
}

// 获取销售百分比
function getSalePercentage(row) {
  if (row.totalSeats === 0) return 0
  return Math.round((row.soldSeats / row.totalSeats) * 100)
}

// 获取进度条颜色
function getProgressColor(percentage) {
  if (percentage < 30) return '#F56C6C'
  if (percentage < 70) return '#E6A23C'
  return '#67C23A'
}

// 获取场次状态类型
function getSessionStatusType(status) {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取场次状态文本
function getSessionStatusText(status) {
  const textMap = {
    0: '未开始',
    1: '进行中',
    2: '已结束',
    3: '已取消'
  }
  return textMap[status] || '未知'
}

// 计算属性：剧目价格提示
const showPriceHint = computed(() => {
  if (!editForm.showId || !currentShow.value) return ''
  const show = currentShow.value
  const prices = []
  if (show.vipPrice) prices.push(`VIP: ¥${show.vipPrice}`)
  if (show.normalPrice) prices.push(`普通: ¥${show.normalPrice}`)
  if (show.studentPrice) prices.push(`学生: ¥${show.studentPrice}`)
  if (show.discountPrice) prices.push(`优惠: ¥${show.discountPrice}`)
  return prices.length > 0 ? `剧目价格: ${prices.join('、')}` : '该剧目暂未设置价格'
})

// 使用剧目价格
function useShowPrice() {
  if (!editForm.showId || !currentShow.value) return
  const show = currentShow.value

  // 如果当前没有勾选任何票价类型，自动勾选所有有价格的类型
  if (editForm.priceTypes.length === 0) {
    const types = []
    if (show.vipPrice) types.push('vip')
    if (show.normalPrice) types.push('normal')
    if (show.studentPrice) types.push('student')
    if (show.discountPrice) types.push('discount')
    editForm.priceTypes = types
  }

  // 复制价格
  editForm.vipPrice = show.vipPrice
  editForm.normalPrice = show.normalPrice
  editForm.studentPrice = show.studentPrice
  editForm.discountPrice = show.discountPrice
}

// 票价类型变化时处理
function handlePriceTypesChange(types) {
  // 如果取消勾选某个类型，清空对应的价格
  const allTypes = ['vip', 'normal', 'student', 'discount']
  allTypes.forEach(type => {
    if (!types.includes(type)) {
      editForm[`${type}Price`] = null
    }
  })
}

// 监听剧目选择变化，更新当前剧目信息
watch(() => editForm.showId, (newShowId) => {
  if (newShowId) {
    currentShow.value = showOptions.value.find(s => s.id === newShowId)
  } else {
    currentShow.value = null
  }
})

onMounted(async () => {
  // 先加载剧目和剧院选项，再加载场次列表
  await Promise.all([
    fetchShowOptions(),
    fetchTheaterOptions()
  ])
  fetchSessionList()
})
</script>

<style scoped lang="scss">
.session-manage {
  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .seat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .seat-status-container {
    .seat-legend {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      justify-content: center;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #606266;

        .legend-seat {
          width: 24px;
          height: 24px;
          border-radius: 4px;

          &.available {
            background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
            border: 1px solid #e0e0e0;
          }

          &.sold {
            background-color: #909399;
            border: 1px solid #7c7c7c;
          }

          &.locked {
            background: linear-gradient(180deg, #67c23a 0%, #529b2e 100%);
            border: 1px solid #529b2e;
          }
        }
      }
    }

    .seat-map-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: linear-gradient(180deg, #fafbfc 0%, #f5f7fa 100%);
      border-radius: 12px;

      .stage {
        width: 60%;
        height: 36px;
        background: linear-gradient(90deg,
          transparent 0%,
          #667eea 20%,
          #764ba2 50%,
          #667eea 80%,
          transparent 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-weight: 600;
        font-size: 13px;
        letter-spacing: 2px;
        margin-bottom: 10px;
      }

      .seat-grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        max-height: 300px;
        overflow-y: auto;
        padding: 0 20px;

        .seat-row {
          display: flex;
          align-items: center;
          gap: 6px;

          .row-label {
            min-width: 45px;
            text-align: right;
            font-size: 11px;
            color: #909399;
            font-weight: 500;
            padding-right: 8px;
          }

          .seats-in-row {
            display: flex;
            gap: 4px;
          }

          .seat-item {
            width: 28px;
            height: 28px;
            border-radius: 6px 6px 10px 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 500;
            cursor: default;
            user-select: none;
            transition: all 0.2s;

            &.seat-empty {
              visibility: hidden;
            }

            &.available {
              background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
              border: 1px solid #e0e0e0;
              color: #606266;
            }

            &.locked {
              background: linear-gradient(180deg, #67c23a 0%, #529b2e 100%);
              border: 1px solid #529b2e;
              color: white;
            }

            &.sold {
              background: #e8e8e8;
              border: 1px solid #d0d0d0;
              color: #999;
              position: relative;

              &::after {
                content: '×';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 16px;
                line-height: 1;
              }
            }
          }
        }
      }
    }

    .seat-progress {
      margin: 20px 0;
      padding: 0 20px;

      > div {
        margin-bottom: 8px;
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }

    .sold-seats-section {
      margin-top: 20px;
      padding: 15px;
      background: #f5f7fa;
      border-radius: 8px;

      h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #303133;
        font-weight: 600;
      }
    }

    .seat-statistics {
      display: flex;
      justify-content: space-around;
      margin-bottom: 10px;
    }
  }
}
</style>
