import request from '@/utils/request'

/**
 * 获取剧院列表
 */
export function getTheaterList(params) {
  return request.get('/theater/list', { params })
}

/**
 * 获取剧院详情
 */
export function getTheaterDetail(id) {
  return request.get(`/theater/${id}`)
}

/**
 * 获取剧院场次列表
 */
export function getTheaterSessions(theaterId, params) {
  return request.get(`/theater/${theaterId}/sessions`, { params })
}
