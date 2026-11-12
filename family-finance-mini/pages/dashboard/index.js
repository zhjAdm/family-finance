const { request, requireLogin } = require('../../lib/api');
const { selectTab } = require('../../lib/navigation');
const { year, money, risk } = require('../../lib/resources');

function rows(items) {
  const max = items.reduce((limit, item) => Math.max(limit, Math.abs(Number(item.amount))), 1);
  return items.map(({ name, amount }, index) => ({
    id: index, name, amount: money(amount), width: Math.abs(Number(amount)) / max * 100,
  }));
}

Page({
  data: { year: year(), owners: [], ownerIndex: 0, loading: true, error: '', summary: null, sections: [],
    trendOptions: [], trendIndex: 0, trendRows: [] },
  onShow() {
    if (!requireLogin()) return;
    selectTab(this, 'dashboard');
    this.load();
  },
  onPullDownRefresh() { this.load().finally(() => wx.stopPullDownRefresh()); },
  async load() {
    const seq = this.seq = (this.seq || 0) + 1;
    this.setData({ loading: true, error: '', summary: null });
    try {
      const [owners, dashboard] = await Promise.all([
        request('/options/owners'),
        request('/dashboard', 'GET', { year: this.data.year, ownerId: this.ownerId || '' }),
      ]);
      if (seq !== this.seq) return;
      const choices = [{ id: '', label: '全家' }, ...owners.map(item => ({ id: item.id, label: item.displayName || item.name }))];
      const ownerIndex = choices.findIndex(item => item.id === (this.ownerId || ''));
      if (ownerIndex < 0) {
        this.ownerId = '';
        return this.load();
      }
      const sections = [
        ['按资产类型', dashboard.assetTypeDistribution],
        ['按账户', dashboard.accountDistribution],
        ['按所有人', dashboard.ownerDistribution],
        ['按风险等级', dashboard.riskDistribution.map(item => ({ ...item, name: risk[item.riskLevel] || item.riskLevel }))],
      ].filter(([, items]) => items.length).map(([title, items]) => ({ title, rows: rows(items) }));
      const series = (dates, items, prefix) => items.map(item => ({
        label: prefix + item.name,
        rows: rows(dates.map((date, index) => ({ name: date.slice(0, 7), amount: item.data[index] }))),
      }));
      this.trends = [
        { label: '全部资产', rows: rows(dashboard.trend.map(item => ({ name: item.snapshotDate.slice(0, 7), amount: item.amount }))) },
        ...series(dashboard.ownerTrend.dates, dashboard.ownerTrend.owners, '所有人 · '),
        ...series(dashboard.accountTrend.dates, dashboard.accountTrend.accounts, '账户 · '),
      ];
      const gold = dashboard.gold;
      this.setData({
        owners: choices, ownerIndex, sections, trendOptions: this.trends.map(item => item.label),
        trendIndex: 0, trendRows: this.trends[0].rows,
        summary: {
          net: money(dashboard.netAssetAmount), assets: money(dashboard.assetAmount), debts: money(dashboard.debtAmount),
          increase: (Number(dashboard.yearIncreaseAmount) >= 0 ? '+' : '') + money(dashboard.yearIncreaseAmount),
          increasing: Number(dashboard.yearIncreaseAmount) >= 0,
          gold: gold?.count > 0 ? [
            { name: '总克重', value: gold.totalWeight + ' g' },
            { name: '总投入', value: money(gold.totalAmount) },
            { name: '均价', value: money(gold.avgPrice) + '/g' },
            { name: '笔数', value: gold.count },
          ] : [],
          goal: money(dashboard.targetAmount),
          remaining: money(dashboard.remainingAmount), progress: Number(dashboard.completionRate || 0).toFixed(1),
          progressWidth: Math.max(0, Math.min(100, Number(dashboard.completionRate) || 0)),
          latest: dashboard.latestSnapshotDate || '暂无',
        },
      });
    } catch (error) {
      if (seq === this.seq) this.setData({ error: error.message });
    } finally {
      if (seq === this.seq) this.setData({ loading: false });
    }
  },
  changeYear(e) {
    const year = Number(e.detail.value.slice(0, 4));
    this.setData({ year });
    this.load();
  },
  changeOwner(e) {
    this.ownerId = this.data.owners[Number(e.detail.value)].id;
    this.load();
  },
  changeTrend(e) {
    const trendIndex = Number(e.detail.value);
    this.setData({ trendIndex, trendRows: this.trends[trendIndex].rows });
  },
});
