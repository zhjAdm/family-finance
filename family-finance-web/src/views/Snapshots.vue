<template>
  <div class="snapshots">
    <div class="page-header">
      <h2>资产快照</h2>
      <div class="header-actions">
        <div class="view-toggle">
          <button :class="{ active: activeTab === 'latest' }" @click="switchTab('latest')">最新记录</button>
          <button :class="{ active: activeTab === 'history' }" @click="switchTab('history')">历史快照</button>
        </div>
        <el-button type="primary" @click="openAddDialog">新增记录</el-button>
      </div>
    </div>

    <!-- 记录列表 -->
    <div v-loading="loading" class="item-list">
      <div v-for="row in list" :key="row.id" class="item-card" :class="{ 'item-card--debt': row._debt }">
        <div class="item-main">
          <div class="item-left">
            <div class="record-icon" :style="{ background: iconBg(row._debt) }">
              <el-icon :size="16"><Wallet /></el-icon>
            </div>
            <div class="item-info">
              <div class="item-title">{{ getAccountName(row.accountId) }}</div>
              <div class="item-meta">
                <span class="meta-tag date-tag">{{ row.snapshotDate }}</span>
                <span class="meta-tag">{{ getOwnerName(row.ownerId) }}</span>
                <span class="meta-tag">{{ getAssetTypeName(row.assetTypeId) }}</span>
              </div>
            </div>
          </div>
          <div class="item-amount" :class="{ 'amount-debt': row._debt }">
            {{ row._calculated }}
          </div>
        </div>
        <div v-if="row.remark" class="item-remark">{{ row.remark }}</div>
        <div class="item-actions">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-popconfirm title="确定删除这条记录？" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
      <el-empty v-if="!loading && list.length === 0" description="暂无快照记录" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑记录' : '新增记录'"
      v-model="dialogVisible"
      width="460px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="日期" prop="snapshotDate">
          <el-date-picker
            v-model="form.snapshotDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="所有人" prop="ownerId">
          <el-select v-model="form.ownerId" placeholder="选择所有人" @change="onOwnerChange" style="width: 100%">
            <el-option v-for="o in ownerOptions" :key="o.id" :label="o.name" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户" prop="accountId">
          <el-select v-model="form.accountId" placeholder="选择账户" @change="onAccountChange" style="width: 100%">
            <el-option v-for="a in getAccountOpts(form.ownerId)" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资产类型" prop="assetTypeId">
          <el-select v-model="form.assetTypeId" placeholder="选择资产类型" style="width: 100%">
            <el-option v-for="t in assetTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Wallet } from '@element-plus/icons-vue'
import {
  getSnapshots, createSnapshot, updateSnapshot, deleteSnapshot,
  getOwnerOptions, getAccountOptions, getAssetTypeOptions,
} from '../api'

const list = ref([])
const loading = ref(false)
const activeTab = ref('latest')

function switchTab(tab) {
  activeTab.value = tab
  fetchList()
}

