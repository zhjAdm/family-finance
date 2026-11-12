const header = ['名称', '编码', '方向', '风险等级', '计入总资产', '图表显示', '启用', '排序', '备注'];
const directions = { 资产: 'ASSET', 负债: 'DEBT', ASSET: 'ASSET', DEBT: 'DEBT' };
const riskLevels = { 无: 'NONE', 低: 'LOW', 中: 'MEDIUM', 高: 'HIGH', NONE: 'NONE', LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' };

function parseAssetTypes(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n') + '\n';
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (char === ',' || char === '\n')) {
      row.push(value.trim());
      value = '';
      if (char === '\n') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
      }
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('CSV 有未闭合的引号');
  const columns = rows.shift();
  if (!columns || columns.join(',') !== header.join(',')) throw new Error('请使用系统导出的资产类型 CSV 表头');
  if (!rows.length) throw new Error('CSV 中没有可导入的记录');
  return rows.map(([name, code, direction, riskLevel, total, chart, , sort, remark]) => ({
    name, code,
    direction: directions[direction] || 'ASSET',
    riskLevel: riskLevels[riskLevel] || 'NONE',
    includeInTotal: !['否', 'false', '0'].includes(total),
    includeInChart: !['否', 'false', '0'].includes(chart),
    sort: parseInt(sort, 10) || 0,
    remark: remark || null,
  }));
}

module.exports = { parseAssetTypes };
