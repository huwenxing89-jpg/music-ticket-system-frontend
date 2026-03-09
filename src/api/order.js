import request from '@/utils/request'

/**
 * 创建订单
 */
export function createOrder(data) {
  return request.post('/order/create', data)
}

/**
 * 获取订单列表
 */
export function getOrderList(params) {
  return request.get('/order/list', { params })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id) {
  return request.get(`/order/${id}`)
}

/**
 * 取消订单
 */
export function cancelOrder(id) {
  return request.post(`/order/${id}/cancel`)
}

/**
 * 申请退票
 */
export function refundOrder(id, reason) {
  return request.post(`/order/${id}/refund`, { reason })
}

/**
 * 支付订单
 */
export function payOrder(id, paymentMethod) {
  return request.post(`/order/${id}/pay`, { paymentMethod })
}

/**
 * 获取订单统计
 */
export function getOrderStatistics() {
  return request.get('/order/statistics')
}
