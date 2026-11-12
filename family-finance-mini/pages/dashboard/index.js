const { request, requireLogin } = require('../../lib/api');
const { selectTab } = require('../../lib/navigation');
const { year, money } = require('../../lib/resources');
const { palette } = require('../../components/finance-chart/draw');

const riskLabels = { LOW: '低风险', MEDIUM: '中风险', HIGH: '高风险', NONE: '无风险' };
const riskColors = { LOW: '#67C23A', MEDIUM: '#E6A23C', HIGH: '#F56C6C', NONE: '#C9CDD4' };
const monthLabel = date => date.slice(2, 7).replace('-', '/');

function lineChart(dates, series) {
  const normalized = series.map((item, index) => ({
    name: item.name, color: palette[index % palette.length],
    values: dates.map((_, position) => Number(item.data[position]) || 0), area: !!item.area,
  }));
  return {
    type: 'line', height: 210, months: dates.map(monthLabel), series: normalized,
    legend: normalized.map((item, index) => ({ key: index, label: item.name, color: item.color })),
  };
}

function distributionChart(type, values) {
  const items = values.map((item, index) => ({
    name: item.name, amount: Number(item.amount) || 0, color: item.color || palette[index % palette.length],
  })).filter(item => type === 'bar' || item.amount > 0);
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    type, height: type === 'bar' ? Math.max(180, Math.min(850, items.length * 26 + 36)) : 208, items,
    legend: type === 'bar' ? [] : items.map((item, index) => ({
      key: index, color: item.color, label: item.name + ' ' + (item.amount / total * 100).toFixed(1) + '%',
    })),
  };
}

function monthDifference(cents) {
  if (cents.length < 2) return '--';
  const difference = cents[cents.length - 1] - cents[cents.length - 2];
  const sign = difference > 0 ? '+' : (difference < 0 ? '-' : '');
  return sign + money(Math.abs(difference) / 100);
}

Page({
  data: { year: year(), owners: [], ownerIndex: 0, isPersonal: false, loading: true, error: '', summary: null, sections: [],
    trendRange: 6, accountTrendView: 'chart', assetChart: null, accountChart: null, accountDates: [], accountSeries: [], accountTotal: null },
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
      const choices = owners.map(item => ({ id: item.id, label: item.displayName || item.name }));
      const ownerIndex = choices.findIndex(item => item.id === this.ownerId);
      if (this.ownerId && ownerIndex < 0) {
        this.ownerId = '';
        this.setData({ isPersonal: false });
        return this.load();
      }
      const sections = [
        { title: '账户余额', chart: distributionChart('bar', dashboard.accountDistribution) },
        { title: '资产类型分布', chart: distributionChart('donut', dashboard.assetTypeDistribution) },
        { title: '风险等级分布', chart: distributionChart('pie', dashboard.riskDistribution.map(item => ({
          ...item, name: riskLabels[item.riskLevel] || item.riskLevel, color: riskColors[item.riskLevel] || '#C9CDD4',
        }))) },
      ];
      if (!this.ownerId) sections.push({ title: '所有人资产分布', chart: distributionChart('pie', dashboard.ownerDistribution) });
      this.trend = dashboard.trend;
      this.ownerTrend = dashboard.ownerTrend?.owners || [];
      this.accountTrend = dashboard.accountTrend;
      const gold = dashboard.gold;
      this.setData({
        owners: choices, ownerIndex: Math.max(0, ownerIndex), sections,
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
      this.renderTrends();
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
  switchView(e) {
    const isPersonal = e.currentTarget.dataset.mode === 'personal';
    if (isPersonal === this.data.isPersonal) return;
    const owner = isPersonal ? this.data.owners[0] : null;
    if (isPersonal && !owner) return;
    this.ownerId = owner ? owner.id : '';
    this.setData({ isPersonal, ownerIndex: 0 });
    this.load();
  },
  changeOwner(e) {
    const owner = this.data.owners[Number(e.detail.value)];
    if (!this.data.isPersonal || !owner) return;
    this.ownerId = owner.id;
    this.load();
  },
  changeTrendRange(e) {
    this.setData({ trendRange: Number(e.currentTarget.dataset.range) });
    this.renderTrends();
  },
  changeAccountView(e) { this.setData({ accountTrendView: e.currentTarget.dataset.view }); },
  renderTrends() {
    const range = this.data.trendRange;
    const dates = this.accountTrend.dates.slice(-range);
    const trend = this.trend.slice(-range);
    const assetSeries = [{ name: '总计', area: true, data: trend.map(item => item.amount) }];
    if (this.ownerTrend?.length > 1) {
      assetSeries.push(...this.ownerTrend.map(item => ({ name: item.name, data: item.data.slice(-range) })));
    }
    const accountChart = lineChart(dates, this.accountTrend.accounts.map(item => ({
      name: item.name, data: item.data.slice(-range),
    })));
    const totals = dates.map(() => 0);
    const accountSeries = this.accountTrend.accounts.map(account => {
      const values = account.data.slice(-range);
      const cents = dates.map((_, index) => {
        const amount = Math.round((Number(values[index]) || 0) * 100);
        totals[index] += amount;
        return amount;
      });
      return {
        id: account.id, name: account.name,
        cells: dates.map((date, index) => ({ date, value: Number(values[index]) ? money(values[index]) : '--' })),
        difference: monthDifference(cents),
      };
    });
    this.setData({
      assetChart: lineChart(trend.map(item => item.snapshotDate), assetSeries),
      accountChart,
      accountDates: dates.map(date => date.slice(0, 7)),
      accountSeries,
      accountTotal: {
        cells: dates.map((date, index) => ({ date, value: money(totals[index] / 100) })),
        difference: monthDifference(totals),
      },
    });
  },
});
