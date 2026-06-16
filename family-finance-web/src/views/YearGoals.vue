<template>
  <div class="year-goals">
    <div class="page-header">
      <h2>年度目标</h2>
      <div class="header-actions">
        <el-select v-model="selectedOwner" placeholder="全部所有人" clearable style="width: 160px" @change="fetchList">
          <el-option v-for="o in ownerOptions" :key="o.id" :label="o.displayName || o.name" :value="o.id" />
        </el-select>
        <el-button type="primary" @click="openDialog()">新增目标</el-button>
      </div>
    </div>

    <!-- 进度概览卡片 -->
    <div class="goal-progress-card glass-card glass-card--hero-green" v-if="activeGoal">
      <div class="goal-progress-top">
        <div class="goal-progress-left">
          <div class="goal-year-badge">{{ activeGoal.year }}{{ activeGoal.ownerName ? ' · ' + activeGoal.ownerName : '' }}</div>
          <div class="goal-target-label">年度目标</div>
          <div class="goal-target-value">{{ formatMoney(activeGoal.targetAmount) }}</div>
        </div>
        <div class="goal-progress-right">
          <div class="goal-ring">
            <svg viewBox="0 0 100 100" class="goal-ring-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#E8F3E8" stroke-width="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#goalGrad)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 42"
                :stroke-dashoffset="2 * Math.PI * 42 * (1 - Math.min(goalPercent / 100, 1))"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#67C23A" />
                  <stop offset="100%" stop-color="#95D475" />
                </linearGradient>
              </defs>
            </svg>
            <div class="goal-ring-text">{{ goalPercent }}%</div>
          </div>
        </div>
      </div>
      <div class="goal-progress-info">
        <div class="goal-progress-item">
          <span class="goal-progress-dot done"></span>
          已完成 {{ formatMoney(activeGoal.currentAmount) }}
        </div>
        <div class="goal-progress-item">
          <span class="goal-progress-dot remain"></span>
          还差 {{ formatMoney(activeGoal.remaining) }}
        </div>
      </div>
    </div>

    <!-- 年度目标卡片列表 -->
    <div class="goal-cards" v-if="list.length > 0">
      <div v-for="item in list" :key="item.id" class="goal-card glass-card">
        <div class="goal-card-header">
          <div class="goal-card-year">{{ item.year }}年目标<span v-if="item.owner" class="goal-card-owner"> · {{ item.owner.displayName || item.owner.name }}</span></div>
          <div class="goal-card-actions">
            <el-button link type="primary" @click="openDialog(item)">编辑</el-button>
            <el-popconfirm title="确定删除？" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(item.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <div class="goal-card-body">
          <div class="goal-card-field">
            <span class="goal-card-label">目标金额</span>
            <span class="goal-card-value highlight">{{ formatMoney(item.targetAmount) }}</span>
          </div>
          <div class="goal-card-field">
            <span class="goal-card-label">年初资产</span>
            <span class="goal-card-value">{{ formatMoney(item.startAmount) }}</span>
          </div>
          <div class="goal-card-field" v-if="item.remark">
            <span class="goal-card-label">备注</span>
            <span class="goal-card-remark">{{ item.remark }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state" v-loading="loading">
      <el-empty description="暂无年度目标" />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="isEdit ? '编辑年度目标' : '新增年度目标'"
      v-model="dialogVisible"
      width="480px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="年份" prop="year">
          <el-input-number v-model="form.year" :min="2020" :max="2099" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="所有人" prop="ownerId">
          <el-select v-model="form.ownerId" placeholder="请选择所有人" style="width: 100%">
            <el-option v-for="o in ownerOptions" :key="o.id" :label="o.displayName || o.name" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年初资产" prop="startAmount">
          <el-input-number v-model="form.startAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="年度目标金额" prop="targetAmount">
          <el-input-number v-model="form.targetAmount" :min="0" :precision="2" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" maxlength="255" />
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
import { getYearGoals, createYearGoal, updateYearGoal, deleteYearGoal, getOwnerOptions } from '../api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({ year: null, ownerId: '', targetAmount: null, startAmount: 0, remark: '' })
const rules = {
  year: [{ required: true, message: '请输入年份', trigger: 'blur' }],
  ownerId: [{ required: true, message: '请选择所有人', trigger: 'change' }],
  targetAmount: [{ required: true, message: '请输入目标金额', trigger: 'blur' }],
}

const selectedOwner = ref('')
const ownerOptions = ref([])

// 当前激活目标（取当前年份或最近年份）
const activeGoal = computed(() => {
  if (list.value.length === 0) return null
  const currentYear = new Date().getFullYear()
  const current = list.value.find(g => g.year === currentYear)
  if (current) {
    const target = Number(current.targetAmount) || 1
    const currentAmount = 0 // 由 dashboard 提供，此处为静态
    return {
      year: currentYear,
      ownerName: current.owner?.displayName || current.owner?.name || '',
      targetAmount: current.targetAmount,
      startAmount: current.startAmount,
      currentAmount: currentAmount,
      remaining: Math.max(target - currentAmount, 0),
    }
  }
  // fallback to latest year
  const latest = [...list.value].sort((a, b) => b.year - a.year)[0]
  const target = Number(latest.targetAmount) || 1
  return {
    year: latest.year,
    ownerName: latest.owner?.displayName || latest.owner?.name || '',
    targetAmount: latest.targetAmount,
    startAmount: latest.startAmount,
    currentAmount: 0,
    remaining: target,
  }
})

const goalPercent = computed(() => {
  if (!activeGoal.value) return 0
  const target = Number(activeGoal.value.targetAmount) || 1
  const current = Number(activeGoal.value.currentAmount) || 0
  return Math.min(Math.round((current / target) * 100), 100)
})

function formatMoney(val) {
  if (val === null || val === undefined) return '--'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getYearGoals(selectedOwner.value || undefined)
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

async function loadOwnerOptions() {
  try {
    const res = await getOwnerOptions()
    ownerOptions.value = res.data || []
  } catch {
    ownerOptions.value = []
  }
}

function openDialog(row) {
  if (row) {
    isEdit.value = true
    form.value = {
      id: row.id,
      year: row.year,
      ownerId: row.ownerId?.toString() || '',
      targetAmount: Number(row.targetAmount),
      startAmount: Number(row.startAmount),
      remark: row.remark || '',
    }
  } else {
    isEdit.value = false
    form.value = { year: null, ownerId: selectedOwner.value || '', targetAmount: null, startAmount: 0, remark: '' }
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
      year: form.value.year,
      ownerId: form.value.ownerId,
      targetAmount: form.value.targetAmount,
      startAmount: form.value.startAmount,
      remark: form.value.remark,
    }
    if (isEdit.value) {
      await updateYearGoal(form.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await createYearGoal(data)
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
    await deleteYearGoal(id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch { /* handled */ }
}

onMounted(() => {
  loadOwnerOptions()
  fetchList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1D2129;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 进度概览卡片 — glass-card--hero-green 提供基础样式 */
.goal-progress-card {
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: 0 12px 40px rgba(103,194,58,.2);
}
.goal-progress-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.goal-year-badge {
  display: inline-block;
  background: rgba(255,255,255,.2);
  border-radius: 8px;
  padding: 3px 12px;
  font-size: 13px;
  margin-bottom: 8px;
}
.goal-target-label {
  font-size: 14px;
  opacity: .9;
  margin-bottom: 4px;
}
.goal-target-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -.5px;
}
.goal-ring {
  position: relative;
  width: 90px;
  height: 90px;
}
.goal-ring-svg {
  width: 100%;
  height: 100%;
}
.goal-ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  font-weight: 700;
}
.goal-progress-info {
  display: flex;
  gap: 24px;
}
.goal-progress-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  opacity: .95;
}
.goal-progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.goal-progress-dot.done { background: #C6FFA8; }
.goal-progress-dot.remain { background: rgba(255,255,255,.5); }

/* 目标卡片列表 */
.goal-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.goal-card {
  padding: 20px 24px;
}
.goal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.goal-card-year {
  font-size: 16px;
  font-weight: 600;
  color: #1D2129;
}
.goal-card-owner {
  font-size: 13px;
  font-weight: 400;
  color: #86909C;
}
.goal-card-body {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.goal-card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.goal-card-label {
  font-size: 12px;
  color: #86909C;
}
.goal-card-value {
  font-size: 18px;
  font-weight: 700;
  color: #1D2129;
}
.goal-card-value.highlight {
  color: #67C23A;
}
.goal-card-remark {
  font-size: 14px;
  color: #4E5969;
}

.empty-state {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .goal-progress-card {
    padding: 20px 16px;
    border-radius: 14px;
  }
  .goal-progress-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .goal-target-value {
    font-size: 24px;
  }
  .goal-ring {
    width: 70px;
    height: 70px;
  }
  .goal-ring-text {
    font-size: 16px;
  }
  .goal-progress-info {
    flex-direction: column;
    gap: 8px;
  }
  .goal-card {
    padding: 16px;
  }
  .goal-card-body {
    gap: 16px;
  }
  .goal-card-value {
    font-size: 16px;
  }
}
</style>
