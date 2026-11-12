const today = () => {
  const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
};
const year = () => Number(today().slice(0, 4));
const money = value => value == null ? '—' : '¥' + Number(value).toFixed(2);
const choice = (key, label, source, required = false) => ({ key, label, type: 'choice', source, required });
const field = (key, label, type = 'text', required = false) => ({ key, label, type, required });
const owner = choice('ownerId', '所有人', 'owners', true);
const remark = field('remark', '备注');
const name = field('name', '名称', 'text', true);
const sort = field('sort', '排序', 'integer');
const code = field('code', '编码');
const total = field('includeInTotal', '计入总资产', 'switch');
const categories = { BANK: '银行', WECHAT: '微信', ALIPAY: '支付宝', SECURITY: '证券', FUND: '基金', CASH: '现金', LOAN: '贷款', OTHER: '其他' };
const risk = { NONE: '无', LOW: '低', MEDIUM: '中', HIGH: '高' };

const resources = {
  snapshots: {
    title: '资产快照',
    fields: [field('snapshotDate', '日期', 'date', true), owner, choice('accountId', '账户', 'accounts', true),
      choice('assetTypeId', '资产类型', 'asset-types', true), field('amount', '金额', 'decimal', true), remark],
    defaults: () => ({ snapshotDate: today() }),
    row: item => [item.account?.name, [item.snapshotDate?.slice(0, 10), item.owner?.name, item.assetType?.name].filter(Boolean).join(' · '), money(item.calculatedAmount)],
  },
  golds: {
    title: '攒金记录',
    fields: [field('purchaseDate', '购入日期', 'date', true), field('channel', '购入渠道', 'text', true),
      field('weightGrams', '重量（克）', 'decimal', true), field('purchaseAmount', '总价', 'decimal', true), remark],
    defaults: () => ({ purchaseDate: today() }),
    row: item => [item.channel, item.purchaseDate?.slice(0, 10) + ' · ' + item.weightGrams + ' 克 · ' + money(item.pricePerGram) + '/克', money(item.purchaseAmount)],
  },
  'year-goals': {
    title: '年度目标',
    fields: [field('year', '年份', 'integer', true), owner, field('startAmount', '年初金额', 'decimal'),
      field('targetAmount', '年度目标金额', 'decimal', true), remark],
    defaults: () => ({ year: year(), startAmount: '0' }),
    row: item => [item.year + ' 年 · ' + (item.owner?.displayName || item.owner?.name || ''), '年初 ' + money(item.startAmount), money(item.targetAmount)],
  },
  owners: {
    title: '所有人配置', toggle: true,
    fields: [name, field('displayName', '显示名'), sort, remark],
    defaults: () => ({ sort: 0 }),
    row: item => [item.displayName || item.name, item.remark],
  },
  accounts: {
    title: '账户配置', toggle: true,
    fields: [name, code, owner, choice('defaultAssetTypeId', '默认资产类型', 'asset-types'),
      choice('accountCategory', '账户分类', categories), total, sort, remark],
    defaults: () => ({ sort: 0, includeInTotal: true }),
    row: item => [item.name, [item.owner?.name, item.defaultAssetType?.name, categories[item.accountCategory]].filter(Boolean).join(' · ')],
  },
  'asset-types': {
    title: '资产类型配置', toggle: true,
    fields: [name, field('code', '编码', 'text', true), choice('direction', '方向', { ASSET: '资产', DEBT: '负债' }, true),
      choice('riskLevel', '风险等级', risk, true), total, field('includeInChart', '计入图表', 'switch'), sort, remark],
    defaults: () => ({ direction: 'ASSET', riskLevel: 'NONE', includeInTotal: true, includeInChart: true, sort: 0 }),
    row: item => [item.name, (item.direction === 'DEBT' ? '负债' : '资产') + ' · 风险 ' + (risk[item.riskLevel] || '—')],
  },
};

module.exports = { resources, today, year, money, risk };
