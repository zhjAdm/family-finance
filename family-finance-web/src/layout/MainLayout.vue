<template>
  <div class="app-shell">
    <!-- 内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 底部导航栏 -->
    <nav class="bottom-hub">
      <router-link to="/dashboard" class="hub-item" active-class="hub-item--active">
        <el-icon :size="22"><DataAnalysis /></el-icon>
        <span>看板</span>
      </router-link>
      <router-link to="/snapshots" class="hub-item" active-class="hub-item--active">
        <el-icon :size="22"><Camera /></el-icon>
        <span>记录</span>
      </router-link>
      <router-link to="/golds" class="hub-item" active-class="hub-item--active">
        <el-icon :size="22"><Coin /></el-icon>
        <span>攒金</span>
      </router-link>
      <router-link to="/year-goals" class="hub-item" active-class="hub-item--active">
        <el-icon :size="22"><Flag /></el-icon>
        <span>目标</span>
      </router-link>
      <router-link to="/config" class="hub-item" active-class="hub-item--active">
        <el-icon :size="22"><Setting /></el-icon>
        <span>配置</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: transparent;
}

/* 内容区 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  padding-bottom: 76px;
}

/* 底部导航栏 */
.bottom-hub {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.hub-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 16px;
  font-size: 11px;
  font-weight: 500;
  color: #86909C;
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.hub-item:hover {
  color: #4E5969;
}

.hub-item--active {
  color: #409EFF;
}

@media (max-width: 768px) {
  .main-content {
    padding: 16px;
    padding-bottom: 72px;
  }
}
</style>
