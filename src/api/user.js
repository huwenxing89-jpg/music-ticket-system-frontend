import request from '@/utils/request'

/**
 * 用户注册
 */
export function register(data) {
  return request.post('/user/register', data)
}

/**
 * 用户登录
 */
export function login(data) {
  return request.post('/user/login', data)
}

/**
 * 手机号登�? */
export function loginByPhone(data) {
  return request.post('/user/login/phone', data)
}

/**
 * 发送验证码
 */
export function sendSmsCode(phone) {
  return request.post('/user/sms/send', { phone })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return request.get('/user/info')
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data) {
  return request.put('/user/info', data)
}

/**
 * 修改密码
 */
export function changePassword(data) {
  return request.post('/user/change-password', data)
}

/**
 * 重置密码
 */
export function resetPassword(data) {
  return request.post('/user/password/reset', data)
}

/**
 * 上传头像
 */
export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/user/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 实名认证
 */
export function realNameAuth(data) {
  return request.post('/user/realname', data)
}

/**
 * 获取公告列表
 */
export function getAnnouncements() {
  return request.get('/admin/announcement/active')
}
