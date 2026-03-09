import { defineStore } from 'pinia'
import { login as loginApi, getUserInfo } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    isLogin: !!localStorage.getItem('token')
  }),

  getters: {
    // 获取用户显示名称
    displayName: (state) => {
      if (!state.userInfo) return '未登录'
      return state.userInfo.nickname || state.userInfo.username || '用户'
    },
    
    // 判断是否为管理员
    isAdmin: (state) => {
      return state.userInfo?.role === 'admin'
    }
  },

  actions: {
    // 设置token
    setToken(token) {
      this.token = token
      this.isLogin = !!token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      } else {
        localStorage.removeItem('userInfo')
      }
    },

    // 登录
    async login(loginData) {
      try {
        const res = await loginApi(loginData)
        if (res.code === 200) {
          this.setToken(res.data.token)
          this.setUserInfo(res.data.userInfo)
          return res
        }
        return res
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    // 获取用户信息
    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        if (res.code === 200) {
          this.setUserInfo(res.data)
          return res
        }
        return res
      } catch (error) {
        console.error('获取用户信息失败:', error)
        throw error
      }
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.setUserInfo(userInfo)
    },

    // 登出
    logout() {
      this.setToken('')
      this.setUserInfo(null)
      this.isLogin = false
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
