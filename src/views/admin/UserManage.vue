<template>
  <div class="user-manage">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item label="用户状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择"
            clearable
            style="width: 180px"
          >
            <el-option label="正常" value="0" />
            <el-option label="封禁" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAdd">添加用户</el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="用户状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="success">正常</el-tag>
            <el-tag v-else-if="row.status === 1" type="danger">封禁</el-tag>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实名认证" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isVerified === 1" type="success">已认证</el-tag>
            <el-tag v-else type="warning">未认证</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="warning"
              :icon="Lock"
              @click="handleBan(row)"
            >
              封禁
            </el-button>
            <el-button
              v-else
              link
              type="success"
              :icon="Unlock"
              @click="handleUnban(row)"
            >
              解封
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUserList"
          @current-change="fetchUserList"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="800px"
      @open="handleDetailOpen"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions v-if="currentUser" :column="2" border>
            <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ currentUser.nickname }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱" :span="2">{{ currentUser.email }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ currentUser.gender === 1 ? '男' : currentUser.gender === 2 ? '女' : '保密' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">{{ currentUser.age || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实名认证">
              <el-tag v-if="currentUser.isVerified === 1" type="success">已认证</el-tag>
              <el-tag v-else type="warning">未认证</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户状态">
              <el-tag v-if="currentUser.status === 0" type="success">正常</el-tag>
              <el-tag v-else-if="currentUser.status === 1" type="danger">封禁</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">{{ currentUser.createTime }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="订单记录" name="orders">
          <el-table :data="currentUser?.orders || []" border stripe>
            <el-table-column prop="orderNo" label="订单号" min-width="180" />
            <el-table-column prop="showName" label="剧目名称" min-width="150" />
            <el-table-column prop="totalAmount" label="订单金额" width="120">
              <template #default="{ row }">¥{{ row.totalAmount }}</template>
            </el-table-column>
            <el-table-column label="订单状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">
                  {{ getOrderStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="登录日志" name="logs">
          <el-table :data="currentUser?.loginLogs || []" border stripe>
            <el-table-column prop="loginTime" label="登录时间" width="180" />
            <el-table-column prop="ip" label="IP地址" width="140" />
            <el-table-column prop="location" label="登录地点" min-width="150" />
            <el-table-column prop="device" label="设备信息" min-width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'success'" type="success">成功</el-tag>
                <el-tag v-else type="danger">失败</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.id ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" :disabled="!!editForm.id" />
        </el-form-item>
        <el-form-item v-if="!editForm.id" label="密码" prop="password">
          <el-input v-model="editForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">保密</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 封禁用户对话框 -->
    <el-dialog v-model="banDialogVisible" title="封禁用户" width="500px">
      <el-form ref="banFormRef" :model="banForm" :rules="banRules" label-width="100px">
        <el-form-item label="封禁原因" prop="reason">
          <el-input
            v-model="banForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入封禁原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="banDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleBanSubmit">确定封禁</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserList, getUserDetail, updateUser, addUser, banUser, unbanUser, deleteUser } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  View,
  Edit,
  Lock,
  Unlock,
  Delete
} from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  username: '',
  phone: '',
  status: null,
  dateRange: []
})

// 表格数据
const loading = ref(false)
const tableData = ref([])

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 用户详情对话框
const detailDialogVisible = ref(false)
const activeTab = ref('basic')
const currentUser = ref(null)

// 编辑用户对话框
const editDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: null,
  username: '',
  password: '',
  nickname: '',
  phone: '',
  email: '',
  gender: 0
})

// 封禁用户对话框
const banDialogVisible = ref(false)
const banFormRef = ref()
const banForm = reactive({
  userId: null,
  reason: ''
})

