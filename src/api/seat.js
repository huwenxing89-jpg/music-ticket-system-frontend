import request from '@/utils/request'

/**
 * 获取场次座位状态
 */
export function getSeatStatus(sessionId) {
  return request.get(`/seat/session/${sessionId}`)
}

/**
 * 获取场次座位状态（别名，与后端API一致）
 */
export function getSessionSeatStatus(sessionId) {
  return getSeatStatus(sessionId)
}

/**
 * 锁定座位
 */
export function lockSeats(data) {
  return request.post('/seat/lock', data)
}

/**
 * 释放座位
 */
export function unlockSeats(data) {
  return request.post('/seat/unlock', data)
}

/**
 * 批量锁定座位
 */
export function batchLockSeats(seatIds) {
  return request.post('/seat/lock/batch', { seatIds })
}
