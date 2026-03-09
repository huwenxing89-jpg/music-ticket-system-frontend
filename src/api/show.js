import request from '@/utils/request'

/**
 * 获取剧目列表
 */
export function getShowList(params) {
  return request.get('/show/list', { params })
}

/**
 * 获取剧目详情
 */
export function getShowDetail(id) {
  return request.get(`/show/${id}`)
}

/**
 * 收藏剧目
 */
export function favoriteShow(showId) {
  return request.post('/show/favorite', null, { params: { showId } })
}

/**
 * 取消收藏
 */
export function unfavoriteShow(showId) {
  return request.delete('/show/favorite', { params: { showId } })
}

/**
 * 获取收藏列表
 */
export function getFavoriteList(params) {
  return request.get('/show/favorite/list', { params })
}

/**
 * 获取热门剧目
 */
export function getHotShows(limit = 10) {
  return request.get('/show/hot', { params: { limit } })
}

/**
 * 获取推荐剧目
 */
export function getRecommendShows(limit = 10) {
  return request.get('/show/recommend', { params: { limit } })
}

/**
 * 搜索剧目
 */
export function searchShows(keyword) {
  return request.get('/show/list', { params: { keyword, current: 1, size: 20 } })
}

/**
 * 获取轮播图列表（启用的）
 */
export function getActiveCarousels() {
  return request.get('/carousel/active')
}
