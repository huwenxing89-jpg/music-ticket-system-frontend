<template>
  <div class="theater-detail-page" v-loading="loading">
    <el-page-header @back="goBack" title="返回剧院列表">
      <template #content>
        <span class="page-title">剧院详情</span>
      </template>
    </el-page-header>

    <div v-if="theaterInfo" class="detail-content">
      <!-- 剧院基本信息 -->
      <div class="theater-header">
        <div class="theater-image" :style="getTheaterImageStyle(theaterInfo)"></div>
        <div class="theater-basic-info">
          <h1 class="theater-name">{{ theaterInfo.name }}</h1>
          <div class="theater-tags">
            <el-tag type="info">{{ theaterInfo.totalSeats || 0 }}座位</el-tag>
            <el-tag type="success" v-if="theaterInfo.region">{{ formatRegion(theaterInfo.region) }}</el-tag>
          </div>
          <div class="theater-contact" v-if="theaterInfo.phone">
            <el-icon><Phone /></el-icon>
            <span>{{ theaterInfo.phone }}</span>
          </div>
        </div>
      </div>

      <!-- 剧院简介 -->
      <div class="info-section">
        <h2>📖 剧院简介</h2>
        <p class="description">{{ theaterInfo.description || '暂无简介' }}</p>
      </div>

      <!-- 地址交通 -->
      <div class="info-section">
        <h2>📍 地址与交通</h2>
        <div class="address-info">
          <p class="address">
            <el-icon><Location /></el-icon>
            {{ theaterInfo.address || '暂无地址信息' }}
          </p>
          <div class="traffic" v-if="theaterInfo.traffic || theaterInfo.trafficGuide">
            <h4>交通指南</h4>
            <p>{{ theaterInfo.traffic || theaterInfo.trafficGuide || '暂无交通信息' }}</p>
          </div>
        </div>
      </div>

      <!-- 设施服务 -->
      <div class="info-section" v-if="theaterInfo.facilities && theaterInfo.facilities.length > 0">
        <h2>🏢 设施服务</h2>
        <div class="facilities-list">
          <div class="facility-item" v-for="(facility, index) in parseFacilities(theaterInfo.facilities)" :key="index">
            <el-icon class="facility-icon"><CircleCheck /></el-icon>
            <span>{{ facility }}</span>
          </div>
        </div>
      </div>

      <!-- 演出场次 -->
      <div class="info-section" id="sessions">
        <h2>🎭 演出场次</h2>
        <div v-if="sessionList.length > 0" class="session-list">
          <div
            class="session-item"
            v-for="session in sessionList"
            :key="session.id"
            @click="goToShow(session.showId)"
          >
            <div class="session-date">
              <div class="day">{{ formatDate(session.showTime).day }}</div>
              <div class="month">{{ formatDate(session.showTime).month }}月</div>
            </div>
            <div class="session-info">
              <h4>{{ session.showTitle || '剧目名称' }}</h4>
              <p>
                <el-icon><Clock /></el-icon>
                {{ formatTime(session.showTime) }}
              </p>
              <p class="price">¥{{ getMinPrice(session) }}起</p>
            </div>
            <div class="session-action">
              <el-button type="primary" @click.stop="goToSeat(session)">购票</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无演出场次" />
      </div>
    </div>

    <el-empty v-else-if="!loading" description="剧院不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTheaterDetail } from '@/api/theater'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { Phone, Location, Clock, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const theaterInfo = ref(null)
const sessionList = ref([])

// 获取剧院场次列表（用户端接口）
async function loadSessions(theaterId) {
  try {
    const res = await request.get('/session', {
      params: {
        page: 1,
        size: 20,
        theaterId,
        status: 0 // 未开始的场次
      }
    })
    if (res.code === 200) {
      sessionList.value = res.data?.records || []
    }
  } catch (error) {
    console.error('加载场次失败', error)
  }
}

