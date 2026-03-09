import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  // 登录页面
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  // 注册页面
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  // 用户端路由
  {
    path: '/',
    component: () => import('@/components/user/UserLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/Home.vue'),
        meta: { title: '首页', requiresAuth: false }
      },
      {
        path: 'show',
        name: 'ShowList',
        component: () => import('@/views/show/ShowList.vue'),
        meta: { title: '剧目列表', requiresAuth: false }
      },
      {
        path: 'show/:id',
        name: 'ShowDetail',
        component: () => import('@/views/show/ShowDetail.vue'),
        meta: { title: '剧目详情', requiresAuth: false }
      },
      {
        path: 'theater',
        name: 'TheaterList',
        component: () => import('@/views/theater/TheaterList.vue'),
        meta: { title: '剧院列表', requiresAuth: false }
      },
      {
        path: 'theater/:id',
        name: 'TheaterDetail',
        component: () => import('@/views/theater/TheaterDetail.vue'),
        meta: { title: '剧院详情', requiresAuth: false }
      },
      {
        path: 'cart',
        name: 'Cart',
        component: () => import('@/views/cart/Cart.vue'),
        meta: { title: '购物车', requiresAuth: true }
      },
      {
        path: 'order/confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/order/OrderConfirm.vue'),
        meta: { title: '确认订单', requiresAuth: true }
      },
      {
        path: 'order/list',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'order/detail/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'user/center',
        name: 'UserCenter',
        component: () => import('@/views/user/UserCenter.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'user/profile',
        redirect: '/user/center'
      },
      {
        path: 'seat/select',
        name: 'SeatSelect',
        component: () => import('@/views/seat/SeatSelect.vue'),
        meta: { title: '选座购票', requiresAuth: true }
      }
    ]
  },
  // 管理端路由
  {
    path: '/admin',
    component: () => import('@/components/admin/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据仪表盘', icon: 'DataAnalysis' }
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'show',
        name: 'ShowManage',
        component: () => import('@/views/admin/ShowManage.vue'),
        meta: { title: '剧目管理', icon: 'Film' }
      },
      {
        path: 'theater',
        name: 'TheaterManage',
        component: () => import('@/views/admin/TheaterManage.vue'),
        meta: { title: '剧院管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'session',
        name: 'SessionManage',
        component: () => import('@/views/admin/SessionManage.vue'),
        meta: { title: '场次管理', icon: 'Calendar' }
      },
      {
        path: 'order',
        name: 'OrderManage',
        component: () => import('@/views/admin/OrderManage.vue'),
        meta: { title: '订单管理', icon: 'Tickets' }
      },
      {
        path: 'comment',
        name: 'CommentManage',
        component: () => import('@/views/admin/CommentManage.vue'),
        meta: { title: '评论管理', icon: 'ChatLineSquare' }
      },
      {
        path: 'carousel',
        name: 'CarouselManage',
        component: () => import('@/views/admin/CarouselManage.vue'),
        meta: { title: '轮播图管理', icon: 'Picture' }
      },
      {
        path: 'announcement',
        name: 'AnnouncementManage',
        component: () => import('@/views/admin/AnnouncementManage.vue'),
        meta: { title: '公告管理', icon: 'Bell' }
      },
      {
        path: 'system',
        name: 'SystemConfig',
        component: () => import('@/views/admin/SystemConfig.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      },
      {
        path: 'operator-log',
        name: 'OperatorLog',
        component: () => import('@/views/admin/OperatorLog.vue'),
        meta: { title: '操作日志', icon: 'Document' }
      },
      {
        path: 'login-log',
        name: 'LoginLog',
        component: () => import('@/views/admin/LoginLog.vue'),
        meta: { title: '登录日志', icon: 'Clock' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 音乐剧购票系统` : '音乐剧购票系统'

  // 检查所有匹配的路由记录（包括父路由）
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role

  // 检查是否需要登录
  if (requiresAuth) {
    if (!userStore.isLogin) {
      return '/login'
    }

    // 检查角色权限
    if (requiredRole && userStore.userInfo?.role !== requiredRole) {
      return '/login'
    }
  }

  // 如果已登录且访问登录/注册页，跳转到首页
  if ((to.path === '/login' || to.path === '/register') && userStore.isLogin) {
    // 判断角色，管理员跳转到管理端，普通用户跳转到首页
    return userStore.userInfo?.role === 'admin' ? '/admin/dashboard' : '/'
  }

  // 允许导航继续
  return true
})

export default router
