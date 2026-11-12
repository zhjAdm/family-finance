const { request, requireLogin, logout } = require('../../lib/api');
const { selectTab } = require('../../lib/navigation');

Page({
  data: {
    entries: [
      { key: 'owners', title: '所有人配置', icon: 'user', tone: 'blue', suffix: '人启用', url: '/pages/records/index?type=owners' },
      { key: 'accounts', title: '账户配置', icon: 'credit-card', tone: 'purple', suffix: '账户', url: '/pages/records/index?type=accounts' },
      { key: 'asset-types', title: '资产类型', icon: 'collection', tone: 'green', suffix: '类型', url: '/pages/records/index?type=asset-types' },
      { key: 'export', title: '数据导出', icon: 'download', tone: 'amber', meta: 'CSV 备份', url: '/pages/exports/index' },
    ],
  },
  async onShow() {
    if (!requireLogin()) return;
    selectTab(this, 'settings');
    const entries = await Promise.all(this.data.entries.map(async item => {
      if (!item.suffix) return item;
      try {
        const records = await request('/' + item.key, 'GET', { enabled: 'true' });
        return { ...item, meta: records.length + item.suffix };
      } catch {
        return item;
      }
    }));
    this.setData({ entries });
  },
  logout,
});
