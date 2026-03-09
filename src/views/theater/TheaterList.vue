<template>
  <div class="theater-list-page">
    <h1 class="page-title">🏛️ 剧院信息</h1>

    <div class="theater-list" v-loading="loading">
      <el-empty v-if="theaterList.length === 0 && !loading" description="暂无剧院数据" />

      <div class="theater-item" v-for="theater in theaterList" :key="theater.id" @click="viewTheaterDetail(theater.id)">
        <div class="theater-image" :style="getTheaterImageStyle(theater)"></div>
        <div class="theater-info">
          <h3>{{ theater.name }}</h3>
          <p class="theater-address">
            <el-icon><Location /></el-icon>
            {{ theater.address }}
          </p>
          <p class="theater-facilities" v-if="theater.facilities">
            <span class="label">设施：</span>
            <el-tag size="small" v-for="(facility, index) in parseFacilities(theater.facilities)" :key="index">
              {{ facility }}
            </el-tag>
          </p>
          <div class="theater-actions">
            <el-button type="primary" size="small">查看场次</el-button>
            <el-button size="small">详细信息</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTheaterList } from '@/api/theater'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const theaterList = ref([])

async function loadTheaterList() {
  try {
    loading.value = true
    const res = await getTheaterList({ page: 1, size: 50 })
    if (res.code === 200) {
      theaterList.value = res.data?.records || res.data || []
      console.log('剧院列表数据:', theaterList.value)
      console.log('第一个剧院的图片:', theaterList.value[0]?.image)
    }
  } catch (error) {
    console.error('加载剧院列表失败', error)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function parseFacilities(facilities) {
  if (typeof facilities === 'string') {
    return facilities.split(',').filter(f => f.trim())
  }
  return []
}

function viewTheaterDetail(id) {
  // TODO: 跳转到剧院详情页
  router.push(`/theater/${id}`)
}

// 获取剧院图片样式
function getTheaterImageStyle(theater) {
  if (!theater || !theater.image) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }
  let imageUrl = theater.image
  // 如果已经是完整URL，直接使用；否则使用相对路径
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // 确保路径以 / 开头
    if (!imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl
    }
  }
  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

onMounted(() => {
  loadTheaterList()
})
</script>

<style scoped lang="scss">
.theater-list-page {
  .page-title {
    margin: 0 0 30px 0;
    font-size: 28px;
    color: #303133;
  }

  .theater-list {
    .theater-item {
      display: flex;
      gap: 20px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      margin-bottom: 20px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .theater-image {
        width: 300px;
        height: 200px;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        background-color: #f5f7fa;
        flex-shrink: 0;
      }

      .theater-info {
        flex: 1;

        h3 {
          margin: 0 0 15px 0;
          font-size: 20px;
          color: #303133;
        }

        .theater-address {
          margin: 8px 0;
          font-size: 14px;
          color: #606266;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .theater-facilities {
          margin: 10px 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;

          .label {
            font-size: 14px;
            color: #606266;
          }
        }

        .theater-actions {
          margin-top: 15px;
          display: flex;
          gap: 10px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .theater-list-page {
    .theater-list {
      .theater-item {
        flex-direction: column;

        .theater-image {
          width: 100%;
          height: 200px;
        }
      }
    }
  }
}
</style>
