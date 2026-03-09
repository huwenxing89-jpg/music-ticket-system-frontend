import request from '@/utils/request'

/**
 * 获取公共系统配置
 * @returns {Promise} 返回系统配置信息
 */
export function getPublicConfig() {
  return request.get('/public/config')
}
