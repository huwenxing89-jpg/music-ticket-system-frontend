<template>
  <div class="announcement-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="公告标题">
          <el-input v-model="searchForm.title" placeholder="请输入公告标题" clearable />
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 200px">
            <el-option label="系统公告" :value="1" />
            <el-option label="活动公告" :value="2" />
            <el-option label="维护公告" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公告列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>公告列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">发布公告</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="title" label="公告标题" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getAnnouncementTypeColor(row.type)">
              {{ getAnnouncementTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="公告内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="置顶" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isTop" type="danger">置顶</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.isTop ? 'warning' : 'success'"
              :icon="Top"
              @click="handleToggleTop(row)"
            >
              {{ row.isTop ? '取消置顶' : '置顶' }}
            </el-button>
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
          @size-change="fetchAnnouncementList"
          @current-change="fetchAnnouncementList"
        />
      </div>
    </el-card>

    <!-- 公告详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="公告详情" width="700px">
      <div v-if="currentAnnouncement" class="announcement-detail">
        <div class="detail-header">
          <h2>{{ currentAnnouncement.title }}</h2>
          <div class="meta">
            <el-tag :type="getAnnouncementTypeColor(currentAnnouncement.type)">
              {{ getAnnouncementTypeText(currentAnnouncement.type) }}
            </el-tag>
            <span class="time">{{ currentAnnouncement.createTime }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentAnnouncement.content }}</div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑公告' : '发布公告'"
      width="700px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入公告标题" />
        </el-form-item>

        <el-form-item label="公告类型" prop="type">
          <el-select v-model="editForm.type" placeholder="请选择公告类型" style="width: 100%">
            <el-option label="系统公告" :value="1" />
            <el-option label="活动公告" :value="2" />
            <el-option label="维护公告" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
          />
        </el-form-item>

        <el-form-item label="置顶">
          <el-switch v-model="editForm.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="发布" inactive-text="草稿" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAnnouncementList, getAnnouncementDetail, createAnnouncement, updateAnnouncement, deleteAnnouncement, setAnnouncementTop } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, View, Edit, Top, Delete } from '@element-plus/icons-vue'

const searchForm = reactive({
  title: '',
  type: ''
})

const loading = ref(false)
const tableData = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const detailDialogVisible = ref(false)
const currentAnnouncement = ref(null)

const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  title: '',
  type: 1,
  content: '',
  isTop: 0,
  status: 1
})

const editRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

async function fetchAnnouncementList() {
  loading.value = true
  try {
    const params = {
      current: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    const res = await getAnnouncementList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取公告列表失败', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchAnnouncementList()
}

function handleReset() {
  Object.assign(searchForm, {
    title: '',
    type: ''
  })
  pagination.page = 1
  fetchAnnouncementList()
}

async function handleView(row) {
  try {
    const res = await getAnnouncementDetail(row.id)
    if (res.code === 200) {
      currentAnnouncement.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取公告详情失败', error)
  }
}

function handleAdd() {
  Object.assign(editForm, {
    id: null,
    title: '',
    type: 1,
    content: '',
    isTop: 0,
    status: 1
  })
  editDialogVisible.value = true
}

async function handleEdit(row) {
  try {
    const res = await getAnnouncementDetail(row.id)
    if (res.code === 200) {
      const data = res.data
      Object.assign(editForm, {
        id: data.id,
        title: data.title,
        type: data.type,
        content: data.content,
        isTop: data.isTop,
        status: data.status
      })
      editDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取公告详情失败', error)
  }
}

async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()
    const data = { ...editForm }
    delete data.id

    let res
    if (editForm.id) {
      res = await updateAnnouncement(editForm.id, data)
    } else {
      res = await createAnnouncement(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '发布成功')
      editDialogVisible.value = false
      fetchAnnouncementList()
    }
  } catch (error) {
    console.error('提交失败', error)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除这条公告吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteAnnouncement(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchAnnouncementList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

async function handleToggleTop(row) {
  try {
    const res = await setAnnouncementTop(row.id, row.isTop ? 0 : 1)
    if (res.code === 200) {
      ElMessage.success(row.isTop ? '已取消置顶' : '已置顶')
      fetchAnnouncementList()
    }
  } catch (error) {
    console.error('操作失败', error)
  }
}

async function handleStatusChange(row) {
  try {
    const res = await updateAnnouncement(row.id, { status: row.status })
    if (res.code === 200) {
      ElMessage.success('状态更新成功')
    } else {
      row.status = row.status === 1 ? 0 : 1
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
    console.error('状态更新失败', error)
  }
}

function getAnnouncementTypeColor(type) {
  const colorMap = {
    1: '',
    2: 'success',
    3: 'warning'
  }
  return colorMap[type] || ''
}

function getAnnouncementTypeText(type) {
  const textMap = {
    1: '系统公告',
    2: '活动公告',
    3: '维护公告'
  }
  return textMap[type] || '未知'
}

onMounted(() => {
  fetchAnnouncementList()
})
</script>

<style scoped lang="scss">
.announcement-manage {
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

  .announcement-detail {
    .detail-header {
      h2 {
        margin: 0 0 10px 0;
        font-size: 20px;
        font-weight: 600;
      }

      .meta {
        display: flex;
        align-items: center;
        gap: 10px;

        .time {
          color: #909399;
          font-size: 14px;
        }
      }
    }

    .detail-content {
      line-height: 1.8;
      color: #606266;
      white-space: pre-wrap;
    }
  }
}
</style>
