const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 查询年度目标列表
router.get('/year-goals', async (_req, res, next) => {
  try {
    const list = await prisma.financeYearGoal.findMany({
      orderBy: { year: 'desc' },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 新增年度目标
router.post('/year-goals', async (req, res, next) => {
  try {
    const { year, targetAmount, startAmount, remark } = req.body;
    if (!year || targetAmount == null) {
      return res.status(400).json({ code: 400, message: '年份和年度目标金额为必填项', data: null });
    }
    const goal = await prisma.financeYearGoal.create({
      data: { year, targetAmount, startAmount: startAmount || 0, remark },
    });
    res.status(201).json(success(goal, '创建成功'));
  } catch (err) { next(err); }
});

// 修改年度目标
router.put('/year-goals/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { year, targetAmount, startAmount, remark } = req.body;
    const goal = await prisma.financeYearGoal.update({
      where: { id },
      data: { year, targetAmount, startAmount, remark },
    });
    res.json(success(goal, '更新成功'));
  } catch (err) { next(err); }
});

// 删除年度目标
router.delete('/year-goals/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.financeYearGoal.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

module.exports = router;
