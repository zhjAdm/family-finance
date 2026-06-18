<template>
  <div class="gold-records">
    <div class="page-header">
      <h2>攒金记录</h2>
      <div class="page-header-actions">
        <el-button @click="handleFetchPrice" :loading="fetchingPrice" :icon="Refresh" circle title="更新金价" />
        <el-button @click="settingsVisible = true" :icon="Setting" circle title="设置" />
        <el-button type="primary" @click="openDialog()">新增记录</el-button>
      </div>
    </div>

    <!-- 汇总卡片 -->
    <div class="gold-summary glass-card glass-card--gold" v-if="summary">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">总克重</span>
          <span class="summary-value">{{ formatWeight(summary.totalWeight) }}<small>g</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-label">总投入</span>
          <span class="summary-value">{{ formatMoney(summary.totalAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">均价</span>
          <span class="summary-value">{{ formatMoney(summary.avgPrice) }}<small>/g</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-label">笔数</span>
          <span class="summary-value">{{ summary.count }}</span>
        </div>
      </div>
      <div class="summary-market" v-if="summary.currentPrice">
        <div class="summary-item">
          <span class="summary-label">当前金价</span>
          <span class="summary-value summary-value--price">{{ formatMoney(summary.currentPrice) }}<small>/g</small></span>
        </div>
        <div class="summary-item">
          <span class="summary-label">当前市值</span>
          <span class="summary-value">{{ formatMoney(summary.marketValue) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">收益</span>
          <span class="summary-value" :class="summary.profit >= 0 ? 'profit-up' : 'profit-down'">
            {{ summary.profit >= 0 ? '+' : '' }}{{ formatMoney(summary.profit) }}
          </span>
        </div>
        <div class="summary-item summary-item--hint">
          <span class="summary-label">更新时间</span>
          <span class="summary-hint">{{ formatDateTime(summary.priceUpdatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 记录列表 -->
    <div v-loading="loading" class="gold-list">
      <div v-for="item in list" :key="item.id" class="gold-card glass-card">
        <div class="gold-card-body">
          <div class="gold-card-left">
            <div class="gold-price-badge">{{ formatMoney(item.pricePerGram) }}元/克</div>
            <div class="gold-channel-name">{{ item.channel }}<span v-if="item.remark" class="gold-remark-inline"> · {{ item.remark }}</span></div>
            <div class="gold-weight-amount">
              <span class="gold-dot-icon"></span>
              {{ formatWeight(item.weightGrams) }}克 {{ formatMoney(item.purchaseAmount) }}元
            </div>
          </div>
          <div class="gold-card-right">
            <div class="gold-date">{{ formatDateDot(item.purchaseDate) }}</div>
            <div class="gold-profit" v-if="summary && summary.currentPrice" :class="getProfit(item) >= 0 ? 'profit-up' : 'profit-down'">
              收益：{{ getProfit(item) >= 0 ? '+' : '' }}{{ formatMoney(getProfit(item)) }}
            </div>
          </div>
        </div>
        <div class="gold-card-actions">
          <el-button link type="primary" size="small" @click="openDialog(item)">编辑</el-button>
          <el-popconfirm title="确定删除？" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(item.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
      <el-empty v-if="!loading && list.length === 0" description="暂无攒金记录" />
    </div>

    <!-- 设置弹窗 -->
    <el-dialog title="攒金设置" v-model="settingsVisible" width="440px">
      <el-form label-width="110px">
        <el-form-item label="金价API Token">
          <el-input v-model="apiToken" placeholder="请输入 istero.com 的 API Token" clearable />
        </el-form-item>
        <el-form-item>
          <div class="settings-hint">
            前往 <a href="https://api.istero.com" target="_blank">api.istero.com</a> 获取 Token，用于获取每日 AU9999 金价
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveToken" :loading="savingToken">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑记录' : '新增记录'"
      v-model="dialogVisible"
      width="460px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="购买日期" prop="purchaseDate">
          <el-date-picker
            v-model="form.purchaseDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="购买渠道" prop="channel">
          <el-input v-model="form.channel" placeholder="如：银行、金店、电商" maxlength="100" />
        </el-form-item>
        <el-form-item label="克重" prop="weightGrams">
          <el-input-number v-model="form.weightGrams" :min="0" :precision="4" :step="1" controls-position="right" style="width: 100%" @change="calcPrice" />
        </el-form-item>
        <el-form-item label="购买金额" prop="purchaseAmount">
          <el-input-number v-model="form.purchaseAmount" :min="0" :precision="2" :step="100" controls-position="right" style="width: 100%" @change="calcPrice" />
        </el-form-item>
        <el-form-item label="克重单价">
          <div class="calc-price">{{ calcDisplayPrice }}</div>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" maxlength="255" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Refresh } from '@element-plus/icons-vue'
import { getGolds, getGoldsSummary, createGold, updateGold, deleteGold, fetchGoldPrice, getConfig, setConfig } from '../api'

const list = ref([])
const summary = ref(null)
const loading = ref(false)

const settingsVisible = ref(false)
const apiToken = ref('')
const savingToken = ref(false)
const fetchingPrice = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  purchaseDate: '',
  channel: '',
  weightGrams: null,
  purchaseAmount: null,
  remark: '',
})

const rules = {
  purchaseDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  channel: [{ required: true, message: '请输入购买渠道', trigger: 'blur' }],
  weightGrams: [{ required: true, message: '请输入克重', trigger: 'blur' }],
  purchaseAmount: [{ required: true, message: '请输入购买金额', trigger: 'blur' }],
}

const calcDisplayPrice = computed(() => {
  const w = Number(form.value.weightGrams) || 0
  const a = Number(form.value.purchaseAmount) || 0
  if (w <= 0) return '-- 元/克'
  return (a / w).toFixed(2) + ' 元/克'
})

function calcPrice() {}

function formatDate(val) {
  if (!val) return ''
  return String(val).slice(0, 10)
}

function formatDateDot(val) {
  if (!val) return ''
  return String(val).slice(0, 10).replace(/-/g, '.')
}

function formatDateTime(val) {
  if (!val) return '未更新'
  try {
    const d = new Date(val)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return val
  }
}

function formatMoney(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatWeight(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toFixed(2)
}

function getProfit(item) {
  if (!summary.value?.currentPrice) return 0
  const marketValue = summary.value.currentPrice * Number(item.weightGrams)
  return Math.round((marketValue - Number(item.purchaseAmount)) * 100) / 100
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getGolds()
    list.value = res.data || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function fetchSummary() {
  try {
    const res = await getGoldsSummary()
    summary.value = res.data || null
  } catch {
    summary.value = null
  }
}

async function fetchData() {
  await Promise.all([fetchList(), fetchSummary()])
}

async function loadToken() {
  try {
    const res = await getConfig('gold_api_token')
    apiToken.value = res.data || ''
  } catch {
    apiToken.value = ''
  }
}

async function handleSaveToken() {
  savingToken.value = true
  try {
    await setConfig('gold_api_token', apiToken.value)
    ElMessage.success('Token 保存成功')
    settingsVisible.value = false
  } finally {
    savingToken.value = false
  }
}

async function handleFetchPrice() {
  fetchingPrice.value = true
  try {
    await fetchGoldPrice()
    ElMessage.success('金价更新成功')
    await fetchSummary()
  } catch (err) {
    // error already shown by interceptor
  } finally {
    fetchingPrice.value = false
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function openDialog(row) {
  if (row) {
    isEdit.value = true
    editingId.value = row.id
    form.value = {
      purchaseDate: formatDate(row.purchaseDate),
      channel: row.channel,
      weightGrams: Number(row.weightGrams),
      purchaseAmount: Number(row.purchaseAmount),
      remark: row.remark || '',
    }
  } else {
    isEdit.value = false
    editingId.value = null
    form.value = {
      purchaseDate: today(),
      channel: '',
      weightGrams: null,
      purchaseAmount: null,
      remark: '',
    }
  }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = {
      purchaseDate: form.value.purchaseDate,
      channel: form.value.channel,
      weightGrams: form.value.weightGrams,
      purchaseAmount: form.value.purchaseAmount,
      remark: form.value.remark,
    }
    if (isEdit.value) {
      await updateGold(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createGold(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchData()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteGold(id)
    ElMessage.success('删除成功')
    await fetchData()
  } catch { /* handled */ }
}

onMounted(() => {
  fetchData()
  loadToken()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1D2129;
}
.page-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 汇总卡片 — 金色主题 */
.glass-card--gold {
  background: linear-gradient(135deg, #FFF8E1, #FFECB3);
  border: 1px solid rgba(255, 179, 0, 0.2);
  padding: 24px 28px;
  margin-bottom: 20px;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
}
.summary-market {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(141, 110, 0, 0.15);
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.summary-item--hint {
  text-align: right;
}
.summary-label {
  font-size: 12px;
  color: #8D6E00;
  font-weight: 500;
}
.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: #5D4600;
}
.summary-value small {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
}
.summary-value--price {
  color: #B8860B;
}
.summary-hint {
  font-size: 12px;
  color: #8D6E00;
  opacity: 0.7;
}
.profit-up { color: #558B2F; }
.profit-down { color: #C62828; }

/* 记录列表 */
.gold-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.gold-card {
  padding: 16px 20px;
}
.gold-card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.gold-card-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.gold-price-badge {
  display: inline-block;
  background: linear-gradient(135deg, #FFD54F, #FFB300);
  color: #5D4600;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 4px;
  align-self: flex-start;
}
.gold-channel-name {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}
.gold-remark-inline {
  font-weight: 400;
}
.gold-weight-amount {
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}
.gold-dot-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFD54F, #FFB300);
  flex-shrink: 0;
}
.gold-card-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16px;
  padding-top: 4px;
}
.gold-date {
  font-size: 13px;
  color: #909399;
}
.gold-profit {
  font-size: 14px;
  font-weight: 700;
  margin-top: 4px;
}
.profit-up { color: #558B2F; }
.profit-down { color: #C62828; }
.gold-card-actions {
  margin-top: 8px;
  border-top: 1px solid #F0F0F0;
  display: flex;
  gap: 12px;
}
.gold-card-actions .el-button {
  font-size: 12px;
}

/* 设置弹窗 */
.settings-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
.settings-hint a {
  color: #409EFF;
  text-decoration: none;
}

/* 计算单价 */
.calc-price {
  font-size: 16px;
  font-weight: 600;
  color: #B8860B;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .summary-grid,
  .summary-market {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .gold-card {
    padding: 12px 14px;
  }
}
</style>

<style>
.gold-records .page-header-actions .el-button {
  height: 30px;
  padding: 0 14px;
  font-size: 13px;
}
.gold-records .page-header-actions .el-button.is-circle {
  width: 30px;
  padding: 0;
}
</style>
