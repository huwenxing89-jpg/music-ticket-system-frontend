import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    total: 0
  }),

  getters: {
    // 获取购物车数量
    itemCount: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },

    // 获取购物车总价
    cartTotal: (state) => {
      return state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
    },

    // 判断座位是否已在购物车
    hasSeat: (state) => (sessionId, seatId) => {
      return state.items.some(item => 
        item.sessionId === sessionId && item.seatId === seatId
      )
    }
  },

  actions: {
    // 添加座位到购物车
    addItem(item) {
      const existingItem = this.items.find(
        i => i.sessionId === item.sessionId && i.seatId === item.seatId
      )

      if (!existingItem) {
        this.items.push({
          ...item,
          quantity: 1
        })
        this.calculateTotal()
      }
    },

    // 批量添加座位
    addItems(items) {
      items.forEach(item => {
        const existingItem = this.items.find(
          i => i.sessionId === item.sessionId && i.seatId === item.seatId
        )
        if (!existingItem) {
          this.items.push({
            ...item,
            quantity: 1
          })
        }
      })
      this.calculateTotal()
    },

    // 移除座位
    removeItem(sessionId, seatId) {
      const index = this.items.findIndex(
        item => item.sessionId === sessionId && item.seatId === seatId
      )
      if (index > -1) {
        this.items.splice(index, 1)
        this.calculateTotal()
      }
    },

    // 移除某个场次的所有座位
    removeBySessionId(sessionId) {
      this.items = this.items.filter(item => item.sessionId !== sessionId)
      this.calculateTotal()
    },

    // 清空购物车
    clear() {
      this.items = []
      this.total = 0
    },

    // 计算总价
    calculateTotal() {
      this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },

    // 持久化到localStorage
    saveToLocalStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items))
    },

    // 从localStorage恢复
    loadFromLocalStorage() {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          this.items = JSON.parse(savedCart)
          this.calculateTotal()
        } catch (error) {
          console.error('恢复购物车数据失败:', error)
          this.items = []
          this.total = 0
        }
      }
    }
  }
})
