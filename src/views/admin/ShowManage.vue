<template>
  <div class="show-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="剧目名称">
          <el-input v-model="searchForm.name" placeholder="请输入剧目名称" clearable />
        </el-form-item>
        <el-form-item label="剧目类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 150px">
            <el-option label="原创" :value="0" />
            <el-option label="引进" :value="1" />
            <el-option label="经典" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="即将上映" :value="0" />
            <el-option label="正在热映" :value="1" />
            <el-option label="已下映" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 剧目列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>剧目列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加剧目</el-button>
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
        <el-table-column label="海报" width="100">
          <template #default="{ row }">
            <el-image
              :src="getImageUrl(row.poster)"
              :preview-src-list="[getImageUrl(row.poster)]"
              fit="cover"
              style="width: 60px; height: 80px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="剧目名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ getShowTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="{ row }">{{ row.duration }}分钟</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getShowStatusType(row.status)">
              {{ getShowStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="User" @click="handleActors(row)">演员</el-button>
            <el-button link type="primary" :icon="Money" @click="handlePrice(row)">票价</el-button>
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
          @size-change="fetchShowList"
          @current-change="fetchShowList"
        />
      </div>
    </el-card>

    <!-- 剧目详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="剧目详情" width="900px">
      <el-descriptions v-if="currentShow" :column="2" border>
        <el-descriptions-item label="剧目ID">{{ currentShow.id }}</el-descriptions-item>
        <el-descriptions-item label="剧目名称">{{ currentShow.name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag>{{ getShowTypeText(currentShow.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时长">{{ currentShow.duration }}分钟</el-descriptions-item>
        <el-descriptions-item label="票价范围">
          ¥{{ currentShow.minPrice }} - ¥{{ currentShow.maxPrice }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getShowStatusType(currentShow.status)">
            {{ getShowStatusText(currentShow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="导演">{{ currentShow.director || '-' }}</el-descriptions-item>
        <el-descriptions-item label="编剧">{{ currentPlaywright || '-' }}</el-descriptions-item>
        <el-descriptions-item label="语言">{{ currentShow.language || '-' }}</el-descriptions-item>
        <el-descriptions-item label="首演时间">{{ currentShow.premiereDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推荐" :span="2">
          <el-tag v-if="currentShow.isRecommend" type="success" size="small">推荐</el-tag>
          <el-tag v-if="currentShow.isHot" type="danger" size="small">热门</el-tag>
          <el-tag v-if="currentShow.isNew" type="warning" size="small">新上</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="简介" :span="2">
          {{ currentShow.description }}
        </el-descriptions-item>
        <el-descriptions-item label="海报" :span="2">
          <el-image
            :src="getImageUrl(currentShow.poster)"
            :preview-src-list="[getImageUrl(currentShow.poster)]"
            style="width: 200px; height: 280px; border-radius: 4px;"
          />
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑剧目对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑剧目' : '添加剧目'"
      width="800px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="剧目名称" prop="name">
              <el-input v-model="editForm.name" placeholder="请输入剧目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剧目类型" prop="type">
              <el-select v-model="editForm.type" placeholder="请选择类型" style="width: 200px">
                <el-option label="原创" :value="0" />
                <el-option label="引进" :value="1" />
                <el-option label="经典" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时长（分钟）" prop="duration">
              <el-input-number v-model="editForm.duration" :min="30" :max="300" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言" prop="language">
              <el-input v-model="editForm.language" placeholder="如：中文、英文等" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="导演" prop="director">
              <el-input v-model="editForm.director" placeholder="请输入导演" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="编剧" prop="playwright">
              <el-input v-model="editForm.playwright" placeholder="请输入编剧" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="首演时间" prop="premiereDate">
              <el-date-picker
                v-model="editForm.premiereDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 200px">
                <el-option label="即将上映" :value="0" />
                <el-option label="正在热映" :value="1" />
                <el-option label="已下映" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签">
          <el-checkbox-group v-model="editForm.tags">
            <el-checkbox label="recommend">推荐</el-checkbox>
            <el-checkbox label="hot">热门</el-checkbox>
            <el-checkbox label="new">新上</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="海报" prop="poster">
          <el-upload
            class="poster-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handlePosterSuccess"
            :before-upload="beforePosterUpload"
          >
            <img v-if="editForm.poster" :src="getImageUrl(editForm.poster)" class="poster" />
            <el-icon v-else class="poster-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="剧目简介" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入剧目简介"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 演员管理对话框 -->
    <el-dialog v-model="actorsDialogVisible" title="演员管理" width="800px">
      <div class="actors-header">
        <el-button type="primary" :icon="Plus" @click="handleAddActor">添加演员</el-button>
      </div>
      <el-table :data="actors" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="60" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="演员姓名" min-width="120" />
        <el-table-column prop="role" label="扮演角色" min-width="150" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditActor(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteActor(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 票价设置对话框 -->
    <el-dialog v-model="priceDialogVisible" title="票价设置" width="600px">
      <el-form ref="priceFormRef" :model="priceForm" label-width="100px">
        <el-form-item label="VIP票">
          <el-input-number v-model="priceForm.vipPrice" :min="0" :precision="2" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="普通票">
          <el-input-number v-model="priceForm.normalPrice" :min="0" :precision="2" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="学生票">
          <el-input-number v-model="priceForm.studentPrice" :min="0" :precision="2" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="优惠票">
          <el-input-number v-model="priceForm.discountPrice" :min="0" :precision="2" controls-position="right" />
          <span class="unit">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="priceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePriceSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getShowList, getShowDetail, createShow, updateShow, deleteShow, setRecommendShow, setHotShow, uploadShowPoster, updateShowPrice } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  View,
  Edit,
  User,
  Money,
  Delete
} from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  name: '',
  type: null,
  status: null
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
const currentShow = ref(null)

// 编辑对话框
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  name: '',
  type: null,
  duration: 120,
  language: '',
  director: '',
  playwright: '',
  premiereDate: '',
  status: 'coming',
  poster: '',
  description: '',
  tags: []
})

// 演员管理对话框
const actorsDialogVisible = ref(false)
const actors = ref([])
const currentShowId = ref(null)

// 票价设置对话框
const priceDialogVisible = ref(false)
const priceFormRef = ref()
const priceForm = reactive({
  vipPrice: 0,
  normalPrice: 0,
  studentPrice: 0,
  discountPrice: 0
})

// 上传配置
const uploadAction = computed(() => '/api/admin/show/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

// 表单验证规则
const editRules = {
  name: [{ required: true, message: '请输入剧目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择剧目类型', trigger: 'change' }],
  duration: [{ required: true, message: '请输入时长', trigger: 'blur' }],
  poster: [{ required: true, message: '请上传海报', trigger: 'change' }],
  description: [{ required: true, message: '请输入剧目简介', trigger: 'blur' }]
}

// 获取剧目列表
async function fetchShowList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await getShowList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取剧目列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchShowList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    name: '',
    type: null,
    status: null
  })
  pagination.page = 1
  fetchShowList()
}

// 查看详情
async function handleView(row) {
  try {
    const res = await getShowDetail(row.id)
    if (res.code === 200) {
      currentShow.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取剧目详情失败', error)
  }
}

// 添加剧目
function handleAdd() {
  Object.assign(editForm, {
    id: null,
    name: '',
    type: null,
    duration: 120,
    language: '',
    director: '',
    playwright: '',
    premiereDate: '',
    status: 0,
    poster: '',
    description: '',
    tags: []
  })
  editDialogVisible.value = true
}

// 编辑剧目
async function handleEdit(row) {
  try {
    const res = await getShowDetail(row.id)
    if (res.code === 200) {
      const data = res.data

      // 处理标签回显
      const tags = []
      if (data.isRecommend) tags.push('recommend')
      if (data.isHot) tags.push('hot')
      if (data.isNew) tags.push('new')

      Object.assign(editForm, {
        id: data.id,
        name: data.name,
        type: data.type,
        duration: data.duration,
        language: data.language || '',
        director: data.director || '',
        playwright: data.playwright || '',
        premiereDate: data.premiereDate || '',
        status: data.status,
        poster: data.poster,
        description: data.description,
        tags: tags
      })
      editDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取剧目详情失败', error)
  }
}

// 提交编辑
async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()

    const data = {
      name: editForm.name,
      type: editForm.type,
      duration: editForm.duration,
      language: editForm.language || null,
      director: editForm.director || null,
      playwright: editForm.playwright || null,
      premiereDate: editForm.premiereDate || null,
      status: editForm.status,
      poster: editForm.poster,
      description: editForm.description,
      // 标签转换为布尔字段
      isRecommend: editForm.tags.includes('recommend'),
      isHot: editForm.tags.includes('hot'),
      isNew: editForm.tags.includes('new')
    }

    let res
    if (editForm.id) {
      res = await updateShow(editForm.id, data)
    } else {
      res = await createShow(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '添加成功')
      editDialogVisible.value = false
      fetchShowList()
    }
  } catch (error) {
    console.error('提交失败', error)
  }
}

// 删除剧目
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除剧目 "${row.name}" 吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteShow(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchShowList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 演员管理
async function handleActors(row) {
  currentShowId.value = row.id
  // TODO: 获取演员列表
  actors.value = []
  actorsDialogVisible.value = true
}

function handleAddActor() {
  // TODO: 添加演员
  ElMessage.info('添加演员功能待实现')
}

function handleEditActor(row) {
  // TODO: 编辑演员
  ElMessage.info('编辑演员功能待实现')
}

function handleDeleteActor(row) {
  // TODO: 删除演员
  ElMessage.info('删除演员功能待实现')
}

// 票价设置
function handlePrice(row) {
  currentShowId.value = row.id
  Object.assign(priceForm, {
    vipPrice: row.vipPrice || 0,
    normalPrice: row.normalPrice || 0,
    studentPrice: row.studentPrice || 0,
    discountPrice: row.discountPrice || 0
  })
  priceDialogVisible.value = true
}

async function handlePriceSubmit() {
  try {
    const res = await updateShowPrice(currentShowId.value, priceForm)
    if (res.code === 200) {
      ElMessage.success('票价设置成功')
      priceDialogVisible.value = false
      fetchShowList() // 刷新列表以显示更新后的票价
    }
  } catch (error) {
    console.error('票价设置失败', error)
  }
}

// 海报上传
function handlePosterSuccess(response) {
  if (response.code === 200) {
    // 只保存相对路径，不保存完整 URL
    editForm.poster = response.data.url
    ElMessage.success('上传成功')
  }
}

function beforePosterUpload(file) {
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

// 获取图片完整 URL
const getImageUrl = (url) => {
  if (!url) return ''
  // 如果已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 否则添加 API 基础地址
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return baseUrl + url
}

// 获取剧目类型文本
function getShowTypeText(type) {
  const typeMap = {
    0: '原创',
    1: '引进',
    2: '经典',
    3: '音乐剧',
    4: '演唱会'
  }
  return typeMap[type] || '未知'
}

// 获取剧目状态类型
function getShowStatusType(status) {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger',
    3: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取剧目状态文本
function getShowStatusText(status) {
  const textMap = {
    0: '即将上映',
    1: '正在热映',
    2: '已下映',
    3: '已结束'
  }
  return textMap[status] || '未知'
}

onMounted(() => {
  fetchShowList()
})
</script>

<style scoped lang="scss">
.show-manage {
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

  .poster-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: #409EFF;
      }
    }
  }

  .poster-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .poster {
    width: 178px;
    height: 250px;
    display: block;
  }

  .actors-header {
    margin-bottom: 16px;
  }

  .unit {
    margin-left: 8px;
    color: #909399;
  }
}
</style>
