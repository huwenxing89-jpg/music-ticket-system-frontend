import request from '@/utils/request'

/**
 * 获取购物车列表
 */
export function getCartList() {
  return request.get('/cart/list')
}

/**
 * 添加到购物车
 */
export function addToCart(data) {
  return request.post('/cart/add', data)
}

/**
 * 从购物车删除
 */
export function removeFromCart(id) {
  return request.delete(`/cart/${id}`)
}

/**
 * 清空购物车
 */
export function clearCart() {
  return request.delete('/cart/clear')
}
