import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 响应拦截
request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data.code !== 0) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return data
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

// 年度目标
export const getYearGoals = (ownerId) => request.get('/year-goals', { params: { ownerId } })
export const createYearGoal = (data) => request.post('/year-goals', data)
export const updateYearGoal = (id, data) => request.put(`/year-goals/${id}`, data)
export const deleteYearGoal = (id) => request.delete(`/year-goals/${id}`)

// 所有人
export const getOwners = (enabled) => request.get('/owners', { params: { enabled } })
export const createOwner = (data) => request.post('/owners', data)
export const updateOwner = (id, data) => request.put(`/owners/${id}`, data)
export const deleteOwner = (id) => request.delete(`/owners/${id}`)
export const enableOwner = (id) => request.patch(`/owners/${id}/enable`)
export const disableOwner = (id) => request.patch(`/owners/${id}/disable`)

// 资产类型
export const getAssetTypes = (enabled) => request.get('/asset-types', { params: { enabled } })
export const createAssetType = (data) => request.post('/asset-types', data)
export const updateAssetType = (id, data) => request.put(`/asset-types/${id}`, data)
export const deleteAssetType = (id) => request.delete(`/asset-types/${id}`)
export const enableAssetType = (id) => request.patch(`/asset-types/${id}/enable`)
export const disableAssetType = (id) => request.patch(`/asset-types/${id}/disable`)
export const importAssetTypes = (items) => request.post('/asset-types/import', items)

// 账户
export const getAccounts = (params) => request.get('/accounts', { params })
export const createAccount = (data) => request.post('/accounts', data)
export const updateAccount = (id, data) => request.put(`/accounts/${id}`, data)
export const deleteAccount = (id) => request.delete(`/accounts/${id}`)
export const enableAccount = (id) => request.patch(`/accounts/${id}/enable`)
export const disableAccount = (id) => request.patch(`/accounts/${id}/disable`)

// 资产快照
export const getSnapshots = (params) => request.get('/snapshots', { params })
export const createSnapshot = (data) => request.post('/snapshots', data)
export const updateSnapshot = (id, data) => request.put(`/snapshots/${id}`, data)
export const deleteSnapshot = (id) => request.delete(`/snapshots/${id}`)
export const deleteSnapshotsByDate = (date) => request.delete(`/snapshots/by-date/${date}`)
export const getLatestSnapshotDate = () => request.get('/snapshots/latest-date')
export const copyLatestSnapshot = (data) => request.post('/snapshots/copy-latest', data)

// 下拉选项
export const getOwnerOptions = () => request.get('/options/owners')
export const getAccountOptions = (ownerId) => request.get('/options/accounts', { params: { ownerId } })
export const getAssetTypeOptions = () => request.get('/options/asset-types')

// 看板
export const getDashboard = (year, ownerId) => request.get('/dashboard', { params: { year, ownerId } })
export const getDistributions = (year, ownerId) => request.get('/dashboard/distributions', { params: { year, ownerId } })

// 导出
export const exportSnapshotsCsv = () => '/api/export/snapshots.csv'
export const exportAccountsCsv = () => '/api/export/accounts.csv'
export const exportAssetTypesCsv = () => '/api/export/asset-types.csv'

export default request
