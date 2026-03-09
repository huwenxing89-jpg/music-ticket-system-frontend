import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

// 导出各个store
export { useUserStore } from './user'
export { useShowStore } from './show'
export { useCartStore } from './cart'
