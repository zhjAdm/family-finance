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

// 批量导入资产类型
router.post('/asset-types/import', async (req, res, next) => {
  try {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: 400, message: '导入数据不能为空', data: null });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = i + 1;

      if (!item.name || !item.code) {
        errors.push(`第${row}行: 名称或编码为空，已跳过`);
        skipped++;
        continue;
      }
      if (item.direction && !VALID_DIRECTIONS.includes(item.direction)) {
        errors.push(`第${row}行: 方向 "${item.direction}" 无效，默认 ASSET`);
        item.direction = 'ASSET';
      }
      if (item.riskLevel && !VALID_RISK_LEVELS.includes(item.riskLevel)) {
        errors.push(`第${row}行: 风险等级 "${item.riskLevel}" 无效，默认 NONE`);
        item.riskLevel = 'NONE';
      }

      const data = {
        name: item.name,
        direction: item.direction || 'ASSET',
        riskLevel: item.riskLevel || 'NONE',
        includeInTotal: item.includeInTotal !== false,
        includeInChart: item.includeInChart !== false,
        sort: typeof item.sort === 'number' ? item.sort : (parseInt(item.sort) || 0),
        remark: item.remark || null,
      };

      const existing = await prisma.financeAssetType.findUnique({ where: { code: item.code } });
      if (existing) {
        await prisma.financeAssetType.update({ where: { code: item.code }, data });
        updated++;
      } else {
        await prisma.financeAssetType.create({ data: { ...data, code: item.code } });
        created++;
      }
    }

    res.json(success({ created, updated, skipped, errors },
      `导入完成：新增 ${created}，更新 ${updated}，跳过 ${skipped}`));
  } catch (err) { next(err); }
});

module.exports = router;
