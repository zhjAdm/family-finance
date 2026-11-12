const { request, requireLogin, toast, confirm } = require('./api');
const { resources, today, money } = require('./resources');

const { selectTab } = require('./navigation');
const { parseAssetTypes } = require('./asset-csv');

const pageSize = 30;
module.exports = function recordPage(tabType) {
  return {
    data: { withTabs: !!tabType, title: '', goals: false, rows: [], count: 0, loading: true, busy: false, error: '', date: '', targetDate: today(),
      snapshots: false, golds: false, assetTypes: false, goldSummary: [], configOpen: false, config: '',
      mode: 'true', snapshotModes: ['最新记录', '历史快照', '全部记录'], modeIndex: 0 },
    onLoad(options) {
      const type = tabType || options.type;
      if (!Object.prototype.hasOwnProperty.call(resources, type)) return wx.navigateBack();
      this.type = type;
      this.resource = resources[type];
      this.setData({
        title: this.resource.title,
        snapshots: type === 'snapshots',
        golds: type === 'golds',
        goals: type === 'year-goals',
        assetTypes: type === 'asset-types',
      });
      wx.setNavigationBarTitle({ title: this.resource.title });
    },
    onShow() {
      if (!this.resource || !requireLogin()) return;
      if (tabType) selectTab(this, tabType);
      this.load();
    },
    onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
    async load() {
      const seq = this.seq = (this.seq || 0) + 1;
      this.setData({ loading: true, error: '' });
      try {
        const { snapshots, mode, date } = this.data;
        const filter = date ? { snapshotDate: date } : (snapshots && mode ? { latest: mode } : undefined);
        const [records, gold] = await Promise.all([
          request('/' + this.type, 'GET', filter),
          this.data.golds ? request('/golds/summary') : null,
        ]);
        if (seq !== this.seq) return;
        this.rows = records.map(item => {
          const [title, detail, amount] = this.resource.row(item);
          return {
            id: item.id, title, detail, amount: amount || '', toggle: !!this.resource.toggle, enabled: !!item.enabled,
            debt: item.assetType?.direction === 'DEBT',
            tags: snapshots ? [item.snapshotDate?.slice(0, 10), item.owner?.name, item.assetType?.name].filter(Boolean) : [],
          };
        });
        this.setData({ rows: this.rows.slice(0, pageSize), count: this.rows.length,
          goldSummary: gold ? [
            { name: '持有重量', value: gold.totalWeight + ' 克' },
            { name: '累计成本', value: money(gold.totalAmount) },
            { name: '买入均价 / 克', value: money(gold.avgPrice) },
            { name: '买入笔数', value: gold.count },
            { name: '现价 / 克', value: money(gold.currentPrice) },
            { name: '参考市值', value: money(gold.marketValue) },
            { name: '浮动盈亏', value: money(gold.profit) },
          ] : [],
        });
      } catch (error) {
        if (seq === this.seq) this.setData({ error: error.message });
      } finally {
        if (seq === this.seq) this.setData({ loading: false });
      }
    },
    onReachBottom() { if (this.rows) this.setData({ rows: this.rows.slice(0, this.data.rows.length + pageSize) }); },
    edit(e) {
      const id = e.currentTarget.dataset.id || '';
      wx.navigateTo({ url: '/pages/edit/index?type=' + this.type + '&id=' + id + '&date=' + this.data.date });
    },
    changeMode(e) {
      const modeIndex = Number(e.currentTarget.dataset.index);
      this.setData({ modeIndex, mode: ['true', 'exclude', ''][modeIndex], date: '', rows: [] });
      this.load();
    },
    importAssetTypes() {
      if (this.data.busy) return;
      wx.chooseMessageFile({
        count: 1, type: 'file', extension: ['csv'],
        success: ({ tempFiles }) => this.importFile(tempFiles[0]),
        fail: error => { if (!error.errMsg.includes('cancel')) toast('无法选择 CSV 文件'); },
      });
    },
    async importFile(file) {
      if (!file || this.data.busy) return;
      if (file.size > 100000) return toast('请选择小于 100 KB 的 CSV');
      this.setData({ busy: true });
      try {
        const csv = wx.getFileSystemManager().readFileSync(file.path, 'utf8');
        const items = parseAssetTypes(csv);
        if (!(await confirm('导入 ' + items.length + ' 个资产类型？已有相同编码的记录会更新。'))) return;
        const result = await request('/asset-types/import', 'POST', items);
        wx.showModal({
          title: '导入结果', showCancel: false,
          content: '新增 ' + result.created + '，更新 ' + result.updated + '，跳过 ' + result.skipped
            + (result.errors.length ? '\n' + result.errors.slice(0, 4).join('\n') : ''),
        });
        await this.load();
      } catch (error) { toast(error.message); }
      finally { this.setData({ busy: false }); }
    },
    filterDate(e) { this.setData({ date: e.detail.value, rows: [] }); this.load(); },
    clearDate() { this.setData({ date: '', rows: [] }); this.load(); },
    setTargetDate(e) { this.setData({ targetDate: e.detail.value }); },
    async mutate(path, method, data, prompt) {
      if (this.data.busy) return;
      this.setData({ busy: true });
      try {
        if (prompt && !(await confirm(prompt))) return;
        await request(path, method, data);
        await this.load();
      } catch (error) { toast(error.message); }
      finally { this.setData({ busy: false }); }
    },
    remove(e) { return this.mutate('/' + this.type + '/' + e.currentTarget.dataset.id, 'DELETE', undefined, '删除这条记录？'); },
    toggle(e) {
      const { id, enabled } = e.currentTarget.dataset;
      return this.mutate('/' + this.type + '/' + id + (enabled ? '/disable' : '/enable'), 'PUT');
    },
    copy() {
      const targetDate = this.data.targetDate;
      return this.mutate('/snapshots/copy-latest', 'POST', { targetDate }, '将最近一次的快照复制到 ' + targetDate + '？');
    },
    removeDate() {
      const date = this.data.date;
      return this.mutate('/snapshots/by-date/' + date, 'DELETE', undefined, '删除 ' + date + ' 的全部快照？');
    },
    refreshPrice() { return this.mutate('/golds/fetch-price', 'POST'); },
    openConfig() { this.setData({ configOpen: !this.data.configOpen, config: '' }); },
    inputConfig(e) { this.setData({ config: e.detail.value }); },
    async saveConfig() {
      if (this.data.busy) return;
      const value = this.data.config.trim();
      if (!value) return toast('请输入金价接口令牌');
      this.setData({ busy: true });
      try {
        await request('/config/gold_api_token', 'PUT', { value });
        this.setData({ configOpen: false, config: '' });
        toast('已保存');
      } catch (error) { toast(error.message); }
      finally { this.setData({ busy: false }); }
    },
  };
};
