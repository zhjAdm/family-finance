<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>财务看板</h2>
      <el-select v-model="selectedYear" @change="loadDashboard" style="width: 120px">
        <el-option v-for="y in years" :key="y" :label="y + '年'" :value="y" />
      </el-select>
    </div>

    <div v-if="!dashboardData" class="empty-state">
      <el-empty description="暂无数据，请先设置年度目标和资产快照" />
    </div>

    <template v-else>
      <!-- 资产净值卡片 -->
      <div class="net-asset-card glass-card glass-card--hero-blue">
        <div class="net-asset-main">
          <div class="net-asset-label">资产净值</div>
          <div class="net-asset-value">{{ formatMoney(dashboardData.netAssetAmount) }}</div>
        </div>
        <div class="net-asset-side">
          <div class="net-asset-side-label">年度新增</div>
          <div class="net-asset-side-value" :class="Number(dashboardData.yearIncreaseAmount) >= 0 ? 'up' : 'down'">
            {{ Number(dashboardData.yearIncreaseAmount) >= 0 ? '+' : '' }}{{ formatMoney(dashboardData.yearIncreaseAmount) }}
          </div>
        </div>
      </div>

      <!-- 指标卡片行 -->
      <div class="metric-cards">
        <div class="metric-card glass-card">
          <div class="metric-label">年初资产</div>
          <div class="metric-value">{{ formatMoney(dashboardData.startAmount) }}</div>
        </div>
        <div class="metric-card glass-card metric-card--blue">
          <div class="metric-label">年度目标</div>
          <div class="metric-value">{{ formatMoney(dashboardData.targetAmount) }}</div>
        </div>
        <div class="metric-card glass-card" :class="Number(dashboardData.remainingAmount) > 0 ? 'metric-card--warn' : 'metric-card--success'">
          <div class="metric-label">距离目标</div>
          <div class="metric-value">{{ formatMoney(dashboardData.remainingAmount) }}</div>
        </div>
      </div>

      <!-- 负债卡片 -->
      <div class="debt-row" v-if="Number(dashboardData.debtAmount) > 0">
        <div class="debt-item glass-card">
          <div class="debt-label">总资产</div>
          <div class="debt-value up">{{ formatMoney(dashboardData.assetAmount) }}</div>
        </div>
        <div class="debt-item glass-card">
          <div class="debt-label">总负债</div>
          <div class="debt-value down">{{ formatMoney(dashboardData.debtAmount) }}</div>
        </div>
        <div class="debt-item glass-card">
          <div class="debt-label">净资产</div>
          <div class="debt-value primary">{{ formatMoney(dashboardData.netAssetAmount) }}</div>
        </div>
      </div>

      <!-- 年度目标进度 -->
      <div class="chart-card glass-card progress-section">
        <div class="chart-card-title">年度目标进度</div>
        <div class="custom-progress">
          <div class="custom-progress-track">
            <div class="custom-progress-fill" :style="{ width: Math.min(dashboardData.completionRate, 100) + '%', background: progressGradient }"></div>
          </div>
          <div class="custom-progress-info">
            <span class="custom-progress-rate">{{ dashboardData.completionRate }}%</span>
            <span class="custom-progress-date">最新快照：{{ dashboardData.latestSnapshotDate || '暂无' }}</span>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-grid">
        <div class="chart-card glass-card">
          <div class="chart-card-title">资产趋势</div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card glass-card">
          <div class="chart-card-title">资产类型分布</div>
          <div ref="assetTypeChartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card glass-card">
          <div class="chart-card-title">账户余额</div>
          <div ref="accountChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card glass-card">
          <div class="chart-card-title">风险等级分布</div>
          <div ref="riskChartRef" class="chart-container"></div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card glass-card chart-card--half">
          <div class="chart-card-title">所有人资产分布</div>
          <div ref="ownerChartRef" class="chart-container"></div>
        </div>
        <div class="chart-card--spacer"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboard } from '../api'

const selectedYear = ref(new Date().getFullYear())
const years = ref([])
const dashboardData = ref(null)

const trendChartRef = ref(null)
const assetTypeChartRef = ref(null)
const accountChartRef = ref(null)
const riskChartRef = ref(null)
const ownerChartRef = ref(null)
let trendChart = null
let assetTypeChart = null
let accountChart = null
let riskChart = null
let ownerChart = null

const progressGradient = computed(() => {
  const rate = dashboardData.value?.completionRate || 0
  if (rate >= 100) return 'linear-gradient(90deg, #67C23A, #95D475)'
  if (rate >= 50) return 'linear-gradient(90deg, #409EFF, #6BCBFF)'
  return 'linear-gradient(90deg, #E6A23C, #F3D19E)'
})

