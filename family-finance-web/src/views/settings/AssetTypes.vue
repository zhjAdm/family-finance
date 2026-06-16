<template>
  <div class="settings-page">
    <div class="settings-card glass-card">
      <div class="card-header">
        <h2>资产类型配置</h2>
        <el-button type="primary" @click="openDialog()">新增</el-button>
      </div>

      <div v-loading="loading" class="item-list">
        <div v-for="row in list" :key="row.id" class="item-card">
          <div class="item-main">
            <div class="item-title">
              <span class="status-dot" :class="row.enabled ? 'on' : 'off'" />
              {{ row.name }}
            </div>
            <div class="item-meta">
              <span class="direction-tag" :class="row.direction === 'DEBT' ? 'debt' : 'asset'">
                {{ row.direction === 'DEBT' ? '负债' : '资产' }}
              </span>
              <span class="risk-tag" :class="row.riskLevel?.toLowerCase()">
                {{ riskMap[row.riskLevel] || row.riskLevel }}
              </span>
              <span class="meta-tag">{{ row.includeInTotal ? '计入总资产' : '不计入' }}</span>
              <span class="meta-tag">{{ row.includeInChart ? '图表显示' : '隐藏图表' }}</span>
            </div>
          </div>
          <div class="item-detail">
            <span v-if="row.code" class="detail-item">编码: {{ row.code }}</span>
            <span v-if="row.sort" class="detail-item">排序: {{ row.sort }}</span>
            <span v-if="row.remark" class="detail-item remark">{{ row.remark }}</span>
          </div>
          <div class="item-actions">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link :type="row.enabled ? 'warning' : 'success'" @click="toggleStatus(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-popconfirm title="确定删除？" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        <el-empty v-if="!loading && list.length === 0" description="暂无数据" />
      </div>
    </div>

    <el-dialog
      :title="isEdit ? '编辑资产类型' : '新增资产类型'"
      v-model="dialogVisible"
      width="520px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="50" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" maxlength="50" />
        </el-form-item>
        <el-form-item label="方向" prop="direction">
          <el-select v-model="form.direction" style="width: 100%">
            <el-option label="ASSET - 资产" value="ASSET" />
            <el-option label="DEBT - 负债" value="DEBT" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="form.riskLevel" style="width: 100%">
            <el-option v-for="(label, value) in riskMap" :key="value" :label="value + ' - ' + label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计入总资产" prop="includeInTotal">
          <el-switch v-model="form.includeInTotal" />
        </el-form-item>
        <el-form-item label="图表显示" prop="includeInChart">
          <el-switch v-model="form.includeInChart" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" style="width: 100%" />
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAssetTypes, createAssetType, updateAssetType, deleteAssetType, enableAssetType, disableAssetType } from '../../api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  name: '', code: '', direction: 'ASSET', riskLevel: 'NONE',
  includeInTotal: true, includeInChart: true, sort: 0, remark: '',
})
const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  direction: [{ required: true, message: '请选择方向', trigger: 'change' }],
}

const riskMap = { NONE: '无', LOW: '低', MEDIUM: '中', HIGH: '高' }

async function fetchList() {
  loading.value = true
  try {
    const res = await getAssetTypes()
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

function openDialog(row) {
  if (row) {
    isEdit.value = true
    form.value = {
      id: row.id,
      name: row.name,
      code: row.code,
      direction: row.direction,
      riskLevel: row.riskLevel || 'NONE',
      includeInTotal: row.includeInTotal,
      includeInChart: row.includeInChart,
      sort: row.sort || 0,
      remark: row.remark || '',
    }
  } else {
    isEdit.value = false
    form.value = {
      name: '', code: '', direction: 'ASSET', riskLevel: 'NONE',
      includeInTotal: true, includeInChart: true, sort: 0, remark: '',
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
      name: form.value.name,
      code: form.value.code,
      direction: form.value.direction,
      riskLevel: form.value.riskLevel,
      includeInTotal: form.value.includeInTotal,
      includeInChart: form.value.includeInChart,
      sort: form.value.sort,
      remark: form.value.remark,
    }
    if (isEdit.value) {
      await updateAssetType(form.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await createAssetType(data)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await fetchList()
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row) {
  try {
    if (row.enabled) {
      await disableAssetType(row.id)
    } else {
      await enableAssetType(row.id)
    }
    ElMessage.success('操作成功')
    await fetchList()
  } catch { /* handled */ }
}

async function handleDelete(id) {
  try {
    await deleteAssetType(id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch { /* handled */ }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.settings-page {
  max-width: 900px;
}

.settings-card {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
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

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.item-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 2px 10px;
  background: #f5f7fa;
  color: #606266;
  border-radius: 6px;
  font-size: 12px;
}

.item-detail {
  margin-top: 10px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.detail-item {
  font-size: 12px;
  color: #909399;
}
.detail-item.remark {
  color: #606266;
}

.item-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 16px;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}
.status-dot.on { background: #67C23A; }
.status-dot.off { background: #C0C4CC; }

.direction-tag {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.direction-tag.asset {
  background: rgba(64, 158, 255, 0.12);
  color: #337ecc;
}
.direction-tag.debt {
  background: rgba(245, 108, 108, 0.12);
  color: #c45656;
}

.risk-tag {
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.risk-tag.none { background: #f5f7fa; color: #909399; }
.risk-tag.low { background: rgba(64, 158, 255, 0.12); color: #337ecc; }
.risk-tag.medium { background: rgba(230, 162, 60, 0.12); color: #b88230; }
.risk-tag.high { background: rgba(245, 108, 108, 0.12); color: #c45656; }

@media (max-width: 768px) {
  .settings-page {
    max-width: none;
  }
  .settings-card {
    padding: 16px;
  }
  .card-header {
    margin-bottom: 16px;
  }
  .card-header h2 {
    font-size: 16px;
  }
  .item-card {
    padding: 14px 16px;
  }
  .item-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
