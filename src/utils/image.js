/**
 * 图片URL处理工具函数
 * 统一处理所有图片URL，确保在开发和生产环境中都能正常显示
 */

/**
 * 获取处理后的图片URL
 * @param {string} url - 原始图片URL（可能是相对路径或绝对路径）
 * @returns {string} 处理后的图片URL
 */
export function getImageUrl(url) {
  if (!url || url.trim() === '') {
    return ''
  }

  let imageUrl = url.trim()

  // 如果已经是完整的HTTP/HTTPS URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // 确保相对路径以 / 开头
  if (!imageUrl.startsWith('/')) {
    imageUrl = '/' + imageUrl
  }

  return imageUrl
}

/**
 * 获取图片背景样式对象（用于 Vue 的 :style 绑定）
 * @param {string} url - 原始图片URL
 * @param {string} defaultBackground - 默认背景（当图片不存在时）
 * @returns {object} 样式对象
 */
export function getImageStyle(url, defaultBackground = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)') {
  const imageUrl = getImageUrl(url)

  if (!imageUrl) {
    return {
      background: defaultBackground
    }
  }

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
}

/**
 * 获取剧目封面样式
 * @param {object} show - 剧目对象
 * @returns {object} 样式对象
 */
export function getShowCoverStyle(show) {
  if (!show) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }

  const poster = show.poster || show.coverImage
  return getImageStyle(poster)
}

/**
 * 获取演员头像样式
 * @param {object} actor - 演员对象
 * @returns {object} 样式对象
 */
export function getActorAvatarStyle(actor) {
  if (!actor) {
    return {
      background: '#e0e0e0'
    }
  }

  return getImageStyle(actor.avatar, '#e0e0e0')
}

/**
 * 获取剧院图片样式
 * @param {object} theater - 剧院对象
 * @returns {object} 样式对象
 */
export function getTheaterImageStyle(theater) {
  if (!theater) {
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }

  return getImageStyle(theater.image)
}

/**
 * 获取用户头像URL
 * @param {string} avatar - 头像URL
 * @returns {string|null} 处理后的头像URL，如果为空则返回null
 */
export function getAvatarUrl(avatar) {
  if (!avatar || avatar.trim() === '') {
    return null
  }

  const url = getImageUrl(avatar)
  return url || null
}
