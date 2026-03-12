<template>
  <div class="show-detail-page" v-loading="loading">
    <el-page-header @back="goBack" title="返回剧目列表">
      <template #content>
        <span class="page-title">剧目详情</span>
      </template>
    </el-page-header>

    <div v-if="showInfo" class="detail-content">
      <!-- 剧目基本信息 -->
      <div class="show-header">
        <div class="show-cover" :style="getCoverStyle(showInfo)">
          <div class="show-rating" v-if="showInfo.rating">
            <el-icon><Star /></el-icon>
            {{ showInfo.rating }}
          </div>
        </div>
        <div class="show-basic-info">
          <h1 class="show-title">{{ showInfo.name || showInfo.title }}</h1>
          <p class="show-subtitle">{{ showInfo.description || showInfo.subtitle }}</p>
          <div class="show-tags">
            <el-tag type="success">{{ showInfo.category }}</el-tag>
            <el-tag type="info">{{ showInfo.duration }}分钟</el-tag>
          </div>
          <div class="show-price-range">
            <span class="label">票价：</span>
            <span class="price">
              ¥{{ showInfo.minPrice !== null && showInfo.minPrice !== undefined && showInfo.minPrice !== '' ? showInfo.minPrice : '待定' }}起
            </span>
          </div>
          <div class="show-actions">
            <el-button type="primary" size="large" @click="scrollToSessions">立即购票</el-button>
            <el-button size="large" @click="handleFavorite">
              <el-icon><Star /></el-icon>
              {{ isFavorited ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 剧目描述 -->
      <div class="show-section">
        <h2>📖 剧目简介</h2>
        <div class="show-description">
          {{ showInfo.description || '暂无简介' }}
        </div>
      </div>

      <!-- 演员阵容 -->
      <div class="show-section" v-if="actors && actors.length > 0">
        <h2>👥 演员阵容</h2>
        <div class="actors-list">
          <div class="actor-item" v-for="actor in actors" :key="actor.id">
            <div class="actor-avatar" :style="getAvatarStyle(actor)"></div>
            <div class="actor-info">
              <h4>{{ actor.name }}</h4>
              <p>{{ actor.roleName || '演员' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 演出场次 -->
      <div class="show-section" id="sessions">
        <h2>🎫 演出场次</h2>
        <div class="sessions-list" v-if="sessions && sessions.length > 0">
          <div
            class="session-item"
            v-for="session in sessions"
            :key="session.id"
            @click="selectSession(session)"
          >
            <div class="session-date">
              <div class="day">{{ formatDate(session.showTime).day }}</div>
              <div class="month">{{ formatDate(session.showTime).month }}月</div>
            </div>
            <div class="session-info">
              <h4>{{ showInfo.title }}</h4>
              <p>
                <el-icon><Location /></el-icon>
                {{ session.theaterName || '剧院' }}
              </p>
              <p>
                <el-icon><Clock /></el-icon>
                {{ formatTime(session.showTime) }}
              </p>
            </div>
            <div class="session-price">
              <div class="price-tags">
                <el-tag v-if="session.vipPrice" size="small" type="warning">VIP ¥{{ session.vipPrice }}</el-tag>
                <el-tag v-if="session.normalPrice" size="small" type="primary">普通 ¥{{ session.normalPrice }}</el-tag>
                <el-tag v-if="session.studentPrice" size="small" type="success">学生 ¥{{ session.studentPrice }}</el-tag>
                <el-tag v-if="session.discountPrice" size="small" type="info">优惠 ¥{{ session.discountPrice }}</el-tag>
              </div>
              <div class="price-range">
                <span class="min-price">¥{{ getMinPrice(session) }}起</span>
              </div>
              <el-button type="primary" @click.stop="selectSession(session)">选座购票</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无场次信息" />
      </div>

      <!-- 用户评论 -->
      <div class="show-section" id="comments">
        <h2>💬 用户评论</h2>
        <div class="comment-input">
          <el-rate v-model="newComment.rating" />
          <el-input
            v-model="newComment.content"
            type="textarea"
            placeholder="写下你的观剧感受..."
            :rows="3"
            maxlength="500"
            show-word-limit
          />
          <el-button type="primary" @click="submitComment" :disabled="!isLogin">发表评论</el-button>
        </div>
        <div class="comments-list" v-if="comments && comments.length > 0">
          <div class="comment-item" v-for="comment in comments" :key="comment.id">
            <div class="comment-avatar">
              <el-avatar :src="getAvatarUrl(comment.userAvatar)" :alt="comment.username">{{ comment.username?.charAt(0) }}</el-avatar>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-user">{{ comment.username }}</span>
                <el-rate v-model="comment.rating" disabled />
              </div>
              <p class="comment-text">{{ comment.content }}</p>
              <span class="comment-time">{{ comment.createTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无评论，快来抢沙发吧" />
      </div>
    </div>

    <el-empty v-else-if="!loading" description="剧目不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShowDetail, favoriteShow, unfavoriteShow, getFavoriteList } from '@/api/show'
import { addComment, getCommentList } from '@/api/comment'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { Star, Location, Clock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 数据状态
const loading = ref(false)
const showInfo = ref(null)
const sessions = ref([])
const actors = ref([])
const comments = ref([])
const isFavorited = ref(false)

// 是否登录
const isLogin = computed(() => userStore.isLogin)

// 新评论
const newComment = ref({
  rating: 5,
  content: ''
})

// 加载剧目详情
async function loadShowDetail() {
  try {
    loading.value = true
    const showId = route.params.id
    const res = await getShowDetail(showId)
    if (res.code === 200) {
      const data = res.data
      // 确保数据格式正确
      showInfo.value = {
        ...data,
        // 确保poster字段正确处理
        poster: data.poster || null,
        // 确保minPrice正确处理（BigDecimal转字符串）
        minPrice: data.minPrice ? String(data.minPrice) : null
      }
      sessions.value = res.data.sessions || []
      actors.value = res.data.actors || []
      console.log('剧目详情数据:', showInfo.value)
      console.log('场次数据:', sessions.value)
      sessions.value.forEach(s => {
        console.log('场次ID:', s.id, '价格:', s.price)
      })
      console.log('minPrice:', showInfo.value.minPrice, 'poster:', showInfo.value.poster)
      // 加载评论列表
      await loadComments()
      // 检查收藏状态
      await checkFavoriteStatus()
    }
  } catch (error) {
    console.error('加载剧目详情失败', error)
    // 使用模拟数据作为回退
    showInfo.value = {
      id: showId || 1,
      name: '音乐剧《猫》',
      poster: '',
      coverImage: '',
      category: '经典音乐剧',
      duration: 150,
      description: '《猫》是安德鲁·劳埃德·韦伯根据T.S.艾略特的诗集《老负鼠的猫经》改编而成的音乐剧。自1981年在伦敦西区首演以来，已被翻译成十几种语言，在全球各地上演，成为音乐剧史上最成功的作品之一。',
      rating: 4.8,
      status: 1
    }
    sessions.value = [
      {
        id: 1,
        showTime: '2026-03-15 19:30:00',
        theaterName: '上海大剧院',
        price: 380,
        availableSeats: 120
      },
      {
        id: 2,
        showTime: '2026-03-16 14:00:00',
        theaterName: '上海大剧院',
        price: 380,
        availableSeats: 85
      },
      {
        id: 3,
        showTime: '2026-03-17 19:30:00',
        theaterName: '上海大剧院',
        price: 480,
        availableSeats: 50
      },
      {
        id: 4,
        showTime: '2026-03-18 19:30:00',
        theaterName: '上海大剧院',
        price: 380,
        availableSeats: 200
      }
    ]
    actors.value = [
      { name: '张三', avatar: '', role: '格里德尔贝拉' },
      { name: '李四', avatar: '', role: '罗姆·塔格' }
    ]
    comments.value = [
      { user: '用户A', rating: 5, content: '非常精彩的演出！', createTime: '2026-03-01' },
      { user: '用户B', rating: 4, content: '舞台效果很棒！', createTime: '2026-03-02' }
    ]
  } finally {
    loading.value = false
  }
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
  const prices = []
  if (session.vipPrice) prices.push(session.vipPrice)
  if (session.normalPrice) prices.push(session.normalPrice)
  if (session.studentPrice) prices.push(session.studentPrice)
  if (session.discountPrice) prices.push(session.discountPrice)
  if (prices.length > 0) {
    return Math.min(...prices)
  }
  return session.price || '待定'
}

// 获取封面样式
function getCoverStyle(show) {
  if (!show) return {}
  const poster = show.poster || show.coverImage
  // 检查poster是否存在且不为空字符串，且不是示例URL
  if (poster && poster.trim() !== '' && poster !== 'null' && poster !== 'undefined' && !poster.includes('example.com')) {
    let posterUrl = poster.trim()
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

// 获取演员头像样式
function getAvatarStyle(actor) {
  if (!actor) return {}
  const avatar = actor.avatar
  if (avatar && avatar.trim() && !avatar.includes('example.com')) {
    let avatarUrl = avatar
    // 如果已经是完整URL，直接使用；否则使用相对路径
    if (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
      // 确保路径以 / 开头
      if (!avatarUrl.startsWith('/')) {
        avatarUrl = '/' + avatarUrl
      }
    }
    return {
      backgroundImage: `url(${avatarUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  // 默认背景
  return {
    background: '#e0e0e0'
  }
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

// 返回上一页
function goBack() {
  router.back()
}

// 立即购票 - 直接跳转到选座页面
function scrollToSessions() {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 如果有场次，选择第一个场次跳转到选座页面
  if (sessions.value && sessions.value.length > 0) {
    selectSession(sessions.value[0])
  } else {
    ElMessage.warning('暂无可购票场次')
  }
}

// 收藏剧目
async function handleFavorite() {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const showId = route.params.id
  try {
    if (isFavorited.value) {
      await unfavoriteShow(showId)
      isFavorited.value = false
      ElMessage.success('取消收藏成功')
    } else {
      await favoriteShow(showId)
      isFavorited.value = true
      ElMessage.success('收藏成功')
    }
  } catch (error) {
    console.error('收藏操作失败', error)
  }
}

// 选择场次
function selectSession(session) {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  // 跳转到选座页面
  router.push({
    path: '/seat/select',
    query: { sessionId: session.id }
  })
}

// 加载评论列表
async function loadComments() {
  const showId = route.params.id
  try {
    const res = await getCommentList(showId, { current: 1, size: 10 })
    if (res.code === 200) {
      comments.value = res.data.records || []
    }
  } catch (error) {
    console.error('加载评论失败', error)
  }
}

// 检查收藏状态
async function checkFavoriteStatus() {
  if (!isLogin.value) {
    isFavorited.value = false
    return
  }

  try {
    const res = await getFavoriteList({ page: 1, size: 100 })
    if (res.code === 200) {
      const showId = route.params.id
      const favorites = res.data?.records || []
      isFavorited.value = favorites.some(f => f.showId == showId)
      console.log('收藏状态:', isFavorited.value, 'showId:', showId)
    }
  } catch (error) {
    console.error('检查收藏状态失败', error)
  }
}

// 提交评论
async function submitComment() {
  if (!isLogin.value) {
    ElMessage.warning('请先登录')
    return
  }

  if (!newComment.value.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  const showId = route.params.id
  try {
    await addComment({
      showId: showId,
      rating: newComment.value.rating,
      content: newComment.value.content
    })
    ElMessage.success('评论已提交，等待审核')
    newComment.value = { rating: 5, content: '' }
    // 重新加载评论列表
    await loadComments()
  } catch (error) {
    console.error('提交评论失败', error)
    ElMessage.error('提交评论失败')
  }
}

onMounted(() => {
  loadShowDetail()
})
</script>

<style scoped lang="scss">
.show-detail-page {
  .page-title {
    font-size: 18px;
    font-weight: 500;
  }

  .detail-content {
    margin-top: 20px;

    .show-header {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;

      .show-cover {
        width: 360px;
        height: 480px;
        border-radius: 8px;
        background-size: cover;
        background-position: center;
        position: relative;
        background-color: #f5f7fa;
        flex-shrink: 0;

        .show-rating {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 15px;
          border-radius: 25px;
          font-weight: bold;
          font-size: 18px;
          color: #F56C6C;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      }

      .show-basic-info {
        flex: 1;

        .show-title {
          margin: 0 0 10px 0;
          font-size: 32px;
          color: #303133;
        }

        .show-subtitle {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: #909399;
        }

        .show-tags {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }

        .show-price-range {
          margin-bottom: 25px;
          font-size: 18px;

          .label {
            color: #606266;
          }

          .price {
            font-size: 28px;
            font-weight: bold;
            color: #F56C6C;
          }
        }

        .show-actions {
          display: flex;
          gap: 15px;
        }
      }
    }

    .show-section {
      margin-bottom: 40px;

      h2 {
        margin: 0 0 20px 0;
        font-size: 22px;
        color: #303133;
      }

      &.show-description {
        font-size: 15px;
        line-height: 1.8;
        color: #606266;
        white-space: pre-line;
      }

      .actors-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;

        .actor-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f5f7fa;
          border-radius: 8px;

          .actor-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-size: cover;
            background-position: center;
            background-color: #e0e0e0;
            flex-shrink: 0;
          }

          .actor-info {
            h4 {
              margin: 0 0 5px 0;
              color: #303133;
            }

            p {
              margin: 0;
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }

      .sessions-list {
        .session-item {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409EFF;
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
          }

          .session-date {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
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
            }
          }

          .session-info {
            flex: 1;

            h4 {
              margin: 0 0 10px 0;
              font-size: 16px;
              color: #303133;
            }

            p {
              margin: 5px 0;
              font-size: 14px;
              color: #606266;
              display: flex;
              align-items: center;
              gap: 5px;
            }
          }

          .session-price {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            gap: 8px;
            min-width: 180px;

            .price-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              justify-content: flex-end;
              margin-bottom: 5px;

              .el-tag {
                font-weight: 600;
                font-size: 13px;
                padding: 4px 10px;
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                &.el-tag--warning {
                  background: linear-gradient(135deg, #F6D155 0%, #F5A623 100%);
                  border: none;
                  color: white;
                }

                &.el-tag--primary {
                  background: linear-gradient(135deg, #409EFF 0%, #3375D9 100%);
                  border: none;
                  color: white;
                }

                &.el-tag--success {
                  background: linear-gradient(135deg, #67C23A 0%, #529B2E 100%);
                  border: none;
                  color: white;
                }

                &.el-tag--info {
                  background: linear-gradient(135deg, #909399 0%, #7A7E83 100%);
                  border: none;
                  color: white;
                }
              }
            }

            .price-range {
              .min-price {
                font-size: 16px;
                font-weight: 600;
                color: #606266;

                &::before {
                  content: '起';
                  font-size: 14px;
                  font-weight: normal;
                  margin-left: 2px;
                  color: #909399;
                }
              }
            }

            .el-button {
              width: 100%;
              border-radius: 8px;
              font-weight: 500;
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
              }
            }
          }
        }
      }

      .comment-input {
        margin-bottom: 20px;
        padding: 20px;
        background: #f5f7fa;
        border-radius: 8px;

        .el-rate {
          margin-bottom: 15px;
        }

        .el-textarea {
          margin-bottom: 15px;
        }
      }

      .comments-list {
        .comment-item {
          display: flex;
          gap: 15px;
          padding: 15px;
          background: #f5f7fa;
          border-radius: 8px;
          margin-bottom: 15px;

          .comment-content {
            flex: 1;

            .comment-header {
              display: flex;
              align-items: center;
              gap: 15px;
              margin-bottom: 8px;

              .comment-user {
                font-weight: 500;
                color: #303133;
              }
            }

            .comment-text {
              margin: 8px 0;
              color: #606266;
              line-height: 1.6;
            }

            .comment-time {
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .show-detail-page {
    .detail-content {
      .show-header {
        flex-direction: column;

        .show-cover {
          width: 100%;
          height: 300px;
        }
      }
    }
  }
}
</style>
