const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 查询资产快照
router.get('/snapshots', async (req, res, next) => {
  try {
    const { snapshotDate, startDate, endDate, ownerId, accountId, assetTypeId } = req.query;
    const where = {};
    if (snapshotDate) where.snapshotDate = new Date(snapshotDate);
    if (startDate && endDate) {
      where.snapshotDate = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      where.snapshotDate = { gte: new Date(startDate) };
    } else if (endDate) {
      where.snapshotDate = { lte: new Date(endDate) };
    }
    if (ownerId) where.ownerId = BigInt(ownerId);
    if (accountId) where.accountId = BigInt(accountId);
    if (assetTypeId) where.assetTypeId = BigInt(assetTypeId);

    const list = await prisma.financeAssetSnapshot.findMany({
      where,
      orderBy: [{ snapshotDate: 'desc' }, { id: 'asc' }],
      include: {
        owner: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        assetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 获取最近一次快照日期
router.get('/snapshots/latest-date', async (_req, res, next) => {
  try {
    const result = await prisma.financeAssetSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    });
    res.json(success(result ? result.snapshotDate : null));
  } catch (err) { next(err); }
});

// 计算 calculatedAmount
function calcAmount(amount, direction) {
  const absAmount = Math.abs(Number(amount));
  return direction === 'DEBT' ? -absAmount : absAmount;
}

// 单条新增快照
router.post('/snapshots', async (req, res, next) => {
  try {
    const { snapshotDate, ownerId, accountId, assetTypeId, amount, remark } = req.body;

    // 如果是批量新增
    if (req.body.items && Array.isArray(req.body.items)) {
      const items = req.body.items;
      if (!snapshotDate) {
        return res.status(400).json({ code: 400, message: '快照日期不能为空', data: null });
      }

      const snapshots = [];
      for (const item of items) {
        if (!item.ownerId || !item.accountId || !item.assetTypeId || item.amount == null) {
          return res.status(400).json({ code: 400, message: '所有人、账户、资产类型、金额为必填项', data: null });
        }
        const assetType = await prisma.financeAssetType.findUnique({ where: { id: BigInt(item.assetTypeId) } });
        if (!assetType) {
          return res.status(400).json({ code: 400, message: `资产类型不存在: ${item.assetTypeId}`, data: null });
        }
        const calculatedAmount = calcAmount(item.amount, assetType.direction);

        const snapshot = await prisma.financeAssetSnapshot.create({
          data: {
            snapshotDate: new Date(snapshotDate),
            ownerId: BigInt(item.ownerId),
            accountId: BigInt(item.accountId),
            assetTypeId: BigInt(item.assetTypeId),
            amount: item.amount,
            calculatedAmount,
            remark: item.remark,
          },
          include: {
            owner: { select: { id: true, name: true } },
            account: { select: { id: true, name: true } },
            assetType: { select: { id: true, name: true, direction: true } },
          },
        });
        snapshots.push(snapshot);
      }
      return res.status(201).json(success(snapshots, `成功创建 ${snapshots.length} 条快照`));
    }

    // 单条新增
    if (!snapshotDate || !ownerId || !accountId || !assetTypeId || amount == null) {
      return res.status(400).json({ code: 400, message: '快照日期、所有人、账户、资产类型、金额为必填项', data: null });
    }

    const assetType = await prisma.financeAssetType.findUnique({ where: { id: BigInt(assetTypeId) } });
    if (!assetType) {
      return res.status(400).json({ code: 400, message: '资产类型不存在', data: null });
    }
    const calculatedAmount = calcAmount(amount, assetType.direction);

    const snapshot = await prisma.financeAssetSnapshot.create({
      data: {
        snapshotDate: new Date(snapshotDate),
        ownerId: BigInt(ownerId),
        accountId: BigInt(accountId),
        assetTypeId: BigInt(assetTypeId),
        amount,
        calculatedAmount,
        remark,
      },
      include: {
        owner: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        assetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.status(201).json(success(snapshot, '创建成功'));
  } catch (err) { next(err); }
});

// 修改快照
router.put('/snapshots/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { snapshotDate, ownerId, accountId, assetTypeId, amount, remark } = req.body;

    let calculatedAmount = undefined;
    if (amount != null) {
      let direction;
      if (assetTypeId) {
        const assetType = await prisma.financeAssetType.findUnique({ where: { id: BigInt(assetTypeId) } });
        direction = assetType?.direction;
      } else {
        const existing = await prisma.financeAssetSnapshot.findUnique({
          where: { id },
          include: { assetType: true },
        });
        direction = existing?.assetType?.direction;
      }
      if (direction) {
        calculatedAmount = calcAmount(amount, direction);
      }
    }

    const data = {};
    if (snapshotDate) data.snapshotDate = new Date(snapshotDate);
    if (ownerId) data.ownerId = BigInt(ownerId);
    if (accountId) data.accountId = BigInt(accountId);
    if (assetTypeId) data.assetTypeId = BigInt(assetTypeId);
    if (amount != null) data.amount = amount;
    if (calculatedAmount !== undefined) data.calculatedAmount = calculatedAmount;
    if (remark !== undefined) data.remark = remark;

    const snapshot = await prisma.financeAssetSnapshot.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true } },
        account: { select: { id: true, name: true } },
        assetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.json(success(snapshot, '更新成功'));
  } catch (err) { next(err); }
});

// 删除单条快照
router.delete('/snapshots/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.financeAssetSnapshot.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

// 按日期删除整组快照
router.delete('/snapshots/by-date/:snapshotDate', async (req, res, next) => {
  try {
    const date = new Date(req.params.snapshotDate);
    const result = await prisma.financeAssetSnapshot.deleteMany({
      where: { snapshotDate: date },
    });
    res.json(success({ deletedCount: result.count }, `已删除 ${result.count} 条快照`));
  } catch (err) { next(err); }
});

// 复制最近一次快照
router.post('/snapshots/copy-latest', async (req, res, next) => {
  try {
    const { targetDate } = req.body;
    if (!targetDate) {
      return res.status(400).json({ code: 400, message: '目标日期不能为空', data: null });
    }

    const targetDateObj = new Date(targetDate);

    // 检查目标日期是否已有快照
    const existingCount = await prisma.financeAssetSnapshot.count({
      where: { snapshotDate: targetDateObj },
    });
    if (existingCount > 0) {
      return res.status(400).json({ code: 400, message: `目标日期 ${targetDate} 已有快照数据，请勿重复复制`, data: null });
    }

    // 查询最新快照日期
    const latest = await prisma.financeAssetSnapshot.findFirst({
      orderBy: { snapshotDate: 'desc' },
      select: { snapshotDate: true },
    });
    if (!latest) {
      return res.status(400).json({ code: 400, message: '没有可复制的快照数据', data: null });
    }

    // 获取该日期下所有快照
    const sourceSnapshots = await prisma.financeAssetSnapshot.findMany({
      where: { snapshotDate: latest.snapshotDate },
    });

    // 复制到目标日期
    const newSnapshots = [];
    for (const s of sourceSnapshots) {
      const snapshot = await prisma.financeAssetSnapshot.create({
        data: {
          snapshotDate: targetDateObj,
          ownerId: s.ownerId,
          accountId: s.accountId,
          assetTypeId: s.assetTypeId,
          amount: s.amount,
          calculatedAmount: s.calculatedAmount,
          remark: s.remark,
        },
        include: {
          owner: { select: { id: true, name: true } },
          account: { select: { id: true, name: true } },
          assetType: { select: { id: true, name: true, direction: true } },
        },
      });
      newSnapshots.push(snapshot);
    }

    res.status(201).json(success({
      sourceDate: latest.snapshotDate,
      targetDate: targetDateObj,
      count: newSnapshots.length,
      snapshots: newSnapshots,
    }, `成功从 ${latest.snapshotDate.toISOString().split('T')[0]} 复制 ${newSnapshots.length} 条快照到 ${targetDate}`));
  } catch (err) { next(err); }
});

module.exports = router;
