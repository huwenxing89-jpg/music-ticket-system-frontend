<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-content">
        <!-- 关于我们 -->
        <div class="footer-section">
          <h3>关于我们</h3>
          <ul>
            <li><a href="#">公司简介</a></li>
            <li><a href="#">联系方式</a></li>
            <li><a href="#">加入我们</a></li>
            <li><a href="#">合作伙伴</a></li>
          </ul>
        </div>

        <!-- 帮助中心 -->
        <div class="footer-section">
          <h3>帮助中心</h3>
          <ul>
            <li><a href="#">购票指南</a></li>
            <li><a href="#">退换票政策</a></li>
            <li><a href="#">常见问题</a></li>
            <li><a href="#">客服中心</a></li>
          </ul>
        </div>

        <!-- 商务合作 -->
        <div class="footer-section">
          <h3>商务合作</h3>
          <ul>
            <li><a href="#">剧院入驻</a></li>
            <li><a href="#">演出合作</a></li>
            <li><a href="#">广告投放</a></li>
            <li><a href="#">企业服务</a></li>
          </ul>
        </div>

        <!-- 关注我们 -->
        <div class="footer-section">
          <h3>关注我们</h3>
          <div class="social-links">
            <a href="#" class="social-link">
              <el-icon :size="24"><Message /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon :size="24"><ChatDotRound /></el-icon>
            </a>
            <a href="#" class="social-link">
              <el-icon :size="24"><Phone /></el-icon>
            </a>
          </div>
          <p class="contact-info">
            <el-icon><Phone /></el-icon>
            客服热线：{{ configStore.contactPhone || '400-888-8888' }}
          </p>
          <p class="contact-info">
            <el-icon><Message /></el-icon>
            邮箱：{{ configStore.contactEmail || 'service@musical.com' }}
          </p>
        </div>
      </div>

      <!-- 底部版权信息 -->
      <div class="footer-bottom">
        <p>{{ configStore.fullCopyright }}</p>
        <p v-if="configStore.icp">
          <a href="#">{{ configStore.icp }}</a>
        </p>
        <p>
          <a href="#">用户协议</a> |
          <a href="#">隐私政策</a> |
          <a href="#">备案信息</a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useConfigStore } from '@/store/config'
import { Message, ChatDotRound, Phone } from '@element-plus/icons-vue'

const configStore = useConfigStore()
</script>

<style scoped>
.footer {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 40px 0 20px;
  margin-top: 60px;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 30px;
}

.footer-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: #ffd04b;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s;
}

.footer-section a:hover {
  color: #ffd04b;
}

.social-links {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transition: all 0.3s;
}

.social-link:hover {
  background: #ffd04b;
  color: #2c3e50;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  color: #bdc3c7;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  text-align: center;
  color: #95a5a6;
}

.footer-bottom p {
  margin: 5px 0;
}

.footer-bottom a {
  color: #95a5a6;
  text-decoration: none;
  margin: 0 10px;
}

.footer-bottom a:hover {
  color: #ffd04b;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}
</style>
