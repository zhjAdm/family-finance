const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 查询所有人
router.get('/owners', async (req, res, next) => {
  try {
    const { enabled } = req.query;
    const where = {};
    if (enabled !== undefined) where.enabled = enabled === 'true';
    const list = await prisma.financeOwner.findMany({
      where,
      orderBy: { sort: 'asc' },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 新增所有人
router.post('/owners', async (req, res, next) => {
  try {
    const { name, displayName, sort, remark } = req.body;
    if (!name) {
      return res.status(400).json({ code: 400, message: '名称不能为空', data: null });
    }
    const owner = await prisma.financeOwner.create({
      data: { name, displayName, sort: sort || 0, remark },
    });
    res.status(201).json(success(owner, '创建成功'));
  } catch (err) { next(err); }
});

// 修改所有人
router.put('/owners/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { name, displayName, sort, remark } = req.body;
    const owner = await prisma.financeOwner.update({
      where: { id },
      data: { name, displayName, sort, remark },
    });
    res.json(success(owner, '更新成功'));
  } catch (err) { next(err); }
});

// 停用所有人
router.patch('/owners/:id/disable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const owner = await prisma.financeOwner.update({
      where: { id },
      data: { enabled: false },
    });
    res.json(success(owner, '已停用'));
  } catch (err) { next(err); }
});

// 启用所有人
router.patch('/owners/:id/enable', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const owner = await prisma.financeOwner.update({
      where: { id },
      data: { enabled: true },
    });
    res.json(success(owner, '已启用'));
  } catch (err) { next(err); }
});

// 删除所有人（如果被引用则拒绝）
router.delete('/owners/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    // 检查是否被账户引用
    const accountCount = await prisma.financeAccount.count({ where: { ownerId: id } });
    // 检查是否被快照引用
    const snapshotCount = await prisma.financeAssetSnapshot.count({ where: { ownerId: id } });
    if (accountCount > 0 || snapshotCount > 0) {
      return res.status(400).json({ code: 400, message: '该所有人已被账户或快照引用，不允许删除，只能停用', data: null });
    }
    await prisma.financeOwner.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

module.exports = router;
