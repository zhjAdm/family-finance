const { requireLogin, exportFile } = require('../../lib/api');

Page({
  onShow() { requireLogin(); },
  exportCsv(e) { exportFile(e.currentTarget.dataset.file); },
});
