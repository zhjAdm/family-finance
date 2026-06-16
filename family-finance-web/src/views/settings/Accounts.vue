<template>
  <div class="settings-page">
    <div class="settings-card glass-card">
      <div class="card-header">
        <h2>账户配置</h2>
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
              <span v-if="row.owner?.name" class="meta-tag owner">{{ row.owner.name }}</span>
              <span v-if="row.accountCategory" class="meta-tag">{{ categoryMap[row.accountCategory] || row.accountCategory }}</span>
              <span v-if="row.defaultAssetType?.name" class="meta-tag">{{ row.defaultAssetType.name }}</span>
              <span class="meta-tag">{{ row.enabled ? '启用' : '停用' }}</span>
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
      :title="isEdit ? '编辑账户' : '新增账户'"
      v-model="dialogVisible"
      width="520px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="账户编码" prop="code">
          <el-input v-model="form.code" maxlength="100" />
        </el-form-item>
        <el-form-item label="所有人" prop="ownerId">
          <el-select v-model="form.ownerId" placeholder="选择所有人" style="width: 100%">
            <el-option v-for="o in ownerOptions" :key="o.id" :label="o.name" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认资产类型" prop="defaultAssetTypeId">
          <el-select v-model="form.defaultAssetTypeId" placeholder="选择资产类型" clearable style="width: 100%">
            <el-option v-for="t in assetTypeOptions" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户分类" prop="accountCategory">
          <el-select v-model="form.accountCategory" placeholder="选择分类" clearable style="width: 100%">
            <el-option v-for="(label, value) in categoryMap" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计入总资产" prop="includeInTotal">
          <el-switch v-model="form.includeInTotal" />
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
import { getAccounts, createAccount, updateAccount, deleteAccount, enableAccount, disableAccount } from '../../api'
import { getOwnerOptions, getAssetTypeOptions } from '../../api'

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  name: '', code: '', ownerId: null, defaultAssetTypeId: null,
  accountCategory: '', includeInTotal: true, sort: 0, remark: '',
})
const rules = {
  name: [{ required: true, message: '请输入账户名称', trigger: 'blur' }],
  ownerId: [{ required: true, message: '请选择所有人', trigger: 'change' }],
}

const ownerOptions = ref([])
const assetTypeOptions = ref([])

const categoryMap = {
  BANK: '银行', WECHAT: '微信', ALIPAY: '支付宝',
  SECURITY: '证券', FUND: '基金', CASH: '现金', LOAN: '贷款', OTHER: '其他',
}

async function loadOptions() {
  const [owners, assetTypes] = await Promise.all([getOwnerOptions(), getAssetTypeOptions()])
  ownerOptions.value = owners.data || []
  assetTypeOptions.value = assetTypes.data || []
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAccounts()
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
      code: row.code || '',
      ownerId: row.ownerId,
      defaultAssetTypeId: row.defaultAssetTypeId || null,
      accountCategory: row.accountCategory || '',
      includeInTotal: row.includeInTotal,
      sort: row.sort || 0,
      remark: row.remark || '',
    }
  } else {
    isEdit.value = false
    form.value = {
      name: '', code: '', ownerId: null, defaultAssetTypeId: null,
      accountCategory: '', includeInTotal: true, sort: 0, remark: '',
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
      code: form.value.code || null,
      ownerId: form.value.ownerId,
      defaultAssetTypeId: form.value.defaultAssetTypeId || null,
      accountCategory: form.value.accountCategory || null,
      includeInTotal: form.value.includeInTotal,
      sort: form.value.sort,
      remark: form.value.remark,
    }
    if (isEdit.value) {
      await updateAccount(form.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await createAccount(data)
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
      await disableAccount(row.id)
    } else {
      await enableAccount(row.id)
    }
    ElMessage.success('操作成功')
    await fetchList()
  } catch { /* handled */ }
}

async function handleDelete(id) {
  try {
    await deleteAccount(id)
    ElMessage.success('删除成功')
    await fetchList()
  } catch { /* handled */ }
}

onMounted(() => {
  loadOptions()
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
.meta-tag.owner {
  background: rgba(64, 158, 255, 0.1);
  color: #337ecc;
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
