const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

router.get('/dashboard', async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    // 1. 获取年度目标
    const yearGoal = await prisma.financeYearGoal.findUnique({
      where: { year: targetYear },
    });

    const startAmount = Number(yearGoal?.startAmount || 0);
    const targetAmount = Number(yearGoal?.targetAmount || 0);

    // 2. 获取最新快照日期
    const latestSnapshot = await prisma.financeAssetSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    });
    const latestSnapshotDate = latestSnapshot ? latestSnapshot.snapshotDate.toISOString().split('T')[0] : null;

    // 3. 当前总资产（过滤 include_in_total 条件）
    let currentTotalAmount = 0;
    if (latestSnapshotDate) {
      const currentResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          account: { includeInTotal: true },
          assetType: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      currentTotalAmount = Number(currentResult._sum.calculatedAmount || 0);
    }

    // 4. 年度新增和完成率
    const yearIncreaseAmount = currentTotalAmount - startAmount;
    const completionRate = targetAmount > 0 ? Math.round((yearIncreaseAmount / targetAmount) * 100) : 0;
    const remainingAmount = Math.max(0, targetAmount - yearIncreaseAmount);

    // 5. 资产类型分布（direction=ASSET, includeInChart=true）
    let assetTypeDistribution = [];
    if (latestSnapshotDate) {
      const assetTypeRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['assetTypeId'],
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          assetType: { direction: 'ASSET', includeInTotal: true, includeInChart: true },
          account: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      const assetTypeIds = assetTypeRows.map((r) => r.assetTypeId);
      const assetTypes = await prisma.financeAssetType.findMany({
        where: { id: { in: assetTypeIds } },
      });
      const assetTypeMap = {};
      assetTypes.forEach((at) => { assetTypeMap[at.id.toString()] = at.name; });
      assetTypeDistribution = assetTypeRows
        .map((r) => ({
          name: assetTypeMap[r.assetTypeId.toString()] || '未知',
          amount: String(r._sum.calculatedAmount || 0),
        }))
        .filter((d) => Number(d.amount) > 0);
    }

    // 6. 账户分布
    let accountDistribution = [];
    if (latestSnapshotDate) {
      const accountRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['accountId'],
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          account: { includeInTotal: true },
          assetType: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      const accountIds = accountRows.map((r) => r.accountId);
      const accounts = await prisma.financeAccount.findMany({ where: { id: { in: accountIds } } });
      const accountMap = {};
      accounts.forEach((a) => { accountMap[a.id.toString()] = a.name; });
      accountDistribution = accountRows
        .map((r) => ({
          name: accountMap[r.accountId.toString()] || '未知',
          amount: String(r._sum.calculatedAmount || 0),
        }));
    }

    // 7. 所有人分布
    let ownerDistribution = [];
    if (latestSnapshotDate) {
      const ownerRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['ownerId'],
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          account: { includeInTotal: true },
          assetType: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      const ownerIds = ownerRows.map((r) => r.ownerId);
      const owners = await prisma.financeOwner.findMany({ where: { id: { in: ownerIds } } });
      const ownerMap = {};
      owners.forEach((o) => { ownerMap[o.id.toString()] = o.name; });
      ownerDistribution = ownerRows
        .map((r) => ({
          name: ownerMap[r.ownerId.toString()] || '未知',
          amount: String(r._sum.calculatedAmount || 0),
        }));
    }

    // 8. 资产趋势（该年所有快照日期）
    const yearStart = new Date(`${targetYear}-01-01`);
    const yearEnd = new Date(`${targetYear}-12-31`);
    const trendRows = await prisma.financeAssetSnapshot.groupBy({
      by: ['snapshotDate'],
      where: {
        snapshotDate: { gte: yearStart, lte: yearEnd },
        account: { includeInTotal: true },
        assetType: { includeInTotal: true },
      },
      _sum: { calculatedAmount: true },
      orderBy: { snapshotDate: 'asc' },
    });
    const trend = trendRows.map((r) => ({
      snapshotDate: r.snapshotDate.toISOString().split('T')[0],
      amount: String(r._sum.calculatedAmount || 0),
    }));

    // 9. 风险分布
    let riskDistribution = [];
    if (latestSnapshotDate) {
      const riskRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['assetTypeId'],
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          assetType: { includeInTotal: true },
          account: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      const riskTypeIds = riskRows.map((r) => r.assetTypeId);
      const riskTypes = await prisma.financeAssetType.findMany({ where: { id: { in: riskTypeIds } } });
      const riskTypeMap = {};
      riskTypes.forEach((at) => { riskTypeMap[at.id.toString()] = at.riskLevel || 'NONE'; });
      const riskAgg = {};
      riskRows.forEach((r) => {
        const level = riskTypeMap[r.assetTypeId.toString()] || 'NONE';
        riskAgg[level] = (riskAgg[level] || 0) + Number(r._sum.calculatedAmount || 0);
      });
      riskDistribution = Object.entries(riskAgg).map(([riskLevel, amount]) => ({
        riskLevel, amount: String(amount),
      }));
    }

    // 10. 资产和负债统计
    let assetAmount = 0;
    let debtAmount = 0;
    if (latestSnapshotDate) {
      const assetResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          assetType: { direction: 'ASSET', includeInTotal: true },
          account: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      assetAmount = Number(assetResult._sum.calculatedAmount || 0);

      const debtResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          snapshotDate: new Date(latestSnapshotDate),
          assetType: { direction: 'DEBT', includeInTotal: true },
          account: { includeInTotal: true },
        },
        _sum: { calculatedAmount: true },
      });
      debtAmount = Math.abs(Number(debtResult._sum.calculatedAmount || 0));
    }
    const netAssetAmount = assetAmount - debtAmount;

    res.json(success({
      year: targetYear,
      latestSnapshotDate,
      currentTotalAmount: String(currentTotalAmount),
      startAmount: String(startAmount),
      yearIncreaseAmount: String(yearIncreaseAmount),
      targetAmount: String(targetAmount),
      completionRate,
      remainingAmount: String(remainingAmount),
      assetAmount: String(assetAmount),
      debtAmount: String(debtAmount),
      netAssetAmount: String(netAssetAmount),
      assetTypeDistribution,
      accountDistribution,
      ownerDistribution,
      trend,
      riskDistribution,
    }));
  } catch (err) { next(err); }
});

module.exports = router;
