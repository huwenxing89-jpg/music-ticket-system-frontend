<template>
  <div class="show-list-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索剧目名称、演员..."
        size="large"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.type" placeholder="剧目类型" clearable @change="handleFilter">
            <el-option label="全部类型" :value="null" />
            <el-option label="原创" :value="0" />
            <el-option label="引进" :value="1" />
            <el-option label="经典" :value="2" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filters.sort" placeholder="排序方式" @change="handleFilter">
            <el-option label="综合排序" value="" />
            <el-option label="价格从低到高" value="price_asc" />
            <el-option label="价格从高到低" value="price_desc" />
            <el-option label="评分最高" value="rating_desc" />
            <el-option label="最新上架" value="createTime_desc" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <div class="price-range">
            <span>价格区间：</span>
            <el-input-number v-model="filters.minPrice" :min="0" :max="10000" placeholder="最低" size="small" />
            <span>-</span>
            <el-input-number v-model="filters.maxPrice" :min="0" :max="10000" placeholder="最高" size="small" />
            <el-button type="primary" size="small" @click="handleFilter">确定</el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 剧目列表 -->
    <div class="show-list" v-loading="loading">
      <el-empty v-if="showList.length === 0 && !loading" description="暂无剧目数据" />

      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="show in showList" :key="show.id">
          <div class="show-card" @click="goToShowDetail(show.id)">
            <div class="show-cover" :style="getCoverStyle(show)">
              <div class="show-rating" v-if="show.rating">
                <el-icon><Star /></el-icon>
                {{ show.rating }}
              </div>
            </div>
            <div class="show-info">
              <h3 class="show-title" :title="show.name || show.title">{{ show.name || show.title }}</h3>
              <p class="show-subtitle">{{ show.description || show.subtitle || show.category }}</p>
              <div class="show-meta">
                <span><el-icon><Calendar /></el-icon> {{ show.duration }}分钟</span>
              </div>
              <div class="show-footer">
                <span class="show-price">¥{{ show.minPrice || show.price || '待定' }}起</span>
                <el-button type="primary" size="small">购票</el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getShowList, searchShows } from '@/api/show'
import { ElMessage } from 'element-plus'
import { Search, Star, Calendar } from '@element-plus/icons-vue'

const router = useRouter()

// 数据状态
const loading = ref(false)
const showList = ref([])
const total = ref(0)
const searchKeyword = ref('')

// 分页参数
const pagination = reactive({
  current: 1,
  size: 12
})

// 筛选条件
const filters = reactive({
  type: null,
  sort: '',
  minPrice: null,
  maxPrice: null
})

// 加载剧目列表
async function loadShowList() {
  try {
    loading.value = true

    const params = {
      current: pagination.current,
      size: pagination.size,
      type: filters.type,
      sort: filters.sort || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined
    }

    const res = await getShowList(params)
    if (res.code === 200) {
      showList.value = res.data?.records || []
      total.value = res.data?.total || 0
    }
  } catch (error) {
    console.error('加载剧目列表失败', error)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    loadShowList()
    return
  }

  try {
    loading.value = true
    const res = await searchShows(searchKeyword.value)
    if (res.code === 200) {
      showList.value = res.data?.records || res.data || []
      total.value = res.data?.total || showList.value.length
    }
  } catch (error) {
    console.error('搜索失败', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 筛选
function handleFilter() {
  pagination.current = 1
  loadShowList()
}

// 分页大小变化
function handleSizeChange() {
  pagination.current = 1
  loadShowList()
}

// 页码变化
function handlePageChange() {
  loadShowList()
}

// 跳转到剧目详情
function goToShowDetail(id) {
  router.push(`/show/${id}`)
}

// 获取剧目封面样式
function getCoverStyle(show) {
  if (!show) return {}
  const poster = show.poster || show.coverImage
  if (poster && poster.trim() && !poster.includes('example.com')) {
    let posterUrl = poster
    // 如果已经是完整URL，直接使用；否则使用相对路径
    if (!posterUrl.startsWith('http://') && !posterUrl.startsWith('https://')) {
      // 确保路径以 / 开头
      if (!posterUrl.startsWith('/')) {
        posterUrl = '/' + posterUrl
      }
    }
    return {
      backgroundImage: `url(${posterUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  // 默认背景
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

onMounted(() => {
  loadShowList()
})
</script>

<style scoped lang="scss">
.show-list-page {
  .search-bar {
    margin-bottom: 20px;
  }

  .filter-bar {
    margin-bottom: 20px;
    padding: 15px;
    background: #f5f7fa;
    border-radius: 8px;

    .price-range {
      display: flex;
      align-items: center;
      gap: 10px;

      span {
        color: #606266;
        font-size: 14px;
      }
    }
  }

  .show-list {
    min-height: 400px;

    .show-card {
      margin-bottom: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .show-cover {
        width: 100%;
        height: 280px;
        background-size: cover;
        background-position: center;
        position: relative;
        background-color: #f5f7fa;

        .show-rating {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.9);
          padding: 5px 10px;
          border-radius: 20px;
          font-weight: bold;
          color: #F56C6C;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .show-info {
        padding: 15px;

        .show-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #303133;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .show-subtitle {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #909399;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .show-meta {
          margin-bottom: 10px;
          font-size: 13px;
          color: #606266;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .show-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .show-price {
            font-size: 18px;
            font-weight: bold;
            color: #F56C6C;
          }
        }
      }
    }

    .pagination {
      margin-top: 30px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
