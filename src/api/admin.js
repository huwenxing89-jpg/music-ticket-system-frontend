import request from '@/utils/request'

/**
 * 数据统计相关API
 */
// 获取统计数据
export function getStatistics() {
  return request.get('/admin/statistics')
}

// 获取用户注册趋势
export function getUserRegisterTrend(days = 30) {
  return request.get('/admin/statistics/user-trend', { params: { days } })
}

// 获取订单量趋势
export function getOrderTrend(days = 7) {
  return request.get('/admin/statistics/order-trend', { params: { days } })
}

// 获取热门剧目排行
export function getHotShows(top = 10) {
  return request.get('/admin/statistics/hot-shows', { params: { top } })
}

// 获取销售额统计
export function getSalesStatistics() {
  return request.get('/admin/statistics/sales')
}

/**
 * 用户管理相关API
 */
// 获取用户列表
export function getUserList(params) {
  return request.get('/admin/user', { params })
}

// 获取用户详情
export function getUserDetail(id) {
  return request.get(`/admin/user/${id}`)
}

// 更新用户信息
export function updateUser(id, data) {
  return request.put(`/admin/user/${id}`, data)
}

// 添加用户
export function addUser(data) {
  return request.post('/admin/user', data)
}

// 封禁用户
export function banUser(id, reason) {
  return request.post(`/admin/user/${id}/ban`, { reason })
}

// 解封用户
export function unbanUser(id) {
  return request.post(`/admin/user/${id}/unban`)
}

// 删除用户（软删除）
export function deleteUser(id) {
  return request.delete(`/admin/user/${id}`)
}

// 重置用户密码
export function resetUserPassword(id) {
  return request.post(`/admin/user/${id}/reset-password`)
}

/**
 * 剧目管理相关API
 */
// 获取剧目列表
export function getShowList(params) {
  return request.get('/admin/show', { params })
}

// 获取剧目详情
export function getShowDetail(id) {
  return request.get(`/admin/show/${id}`)
}

// 创建剧目
export function createShow(data) {
  return request.post('/admin/show', data)
}

// 更新剧目
export function updateShow(id, data) {
  return request.put(`/admin/show/${id}`, data)
}

// 删除剧目（软删除）
export function deleteShow(id) {
  return request.delete(`/admin/show/${id}`)
}

// 更新剧目票价
export function updateShowPrice(id, priceData) {
  return request.put(`/admin/show/${id}/price`, priceData)
}

// 设置推荐剧目
export function setRecommendShow(id, isRecommend) {
  return request.put(`/admin/show/${id}/recommend`, { isRecommend })
}

// 设置热门演出
export function setHotShow(id, isHot) {
  return request.put(`/admin/show/${id}/hot`, { isHot })
}