function formatMoney(val) {
  if (val === null || val === undefined) return '--'
  const num = Number(val)
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initYears() {
  const current = new Date().getFullYear()
  for (let y = current - 3; y <= current + 3; y++) {
    years.value.push(y)
  }
}

async function loadDashboard() {
  try {
    const res = await getDashboard(selectedYear.value)
    dashboardData.value = res.data
    await nextTick()
    renderCharts()
  } catch {
    dashboardData.value = null
  }
}

function renderCharts() {
  renderTrendChart()
  renderAssetTypeChart()
  renderAccountChart()
  renderRiskChart()
  renderOwnerChart()
}

const softColors = ['#409EFF', '#67C23A', '#7C6FF7', '#E6A23C', '#F56C6C', '#36CFC9', '#FF85C0', '#B37FEB']

const glassTooltip = {
  backgroundColor: 'rgba(255,255,255,0.75)',
  borderColor: 'rgba(255,255,255,0.5)',
  textStyle: { color: '#4E5969', fontSize: 13 },
  extraCssText: 'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,.08);border-radius:10px;',
}

function renderTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  const isMobile = window.innerWidth <= 768
  const data = dashboardData.value?.trend || []
  const option = {
    tooltip: { trigger: 'axis', ...glassTooltip },
    grid: { left: isMobile ? 40 : 60, right: isMobile ? 10 : 30, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.snapshotDate),
      axisLabel: { color: '#86909C', rotate: 30, fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#86909C', formatter: (v) => (v / 10000).toFixed(0) + '万', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'line',
      data: data.map(d => Number(d.amount)),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64,158,255,.18)' },
          { offset: 1, color: 'rgba(64,158,255,0)' },
        ]),
      },
      lineStyle: { width: 2.5, color: '#409EFF' },
      itemStyle: { color: '#409EFF', borderColor: '#fff', borderWidth: 2 },
    }],
  }
  trendChart.setOption(option)
}

function renderAssetTypeChart() {
  if (!assetTypeChartRef.value) return
  if (!assetTypeChart) assetTypeChart = echarts.init(assetTypeChartRef.value)
  const data = dashboardData.value?.assetTypeDistribution || []
  const option = {
    tooltip: { trigger: 'item', ...glassTooltip, formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#86909C', fontSize: 12 }, itemGap: 16 },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '43%'],
      data: data.map((d, i) => ({ name: d.name, value: Number(d.amount), itemStyle: { color: softColors[i % softColors.length] } })),
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#86909C' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,.1)' } },
    }],
  }
  assetTypeChart.setOption(option)
}

function renderAccountChart() {
  if (!accountChartRef.value) return
  if (!accountChart) accountChart = echarts.init(accountChartRef.value)
  const isMobile = window.innerWidth <= 768
  const data = dashboardData.value?.accountDistribution || []
  const option = {
    tooltip: { trigger: 'axis', ...glassTooltip },
    grid: { left: isMobile ? 50 : 100, right: isMobile ? 10 : 30, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#86909C', formatter: (v) => (v / 10000).toFixed(0) + '万', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.04)', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      inverse: true,
      axisLabel: { color: '#4E5969', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.map(d => Number(d.amount)),
      barMaxWidth: 24,
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#6BCBFF' },
        ]),
      },
      label: { show: true, position: 'right', color: '#4E5969', fontSize: 12, formatter: (p) => (p.value / 10000).toFixed(1) + '万' },
    }],
  }
  accountChart.setOption(option)
}

function renderRiskChart() {
  if (!riskChartRef.value) return
  if (!riskChart) riskChart = echarts.init(riskChartRef.value)
  const data = dashboardData.value?.riskDistribution || []
  const levelMap = { LOW: '低风险', MEDIUM: '中风险', HIGH: '高风险', NONE: '无风险' }
  const colorMap = { LOW: '#67C23A', MEDIUM: '#E6A23C', HIGH: '#F56C6C', NONE: '#C9CDD4' }
  const option = {
    tooltip: { trigger: 'item', ...glassTooltip, formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: '68%',
      center: ['50%', '50%'],
      data: data.map(d => ({
        name: levelMap[d.riskLevel] || d.riskLevel,
        value: Number(d.amount),
        itemStyle: { color: colorMap[d.riskLevel] || '#C9CDD4' },
      })),
      label: { show: true, formatter: '{b}: {d}%', fontSize: 11, color: '#86909C' },
    }],
  }
  riskChart.setOption(option)
}

