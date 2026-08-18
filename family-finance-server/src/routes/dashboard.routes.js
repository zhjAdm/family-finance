const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');
const { getCurrentPrice } = require('../services/gold-price.service');

const router = Router();

async function getLatestPerAccountFilter(ownerFilter, targetYear) {
  const where = {
    account: { includeInTotal: true },
    assetType: { includeInTotal: true },
    ...ownerFilter,
  };
  if (targetYear) {
    where.snapshotDate = {
      gte: new Date(`${targetYear}-01-01`),
      lte: new Date(`${targetYear}-12-31`),
    };
  }
  const maxDates = await prisma.financeAssetSnapshot.groupBy({
    by: ['accountId'],
    where,
    _max: { snapshotDate: true },
  });
  const pairs = maxDates.filter((r) => r._max.snapshotDate);
  if (pairs.length === 0) return { filter: null, latestSnapshotDate: null };
  const latestSnapshotDate = pairs.reduce((max, r) =>
    r._max.snapshotDate > max ? r._max.snapshotDate : max, pairs[0]._max.snapshotDate
  );
  const filter = {
    OR: pairs.map((r) => ({
      accountId: r.accountId,
      snapshotDate: r._max.snapshotDate,
    })),
  };
  return { filter, latestSnapshotDate };
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const { year, ownerId } = req.query;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const ownerFilter = ownerId ? { ownerId: BigInt(ownerId) } : {};

    // 1. 获取年度目标（所有人视角下合计）
    const yearGoalAgg = await prisma.financeYearGoal.aggregate({
      where: { year: targetYear, ...ownerFilter },
      _sum: { startAmount: true, targetAmount: true },
    });

    const startAmount = Number(yearGoalAgg._sum.startAmount || 0);
    const targetAmount = Number(yearGoalAgg._sum.targetAmount || 0);

    // 2. 获取每个账户的最新快照（限当年）
    const { filter: latestPerAccount, latestSnapshotDate } = await getLatestPerAccountFilter(ownerFilter, targetYear);
    const latestSnapshotDateStr = latestSnapshotDate ? latestSnapshotDate.toISOString().split('T')[0] : null;

    // 3. 当前总资产（每个账户取各自最新快照）
    let currentTotalAmount = 0;
    if (latestPerAccount) {
      const currentResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          ...latestPerAccount,
          account: { includeInTotal: true },
          assetType: { includeInTotal: true },
          ...ownerFilter,
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
    if (latestPerAccount) {
      const assetTypeRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['assetTypeId'],
        where: {
          ...latestPerAccount,
          assetType: { direction: 'ASSET', includeInTotal: true, includeInChart: true },
          account: { includeInTotal: true },
          ...ownerFilter,
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
    if (latestPerAccount) {
      const accountRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['accountId'],
        where: {
          ...latestPerAccount,
          account: { includeInTotal: true },
          assetType: { includeInTotal: true },
          ...ownerFilter,
        },
        _sum: { calculatedAmount: true },
      });
      const accountIds = accountRows.map((r) => r.accountId);
      const accounts = await prisma.financeAccount.findMany({
        where: { id: { in: accountIds } },
        include: { owner: true },
      });
      const accountMap = {};
      accounts.forEach((a) => {
        const ownerName = a.owner?.displayName || a.owner?.name || '';
        accountMap[a.id.toString()] = ownerName ? `${ownerName} - ${a.name}` : a.name;
      });
      accountDistribution = accountRows
        .map((r) => ({
          name: accountMap[r.accountId.toString()] || '未知',
          amount: String(r._sum.calculatedAmount || 0),
        }));
    }

    // 7. 所有人分布（筛选特定所有人时跳过）
    let ownerDistribution = [];
    if (latestPerAccount && !ownerId) {
      const ownerRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['ownerId'],
        where: {
          ...latestPerAccount,
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

    // 8. 资产趋势 + 按用户趋势（近 12 个月滚动窗口，跨年，每月取各账户截至月末的最新值）
    const now = new Date();
    const windowEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 当前月最后一天
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 个月前第一天
    const allSnapshots = await prisma.financeAssetSnapshot.findMany({
      where: {
        snapshotDate: { lte: windowEnd },
        account: { includeInTotal: true },
        assetType: { includeInTotal: true },
        ...ownerFilter,
      },
      orderBy: [{ snapshotDate: 'asc' }, { id: 'asc' }],
      select: { snapshotDate: true, accountId: true, ownerId: true, calculatedAmount: true },
    });

    // 生成近 12 个月的月份键（含当月），跨年
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const windowStartKey = months[0];

    // 按 YYYY-MM 分组
    const monthMap = {};
    allSnapshots.forEach((s) => {
      const key = `${s.snapshotDate.getFullYear()}-${String(s.snapshotDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = [];
      monthMap[key].push(s);
    });

    const accountRunning = {};
    const ownerRunning = {};

    // 先累积窗口起始月份之前的快照，建立 carry-forward 基线
    Object.entries(monthMap).forEach(([month, snaps]) => {
      if (month >= windowStartKey) return;
      snaps.forEach((s) => {
        const aid = s.accountId.toString();
        const oid = s.ownerId.toString();
        accountRunning[aid] = Number(s.calculatedAmount || 0);
        if (!ownerRunning[oid]) ownerRunning[oid] = {};
        ownerRunning[oid][aid] = Number(s.calculatedAmount || 0);
      });
    });

    const totalByMonth = {};
    const ownerByMonth = {};
    const accountByMonth = {};

    months.forEach((month) => {
      if (monthMap[month]) {
        monthMap[month].forEach((s) => {
          const aid = s.accountId.toString();
          const oid = s.ownerId.toString();
          accountRunning[aid] = Number(s.calculatedAmount || 0);
          if (!ownerRunning[oid]) ownerRunning[oid] = {};
          ownerRunning[oid][aid] = Number(s.calculatedAmount || 0);
        });
      }
      totalByMonth[month] = Object.values(accountRunning).reduce((a, b) => a + b, 0);
      accountByMonth[month] = { ...accountRunning };
      Object.entries(ownerRunning).forEach(([oid, accts]) => {
        if (!ownerByMonth[oid]) ownerByMonth[oid] = {};
        ownerByMonth[oid][month] = Object.values(accts).reduce((a, b) => a + b, 0);
      });
    });

    const trend = months.map((m) => ({
      snapshotDate: `${m}-01`,
      amount: String(totalByMonth[m] || 0),
    }));

    const trendOwnerIds = [...new Set(allSnapshots.filter((s) => s.snapshotDate >= windowStart).map((s) => s.ownerId))];
    const trendOwners = trendOwnerIds.length > 0
      ? await prisma.financeOwner.findMany({ where: { id: { in: trendOwnerIds } } })
      : [];
    const ownerNameMap = {};
    trendOwners.forEach((o) => { ownerNameMap[o.id.toString()] = o.displayName || o.name; });
    const ownerTrend = {
      dates: months.map((m) => `${m}-01`),
      owners: trendOwnerIds.map((id) => {
        const oid = id.toString();
        return {
          id: oid,
          name: ownerNameMap[oid] || '未知',
          data: months.map((m) => (ownerByMonth[oid] && ownerByMonth[oid][m]) || 0),
        };
      }),
    };

    // 分账户月度趋势
    const trendAccountIds = [...new Set(
      months.flatMap((m) => Object.keys(accountByMonth[m] || {}))
    )];
    const trendAccounts = trendAccountIds.length > 0
      ? await prisma.financeAccount.findMany({
          where: { id: { in: trendAccountIds.map(BigInt) } },
          include: { owner: true },
        })
      : [];
    const accountNameMap = {};
    trendAccounts.forEach((a) => {
      const ownerName = a.owner?.displayName || a.owner?.name || '';
      accountNameMap[a.id.toString()] = ownerName ? `${ownerName} - ${a.name}` : a.name;
    });
    const accountTrend = {
      dates: months.map((m) => `${m}-01`),
      accounts: trendAccountIds
        .map((id) => ({
          id,
          name: accountNameMap[id] || '未知',
          data: months.map((m) => (accountByMonth[m] && accountByMonth[m][id]) || 0),
        }))
        .filter((acc) => acc.data.some((v) => v !== 0)),
    };

    // 9. 风险分布
    let riskDistribution = [];
    if (latestPerAccount) {
      const riskRows = await prisma.financeAssetSnapshot.groupBy({
        by: ['assetTypeId'],
        where: {
          ...latestPerAccount,
          assetType: { includeInTotal: true },
          account: { includeInTotal: true },
          ...ownerFilter,
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
    if (latestPerAccount) {
      const assetResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          ...latestPerAccount,
          assetType: { direction: 'ASSET', includeInTotal: true },
          account: { includeInTotal: true },
          ...ownerFilter,
        },
        _sum: { calculatedAmount: true },
      });
      assetAmount = Number(assetResult._sum.calculatedAmount || 0);

      const debtResult = await prisma.financeAssetSnapshot.aggregate({
        where: {
          ...latestPerAccount,
          assetType: { direction: 'DEBT', includeInTotal: true },
          account: { includeInTotal: true },
          ...ownerFilter,
        },
        _sum: { calculatedAmount: true },
      });
      debtAmount = Math.abs(Number(debtResult._sum.calculatedAmount || 0));
    }
    const netAssetAmount = assetAmount - debtAmount;

    // 11. 攒金汇总
    const goldSummary = await prisma.financeGold.aggregate({
      _sum: { weightGrams: true, purchaseAmount: true },
      _count: true,
    });
    const goldTotalWeight = Number(goldSummary._sum.weightGrams || 0);
    const goldTotalAmount = Number(goldSummary._sum.purchaseAmount || 0);
    const goldAvgPrice = goldTotalWeight > 0 ? goldTotalAmount / goldTotalWeight : 0;

    const priceInfo = await getCurrentPrice();
    const goldCurrentPrice = priceInfo.price;
    const goldMarketValue = goldCurrentPrice ? goldTotalWeight * goldCurrentPrice : null;
    const goldProfit = goldMarketValue !== null ? goldMarketValue - goldTotalAmount : null;

    res.json(success({
      year: targetYear,
      latestSnapshotDate: latestSnapshotDateStr,
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
      ownerTrend,
      accountTrend,
      riskDistribution,
      gold: {
        totalWeight: goldTotalWeight,
        totalAmount: goldTotalAmount,
        avgPrice: Math.round(goldAvgPrice * 100) / 100,
        count: goldSummary._count,
        currentPrice: goldCurrentPrice,
        marketValue: goldMarketValue !== null ? Math.round(goldMarketValue * 100) / 100 : null,
        profit: goldProfit !== null ? Math.round(goldProfit * 100) / 100 : null,
        priceUpdatedAt: priceInfo.updatedAt,
      },
    }));
  } catch (err) { next(err); }
});

// 按所有人筛选的资产类型分布和风险分布
router.get('/dashboard/distributions', async (req, res, next) => {
  try {
    const { ownerId, year } = req.query;
    const ownerFilter = ownerId ? { ownerId: BigInt(ownerId) } : {};
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const { filter: latestPerAccount } = await getLatestPerAccountFilter(ownerFilter, targetYear);

    if (!latestPerAccount) {
      return res.json(success({ assetTypeDistribution: [], riskDistribution: [] }));
    }

    const baseWhere = {
      ...latestPerAccount,
      account: { includeInTotal: true },
      assetType: { includeInTotal: true },
      ...ownerFilter,
    };

    // 资产类型分布
    const assetTypeRows = await prisma.financeAssetSnapshot.groupBy({
      by: ['assetTypeId'],
      where: { ...baseWhere, assetType: { direction: 'ASSET', includeInTotal: true, includeInChart: true } },
      _sum: { calculatedAmount: true },
    });
    const assetTypeIds = assetTypeRows.map((r) => r.assetTypeId);
    const assetTypes = assetTypeIds.length > 0
      ? await prisma.financeAssetType.findMany({ where: { id: { in: assetTypeIds } } })
      : [];
    const assetTypeMap = {};
    assetTypes.forEach((at) => { assetTypeMap[at.id.toString()] = at.name; });
    const assetTypeDistribution = assetTypeRows
      .map((r) => ({
        name: assetTypeMap[r.assetTypeId.toString()] || '未知',
        amount: String(r._sum.calculatedAmount || 0),
      }))
      .filter((d) => Number(d.amount) > 0);

    // 风险分布
    const riskRows = await prisma.financeAssetSnapshot.groupBy({
      by: ['assetTypeId'],
      where: baseWhere,
      _sum: { calculatedAmount: true },
    });
    const riskTypeIds = riskRows.map((r) => r.assetTypeId);
    const riskTypes = riskTypeIds.length > 0
      ? await prisma.financeAssetType.findMany({ where: { id: { in: riskTypeIds } } })
      : [];
    const riskTypeMap = {};
    riskTypes.forEach((at) => { riskTypeMap[at.id.toString()] = at.riskLevel || 'NONE'; });
    const riskAgg = {};
    riskRows.forEach((r) => {
      const level = riskTypeMap[r.assetTypeId.toString()] || 'NONE';
      riskAgg[level] = (riskAgg[level] || 0) + Number(r._sum.calculatedAmount || 0);
    });
    const riskDistribution = Object.entries(riskAgg).map(([riskLevel, amount]) => ({
      riskLevel, amount: String(amount),
    }));

    res.json(success({ assetTypeDistribution, riskDistribution }));
  } catch (err) { next(err); }
});

module.exports = router;
