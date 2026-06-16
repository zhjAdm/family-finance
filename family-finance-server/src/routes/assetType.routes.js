const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

const VALID_DIRECTIONS = ['ASSET', 'DEBT'];
const VALID_RISK_LEVELS = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];

// 查询资产类型
router.get('/asset-types', async (req, res, next) => {
  try {
    const { enabled } = req.query;
    const where = {};
    if (enabled !== undefined) where.enabled = enabled === 'true';
    const list = await prisma.financeAssetType.findMany({
      where,
      orderBy: { sort: 'asc' },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 新增资产类型
router.post('/asset-types', async (req, res, next) => {
  try {
    const { name, code, direction, riskLevel, includeInTotal, includeInChart, sort, remark } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, message: '名称不能为空', data: null });
    }
    if (!code) {
      return res.status(400).json({ code: 400, message: '编码不能为空', data: null });
    }
    if (direction && !VALID_DIRECTIONS.includes(direction)) {
      return res.status(400).json({ code: 400, message: '方向只能是 ASSET 或 DEBT', data: null });
    }
    if (riskLevel && !VALID_RISK_LEVELS.includes(riskLevel)) {
      return res.status(400).json({ code: 400, message: '风险等级只能是 NONE、LOW、MEDIUM、HIGH', data: null });
    }
    const assetType = await prisma.financeAssetType.create({
      data: {
        name, code,
        direction: direction || 'ASSET',
        riskLevel: riskLevel || 'NONE',
        includeInTotal: includeInTotal !== false,
        includeInChart: includeInChart !== false,
        sort: sort || 0, remark,
      },
    });
    res.status(201).json(success(assetType, '创建成功'));
  } catch (err) { next(err); }
});

// 修改资产类型
router.put('/asset-types/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { name, code, direction, riskLevel, includeInTotal, includeInChart, sort, remark } = req.body;
    if (direction && !VALID_DIRECTIONS.includes(direction)) {
      return res.status(400).json({ code: 400, message: '方向只能是 ASSET 或 DEBT', data: null });
    }
    if (riskLevel && !VALID_RISK_LEVELS.includes(riskLevel)) {
      return res.status(400).json({ code: 400, message: '风险等级只能是 NONE、LOW、MEDIUM、HIGH', data: null });
    }
    const assetType = await prisma.financeAssetType.update({
      where: { id },
      data: { name, code, direction, riskLevel, includeInTotal, includeInChart, sort, remark },
    });
    res.json(success(assetType, '更新成功'));
  } catch (err) { next(err); }
});

// 停用资产类型
router.patch('/asset-types/:id/disable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const assetType = await prisma.financeAssetType.update({
      where: { id }, data: { enabled: false },
    });
    res.json(success(assetType, '已停用'));
  } catch (err) { next(err); }
});

// 启用资产类型
router.patch('/asset-types/:id/enable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const assetType = await prisma.financeAssetType.update({
      where: { id }, data: { enabled: true },
    });
    res.json(success(assetType, '已启用'));
  } catch (err) { next(err); }
});

// 删除资产类型（被引用则拒绝）
router.delete('/asset-types/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const accountCount = await prisma.financeAccount.count({ where: { defaultAssetTypeId: id } });
    const snapshotCount = await prisma.financeAssetSnapshot.count({ where: { assetTypeId: id } });
    if (accountCount > 0 || snapshotCount > 0) {
      return res.status(400).json({ code: 400, message: '该资产类型已被账户或快照引用，不允许删除，只能停用', data: null });
    }
    await prisma.financeAssetType.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

module.exports = router;