function renderOwnerChart() {
  if (!ownerChartRef.value) return
  if (!ownerChart) ownerChart = echarts.init(ownerChartRef.value)
  const data = dashboardData.value?.ownerDistribution || []
  const option = {
    tooltip: { trigger: 'item', ...glassTooltip, formatter: '{b}: ¥{c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: '68%',
      center: ['50%', '50%'],
      data: data.map((d, i) => ({ name: d.name, value: Number(d.amount), itemStyle: { color: softColors[i % softColors.length] } })),
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#86909C' },
    }],
  }
  ownerChart.setOption(option)
}

function resizeCharts() {
  trendChart?.resize()
  assetTypeChart?.resize()
  accountChart?.resize()
  riskChart?.resize()
  ownerChart?.resize()
}

onMounted(() => {
  initYears()
  loadDashboard()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChart?.dispose()
  assetTypeChart?.dispose()
  accountChart?.dispose()
  riskChart?.dispose()
  ownerChart?.dispose()
})
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.dashboard-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1D2129;
}
.empty-state {
  margin-top: 80px;
}

/* 资产净值卡片 */
.net-asset-card {
  padding: 28px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 12px 40px rgba(64,158,255,.2);
}
.net-asset-label {
  font-size: 14px;
  opacity: .9;
  margin-bottom: 6px;
}
.net-asset-value {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -.5px;
}
.net-asset-side {
  text-align: right;
}
.net-asset-side-label {
  font-size: 13px;
  opacity: .85;
  margin-bottom: 4px;
}
.net-asset-side-value {
  font-size: 22px;
  font-weight: 700;
}
.net-asset-side-value.up { color: #C6FFA8; }
.net-asset-side-value.down { color: #FFD0A8; }

/* 指标卡片 */
.metric-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.metric-card {
  flex: 1;
  padding: 20px 24px;
}
.metric-card--blue { border-left: 3px solid rgba(64, 158, 255, 0.5); }
.metric-card--warn { border-left: 3px solid rgba(230, 162, 60, 0.5); }
.metric-card--success { border-left: 3px solid rgba(103, 194, 58, 0.5); }
.metric-label {
  font-size: 13px;
  color: #86909C;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #1D2129;
}

/* 负债行 */
.debt-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.debt-item {
  flex: 1;
  padding: 20px 24px;
  text-align: center;
}
.debt-label {
  font-size: 13px;
  color: #86909C;
  margin-bottom: 6px;
}
.debt-value {
  font-size: 24px;
  font-weight: 700;
}
.debt-value.up { color: #67C23A; }
.debt-value.down { color: #F56C6C; }
.debt-value.primary { color: #409EFF; }

/* 进度条 */
.progress-section {
  margin-bottom: 16px;
  padding: 24px;
}
.custom-progress-track {
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}
.custom-progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width .6s ease;
}
.custom-progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}
.custom-progress-rate {
  color: #409EFF;
  font-weight: 700;
}
.custom-progress-date {
  color: #86909C;
}

/* 图表卡片 */
.charts-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.chart-card {
  flex: 1;
  padding: 24px;
}
.chart-card--half {
  flex: 1;
  max-width: 50%;
}
.chart-card--spacer {
  flex: 1;
  max-width: 50%;
}
.chart-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 16px;
}
.chart-container {
  width: 100%;
  height: 320px;
}

/* ========== 移动端适配 ========== */
@media (max-width: 768px) {
  .dashboard-header {
    margin-bottom: 16px;
  }
  .dashboard-header h2 {
    font-size: 18px;
  }

  /* 资产净值卡片 */
  .net-asset-card {
    padding: 20px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .net-asset-value {
    font-size: 28px;
  }
  .net-asset-side {
    text-align: left;
  }
  .net-asset-side-value {
    font-size: 18px;
  }

  /* 指标卡片 — 列排 */
  .metric-cards {
    flex-direction: column;
    gap: 12px;
  }
  .metric-card {
    padding: 16px 20px;
  }
  .metric-value {
    font-size: 20px;
  }

  /* 负债行 — 列排 */
  .debt-row {
    flex-direction: column;
    gap: 12px;
  }
  .debt-item {
    padding: 16px 20px;
    text-align: left;
  }
  .debt-value {
    font-size: 20px;
  }

  /* 图表区域 — 单列 */
  .charts-grid {
    flex-direction: column;
    gap: 12px;
  }
  .chart-card {
    padding: 16px;
  }
  .chart-card--half {
    max-width: 100%;
  }
  .chart-card--spacer {
    display: none;
  }
  .chart-container {
    height: 240px;
  }
  .chart-card-title {
    font-size: 15px;
    margin-bottom: 12px;
  }
}
</style>
