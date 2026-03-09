import { defineStore } from 'pinia'
import { getShowList, getShowDetail } from '@/api/show'

export const useShowStore = defineStore('show', {
  state: () => ({
    showList: [],
    currentShow: null,
    total: 0,
    loading: false,
    filters: {
      keyword: '',
      dateRange: [],
      priceRange: [],
      theaterId: null,
      type: null
    },
    sortBy: '综合', // 综合、时间、价格、热度
    pagination: {
      page: 1,
      pageSize: 12
    }
  }),

  getters: {
    // 获取筛选后的剧目列表
    filteredShows: (state) => {
      return state.showList
    },

    // 获取当前页数据
    pagedShows: (state) => {
      const start = (state.pagination.page - 1) * state.pagination.pageSize
      const end = start + state.pagination.pageSize
      return state.showList.slice(start, end)
    }
  },

  actions: {
    // 设置筛选条件
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1 // 重置到第一页
    },

    // 设置排序方式
    setSortBy(sortBy) {
      this.sortBy = sortBy
    },

    // 设置分页
    setPagination(page, pageSize) {
      this.pagination.page = page
      if (pageSize) {
        this.pagination.pageSize = pageSize
      }
    },

    // 获取剧目列表
    async fetchShowList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize,
          keyword: this.filters.keyword,
          ...this.filters
        }
        const res = await getShowList(params)
        if (res.code === 200) {
          this.showList = res.data.list || []
          this.total = res.data.total || 0
        }
        return res
      } catch (error) {
        console.error('获取剧目列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取剧目详情
    async fetchShowDetail(showId) {
      this.loading = true
      try {
        const res = await getShowDetail(showId)
        if (res.code === 200) {
          this.currentShow = res.data
        }
        return res
      } catch (error) {
        console.error('获取剧目详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 清空当前剧目
    clearCurrentShow() {
      this.currentShow = null
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        keyword: '',
        dateRange: [],
        priceRange: [],
        theaterId: null,
        type: null
      }
      this.sortBy = '综合'
      this.pagination.page = 1
    }
  }
})
