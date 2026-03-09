# 音乐剧购票系统 - 管理端开发文档

## 项目概述

本项目是基于 Vue 3 + Spring Boot 的音乐剧购票系统的前端管理端部分，使用 Vue 3 Composition API、Element Plus、ECharts 等技术栈开发。

## 技术栈

- **Vue 3.5+** - 渐进式JavaScript框架，使用 Composition API
- **Vite 7+** - 下一代前端构建工具
- **Element Plus 2+** - Vue 3 组件库
- **Pinia 2+** - Vue 状态管理
- **Vue Router 4+** - Vue 路由管理
- **ECharts 5+** - 数据可视化图表库
- **Axios 1+** - HTTP 客户端
- **Day.js** - 轻量级日期处理库

## 项目结构

```
music-ticket-system-frontend/
├── src/
│   ├── api/                    # API 接口
│   │   └── admin.js            # 管理端 API
│   ├── assets/                 # 静态资源
│   │   ├── images/             # 图片资源
│   │   └── styles/             # 全局样式
│   │       └── global.scss     # 全局样式文件
│   ├── components/             # 组件
│   │   ├── admin/              # 管理端组件
│   │   │   └── AdminLayout.vue # 管理端布局组件
│   │   ├── common/             # 通用组件
│   │   └── business/           # 业务组件
│   ├── views/                  # 页面视图
│   │   ├── admin/              # 管理端页面
│   │   │   ├── Dashboard.vue   # 数据仪表盘
│   │   │   ├── UserManage.vue  # 用户管理
│   │   │   ├── ShowManage.vue  # 剧目管理
│   │   │   ├── TheaterManage.vue # 剧院管理
│   │   │   ├── SessionManage.vue  # 场次管理
│   │   │   ├── OrderManage.vue # 订单管理
│   │   │   ├── CommentManage.vue  # 评论管理
│   │   │   ├── CarouselManage.vue # 轮播图管理
│   │   │   ├── AnnouncementManage.vue # 公告管理
│   │   │   ├── SystemConfig.vue    # 系统配置
│   │   │   ├── OperatorLog.vue     # 操作日志
│   │   │   └── LoginLog.vue        # 登录日志
│   │   └── auth/               # 认证页面
│   │       └── Login.vue       # 登录页面
│   ├── router/                 # 路由配置
│   │   └── index.js            # 路由配置文件
│   ├── store/                  # Pinia 状态管理
│   │   └── user.js             # 用户状态
│   ├── utils/                  # 工具函数
│   │   └── request.js          # Axios 封装
│   ├── App.vue                 # 根组件
│   └── main.js                 # 入口文件
├── public/                     # 公共静态资源
├── package.json                # 项目依赖
├── vite.config.js              # Vite 配置
└── index.html                  # HTML 模板
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 预置账号

| 角色   | 用户名 | 密码   |
| ------ | ------ | ------ |
| 管理员 | admin  | 123456 |

## 功能模块

### 1. 数据仪表盘 (Dashboard)
- 关键指标卡片（总用户数、总订单数、总销售额、在线用户）
- 用户注册趋势折线图（最近30天）
- 订单量柱状图（最近7天）
- 热门剧目排行榜（Top 10）
- 销售额饼图（按剧目分类）
- 订单状态分布图

### 2. 用户管理 (UserManage)
- 用户列表（分页、搜索、筛选）
- 查看用户详情（基本信息、订单记录、登录日志）
- 编辑用户信息
- 封禁/解封用户
- 删除用户（软删除）

### 3. 剧目管理 (ShowManage)
- 剧目列表（分页、搜索、筛选）
- 添加/编辑剧目
- 删除剧目（软删除）
- 演员管理
- 票价设置
- 设置推荐剧目
- 设置热门演出

### 4. 剧院管理 (TheaterManage)
- 剧院列表（分页、搜索）
- 添加/编辑剧院
- 删除剧院
- 座位图模板配置（小型100座、中型300座、大型800座）
- 设置座位类型和价格

### 5. 场次管理 (SessionManage)
- 场次列表（分页、按剧目筛选）
- 添加/编辑场次
- 取消场次
- 查看场次座位销售情况

### 6. 订单管理 (OrderManage)
- 订单列表（分页、搜索、按状态筛选）
- 订单详情
- 手动出票（线下支付）
- 处理退票申请
- 手动更新订单状态
- 导出订单（Excel）

### 7. 评论管理 (CommentManage)
- 评论列表（分页、按状态筛选）
- 评论详情
- 审核评论（通过/拒绝）
- 删除评论
- 标记优质评论

### 8. 轮播图管理 (CarouselManage)
- 轮播图列表
- 上传轮播图
- 编辑轮播图（标题、图片、链接）
- 删除轮播图
- 设置排序

### 9. 公告管理 (AnnouncementManage)
- 公告列表（分页）
- 发布公告（标题、内容）
- 编辑公告
- 删除公告
- 设置置顶

### 10. 系统配置 (SystemConfig)
- 网站基本信息（名称、Logo、备案号）
- 支付配置（支付宝、微信）
- 短信配置
- 邮件配置
- 其他配置（订单超时时间、座位锁定时间等）

### 11. 操作日志 (OperatorLog)
- 日志列表（分页、按时间筛选）
- 日志详情
- 导出日志

### 12. 登录日志 (LoginLog)
- 日志列表（分页、按用户筛选）
- 登录详情
- 异常登录标记

## API 接口

所有 API 接口都封装在 `src/api/admin.js` 文件中，包括：

- 数据统计相关 API
- 用户管理相关 API
- 剧目管理相关 API
- 剧院管理相关 API
- 场次管理相关 API
- 订单管理相关 API
- 评论管理相关 API
- 轮播图管理相关 API
- 公告管理相关 API
- 系统配置相关 API
- 日志管理相关 API

## 状态管理

使用 Pinia 进行状态管理，当前包含：

- `useUserStore` - 用户状态管理
  - 用户信息
  - 登录状态
  - Token 管理
  - 登录/登出

## 路由配置

管理端路由前缀为 `/admin`，需要管理员权限才能访问。

主要路由：
- `/admin/dashboard` - 数据仪表盘
- `/admin/user` - 用户管理
- `/admin/show` - 剧目管理
- `/admin/theater` - 剧院管理
- `/admin/session` - 场次管理
- `/admin/order` - 订单管理
- `/admin/comment` - 评论管理
- `/admin/carousel` - 轮播图管理
- `/admin/announcement` - 公告管理
- `/admin/system` - 系统配置
- `/admin/operator-log` - 操作日志
- `/admin/login-log` - 登录日志

## 开发规范

### 组件命名

- 页面组件使用 PascalCase 命名，如 `Dashboard.vue`
- 业务组件使用 PascalCase 命名
- 通用组件使用 PascalCase 命名

### 代码风格

- 使用 Vue 3 Composition API 的 `<script setup>` 语法
- 使用 `ref` 和 `reactive` 进行响应式数据管理
- 使用 `async/await` 处理异步操作
- 添加必要的注释

### 样式规范

- 使用 SCSS 预处理器
- 使用 BEM 命名规范（可选）
- 使用作用域样式 `<style scoped lang="scss">`

### 组件通信

- 父子组件通信使用 props 和 emit
- 跨组件通信使用 Pinia 状态管理
- 复杂场景可使用 provide/inject

## 注意事项

1. 所有 API 请求都通过 `src/utils/request.js` 中的 Axios 实例发送
2. 请求会自动携带 Token（从 localStorage 中获取）
3. 响应拦截器会统一处理错误
4. 路由守卫会检查登录状态和权限
5. 当前使用模拟数据，实际开发时需要对接后端 API

## 待完成功能

- [ ] 对接真实的后端 API
- [ ] 实现演员管理的完整功能
- [ ] 完善座位图配置功能
- [ ] 添加数据导出功能
- [ ] 添加批量操作功能
- [ ] 添加搜索历史记录
- [ ] 优化性能和加载速度
- [ ] 添加单元测试

## 开发者

**学生**：黄晓倩
**学号**：2205100223
**专业**：计算机科学与技术
**指导教师**：张雪莲

## 许可证

本项目仅用于学习目的。
