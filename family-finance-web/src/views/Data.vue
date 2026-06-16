<template>
  <div class="settings-page">
    <div class="settings-card glass-card">
      <div class="card-header">
        <h2>数据导出</h2>
      </div>

      <div class="export-grid">
        <div class="export-card glass-card">
          <div class="export-icon asset">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <h3>资产快照导出</h3>
          <p>导出所有资产快照记录，包含日期、所有人、账户、资产类型、金额等完整信息。</p>
          <el-button type="primary" @click="doExport(exportSnapshotsCsv())">
            <el-icon><Download /></el-icon> 导出 CSV
          </el-button>
        </div>

        <div class="export-card glass-card">
          <div class="export-icon account">
            <el-icon :size="28"><CreditCard /></el-icon>
          </div>
          <h3>账户配置导出</h3>
          <p>导出所有账户配置信息，包含账户名称、所有人、资产类型、分类等。</p>
          <el-button type="primary" @click="doExport(exportAccountsCsv())">
            <el-icon><Download /></el-icon> 导出 CSV
          </el-button>
        </div>

        <div class="export-card glass-card">
          <div class="export-icon type">
            <el-icon :size="28"><Collection /></el-icon>
          </div>
          <h3>资产类型配置导出</h3>
          <p>导出所有资产类型配置信息，包含名称、方向、风险等级等。</p>
          <el-button type="primary" @click="doExport(exportAssetTypesCsv())">
            <el-icon><Download /></el-icon> 导出 CSV
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { exportSnapshotsCsv, exportAccountsCsv, exportAssetTypesCsv } from '../api'

function doExport(url) {
  window.open(url, '_blank')
}
</script>

<style scoped>
.settings-page {
  max-width: 1100px;
}

.settings-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
}

.export-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.export-card {
  padding: 24px;
  text-align: center;
  transition: box-shadow .2s, transform .2s;
}
.export-card:hover {
  transform: translateY(-2px);
}

.export-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  color: #fff;
}
.export-icon.asset   { background: linear-gradient(135deg, #409EFF, #6BCBFF); }
.export-icon.account { background: linear-gradient(135deg, #7C6FF7, #A78BFA); }
.export-icon.type    { background: linear-gradient(135deg, #67C23A, #95D475); }

.export-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}
.export-card p {
  margin: 0 0 18px;
  font-size: 13px;
  color: #86909C;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .settings-page {
    max-width: none;
  }
  .settings-card {
    padding: 12px;
  }
  .card-header {
    margin-bottom: 16px;
  }
  .card-header h2 {
    font-size: 16px;
  }
  .export-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .export-card {
    padding: 16px 14px;
  }
  .export-icon {
    width: 44px;
    height: 44px;
    border-radius: 11px;
    margin-bottom: 10px;
  }
  .export-card h3 {
    font-size: 14px;
  }
  .export-card p {
    font-size: 12px;
    margin-bottom: 14px;
  }
}
</style>
