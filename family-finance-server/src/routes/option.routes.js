const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 所有人选项
router.get('/options/owners', async (_req, res, next) => {
  try {
    const list = await prisma.financeOwner.findMany({
      where: { enabled: true },
      orderBy: { sort: 'asc' },
      select: { id: true, name: true, displayName: true },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 账户选项
router.get('/options/accounts', async (req, res, next) => {
  try {
    const { ownerId } = req.query;
    const where = { enabled: true };
    if (ownerId) where.ownerId = BigInt(ownerId);
    const list = await prisma.financeAccount.findMany({
      where,
      orderBy: { sort: 'asc' },
      select: {
        id: true, name: true, ownerId: true,
        defaultAssetTypeId: true,
        owner: { select: { id: true, name: true } },
        defaultAssetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 资产类型选项
router.get('/options/asset-types', async (_req, res, next) => {
  try {
    const list = await prisma.financeAssetType.findMany({
      where: { enabled: true },
      orderBy: { sort: 'asc' },
      select: { id: true, name: true, code: true, direction: true, riskLevel: true },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

module.exports = router;
