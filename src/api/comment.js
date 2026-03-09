import request from '@/utils/request'

/**
 * 添加评论
 */
export function addComment(data) {
  return request.post('/comment', data)
}

/**
 * 获取剧目评论列表
 */
export function getCommentList(showId, params) {
  return request.get(`/comment/list/${showId}`, { params })
}

/**
 * 获取我的评论列表
 */
export function getMyComments(params) {
  return request.get('/comment/my', { params })
}

/**
 * 删除评论
 */
export function deleteComment(id) {
  return request.delete(`/comment/${id}`)
}
