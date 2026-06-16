const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 导出资产快照 CSV
router.get('/export/snapshots.csv', async (_req, res, next) => {
  try {
    const list = await prisma.financeAssetSnapshot.findMany({
      orderBy: [{ snapshotDate: 'desc' }, { id: 'asc' }],
      include: {
        owner: { select: { name: true } },
        account: { select: { name: true } },
        assetType: { select: { name: true, direction: true } },
      },
    });

    const header = '日期,所有人,账户,资产类型,录入金额,计算金额,备注\n';
    const rows = list.map((s) => {
      const date = s.snapshotDate.toISOString().split('T')[0];
      const escapeCsv = (v) => v ? `"${String(v).replace(/"/g, '""')}"` : '';
      return [
        date,
        escapeCsv(s.owner.name),
        escapeCsv(s.account.name),
        escapeCsv(s.assetType.name),
        s.amount,
        s.calculatedAmount,
        escapeCsv(s.remark || ''),
      ].join(',');
    }).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=snapshots.csv');
    res.send(bom + header + rows);
  } catch (err) { next(err); }
});

// 导出账户配置 CSV
router.get('/export/accounts.csv', async (_req, res, next) => {
  try {
    const list = await prisma.financeAccount.findMany({
      orderBy: { sort: 'asc' },
      include: {
        owner: { select: { name: true } },
        defaultAssetType: { select: { name: true } },
      },
    });

    const header = '账户名称,账户编码,所有人,默认资产类型,账户分类,计入总资产,启用,排序,备注\n';
    const rows = list.map((a) => {
      const escapeCsv = (v) => v ? `"${String(v).replace(/"/g, '""')}"` : '';
      return [
        escapeCsv(a.name),
        escapeCsv(a.code || ''),
        escapeCsv(a.owner.name),
        escapeCsv(a.defaultAssetType?.name || ''),
        a.accountCategory || '',
        a.includeInTotal ? '是' : '否',
        a.enabled ? '是' : '否',
        a.sort,
        escapeCsv(a.remark || ''),
      ].join(',');
    }).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=accounts.csv');
    res.send(bom + header + rows);
  } catch (err) { next(err); }
});

// 导出资产类型配置 CSV
router.get('/export/asset-types.csv', async (_req, res, next) => {
  try {
    const list = await prisma.financeAssetType.findMany({
      orderBy: { sort: 'asc' },
    });

    const header = '名称,编码,方向,风险等级,计入总资产,图表显示,启用,排序,备注\n';
    const rows = list.map((at) => {
      const escapeCsv = (v) => v ? `"${String(v).replace(/"/g, '""')}"` : '';
      return [
        escapeCsv(at.name),
        escapeCsv(at.code),
        at.direction,
        at.riskLevel || '',
        at.includeInTotal ? '是' : '否',
        at.includeInChart ? '是' : '否',
        at.enabled ? '是' : '否',
        at.sort,
        escapeCsv(at.remark || ''),
      ].join(',');
    }).join('\n');

    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=asset-types.csv');
    res.send(bom + header + rows);
  } catch (err) { next(err); }
});

module.exports = router;