// 上传剧目海报
export function uploadShowPoster(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/show/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 演员管理相关API
 */
// 获取剧目演员列表
export function getActorList(showId) {
  return request.get(`/admin/show/${showId}/actors`)
}

// 添加演员
export function addActor(showId, data) {
  return request.post(`/admin/show/${showId}/actor`, data)
}

// 更新演员
export function updateActor(actorId, data) {
  return request.put(`/admin/actor/${actorId}`, data)
}

// 删除演员
export function deleteActor(actorId) {
  return request.delete(`/admin/actor/${actorId}`)
}

/**
 * 剧院管理相关API
 */
// 获取剧院列表
export function getTheaterList(params) {
  return request.get('/admin/theater', { params })
}

// 获取剧院详情
export function getTheaterDetail(id) {
  return request.get(`/admin/theater/${id}`)
}

// 创建剧院
export function createTheater(data) {
  return request.post('/admin/theater', data)
}

// 更新剧院
export function updateTheater(id, data) {
  return request.put(`/admin/theater/${id}`, data)
}

// 删除剧院
export function deleteTheater(id) {
  return request.delete(`/admin/theater/${id}`)
}

// 获取座位模板列表
export function getSeatTemplates() {
  return request.get('/admin/theater/seat-templates')
}

// 保存座位图配置
export function saveSeatConfig(theaterId, data) {
  return request.post(`/admin/theater/${theaterId}/seat-config`, data)
}

/**
 * 场次管理相关API
 */
// 获取场次列表
export function getSessionList(params) {
  return request.get('/admin/session', { params })
}

// 获取场次详情
export function getSessionDetail(id) {
  return request.get(`/admin/session/${id}`)
}

// 创建场次
export function createSession(data) {
  return request.post('/admin/session', data)
}

// 更新场次
export function updateSession(id, data) {
  return request.put(`/admin/session/${id}`, data)
}

// 取消场次
export function cancelSession(id, reason) {
  return request.post(`/admin/session/${id}/cancel`, { reason })
}

// 获取场次座位销售情况
export function getSessionSeatStatus(sessionId) {
  return request.get(`/admin/session/${sessionId}/seats`)
}

/**
 * 订单管理相关API
 */
// 获取订单列表
export function getOrderList(params) {
  return request.get('/admin/order', { params })
}

// 获取订单详情
export function getOrderDetail(id) {
  return request.get(`/admin/order/${id}`)
}

// 更新订单状态
export function updateOrderStatus(id, status) {
  return request.put(`/admin/order/${id}/status`, { status })
}

// 手动出票
export function issueTicket(id) {
  return request.post(`/admin/order/${id}/issue-ticket`)
}

// 处理退票申请
export function handleRefund(orderId, approve, reason) {
  return request.post(`/admin/order/${orderId}/refund`, { approve, reason })
}

// 导出订单
export function exportOrders(params) {
  return request.get('/admin/order/export', {
    params,
    responseType: 'blob'
  })
}

/**
 * 评论管理相关API
 */
// 获取评论列表
export function getCommentList(params) {
  return request.get('/admin/comment', { params })
}

// 获取评论详情
export function getCommentDetail(id) {
  return request.get(`/admin/comment/${id}`)
}

// 审核评论
export function auditComment(id, status, reason) {
  return request.put(`/admin/comment/${id}/audit`, { status, reason })
}

// 删除评论
export function deleteComment(id) {
  return request.delete(`/admin/comment/${id}`)
}

// 标记优质评论
export function markQualityComment(id, isQuality) {
  return request.put(`/admin/comment/${id}/quality`, { isQuality })
}

/**
 * 轮播图管理相关API
 */
// 获取轮播图列表
export function getCarouselList() {
  return request.get('/admin/carousel')
}

// 创建轮播图
export function createCarousel(data) {
  return request.post('/admin/carousel', data)
}

// 更新轮播图
export function updateCarousel(id, data) {
  return request.put(`/admin/carousel/${id}`, data)
}

// 删除轮播图
export function deleteCarousel(id) {
  return request.delete(`/admin/carousel/${id}`)
}

// 设置轮播图排序
export function updateCarouselSort(data) {
  return request.put('/admin/carousel/sort', data)
}

// 上传轮播图图片
export function uploadCarouselImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/carousel/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 公告管理相关API
 */
// 获取公告列表
export function getAnnouncementList(params) {
  return request.get('/admin/announcement', { params })
}

// 获取公告详情
export function getAnnouncementDetail(id) {
  return request.get(`/admin/announcement/${id}`)
}

// 创建公告
export function createAnnouncement(data) {
  return request.post('/admin/announcement', data)
}

// 更新公告
export function updateAnnouncement(id, data) {
  return request.put(`/admin/announcement/${id}`, data)
}

// 删除公告
export function deleteAnnouncement(id) {
  return request.delete(`/admin/announcement/${id}`)
}

// 设置公告置顶
export function setAnnouncementTop(id, isTop) {
  return request.put(`/admin/announcement/${id}/top`, null, { params: { isTop } })
}

/**
 * 系统配置相关API
 */
// 获取系统配置
export function getSystemConfig() {
  return request.get('/admin/system/config')
}

// 更新系统配置
export function updateSystemConfig(data) {
  return request.put('/admin/system/config', data)
}

// 上传Logo
export function uploadLogo(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/system/upload-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 测试邮件配置
export function testEmailConfig(email) {
  return request.post('/admin/system/test-email', { email })
}

// 测试短信配置
export function testSmsConfig(phone) {
  return request.post('/admin/system/test-sms', { phone })
}

/**
 * 日志管理相关API
 */
// 获取操作日志列表
export function getOperatorLogList(params) {
  return request.get('/admin/log/operator', { params })
}

// 获取登录日志列表
export function getLoginLogList(params) {
  return request.get('/admin/log/login', { params })
}

// 导出操作日志
export function exportOperatorLogs(params) {
  return request.get('/admin/log/operator/export', {
    params,
    responseType: 'blob'
  })
}

// 导出登录日志
export function exportLoginLogs(params) {
  return request.get('/admin/log/login/export', {
    params,
    responseType: 'blob'
  })
}

// 标记异常登录
export function markAbnormalLogin(logId, isAbnormal) {
  return request.put(`/admin/log/login/${logId}/abnormal`, { isAbnormal })
}
