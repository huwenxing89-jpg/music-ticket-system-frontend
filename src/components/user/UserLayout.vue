<template>
  <div class="user-layout">
    <!-- 头部导航 -->
    <app-header />

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部 -->
    <app-footer />
  </div>
</template>

<script setup>
import AppHeader from '@/components/common/Header.vue'
import AppFooter from '@/components/common/Footer.vue'
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 80px 20px 20px;  /* 顶部padding 80px 避开固定header */
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>