// 加载剧院详情
async function loadTheaterDetail() {
  try {
    loading.value = true
    const theaterId = route.params.id
    const res = await getTheaterDetail(theaterId)
    if (res.code === 200) {
      theaterInfo.value = res.data
      // 加载该剧院的场次
      await loadSessions(theaterId)
    }
  } catch (error) {
    console.error('加载剧院详情失败', error)
    ElMessage.error('加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 解析设施列表
function parseFacilities(facilities) {
  if (typeof facilities === 'string') {
    return facilities.split(',').filter(f => f.trim())
  }
  if (Array.isArray(facilities)) {
    return facilities
  }
  return []
}

// 格式化地区
function formatRegion(region) {
  if (!region) return ''
  const regionMap = {
    'beijing/chaoyang': '北京朝阳区',
    'beijing/dongcheng': '北京东城区',
    'beijing/xicheng': '北京西城区',
    'beijing/haidian': '北京海淀区',
    'shanghai/pudong': '上海浦东新区',
    'shanghai/huangpu': '上海黄浦区',
    'guangzhou/tianhe': '广州天河区',
    'shenzhen/futian': '深圳福田区'
  }
  return regionMap[region] || region
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return { day: '--', month: '--' }
  const date = new Date(dateString)
  return {
    day: date.getDate(),
    month: date.getMonth() + 1
  }
}

// 格式化时间
function formatTime(dateString) {
  if (!dateString) return '--:--'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  })
}

// 获取最低价格
function getMinPrice(session) {
  if (!session) return '待定'
  const prices = []
  if (session.vipPrice != null && session.vipPrice !== '') prices.push(Number(session.vipPrice))
  if (session.normalPrice != null && session.normalPrice !== '') prices.push(Number(session.normalPrice))
  if (session.studentPrice != null && session.studentPrice !== '') prices.push(Number(session.studentPrice))
  if (session.discountPrice != null && session.discountPrice !== '') prices.push(Number(session.discountPrice))
  if (prices.length === 0) return '待定'
  // 过滤掉0值和NaN值
  const validPrices = prices.filter(p => p > 0 && !isNaN(p))
  if (validPrices.length === 0) return '待定'
  return Math.min(...validPrices)
}

// 获取剧院图片样式
function getTheaterImageStyle(theater) {
  if (!theater || !theater.image) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }
  let imageUrl = theater.image
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
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

// 返回上一页
function goBack() {
  router.back()
}

// 跳转到剧目详情
function goToShow(showId) {
  router.push(`/show/${showId}`)
}

// 跳转到选座页面
function goToSeat(session) {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push({
    path: '/seat/select',
    query: { sessionId: session.id }
  })
}

onMounted(() => {
  loadTheaterDetail()
})
</script>

<style scoped lang="scss">
.theater-detail-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .page-title {
    font-size: 18px;
    font-weight: 500;
  }

  .detail-content {
    margin-top: 30px;
  }

  .theater-header {
    display: flex;
    gap: 30px;
    margin-bottom: 40px;

    .theater-image {
      width: 400px;
      height: 300px;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      background-color: #f5f7fa;
      flex-shrink: 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .theater-basic-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .theater-name {
        margin: 0 0 20px 0;
        font-size: 32px;
        color: #303133;
        font-weight: 600;
      }

      .theater-tags {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .theater-contact {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        color: #606266;

        .el-icon {
          font-size: 18px;
        }
      }
    }
  }

  .info-section {
    margin-bottom: 40px;

    h2 {
      margin: 0 0 20px 0;
      font-size: 22px;
      color: #303133;
      font-weight: 600;
    }

    .description {
      font-size: 15px;
      line-height: 1.8;
      color: #606266;
      white-space: pre-line;
    }

    .address-info {
      .address {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        color: #606266;
        margin-bottom: 15px;
      }

      .traffic {
        h4 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    .facilities-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;

      .facility-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px;
        background: #f5f7fa;
        border-radius: 8px;
        color: #606266;

        .facility-icon {
          font-size: 20px;
          color: #67C23A;
        }
      }
    }

    .session-list {
      .session-item {
        display: flex;
        gap: 20px;
        padding: 20px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: #409EFF;
          box-shadow: 0 4px 20px rgba(64, 158, 255, 0.15);
          transform: translateY(-2px);
        }

        .session-date {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;

          .day {
            font-size: 28px;
            font-weight: bold;
            line-height: 1;
          }

          .month {
            font-size: 14px;
            margin-top: 5px;
          }
        }

        .session-info {
          flex: 1;

          h4 {
            margin: 0 0 10px 0;
            font-size: 18px;
            color: #303133;
          }

          p {
            margin: 5px 0;
            font-size: 14px;
            color: #606266;
            display: flex;
            align-items: center;
            gap: 5px;

            &.price {
              font-size: 18px;
              font-weight: bold;
              color: #F56C6C;
            }
          }
        }

        .session-action {
          display: flex;
          align-items: center;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .theater-detail-page {
    padding: 15px;

    .theater-header {
      flex-direction: column;

      .theater-image {
        width: 100%;
        height: 200px;
      }

      .theater-basic-info {
        .theater-name {
          font-size: 24px;
        }
      }
    }

    .info-section {
      .facilities-list {
        grid-template-columns: 1fr;
      }

      .session-item {
        flex-direction: column;

        .session-date {
          width: 100%;
          height: 50px;
          flex-direction: row;
          gap: 10px;
        }

        .session-action {
          width: 100%;

          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
