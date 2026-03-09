import { defineStore } from 'pinia'
import { getPublicConfig } from '@/api/config'

export const useConfigStore = defineStore('config', {
  state: () => ({
    // 基础配置
    siteName: '音乐剧购票系统',
    siteShortName: '音乐剧票务',
    logo: '/files/system/logo.png',
    icp: '',
    copyright: '© 2024 音乐剧购票系统',
    contactEmail: 'service@musical.com',
    contactPhone: '400-888-8888',
    // 其他配置
    registerEnabled: true,
    // 加载状态
    loading: false,
    // 是否已加载过配置
    loaded: false
  }),

  getters: {
    // 获取Logo完整URL
    logoUrl: (state) => {
      if (!state.logo) return ''
      // 如果已经是完整URL，直接使用
      if (state.logo.startsWith('http://') || state.logo.startsWith('https://')) {
        return state.logo
      }
      // 处理相对路径
      let logoUrl = state.logo
      while (logoUrl.startsWith('//')) {
        logoUrl = logoUrl.substring(1)
      }
      if (!logoUrl.startsWith('/')) {
        logoUrl = '/' + logoUrl
      }
      return logoUrl
    },

    // 获取完整版权信息
    fullCopyright: (state) => {
      return state.copyright || '© 2024 音乐剧购票系统'
    }
  },

  actions: {
    // 设置配置
    setConfig(config) {
      if (config.basic) {
        this.siteName = config.basic.siteName || '音乐剧购票系统'
        this.siteShortName = config.basic.siteShortName || '音乐剧票务'
        this.logo = config.basic.logo || '/files/system/logo.png'
        this.icp = config.basic.icp || ''
        this.copyright = config.basic.copyright || '© 2024 音乐剧购票系统'
        this.contactEmail = config.basic.contactEmail || 'service@musical.com'
        this.contactPhone = config.basic.contactPhone || '400-888-8888'
      }
      if (config.other) {
        this.registerEnabled = config.other.registerEnabled !== undefined ? config.other.registerEnabled : true
      }
      this.loaded = true
    },

    // 获取公共配置
    async fetchConfig() {
      // 如果已经加载过，直接返回
      if (this.loaded) return

      try {
        this.loading = true
        const res = await getPublicConfig()
        if (res.code === 200 && res.data) {
          this.setConfig(res.data)
        }
      } catch (error) {
        console.error('获取系统配置失败:', error)
        // 失败时使用默认值，不影响用户使用
      } finally {
        this.loading = false
      }
    },

    // 重新加载配置（用于管理员更新配置后刷新）
    async reloadConfig() {
      this.loaded = false
      return await this.fetchConfig()
    }
  }
})
