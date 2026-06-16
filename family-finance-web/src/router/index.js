import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '财务看板' } },
      { path: '/year-goals', name: 'YearGoals', component: () => import('../views/YearGoals.vue'), meta: { title: '年度目标' } },
      { path: '/snapshots', name: 'Snapshots', component: () => import('../views/Snapshots.vue'), meta: { title: '资产快照' } },
      { path: '/config', name: 'ConfigHome', component: () => import('../views/ConfigHome.vue'), meta: { title: '配置中心' } },
      { path: '/settings/owners', name: 'Owners', component: () => import('../views/settings/Owners.vue'), meta: { title: '所有人配置' } },
      { path: '/settings/accounts', name: 'Accounts', component: () => import('../views/settings/Accounts.vue'), meta: { title: '账户配置' } },
      { path: '/settings/asset-types', name: 'AssetTypes', component: () => import('../views/settings/AssetTypes.vue'), meta: { title: '资产类型配置' } },
      { path: '/data', name: 'Data', component: () => import('../views/Data.vue'), meta: { title: '数据导出' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
