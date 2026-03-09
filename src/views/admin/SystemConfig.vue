<template>
  <div class="system-config">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 网站基本信息 -->
        <el-tab-pane label="网站信息" name="basic">
          <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-width="120px" style="max-width: 600px;">
            <el-form-item label="网站名称" prop="siteName">
              <el-input v-model="basicForm.siteName" placeholder="请输入网站名称" />
            </el-form-item>
            <el-form-item label="网站简称" prop="siteShortName">
              <el-input v-model="basicForm.siteShortName" placeholder="请输入网站简称" />
            </el-form-item>
            <el-form-item label="网站Logo" prop="logo">
              <el-upload
                class="logo-uploader"
                :action="uploadAction"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleLogoSuccess"
                :before-upload="beforeLogoUpload"
              >
                <img v-if="basicForm.logo" :src="basicForm.logo" class="logo" />
                <el-icon v-else class="uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="备案号" prop="icp">
              <el-input v-model="basicForm.icp" placeholder="请输入备案号" />
            </el-form-item>
            <el-form-item label="版权信息" prop="copyright">
              <el-input v-model="basicForm.copyright" placeholder="请输入版权信息" />
            </el-form-item>
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="basicForm.contactEmail" placeholder="请输入联系邮箱" />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="basicForm.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveBasic">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 支付配置 -->
        <el-tab-pane label="支付配置" name="payment">
          <el-form ref="paymentFormRef" :model="paymentForm" label-width="120px" style="max-width: 600px;">
            <el-divider content-position="left">支付宝配置</el-divider>
            <el-form-item label="启用支付宝">
              <el-switch v-model="paymentForm.alipayEnabled" />
            </el-form-item>
            <el-form-item label="应用ID" prop="alipayAppId">
              <el-input v-model="paymentForm.alipayAppId" placeholder="请输入支付宝应用ID" />
            </el-form-item>
            <el-form-item label="私钥" prop="alipayPrivateKey">
              <el-input v-model="paymentForm.alipayPrivateKey" type="textarea" :rows="3" placeholder="请输入应用私钥" />
            </el-form-item>
            <el-form-item label="公钥" prop="alipayPublicKey">
              <el-input v-model="paymentForm.alipayPublicKey" type="textarea" :rows="3" placeholder="请输入支付宝公钥" />
            </el-form-item>

            <el-divider content-position="left">微信支付配置</el-divider>
            <el-form-item label="启用微信支付">
              <el-switch v-model="paymentForm.wechatEnabled" />
            </el-form-item>
            <el-form-item label="商户号" prop="wechatMchId">
              <el-input v-model="paymentForm.wechatMchId" placeholder="请输入微信商户号" />
            </el-form-item>
            <el-form-item label="API密钥" prop="wechatApiKey">
              <el-input v-model="paymentForm.wechatApiKey" type="textarea" :rows="3" placeholder="请输入API密钥" />
            </el-form-item>
            <el-form-item label="APPID" prop="wechatAppId">
              <el-input v-model="paymentForm.wechatAppId" placeholder="请输入微信APPID" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSavePayment">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 短信配置 -->
        <el-tab-pane label="短信配置" name="sms">
          <el-form ref="smsFormRef" :model="smsForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="启用短信">
              <el-switch v-model="smsForm.enabled" />
            </el-form-item>
            <el-form-item label="服务商" prop="provider">
              <el-select v-model="smsForm.provider" placeholder="请选择短信服务商">
                <el-option label="阿里云" value="aliyun" />
                <el-option label="腾讯云" value="tencent" />
                <el-option label="网易云信" value="netease" />
              </el-select>
            </el-form-item>
            <el-form-item label="AccessKeyId" prop="accessKeyId">
              <el-input v-model="smsForm.accessKeyId" placeholder="请输入AccessKeyId" />
            </el-form-item>
            <el-form-item label="AccessKeySecret" prop="accessKeySecret">
              <el-input v-model="smsForm.accessKeySecret" type="textarea" :rows="2" placeholder="请输入AccessKeySecret" />
            </el-form-item>
            <el-form-item label="签名名称" prop="signName">
              <el-input v-model="smsForm.signName" placeholder="请输入短信签名名称" />
            </el-form-item>
            <el-form-item label="验证码模板" prop="templateCode">
              <el-input v-model="smsForm.templateCode" placeholder="请输入验证码模板代码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveSms">保存配置</el-button>
              <el-button @click="handleTestSms">测试发送</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 邮件配置 -->
        <el-tab-pane label="邮件配置" name="email">
          <el-form ref="emailFormRef" :model="emailForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="启用邮件">
              <el-switch v-model="emailForm.enabled" />
            </el-form-item>
            <el-form-item label="SMTP服务器" prop="smtpHost">
              <el-input v-model="emailForm.smtpHost" placeholder="如: smtp.qq.com" />
            </el-form-item>
            <el-form-item label="端口" prop="smtpPort">
              <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" controls-position="right" />
            </el-form-item>
            <el-form-item label="发件人邮箱" prop="fromEmail">
              <el-input v-model="emailForm.fromEmail" placeholder="请输入发件人邮箱" />
            </el-form-item>
            <el-form-item label="邮箱用户名" prop="emailUsername">
              <el-input v-model="emailForm.emailUsername" placeholder="请输入邮箱用户名" />
            </el-form-item>
            <el-form-item label="邮箱密码" prop="emailPassword">
              <el-input v-model="emailForm.emailPassword" type="password" show-password placeholder="请输入邮箱密码或授权码" />
            </el-form-item>
            <el-form-item label="使用SSL">
              <el-switch v-model="emailForm.sslEnabled" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveEmail">保存配置</el-button>
              <el-button @click="handleTestEmail">测试发送</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 其他配置 -->
        <el-tab-pane label="其他配置" name="other">
          <el-form ref="otherFormRef" :model="otherForm" label-width="120px" style="max-width: 600px;">
            <el-form-item label="订单超时时间" prop="orderTimeout">
              <el-input-number v-model="otherForm.orderTimeout" :min="5" :max="120" controls-position="right" />
              <span class="unit">分钟</span>
            </el-form-item>
            <el-form-item label="座位锁定时间" prop="seatLockTime">
              <el-input-number v-model="otherForm.seatLockTime" :min="5" :max="60" controls-position="right" />
              <span class="unit">分钟</span>
            </el-form-item>
            <el-form-item label="是否开启注册">
              <el-switch v-model="otherForm.registerEnabled" />
            </el-form-item>
            <el-form-item label="是否需要实名">
              <el-switch v-model="otherForm.realNameRequired" />
            </el-form-item>
            <el-form-item label="允许退票">
              <el-switch v-model="otherForm.refundEnabled" />
            </el-form-item>
            <el-form-item label="退票时限" v-if="otherForm.refundEnabled">
              <el-input-number v-model="otherForm.refundDeadline" :min="1" :max="72" controls-position="right" />
              <span class="unit">小时（演出前）</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveOther">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getSystemConfig, updateSystemConfig, testEmailConfig, testSmsConfig, uploadLogo } from '@/api/admin'
