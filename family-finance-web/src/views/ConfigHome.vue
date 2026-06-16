<template>
  <div class="config-home">
    <h2 class="page-title">配置中心</h2>

    <div class="config-grid">
      <!-- 所有人配置 -->
      <div class="config-card glass-card" @click="$router.push('/settings/owners')">
        <div class="config-icon" style="background: linear-gradient(135deg, #409EFF, #6BCBFF);">
          <el-icon :size="22"><User /></el-icon>
        </div>
        <div class="config-info">
          <span class="config-label">所有人配置</span>
          <span class="config-meta">{{ ownerCount }}人启用</span>
        </div>
        <el-icon class="config-arrow"><ArrowRight /></el-icon>
      </div>

      <!-- 账户配置 -->
      <div class="config-card glass-card" @click="$router.push('/settings/accounts')">
        <div class="config-icon" style="background: linear-gradient(135deg, #7C6FF7, #A78BFA);">
          <el-icon :size="22"><CreditCard /></el-icon>
        </div>
        <div class="config-info">
          <span class="config-label">账户配置</span>
          <span class="config-meta">{{ accountCount }}账户</span>
        </div>
        <el-icon class="config-arrow"><ArrowRight /></el-icon>
      </div>

      <!-- 资产类型 -->
      <div class="config-card glass-card" @click="$router.push('/settings/asset-types')">
        <div class="config-icon" style="background: linear-gradient(135deg, #67C23A, #95D475);">
          <el-icon :size="22"><Collection /></el-icon>
        </div>
        <div class="config-info">
          <span class="config-label">资产类型</span>
          <span class="config-meta">{{ assetTypeCount }}类型</span>
        </div>
        <el-icon class="config-arrow"><ArrowRight /></el-icon>
      </div>

      <!-- 数据导出 -->
      <div class="config-card glass-card" @click="$router.push('/data')">
        <div class="config-icon" style="background: linear-gradient(135deg, #E6A23C, #F2C94C);">
          <el-icon :size="22"><Download /></el-icon>
        </div>
        <div class="config-info">
          <span class="config-label">数据导出</span>
          <span class="config-meta">CSV 备份</span>
        </div>
        <el-icon class="config-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOwners, getAccounts, getAssetTypes } from '../api'

const ownerCount = ref(0)
const accountCount = ref(0)
const assetTypeCount = ref(0)

async function loadCounts() {
  try {
    const [owners, accounts, assetTypes] = await Promise.all([
      getOwners(true),
      getAccounts({ enabled: true }),
      getAssetTypes(true),
    ])
    ownerCount.value = (owners.data || []).length
    accountCount.value = (accounts.data || []).length
    assetTypeCount.value = (assetTypes.data || []).length
  } catch { /* ignore */ }
}

onMounted(loadCounts)
</script>

<style scoped>
.page-title {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 700;
  color: #1D2129;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 720px;
}

.config-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.config-card:hover {
  transform: translateY(-2px);
}

.config-card:active {
  transform: scale(0.98);
}

.config-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.config-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.config-label {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.config-meta {
  font-size: 13px;
  color: #86909C;
}

.config-arrow {
  color: #C9CDD4;
  font-size: 16px;
}

@media (max-width: 768px) {
  .page-title {
    margin: 0 0 16px;
    font-size: 18px;
  }
  .config-grid {
    grid-template-columns: 1fr;
    max-width: none;
    gap: 10px;
  }
  .config-card {
    padding: 14px 16px;
    gap: 12px;
  }
  .config-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .config-label {
    font-size: 14px;
  }
  .config-meta {
    font-size: 12px;
  }
}
</style>
