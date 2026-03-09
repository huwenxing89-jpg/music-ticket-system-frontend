<template>
  <div class="comment-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="剧目名称">
          <el-input v-model="searchForm.showName" placeholder="请输入剧目名称" clearable />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="评分">
          <el-select v-model="searchForm.rating" placeholder="请选择" clearable style="width: 150px">
            <el-option label="5星" value="5" />
            <el-option label="4星" value="4" />
            <el-option label="3星" value="3" />
            <el-option label="2星" value="2" />
            <el-option label="1星" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评论列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="showName" label="剧目名称" min-width="150" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column label="评分" width="153">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score text-color="#ff9900" score-template="{value}" />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="250" show-overflow-tooltip />
        <el-table-column label="标签" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.isQuality" type="success" size="small">优质</el-tag>
            <el-tag v-if="row.hasSpoiler" type="warning" size="small">含剧透</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getCommentStatusType(row.status)">
              {{ getCommentStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="评论时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button
              link
              :type="row.isQuality ? 'warning' : 'success'"
              :icon="Star"
              @click="handleToggleQuality(row)"
            >
              {{ row.isQuality ? '取消优质' : '设为优质' }}
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
          @size-change="fetchCommentList"
          @current-change="fetchCommentList"
        />
      </div>
    </el-card>

    <!-- 评论详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="评论详情" width="700px">
      <div v-if="currentComment" class="comment-detail">
        <div class="detail-header">
          <el-avatar :src="getAvatarUrl(currentComment.userAvatar)" :size="60" />
          <div class="user-info">
            <div class="username">{{ currentComment.username }}</div>
            <div class="time">{{ currentComment.createTime }}</div>
          </div>
        </div>

        <el-divider />

        <div class="detail-content">
          <div class="show-info">
            <el-tag>{{ currentComment.showName }}</el-tag>
            <el-rate v-model="currentComment.rating" disabled show-score text-color="#ff9900" />
          </div>

          <div class="content-text">{{ currentComment.content }}</div>

          <div v-if="currentComment.images && currentComment.images.length" class="content-images">
            <el-image
              v-for="(img, index) in currentComment.images"
              :key="index"
              :src="img"
              :preview-src-list="currentComment.images"
              fit="cover"
              style="width: 100px; height: 100px; margin-right: 10px; border-radius: 4px;"
            />
          </div>

          <div class="detail-footer">
            <el-tag v-if="currentComment.isQuality" type="success">优质评论</el-tag>
            <el-tag v-if="currentComment.hasSpoiler" type="warning">含剧透</el-tag>
            <el-tag :type="getCommentStatusType(currentComment.status)">
              {{ getCommentStatusText(currentComment.status) }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCommentList, getCommentDetail, deleteComment, markQualityComment } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View, Star, Delete } from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  showName: '',
  username: '',
  rating: null
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
const currentComment = ref(null)

// 获取评论列表
async function fetchCommentList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    }
    // 转换评分为数字
    if (searchForm.rating !== null && searchForm.rating !== undefined && searchForm.rating !== '') {
      params.rating = parseInt(searchForm.rating, 10)
    }

    const res = await getCommentList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取评论列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchCommentList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    showName: '',
    username: '',
    rating: null
  })
  pagination.page = 1
  fetchCommentList()
}

// 查看详情
async function handleView(row) {
  try {
    const res = await getCommentDetail(row.id)
    if (res.code === 200) {
      currentComment.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取评论详情失败', error)
  }
}

// 切换优质评论
async function handleToggleQuality(row) {
  try {
    const res = await markQualityComment(row.id, !row.isQuality)
    if (res.code === 200) {
      ElMessage.success(row.isQuality ? '已取消优质' : '已设为优质')
      fetchCommentList()
    }
  } catch (error) {
    console.error('操作失败', error)
  }
}

// 删除评论
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除这条评论吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteComment(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchCommentList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 获取评论状态类型
function getCommentStatusType(status) {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取评论状态文本
function getCommentStatusText(status) {
  const textMap = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝'
  }
  return textMap[status] || '未知'
}

// 获取用户头像URL（处理双斜杠问题）
function getAvatarUrl(avatar) {
  if (!avatar) return undefined
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  let avatarUrl = avatar
  // 去除开头的多余斜杠
  while (avatarUrl.startsWith('//')) {
    avatarUrl = avatarUrl.substring(1)
  }
  if (!avatarUrl.startsWith('/')) {
    avatarUrl = '/' + avatarUrl
  }
  return avatarUrl
}

onMounted(() => {
  fetchCommentList()
})
</script>

<style scoped lang="scss">
.comment-manage {
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

  .comment-detail {
    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;

      .user-info {
        .username {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .time {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }

    .detail-content {
      .show-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }

      .content-text {
        font-size: 14px;
        line-height: 1.8;
        color: #606266;
        margin-bottom: 16px;
        white-space: pre-wrap;
      }

      .content-images {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .detail-footer {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
