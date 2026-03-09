<template>
  <div class="theater-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="剧院名称">
          <el-input v-model="searchForm.name" placeholder="请输入剧院名称" clearable />
        </el-form-item>
        <el-form-item label="所在地区">
          <el-cascader
            v-model="searchForm.region"
            :options="regionOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择地区"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 剧院列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>剧院列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加剧院</el-button>
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
        <el-table-column prop="name" label="剧院名称" min-width="200" />
        <el-table-column prop="address" label="地址" min-width="250" />
        <el-table-column prop="region" label="所在地区" width="180" />
        <el-table-column prop="seatCount" label="座位数" width="100" />
        <el-table-column label="设施" width="200">
          <template #default="{ row }">
            <el-tag v-for="facility in row.facilities" :key="facility" size="small" style="margin-right: 5px;">
              {{ facility }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="Grid" @click="handleSeatConfig(row)">座位图</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
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
          @size-change="fetchTheaterList"
          @current-change="fetchTheaterList"
        />
      </div>
    </el-card>

    <!-- 剧院详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="剧院详情" width="800px">
      <el-descriptions v-if="currentTheater" :column="2" border>
        <el-descriptions-item label="剧院ID">{{ currentTheater.id }}</el-descriptions-item>
        <el-descriptions-item label="剧院名称">{{ currentTheater.name }}</el-descriptions-item>
        <el-descriptions-item label="所在地区" :span="2">{{ currentTheater.region }}</el-descriptions-item>
        <el-descriptions-item label="详细地址" :span="2">{{ currentTheater.address }}</el-descriptions-item>
        <el-descriptions-item label="座位数">{{ currentTheater.seatCount }}</el-descriptions-item>
        <el-descriptions-item label="座位类型">{{ currentTheater.seatType || '标准' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentTheater.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交通">
          {{ currentTheater.traffic || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="设施" :span="2">
          <el-tag v-for="facility in currentTheater.facilities" :key="facility" style="margin-right: 5px;">
            {{ facility }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="简介" :span="2">
          {{ currentTheater.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="剧院图片" :span="2">
          <div v-if="currentTheater.images && currentTheater.images.length" class="theater-images">
            <el-image
              v-for="(img, index) in currentTheater.images"
              :key="index"
              :src="img"
              :preview-src-list="currentTheater.images"
              fit="cover"
              style="width: 150px; height: 100px; margin-right: 10px; border-radius: 4px;"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑剧院对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑剧院' : '添加剧院'"
      width="800px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="剧院名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入剧院名称" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="editForm.region"
            :options="regionOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择地区"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="address">
          <el-input v-model="editForm.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="座位数" prop="seatCount">
              <el-input-number v-model="editForm.seatCount" :min="50" :max="2000" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="交通方式">
          <el-input
            v-model="editForm.traffic"
            type="textarea"
            :rows="2"
            placeholder="如：地铁X号线XX站，公交XX路等"
          />
        </el-form-item>

        <el-form-item label="剧院设施">
          <el-checkbox-group v-model="editForm.facilities">
            <el-checkbox label="停车场">停车场</el-checkbox>
            <el-checkbox label="餐厅">餐厅</el-checkbox>
            <el-checkbox label="VIP休息室">VIP休息室</el-checkbox>
            <el-checkbox label="无障碍设施">无障碍设施</el-checkbox>
            <el-checkbox label="存包处">存包处</el-checkbox>
            <el-checkbox label="WiFi">WiFi</el-checkbox>
            <el-checkbox label="空调">空调</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="剧院图片">
          <el-upload
            v-if="!editForm.image || editForm.imageList.length === 0"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :on-error="handleImageError"
            :before-upload="beforeImageUpload"
          >
            <el-button type="primary">
              <el-icon><Plus /></el-icon>
              上传图片
            </el-button>
          </el-upload>
          <div v-else class="image-preview-wrapper">
            <el-image
              :src="getImageUrl(editForm.imageList[0]?.url || editForm.image)"
              fit="cover"
              class="preview-image"
              :preview-src-list="[getImageUrl(editForm.imageList[0]?.url || editForm.image)]"
            />
            <el-button type="danger" size="small" @click="handleImageRemove">删除</el-button>
          </div>
        </el-form-item>

        <el-form-item label="剧院简介">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入剧院简介"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 座位图配置对话框 -->
    <el-dialog v-model="seatConfigDialogVisible" title="座位图配置" width="1000px" @close="handleSeatConfigClose">
      <div class="seat-config-container">
        <el-form :model="seatConfigForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="座位模板">
                <el-select v-model="seatConfigForm.template" placeholder="请选择模板" @change="handleTemplateChange">
                  <el-option label="小型剧场（100座）" value="small" />
                  <el-option label="中型剧场（300座）" value="medium" />
                  <el-option label="大型剧场（800座）" value="large" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="座位类型">
                <el-radio-group v-model="seatConfigForm.seatType">
                  <el-radio label="standard">标准</el-radio>
                  <el-radio label="vip">VIP</el-radio>
                  <el-radio label="mix">混合</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="座位布局">
            <div class="seat-legend">
              <div class="legend-item">
                <span class="seat-box available"></span>
                <span>可选座位</span>
              </div>
              <div class="legend-item">
                <span class="seat-box sold"></span>
                <span>已售座位</span>
              </div>
              <div class="legend-item">
                <span class="seat-box vip"></span>
                <span>VIP座位</span>
              </div>
              <div class="legend-item">
                <span class="seat-box stage"></span>
                <span>舞台</span>
              </div>
            </div>
            <div class="seat-preview">
              <div class="stage">舞台</div>
              <div class="seat-map" ref="seatMapRef">
                <!-- 座位图预览 -->
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="seatConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSeatConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { getTheaterList, getTheaterDetail, createTheater, updateTheater, deleteTheater, getSeatTemplates, saveSeatConfig } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  View,
  Edit,
  Grid,
  Delete
} from '@element-plus/icons-vue'

// 地区选项
const regionOptions = [
  {
    value: 'beijing',
    label: '北京',
    children: [
      { value: 'dongcheng', label: '东城区' },
      { value: 'xicheng', label: '西城区' },
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'haidian', label: '海淀区' }
    ]
  },
  {
    value: 'shanghai',
    label: '上海',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'changning', label: '长宁区' },
      { value: 'jingan', label: '静安区' }
    ]
  }
  // 可继续添加其他城市
]

// 搜索表单
const searchForm = reactive({
  name: '',
  region: []
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
const currentTheater = ref(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  name: '',
  region: [],
  address: '',
  phone: '',
  seatCount: 500,
  traffic: '',
  facilities: [],
  image: '',
  imageList: [],
  images: [],
  description: ''
})

// 座位图配置对话框
const seatConfigDialogVisible = ref(false)
const seatMapRef = ref()
const seatConfigForm = reactive({
  theaterId: null,
  template: '',
  seatType: 'standard',
  rows: 0,
  cols: 0,
  seats: []
})

// 上传配置
const uploadAction = computed(() => {
  const action = '/api/admin/theater/upload'
  console.log('上传地址:', action)
  return action
})
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  console.log('当前Token:', token ? `${token.substring(0, 20)}...` : 'null')
  const headers = {
    Authorization: `Bearer ${token}`
  }
  console.log('上传Headers:', headers)
  return headers
})

// 获取图片URL
function getImageUrl(url) {
  if (!url) return ''
  let imageUrl = url.trim()
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  if (!imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl
  }
  return imageUrl
}

// 表单验证规则
const editRules = {
  name: [{ required: true, message: '请输入剧院名称', trigger: 'blur' }],
  region: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  seatCount: [{ required: true, message: '请输入座位数', trigger: 'blur' }]
}

// 获取剧院列表
async function fetchTheaterList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      name: searchForm.name
    }
    const res = await getTheaterList(params)
    if (res.code === 200) {
      // 将后端字段映射到前端显示字段
      tableData.value = res.data.records.map(item => ({
        ...item,
        region: item.region ? item.region.split('/') : [],
        seatCount: item.totalSeats,
        facilities: item.facilities ? item.facilities.split(',') : []
      }))
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取剧院列表失败', error)
    ElMessage.error('获取剧院列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchTheaterList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    name: '',
    region: []
  })
  pagination.page = 1
  fetchTheaterList()
}

// 查看详情
async function handleView(row) {
  try {
    const res = await getTheaterDetail(row.id)
    if (res.code === 200) {
      const data = res.data
      // 将后端字段映射到显示字段
      // 将地区字符串转换为数组显示
      const regionArray = data.region ? data.region.split('/') : []
      const regionText = regionArray.length > 0 ? regionArray.join(' > ') : '-'

      currentTheater.value = {
        ...data,
        region: regionText,
        seatCount: data.totalSeats,
        seatType: data.seatType || '标准',
        traffic: data.trafficGuide,
        facilities: data.facilities ? data.facilities.split(',') : [],
        images: data.image ? [data.image] : [],
        description: data.description || ''
      }
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取剧院详情失败', error)
  }
}

// 添加剧院
function handleAdd() {
  Object.assign(editForm, {
    id: null,
    name: '',
    region: [],
    address: '',
    phone: '',
    seatCount: 500,
    traffic: '',
    facilities: [],
    image: '',
    imageList: [],
    images: [],
    description: ''
  })
  editDialogVisible.value = true
}

// 编辑剧院
async function handleEdit(row) {
  try {
    const res = await getTheaterDetail(row.id)
    if (res.code === 200) {
      const data = res.data
      // 将后端字段映射到前端表单
      // 处理地区回显：将字符串转换为数组
      const regionArray = data.region
        ? data.region.split('/')
        : []

      Object.assign(editForm, {
        id: data.id,
        name: data.name,
        region: regionArray,
        address: data.address || '',
        phone: data.phone || '',
        seatCount: data.totalSeats || 500,
        traffic: data.trafficGuide || '',
        facilities: data.facilities ? data.facilities.split(',') : [],
        image: data.image || '',
        imageList: data.image ? [{
          name: 'image',
          url: data.image
        }] : [],
        images: data.image ? [data.image] : [],
        description: data.description || ''
      })
      editDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取剧院详情失败', error)
  }
}

// 提交编辑
async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()

    // 提取图片URL
    let imageUrl = null
    if (editForm.imageList && editForm.imageList.length > 0) {
      const firstFile = editForm.imageList[0]
      // 优先使用 response 中的 URL（新上传的），否则使用 url（已有的）
      imageUrl = firstFile.response?.data?.url || firstFile.url
    }

    console.log('===== 提交表单 =====')
    console.log('imageList:', JSON.stringify(editForm.imageList, null, 2))
    console.log('提取的图片URL:', imageUrl)
    console.log('URL类型:', typeof imageUrl)
    console.log('是否为blob URL:', imageUrl && imageUrl.startsWith('blob:'))

    // 如果是 blob URL，说明上传有问题，不允许提交
    if (imageUrl && imageUrl.startsWith('blob:')) {
      ElMessage.error('图片正在上传中，请稍后再试')
      return
    }

    // 将设施数组转换为字符串
    const facilitiesStr = Array.isArray(editForm.facilities)
      ? editForm.facilities.join(',')
      : ''

    // 将地区数组转换为字符串（用/连接）
    const regionStr = Array.isArray(editForm.region) && editForm.region.length > 0
      ? editForm.region.join('/')
      : null

    const data = {
      name: editForm.name,
      region: regionStr,
      address: editForm.address,
      phone: editForm.phone || null,
      totalSeats: editForm.seatCount,
      trafficGuide: editForm.traffic || null,
      facilities: facilitiesStr,
      description: editForm.description || null,
      image: imageUrl
    }

    let res
    if (editForm.id) {
      res = await updateTheater(editForm.id, data)
    } else {
      res = await createTheater(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '添加成功')
      editDialogVisible.value = false
      fetchTheaterList()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('提交失败，请检查输入信息')
  }
}

// 删除剧院
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除剧院 "${row.name}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteTheater(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchTheaterList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 座位图配置
async function handleSeatConfig(row) {
  seatConfigForm.theaterId = row.id
  seatConfigForm.template = row.seatTemplate || ''
  seatConfigForm.seatType = row.seatType || 'standard'

  if (seatConfigForm.template) {
    await handleTemplateChange(seatConfigForm.template)
  }

  seatConfigDialogVisible.value = true

  nextTick(() => {
    renderSeatMap()
  })
}

// 模板变化
async function handleTemplateChange(template) {
  // 根据模板设置行列数
  const templateConfig = {
    small: { rows: 10, cols: 10 },
    medium: { rows: 15, cols: 20 },
    large: { rows: 20, cols: 40 }
  }

  if (templateConfig[template]) {
    seatConfigForm.rows = templateConfig[template].rows
    seatConfigForm.cols = templateConfig[template].cols
    generateSeats()
  }
}

// 生成座位数据
function generateSeats() {
  const seats = []
  for (let row = 1; row <= seatConfigForm.rows; row++) {
    for (let col = 1; col <= seatConfigForm.cols; col++) {
      seats.push({
        row,
        col,
        status: 'available',
        type: determineSeatType(row, col)
      })
    }
  }
  seatConfigForm.seats = seats
}

// 确定座位类型
function determineSeatType(row, col) {
  if (seatConfigForm.seatType === 'vip') {
    return 'vip'
  }
  if (seatConfigForm.seatType === 'mix') {
    // 前排为VIP
    return row <= 3 ? 'vip' : 'standard'
  }
  return 'standard'
}

// 渲染座位图
function renderSeatMap() {
  if (!seatMapRef.value) return

  const container = seatMapRef.value
  container.innerHTML = ''

  const seatWidth = 24
  const seatHeight = 24
  const gap = 4

  seatConfigForm.seats.forEach(seat => {
    const seatEl = document.createElement('div')
    seatEl.className = `seat-preview ${seat.type} ${seat.status}`
    seatEl.style.cssText = `
      position: absolute;
      left: ${(seat.col - 1) * (seatWidth + gap)}px;
      top: ${(seat.row - 1) * (seatHeight + gap)}px;
      width: ${seatWidth}px;
      height: ${seatHeight}px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    `

    seatEl.onclick = () => {
      seat.status = seat.status === 'available' ? 'sold' : 'available'
      renderSeatMap()
    }

    container.appendChild(seatEl)
  })

  container.style.cssText = `
    position: relative;
    width: ${seatConfigForm.cols * (seatWidth + gap)}px;
    height: ${seatConfigForm.rows * (seatHeight + gap)}px;
    margin: 20px auto;
  `
}

// 保存座位配置
async function handleSaveSeatConfig() {
  try {
    const data = {
      template: seatConfigForm.template,
      seatType: seatConfigForm.seatType,
      rows: seatConfigForm.rows,
      cols: seatConfigForm.cols,
      seats: seatConfigForm.seats
    }

    const res = await saveSeatConfig(seatConfigForm.theaterId, data)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      seatConfigDialogVisible.value = false
      fetchTheaterList()
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

// 关闭座位配置对话框
function handleSeatConfigClose() {
  seatConfigForm.seats = []
}

// 图片上传成功
function handleImageSuccess(response, file, fileList) {
  console.log('===== 上传成功回调 =====')
  console.log('上传响应:', response)
  console.log('文件对象:', file)
  console.log('文件列表:', fileList)

  // 检查响应码
  if (response && response.code === 200) {
    // 直接从响应中获取真实URL
    const realUrl = response.data?.url
    console.log('✓ 服务器返回的真实URL:', realUrl)

    if (realUrl) {
      // 只保留最后上传的一张图片
      editForm.imageList = [{
        name: file.name,
        url: realUrl,
        response: response
      }]
      // 同时更新 image 字段，用于判断是否显示预览
      editForm.image = realUrl
      console.log('✓ 更新后的imageList:', editForm.imageList)
      console.log('✓ 更新后的image:', editForm.image)
      ElMessage.success('上传成功')
    } else {
      console.error('❌ 响应中没有URL字段', response)
      ElMessage.error('上传失败：服务器未返回图片地址')
    }
  } else {
    console.error('❌ 上传失败')
    console.error('响应码:', response?.code)
    console.error('错误消息:', response?.message)
    ElMessage.error(`上传失败：${response?.message || '未知错误'}(错误码: ${response?.code})`)
  }
}

// 图片上传失败
function handleImageError(error) {
  console.error('===== 上传失败 =====')
  console.error('错误信息:', error)
  // 尝试解析错误信息
  let errorMsg = '图片上传失败，请重试'
  try {
    if (error instanceof Error) {
      errorMsg = `上传失败：${error.message}`
    } else if (typeof error === 'string') {
      errorMsg = `上传失败：${error}`
    }
  } catch (e) {
    // 忽略解析错误
  }
  ElMessage.error(errorMsg)
}

// 图片上传前验证
function beforeImageUpload(file) {
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

// 删除图片
function handleImageRemove() {
  editForm.image = ''
  editForm.imageList = []
  ElMessage.info('图片已删除')
}

onMounted(() => {
  fetchTheaterList()
})
</script>

<style scoped lang="scss">
.theater-manage {
  .image-preview-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    .preview-image {
      width: 150px;
      height: 150px;
      border-radius: 8px;
      border: 1px solid #dcdfe6;
    }
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .theater-images {
    display: flex;
    flex-wrap: wrap;
  }

  .seat-config-container {
    .seat-legend {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .seat-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;

          &.available {
            background-color: #67C23A;
          }

          &.sold {
            background-color: #909399;
          }

          &.vip {
            background-color: #E6A23C;
          }

          &.stage {
            background-color: #409EFF;
          }
        }
      }
    }

    .seat-preview {
      &:hover {
        transform: scale(1.1);
      }

      &.vip {
        background-color: #E6A23C;
      }

      &.standard {
        background-color: #67C23A;
      }

      &.available {
        opacity: 1;
      }

      &.sold {
        background-color: #909399 !important;
        opacity: 0.5;
      }
    }

    .seat-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .seat-map {
      min-height: 200px;
    }
  }
}
</style>
