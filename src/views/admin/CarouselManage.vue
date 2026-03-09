<template>
  <div class="carousel-manage">
    <!-- 轮播图列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>轮播图列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加轮播图</el-button>
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
        <el-table-column label="图片" width="200">
          <template #default="{ row }">
            <el-image
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              fit="cover"
              style="width: 180px; height: 100px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="150" />
        <el-table-column prop="linkUrl" label="跳转链接" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" :icon="Top" @click="handleMoveUp(row)" :disabled="row.sort === 1">上移</el-button>
            <el-button link type="primary" :icon="Bottom" @click="handleMoveDown(row)">下移</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑轮播图' : '添加轮播图'"
      width="700px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="图片" prop="imageUrl">
          <el-upload
            class="image-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <img v-if="editForm.imageUrl" :src="editForm.imageUrl" class="uploaded-image" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="跳转链接" prop="linkUrl">
          <el-input v-model="editForm.linkUrl" placeholder="请输入跳转链接，如：/show/1" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="editForm.sort" :min="1" :max="100" controls-position="right" />
          <span class="tip">数字越小越靠前</span>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { getCarouselList, createCarousel, updateCarousel, deleteCarousel, updateCarouselSort, uploadCarouselImage } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Top, Bottom, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])

const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  title: '',
  imageUrl: '',
  linkUrl: '',
  sort: 1,
  status: 1
})

const uploadAction = computed(() => '/api/admin/carousel/upload')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

const editRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请上传图片', trigger: 'change' }],
  linkUrl: [{ required: true, message: '请输入跳转链接', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

async function fetchCarouselList() {
  loading.value = true
  try {
    const res = await getCarouselList()
    if (res.code === 200) {
      tableData.value = res.data.sort((a, b) => a.sort - b.sort)
    }
  } catch (error) {
    console.error('获取轮播图列表失败', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  Object.assign(editForm, {
    id: null,
    title: '',
    imageUrl: '',
    linkUrl: '',
    sort: tableData.value.length + 1,
    status: 1
  })
  editDialogVisible.value = true
}

function handleEdit(row) {
  Object.assign(editForm, {
    id: row.id,
    title: row.title,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    sort: row.sort,
    status: row.status
  })
  editDialogVisible.value = true
}

async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()
    const data = { ...editForm }
    delete data.id

    let res
    if (editForm.id) {
      res = await updateCarousel(editForm.id, data)
    } else {
      res = await createCarousel(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '添加成功')
      editDialogVisible.value = false
      fetchCarouselList()
    }
  } catch (error) {
    console.error('提交失败', error)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除这张轮播图吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteCarousel(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchCarouselList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

async function handleStatusChange(row) {
  try {
    const res = await updateCarousel(row.id, { status: row.status })
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

async function handleMoveUp(row) {
  const index = tableData.value.findIndex(item => item.id === row.id)
  if (index > 0) {
    const temp = tableData.value[index].sort
    tableData.value[index].sort = tableData.value[index - 1].sort
    tableData.value[index - 1].sort = temp

    const sortData = tableData.value.map(item => ({ id: item.id, sort: item.sort }))
    await updateCarouselSort(sortData)
    fetchCarouselList()
  }
}

async function handleMoveDown(row) {
  const index = tableData.value.findIndex(item => item.id === row.id)
  if (index < tableData.value.length - 1) {
    const temp = tableData.value[index].sort
    tableData.value[index].sort = tableData.value[index + 1].sort
    tableData.value[index + 1].sort = temp

    const sortData = tableData.value.map(item => ({ id: item.id, sort: item.sort }))
    await updateCarouselSort(sortData)
    fetchCarouselList()
  }
}

function handleImageSuccess(response) {
  if (response.code === 200) {
    editForm.imageUrl = response.data.url
    ElMessage.success('上传成功')
  }
}

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

onMounted(() => {
  fetchCarouselList()
})
</script>

<style scoped lang="scss">
.carousel-manage {
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .image-uploader {
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

  .uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 400px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .uploaded-image {
    width: 400px;
    height: 200px;
    display: block;
  }

  .tip {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }
}
</style>
