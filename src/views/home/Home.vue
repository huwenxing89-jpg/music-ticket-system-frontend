<template>
  <div class="home-page">
    <!-- 轮播图区域 -->
    <el-carousel height="400px" :interval="5000" arrow="hover" class="carousel">
      <el-carousel-item v-for="item in carouselList" :key="item.id">
        <div
          class="carousel-item"
          :style="item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : { background: item.gradient }"
          @click="goToShow(item.linkUrl)"
        >
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 快捷入口 -->
    <div class="quick-links">
      <el-row :gutter="20">
        <el-col :span="6" v-for="link in quickLinks" :key="link.title">
          <div class="quick-link-item" @click="goToPath(link.path)">
            <div class="icon" :style="{ backgroundColor: link.color }">
              <el-icon :size="30">
                <component :is="link.icon" />
              </el-icon>
            </div>
            <span>{{ link.title }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 热门剧目 -->
    <section class="show-section">
      <div class="section-header">
        <h2>🔥 热门剧目</h2>
        <el-link type="primary" @click="goToPath('/show')">查看更多 →</el-link>
      </div>
      <el-row :gutter="20" v-loading="hotLoading">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="show in hotShowList" :key="show.id">
          <el-card class="show-card" :body-style="{ padding: '0px' }" shadow="hover" @click="goToShowDetail(show.id)">
            <div class="show-cover" :style="getCoverStyle(show)">
              <div class="show-rating" v-if="show.rating">
                <el-icon><Star /></el-icon>
                {{ show.rating }}
              </div>
            </div>
            <div class="show-info">
              <h3 class="show-title">{{ show.name || show.title }}</h3>
              <p class="show-subtitle">{{ show.description }}</p>
              <div class="show-meta">
                <span><el-icon><Calendar /></el-icon> {{ show.duration }}分钟</span>
              </div>
              <div class="show-footer">
                <span class="show-price">¥{{ show.minPrice || '待定' }}起</span>
                <el-button type="primary" size="small">购票</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 即将上演 -->
    <section class="show-section">
      <div class="section-header">
        <h2>🎭 即将上演</h2>
        <el-link type="primary" @click="goToPath('/show')">查看更多 →</el-link>
      </div>
      <el-row :gutter="20" v-loading="upcomingLoading">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="show in upcomingShowList" :key="show.id">
          <el-card class="show-card" :body-style="{ padding: '0px' }" shadow="hover" @click="goToShowDetail(show.id)">
            <div class="show-cover" :style="getCoverStyle(show)">
              <div class="show-rating" v-if="show.rating">
                <el-icon><Star /></el-icon>
                {{ show.rating }}
              </div>
            </div>
            <div class="show-info">
              <h3 class="show-title">{{ show.name || show.title }}</h3>
              <p class="show-subtitle">{{ show.description }}</p>
              <div class="show-meta">
                <span><el-icon><Calendar /></el-icon> {{ show.duration }}分钟</span>
              </div>
              <div class="show-footer">
                <span class="show-price">¥{{ show.minPrice || '待定' }}起</span>
                <el-button type="primary" size="small">购票</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 推荐剧目 -->
    <section class="show-section">
      <div class="section-header">
        <h2>⭐ 为您推荐</h2>
        <el-link type="primary" @click="goToPath('/show')">查看更多 →</el-link>
      </div>
      <el-row :gutter="20" v-loading="recommendLoading">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="show in recommendShowList" :key="show.id">
          <el-card class="show-card" :body-style="{ padding: '0px' }" shadow="hover" @click="goToShowDetail(show.id)">
            <div class="show-cover" :style="getCoverStyle(show)">
              <div class="show-rating" v-if="show.rating">
                <el-icon><Star /></el-icon>
                {{ show.rating }}
              </div>
            </div>
            <div class="show-info">
              <h3 class="show-title">{{ show.name || show.title }}</h3>
              <p class="show-subtitle">{{ show.description }}</p>
              <div class="show-meta">
                <span><el-icon><Calendar /></el-icon> {{ show.duration }}分钟</span>
              </div>
              <div class="show-footer">
                <span class="show-price">¥{{ show.minPrice || '待定' }}起</span>
                <el-button type="primary" size="small">购票</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 系统公告 -->
    <section class="announcement-section">
      <div class="section-header">
        <h2>📢 系统公告</h2>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="announcement in announcementList"
          :key="announcement.id"
          :timestamp="announcement.publishTime"
          placement="top"
        >
          <el-card>
            <h4>{{ announcement.title }}</h4>
            <p>{{ announcement.content }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHotShows, getRecommendShows, getShowList, getActiveCarousels } from '@/api/show'
import { getAnnouncements } from '@/api/user'
import { ElMessage } from 'element-plus'
import {
  Calendar,
  Location,
  Ticket,
  Star,
  Picture,
  OfficeBuilding
} from '@element-plus/icons-vue'

const router = useRouter()

// 数据状态
const carouselList = ref([])
const hotShowList = ref([])
const upcomingShowList = ref([])
const recommendShowList = ref([])
const announcementList = ref([])

const hotLoading = ref(false)
const upcomingLoading = ref(false)
const recommendLoading = ref(false)

// 快捷入口 - 使用实际的图标组件
const quickLinks = [
  { title: '全部剧目', icon: Ticket, color: '#409EFF', path: '/show' },
  { title: '剧院信息', icon: OfficeBuilding, color: '#67C23A', path: '/theater' },
  { title: '我的订单', icon: Calendar, color: '#E6A23C', path: '/order/list' },
  { title: '个人中心', icon: Star, color: '#F56C6C', path: '/user/center' }
]

// 加载轮播图数据
async function loadCarousel() {
  try {
    const res = await getActiveCarousels()
    if (res.code === 200 && res.data && res.data.length > 0) {
      // 使用后端返回的数据，需要补充 description 字段用于展示
      carouselList.value = res.data.map(item => ({
        ...item,
        description: '' // 后端轮播图没有 description 字段，设为空字符串
      }))
    } else {
      // 如果后端没有数据，使用默认模拟数据
      carouselList.value = [
        {
          id: 1,
          title: '经典音乐剧《猫》',
          description: '百老汇经典剧目震撼来袭',
          imageUrl: '',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          linkUrl: '/show'
        },
        {
          id: 2,
          title: '《歌剧魅影》',
          description: '韦伯经典巨作，浪漫唯美的音乐盛宴',
          imageUrl: '',
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          linkUrl: '/show'
        },
        {
          id: 3,
          title: '《狮子王》',
          description: '迪士尼经典音乐剧，开启草原奇遇',
          imageUrl: '',
          gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          linkUrl: '/show'
        }
      ]
    }
  } catch (error) {
    console.error('加载轮播图失败', error)
    // 出错时使用默认模拟数据
    carouselList.value = [
      {
        id: 1,
        title: '经典音乐剧《猫》',
        description: '百老汇经典剧目震撼来袭',
        imageUrl: '',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        linkUrl: '/show'
      },
      {
        id: 2,
        title: '《歌剧魅影》',
        description: '韦伯经典巨作，浪漫唯美的音乐盛宴',
        imageUrl: '',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        linkUrl: '/show'
      },
      {
        id: 3,
        title: '《狮子王》',
        description: '迪士尼经典音乐剧，开启草原奇遇',
        imageUrl: '',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        linkUrl: '/show'
      }
    ]
  }
}

// 加载热门剧目
async function loadHotShows() {
  try {
    hotLoading.value = true
    const res = await getHotShows(8)
    console.log('热门剧目API响应:', res)
    if (res.code === 200) {
      hotShowList.value = res.data?.records || res.data || []
      console.log('热门剧目数据:', hotShowList.value)
    }
  } catch (error) {
    console.error('加载热门剧目失败', error)
  } finally {
    hotLoading.value = false
  }
}

// 加载即将上演的剧目
async function loadUpcomingShows() {
  try {
    upcomingLoading.value = true
    const res = await getShowList({ current: 1, size: 8, status: 0 })
    console.log('即将上演API响应:', res)
    if (res.code === 200) {
      upcomingShowList.value = res.data?.records || res.data || []
      console.log('即将上演数据:', upcomingShowList.value)
    }
  } catch (error) {
    console.error('加载即将上演剧目失败', error)
  } finally {
    upcomingLoading.value = false
  }
}

// 加载推荐剧目
async function loadRecommendShows() {
  try {
    recommendLoading.value = true
    const res = await getRecommendShows(8)
    console.log('推荐剧目API响应:', res)
    if (res.code === 200) {
      recommendShowList.value = res.data?.records || res.data || []
      console.log('推荐剧目数据:', recommendShowList.value)
    }
  } catch (error) {
    console.error('加载推荐剧目失败', error)
  } finally {
    recommendLoading.value = false
  }
}

// 加载公告
async function loadAnnouncements() {
  try {
    const res = await getAnnouncements()
    if (res.code === 200 && res.data) {
      // 后端返回的字段是 createTime，前端模板使用 publishTime，需要映射
      announcementList.value = res.data.map(item => ({
        ...item,
        publishTime: item.createTime
      }))
    }
  } catch (error) {
    console.error('获取公告失败', error)
  }
}

// 跳转到剧目详情
function goToShowDetail(id) {
  router.push(`/show/${id}`)
}

// 跳转到指定路径
function goToPath(path) {
  router.push(path)
}

// 跳转到剧目页面
function goToShow(link) {
  if (!link) return
  // 处理不同格式的链接
  if (link.startsWith('http://') || link.startsWith('https://')) {
    // 外部链接，在新窗口打开
    window.open(link, '_blank')
  } else {
    // 内部链接
    router.push(link)
  }
}

// 获取剧目封面背景样式
function getCoverStyle(show) {
  // 检查poster是否存在且有效
  if (show.poster && show.poster.trim() && !show.poster.includes('example.com')) {
    // 直接使用相对路径，让 Vite 代理处理
    let posterUrl = show.poster
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
  // 使用渐变背景
  return {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}

onMounted(() => {
  loadCarousel()
  loadHotShows()
  loadUpcomingShows()
  loadRecommendShows()
  loadAnnouncements()
})
</script>

<style scoped lang="scss">
.home-page {
  padding: 0;

  .carousel {
    margin-bottom: 30px;
    border-radius: 8px;
    overflow: hidden;

    .carousel-item {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      position: relative;
      cursor: pointer;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        transition: background 0.3s;
      }

      &:hover::before {
        background: rgba(0, 0, 0, 0.4);
      }
    }
  }

  .quick-links {
    margin-bottom: 40px;

    .quick-link-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 10px;
      }

      span {
        font-size: 16px;
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .show-section {
    margin-bottom: 40px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }

      // 修复 el-link 焦点/访问状态不消失的问题
      :deep(.el-link) {
        &:focus,
        &:focus-visible,
        &:visited,
        &:active {
          outline: none;
          text-decoration: none;
        }

        &:after {
          display: none;
        }
      }
    }

    .show-card {
      margin-bottom: 20px;
      cursor: pointer;

      :deep(.el-card__body) {
        padding: 0;
      }

      .show-cover {
        width: 100%;
        height: 280px;
        background-size: cover;
        background-position: center;
        position: relative;

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
          gap: 15px;
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
  }

  .announcement-section {
    margin-bottom: 40px;

    .section-header {
      margin-bottom: 20px;

      h2 {
        margin: 0;
        font-size: 24px;
        color: #303133;
      }
    }

    :deep(.el-timeline-item__wrapper) {
      padding-left: 30px;
    }

    :deep(.el-card) {
      h4 {
        margin: 0 0 10px 0;
        color: #303133;
      }

      p {
        margin: 0;
        color: #606266;
      }
    }
  }
}
</style>
