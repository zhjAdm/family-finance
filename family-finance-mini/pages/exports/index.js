const { requireLogin, exportFile } = require('../../lib/api');

Page({
  data: {
    exports: [
      { file: 'snapshots.csv', title: '资产快照', icon: 'document', tone: 'asset' },
      { file: 'accounts.csv', title: '账户', icon: 'credit-card', tone: 'account' },
      { file: 'asset-types.csv', title: '资产类型', icon: 'collection', tone: 'type' },
    ],
  },
  onShow() { requireLogin(); },
  exportCsv(e) { exportFile(e.currentTarget.dataset.file); },
});