// 下拉选项
const ownerOptions = ref([])
const accountOptions = ref([])
const assetTypeOptions = ref([])

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  snapshotDate: '', ownerId: null, accountId: null,
  assetTypeId: null, amount: null, remark: '',
})
const rules = {
  snapshotDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  ownerId: [{ required: true, message: '请选择所有人', trigger: 'change' }],
  accountId: [{ required: true, message: '请选择账户', trigger: 'change' }],
  assetTypeId: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function normalizeDate(val) {
  if (!val) return ''
  const str = String(val)
  return str.slice(0, 10)
}

function formatMoney(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getOwnerName(id) {
  return ownerOptions.value.find(o => o.id === id)?.name || ''
}
function getAccountName(id) {
  return accountOptions.value.find(a => a.id === id)?.name || ''
}
function getAssetTypeName(id) {
  return assetTypeOptions.value.find(t => t.id === id)?.name || ''
}

function iconBg(isDebt) {
  return isDebt
    ? 'linear-gradient(135deg, #F56C6C, #FF8A80)'
    : 'linear-gradient(135deg, #409EFF, #6BCBFF)'
}

function getAccountOpts(ownerId) {
  if (!ownerId) return accountOptions.value
  return accountOptions.value.filter(a => a.ownerId === ownerId)
}

function getDebtFlag(assetTypeId) {
  const t = assetTypeOptions.value.find(t => t.id === assetTypeId)
  return t?.direction === 'DEBT'
}

function calcAmount(amount, isDebt) {
  if (amount == null) return 0
  return isDebt ? -Math.abs(amount) : Math.abs(amount)
}

async function loadOptions() {
  const [owners, accounts, assetTypes] = await Promise.all([
    getOwnerOptions(), getAccountOptions(), getAssetTypeOptions(),
  ])
  ownerOptions.value = owners.data || []
  accountOptions.value = accounts.data || []
  assetTypeOptions.value = assetTypes.data || []
}

async function fetchList() {
  loading.value = true
  try {
    const params = activeTab.value === 'latest' ? { latest: 'true' } : { latest: 'exclude' }
    const res = await getSnapshots(params)
    const data = res.data || []
    // 按日期倒序
    data.sort((a, b) => normalizeDate(b.snapshotDate).localeCompare(normalizeDate(a.snapshotDate)))
    list.value = data.map(s => {
      const isDebt = getDebtFlag(s.assetTypeId)
      return {
        id: s.id,
        snapshotDate: normalizeDate(s.snapshotDate),
        ownerId: s.ownerId,
        accountId: s.accountId,
        assetTypeId: s.assetTypeId,
        amount: Number(s.amount),
        _debt: isDebt,
        _calculated: formatMoney(calcAmount(s.amount, isDebt)),
        remark: s.remark || '',
      }
    })
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = null
  form.value = {
    snapshotDate: formatDate(new Date()),
    ownerId: null, accountId: null,
    assetTypeId: null, amount: null, remark: '',
  }
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    snapshotDate: normalizeDate(row.snapshotDate),
    ownerId: row.ownerId,
    accountId: row.accountId,
    assetTypeId: row.assetTypeId,
    amount: row.amount,
    remark: row.remark,
  }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
}

function onOwnerChange() {
  form.value.accountId = null
}

function onAccountChange() {
  const account = accountOptions.value.find(a => a.id === form.value.accountId)
  if (account?.defaultAssetTypeId) {
    form.value.assetTypeId = account.defaultAssetTypeId
  }
}

// 检查重复：同日期+所有人+账户+资产类型
function findDuplicate() {
  const formDate = normalizeDate(form.value.snapshotDate)
  return list.value.find(r =>
    normalizeDate(r.snapshotDate) === formDate &&
    r.ownerId === form.value.ownerId &&
    r.accountId === form.value.accountId &&
    r.assetTypeId === form.value.assetTypeId
  )
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  // 检查重复（排除编辑中的自身）
  const dup = findDuplicate()
  if (dup && (!isEdit.value || dup.id !== editingId.value)) {
    try {
      await ElMessageBox.confirm(
        `该组合（${form.value.snapshotDate} / ${getOwnerName(form.value.ownerId)} / ${getAccountName(form.value.accountId)} / ${getAssetTypeName(form.value.assetTypeId)}）已存在记录，是否覆盖？`,
        '重复记录',
        { confirmButtonText: '覆盖', cancelButtonText: '取消', type: 'warning' },
      )
      // 覆盖 = 删除旧记录 + 新增
      await deleteSnapshot(dup.id)
    } catch {
      return // 用户取消
    }
  }

  submitting.value = true
  try {
    const data = {
      snapshotDate: form.value.snapshotDate,
      ownerId: form.value.ownerId,
      accountId: form.value.accountId,
      assetTypeId: form.value.assetTypeId,
      amount: form.value.amount,
      remark: form.value.remark,
    }
    if (isEdit.value) {
      await updateSnapshot(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createSnapshot({ snapshotDate: form.value.snapshotDate, items: [data] })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteSnapshot(id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch { /* handled */ }
}

onMounted(() => {
  loadOptions().then(() => fetchList())
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
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.view-toggle {
  display: flex;
  background: #F2F3F5;
  border-radius: 8px;
  padding: 2px;
}
.view-toggle button {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #86909C;
  cursor: pointer;
  transition: all .2s ease;
  font-weight: 500;
  white-space: nowrap;
}
.view-toggle button:hover {
  color: #4E5969;
}
.view-toggle button.active {
  background: #fff;
  color: #1D2129;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
  font-weight: 600;
}

/* 卡片列表 */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid #ebeef5;
  border-radius: 12px;
  transition: box-shadow 0.2s;
}
.item-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.item-card--debt {
  border-left: 3px solid rgba(245, 108, 108, 0.5);
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.record-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.item-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 2px 8px;
  background: #f5f7fa;
  color: #606266;
  border-radius: 6px;
  font-size: 12px;
}
.meta-tag.date-tag {
  background: rgba(64, 158, 255, 0.1);
  color: #337ecc;
}

.item-amount {
  font-size: 18px;
  font-weight: 700;
  color: #67C23A;
  white-space: nowrap;
}
.item-amount.amount-debt {
  color: #F56C6C;
}

.item-remark {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.item-actions {
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 16px;
}

@media (max-width: 768px) {
  .page-header {
    flex-wrap: wrap;
    gap: 10px;
  }
  .page-header h2 {
    font-size: 18px;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  .view-toggle button {
    padding: 5px 12px;
    font-size: 12px;
  }
  .item-card {
    padding: 14px 16px;
  }
  .item-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .item-amount {
    font-size: 16px;
  }
  .record-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
  }
  .item-title {
    font-size: 14px;
  }
}
</style>