// 表单验证规则
const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        // 编辑用户时不需要密码
        if (editForm.id) {
          callback()
        } else {
          // 添加新用户时密码必填
          if (!value) {
            callback(new Error('请输入密码'))
          } else if (value.length < 6 || value.length > 20) {
            callback(new Error('长度在 6 到 20 个字符'))
          } else {
            callback()
          }
        }
      },
      trigger: 'blur'
    }
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const banRules = {
  reason: [{ required: true, message: '请输入封禁原因', trigger: 'blur' }]
}

// 获取用户列表
async function fetchUserList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    // 只添加有值的搜索条件
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.phone) params.phone = searchForm.phone
    // 处理 status：字符串类型需要转换为整数
    if (searchForm.status !== null && searchForm.status !== undefined && searchForm.status !== '') {
      params.status = parseInt(searchForm.status, 10)
    }
    // 处理日期范围
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const res = await getUserList(params)
    if (res.code === 200) {
      tableData.value = res.data.records
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.page = 1
  fetchUserList()
}

// 重置
function handleReset() {
  Object.assign(searchForm, {
    username: '',
    phone: '',
    status: null,
    dateRange: []
  })
  pagination.page = 1
  fetchUserList()
}

// 查看用户详情
async function handleView(row) {
  try {
    const res = await getUserDetail(row.id)
    if (res.code === 200) {
      currentUser.value = res.data
      detailDialogVisible.value = true
      activeTab.value = 'basic'
    }
  } catch (error) {
    console.error('获取用户详情失败', error)
  }
}

// 添加用户
function handleAdd() {
  Object.assign(editForm, {
    id: null,
    username: '',
    password: '',
    nickname: '',
    phone: '',
    email: '',
    gender: 0
  })
  editDialogVisible.value = true
}

// 编辑用户
function handleEdit(row) {
  Object.assign(editForm, {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    phone: row.phone,
    email: row.email,
    gender: row.gender ?? 0
  })
  editDialogVisible.value = true
}

// 提交编辑
async function handleEditSubmit() {
  try {
    await editFormRef.value.validate()
    const data = { ...editForm }
    delete data.id

    // 编辑用户时，如果没有输入密码，则不发送密码字段
    if (editForm.id && !data.password) {
      delete data.password
    }

    let res
    if (editForm.id) {
      // 编辑用户
      res = await updateUser(editForm.id, data)
    } else {
      // 添加用户
      res = await addUser(data)
    }

    if (res.code === 200) {
      ElMessage.success(editForm.id ? '更新成功' : '添加成功')
      editDialogVisible.value = false
      fetchUserList()
    }
  } catch (error) {
    console.error('提交失败', error)
  }
}

// 封禁用户
function handleBan(row) {
  banForm.userId = row.id
  banForm.reason = ''
  banDialogVisible.value = true
}

// 提交封禁
async function handleBanSubmit() {
  try {
    await banFormRef.value.validate()
    const res = await banUser(banForm.userId, banForm.reason)
    if (res.code === 200) {
      ElMessage.success('封禁成功')
      banDialogVisible.value = false
      fetchUserList()
    }
  } catch (error) {
    console.error('封禁失败', error)
  }
}

// 解封用户
async function handleUnban(row) {
  try {
    await ElMessageBox.confirm(`确定要解封用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await unbanUser(row.id)
    if (res.code === 200) {
      ElMessage.success('解封成功')
      fetchUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('解封失败', error)
    }
  }
}

// 删除用户
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteUser(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchUserList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 获取订单状态类型
function getOrderStatusType(status) {
  const typeMap = {
    pending: 'warning',
    paid: 'success',
    cancelled: 'info',
    refunded: 'danger',
    completed: 'success'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
function getOrderStatusText(status) {
  const textMap = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款',
    completed: '已完成'
  }
  return textMap[status] || '未知'
}

// 详情对话框打开时
function handleDetailOpen() {
  activeTab.value = 'basic'
}

onMounted(() => {
  fetchUserList()
})
</script>

<style scoped lang="scss">
.user-manage {
  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