import { useConfigStore } from '@/store/config'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const activeTab = ref('basic')
const configStore = useConfigStore()

const basicFormRef = ref()
const basicForm = reactive({
  siteName: '',
  siteShortName: '',
  logo: '',
  icp: '',
  copyright: '',
  contactEmail: '',
  contactPhone: ''
})

const paymentForm = reactive({
  alipayEnabled: false,
  alipayAppId: '',
  alipayPrivateKey: '',
  alipayPublicKey: '',
  wechatEnabled: false,
  wechatMchId: '',
  wechatApiKey: '',
  wechatAppId: ''
})

const smsForm = reactive({
  enabled: false,
  provider: 'aliyun',
  accessKeyId: '',
  accessKeySecret: '',
  signName: '',
  templateCode: ''
})

const emailForm = reactive({
  enabled: false,
  smtpHost: '',
  smtpPort: 465,
  fromEmail: '',
  emailUsername: '',
  emailPassword: '',
  sslEnabled: true
})

const otherForm = reactive({
  orderTimeout: 15,
  seatLockTime: 15,
  registerEnabled: true,
  realNameRequired: false,
  refundEnabled: true,
  refundDeadline: 24
})

const basicRules = {
  siteName: [{ required: true, message: '请输入网站名称', trigger: 'blur' }]
}

const uploadAction = computed(() => '/api/admin/system/upload-logo')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

async function fetchConfig() {
  try {
    const res = await getSystemConfig()
    if (res.code === 200) {
      const config = res.data
      Object.assign(basicForm, config.basic || {})
      Object.assign(paymentForm, config.payment || {})
      Object.assign(smsForm, config.sms || {})
      Object.assign(emailForm, config.email || {})
      Object.assign(otherForm, config.other || {})
    }
  } catch (error) {
    console.error('获取系统配置失败', error)
  }
}

async function handleSaveBasic() {
  try {
    await basicFormRef.value.validate()
    const res = await updateSystemConfig({ basic: basicForm })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      // 刷新全局配置，让用户端立即看到更新
      configStore.reloadConfig()
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

async function handleSavePayment() {
  try {
    const res = await updateSystemConfig({ payment: paymentForm })
    if (res.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

async function handleSaveSms() {
  try {
    const res = await updateSystemConfig({ sms: smsForm })
    if (res.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

async function handleSaveEmail() {
  try {
    const res = await updateSystemConfig({ email: emailForm })
    if (res.code === 200) {
      ElMessage.success('保存成功')
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

async function handleSaveOther() {
  try {
    const res = await updateSystemConfig({ other: otherForm })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      // 刷新全局配置
      configStore.reloadConfig()
    }
  } catch (error) {
    console.error('保存失败', error)
  }
}

async function handleTestEmail() {
  try {
    const res = await testEmailConfig(emailForm.fromEmail)
    if (res.code === 200) {
      ElMessage.success('测试邮件已发送，请查收')
    }
  } catch (error) {
    console.error('发送失败', error)
  }
}

async function handleTestSms() {
  try {
    const phone = prompt('请输入测试手机号：')
    if (!phone) return

    const res = await testSmsConfig(phone)
    if (res.code === 200) {
      ElMessage.success('测试短信已发送')
    }
  } catch (error) {
    console.error('发送失败', error)
  }
}

function handleLogoSuccess(response) {
  if (response.code === 200) {
    basicForm.logo = response.data.url
    ElMessage.success('上传成功')
  }
}

function beforeLogoUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped lang="scss">
.system-config {
  .logo-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: #409EFF;
      }
    }
  }

  .uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 150px;
    height: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo {
    width: 150px;
    height: 150px;
    display: block;
  }

  .unit {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }
}
</style>
