<template>
  <div class="app-shell">
    <!-- 顶部导航栏 -->
    <header class="top-nav glass-nav">
      <div class="nav-brand" @click="$router.push('/dashboard')">
        <el-icon :size="22"><Coin /></el-icon>
        <span class="brand-text">familyFinance</span>
      </div>
      <nav class="nav-tabs">
        <router-link to="/dashboard" class="nav-tab" active-class="nav-tab--active">
          <el-icon><DataAnalysis /></el-icon>
          <span>看板</span>
        </router-link>
        <router-link to="/snapshots" class="nav-tab" active-class="nav-tab--active">
          <el-icon><Camera /></el-icon>
          <span>记录</span>
        </router-link>
        <router-link to="/year-goals" class="nav-tab" active-class="nav-tab--active">
          <el-icon><Flag /></el-icon>
          <span>目标</span>
        </router-link>
        <router-link to="/config" class="nav-tab" active-class="nav-tab--active">
          <el-icon><Setting /></el-icon>
          <span>配置</span>
        </router-link>
      </nav>
      <div class="nav-spacer"></div>
      <!-- 移动端汉堡按钮 -->
      <button class="hamburger-btn" @click="mobileMenuVisible = true" aria-label="菜单">
        <span></span><span></span><span></span>
      </button>
    </header>

    <!-- 移动端全屏导航菜单 -->
    <div class="mobile-nav-overlay" :class="{ 'mobile-nav-overlay--open': mobileMenuVisible }">
      <div class="mobile-nav-panel">
        <div class="mobile-nav-header">
          <span class="mobile-nav-title">familyFinance</span>
          <button class="mobile-nav-close" @click="mobileMenuVisible = false" aria-label="关闭">
            <el-icon :size="24"><Close /></el-icon>
          </button>
        </div>
        <nav class="mobile-nav-list">
          <router-link
            to="/dashboard"
            class="mobile-nav-item"
            active-class="mobile-nav-item--active"
            @click="mobileMenuVisible = false"
          >
            <el-icon :size="20"><DataAnalysis /></el-icon>
            <span>看板</span>
          </router-link>
          <router-link
            to="/snapshots"
            class="mobile-nav-item"
            active-class="mobile-nav-item--active"
            @click="mobileMenuVisible = false"
          >
            <el-icon :size="20"><Camera /></el-icon>
            <span>记录</span>
          </router-link>
          <router-link
            to="/year-goals"
            class="mobile-nav-item"
            active-class="mobile-nav-item--active"
            @click="mobileMenuVisible = false"
          >
            <el-icon :size="20"><Flag /></el-icon>
            <span>目标</span>
          </router-link>
          <router-link
            to="/config"
            class="mobile-nav-item"
            active-class="mobile-nav-item--active"
            @click="mobileMenuVisible = false"
          >
            <el-icon :size="20"><Setting /></el-icon>
            <span>配置</span>
          </router-link>
        </nav>
      </div>
    </div>

    <!-- 内容区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuVisible = ref(false)
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: transparent;
}

/* 顶栏 — glass-nav 由 glass.css 提供 */
.top-nav {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #409EFF;
  margin-right: 40px;
  user-select: none;
}

.brand-text {
  font-size: 18px;
  font-weight: 700;
  color: #1D2129;
  letter-spacing: -0.3px;
}

/* Tab 导航 */
.nav-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  font-size: 14px;
  font-weight: 500;
  color: #86909C;
  text-decoration: none;
  border-radius: 9px;
  transition: all 0.2s ease-out;
  position: relative;
}

.nav-tab:hover {
  color: #4E5969;
  background: rgba(255, 255, 255, 0.35);
}

.nav-tab--active {
  color: #409EFF;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.nav-tab--active::after {
  display: none;
}

.nav-spacer {
  flex: 1;
}

/* 内容区 */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ========== 移动端导航 ========== */

/* 汉堡按钮 — 桌面端隐藏 */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  padding: 6px;
  background: none;
  border: none;
  cursor: pointer;
  margin-left: auto;
  border-radius: 8px;
  transition: background 0.15s;
}
.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
.hamburger-btn span {
  display: block;
  width: 100%;
  height: 2px;
  background: #4E5969;
  border-radius: 1px;
  transition: all 0.2s;
}

/* 全屏遮罩导航 */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s, visibility 0.25s;
}
.mobile-nav-overlay--open {
  opacity: 1;
  visibility: visible;
}

.mobile-nav-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: #fff;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.08);
}
.mobile-nav-overlay--open .mobile-nav-panel {
  transform: translateX(0);
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.mobile-nav-title {
  font-size: 17px;
  font-weight: 700;
  color: #1D2129;
}

.mobile-nav-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  color: #86909C;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}
.mobile-nav-close:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mobile-nav-list {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #4E5969;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  margin: 0 8px;
  border-radius: 10px;
}
.mobile-nav-item:hover {
  background: #f5f7fa;
}
.mobile-nav-item--active {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.1);
}

@media (max-width: 768px) {
  .top-nav {
    padding: 0 16px;
  }

  .brand-text {
    font-size: 16px;
  }

  /* 隐藏桌面端导航 */
  .nav-tabs,
  .nav-spacer {
    display: none;
  }

  /* 显示汉堡按钮 */
  .hamburger-btn {
    display: flex;
  }

  .main-content {
    padding: 16px;
  }
}
</style>
