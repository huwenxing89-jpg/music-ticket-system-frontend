import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './style.css'
import './assets/styles/global.scss'
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

let app = null

function render(props = {}) {
  const { container } = props
  app = createApp(App)

  // 注册所有图标
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.use(createPinia())
  app.use(router)
  app.use(ElementPlus)

  // 处理全局状态和 token
  if (props.getToken) {
    const token = props.getToken()
    if (token) localStorage.setItem('token', token)
  }
  if (props.onGlobalStateChange) {
    props.onGlobalStateChange((state) => {
      // 可以在这里处理语言等状态同步
      console.log('music-ticket state changed', state)
    }, true)
  }

  app.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render()
}

// 作为微应用运行
renderWithQiankun({
  mount(props) {
    console.log('[vue] props from main framework', props)
    render(props)
  },
  bootstrap() {
    console.log('[vue] vue app bootstraped')
  },
  unmount() {
    console.log('[vue] vue app unmount')
    app.unmount()
    app = null
  },
  update(props) {
    console.log('[vue] vue app update', props)
  }
})
