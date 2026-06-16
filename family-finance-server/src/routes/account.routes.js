const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

const VALID_CATEGORIES = ['BANK', 'WECHAT', 'ALIPAY', 'SECURITY', 'FUND', 'CASH', 'LOAN', 'OTHER'];

// 查询账户
router.get('/accounts', async (req, res, next) => {
  try {
    const { ownerId, enabled } = req.query;
    const where = {};
    if (ownerId) where.ownerId = BigInt(ownerId);
    if (enabled !== undefined) where.enabled = enabled === 'true';
    const list = await prisma.financeAccount.findMany({
      where,
      orderBy: { sort: 'asc' },
      include: {
        owner: { select: { id: true, name: true } },
        defaultAssetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 新增账户
router.post('/accounts', async (req, res, next) => {
  try {
    const { name, code, ownerId, defaultAssetTypeId, accountCategory, includeInTotal, sort, remark } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, message: '账户名称不能为空', data: null });
    }
    if (!ownerId) {
      return res.status(400).json({ code: 400, message: '所有人不能为空', data: null });
    }
    if (accountCategory && !VALID_CATEGORIES.includes(accountCategory)) {
      return res.status(400).json({ code: 400, message: '无效的账户分类', data: null });
    }
    const account = await prisma.financeAccount.create({
      data: {
        name, code,
        ownerId: BigInt(ownerId),
        defaultAssetTypeId: defaultAssetTypeId ? BigInt(defaultAssetTypeId) : null,
        accountCategory,
        includeInTotal: includeInTotal !== false,
        sort: sort || 0, remark,
      },
      include: {
        owner: { select: { id: true, name: true } },
        defaultAssetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.status(201).json(success(account, '创建成功'));
  } catch (err) { next(err); }
});

// 修改账户
router.put('/accounts/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { name, code, ownerId, defaultAssetTypeId, accountCategory, includeInTotal, sort, remark } = req.body;
    if (accountCategory && !VALID_CATEGORIES.includes(accountCategory)) {
      return res.status(400).json({ code: 400, message: '无效的账户分类', data: null });
    }
    const data = { name, code, accountCategory, includeInTotal, sort, remark };
    if (ownerId) data.ownerId = BigInt(ownerId);
    if (defaultAssetTypeId !== undefined) {
      data.defaultAssetTypeId = defaultAssetTypeId ? BigInt(defaultAssetTypeId) : null;
    }
    const account = await prisma.financeAccount.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true } },
        defaultAssetType: { select: { id: true, name: true, direction: true } },
      },
    });
    res.json(success(account, '更新成功'));
  } catch (err) { next(err); }
});

// 停用账户
router.patch('/accounts/:id/disable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const account = await prisma.financeAccount.update({
      where: { id }, data: { enabled: false },
    });
    res.json(success(account, '已停用'));
  } catch (err) { next(err); }
});

// 启用账户
router.patch('/accounts/:id/enable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const account = await prisma.financeAccount.update({
      where: { id }, data: { enabled: true },
    });
    res.json(success(account, '已启用'));
  } catch (err) { next(err); }
});

// 删除账户（被快照引用则拒绝）
router.delete('/accounts/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const snapshotCount = await prisma.financeAssetSnapshot.count({ where: { accountId: id } });
    if (snapshotCount > 0) {
      return res.status(400).json({ code: 400, message: '该账户已被快照引用，不允许删除，只能停用', data: null });
    }
    await prisma.financeAccount.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

module.exports = router;
