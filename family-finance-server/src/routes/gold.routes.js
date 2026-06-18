const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');
const { fetchGoldPrice, getCurrentPrice } = require('../services/gold-price.service');

const router = Router();

// 查询黄金记录列表
router.get('/golds', async (req, res, next) => {
  try {
    const list = await prisma.financeGold.findMany({
      orderBy: { purchaseDate: 'desc' },
    });
    res.json(success(list));
  } catch (err) { next(err); }
});

// 黄金汇总统计（含当前金价和收益）
router.get('/golds/summary', async (req, res, next) => {
  try {
    const result = await prisma.financeGold.aggregate({
      _sum: { weightGrams: true, purchaseAmount: true },
      _count: true,
    });

    const totalWeight = Number(result._sum.weightGrams || 0);
    const totalAmount = Number(result._sum.purchaseAmount || 0);
    const avgPrice = totalWeight > 0 ? totalAmount / totalWeight : 0;

    const priceInfo = await getCurrentPrice();
    const currentPrice = priceInfo.price;
    const marketValue = currentPrice ? totalWeight * currentPrice : null;
    const profit = marketValue !== null ? marketValue - totalAmount : null;

    res.json(success({
      totalWeight,
      totalAmount,
      avgPrice: Math.round(avgPrice * 100) / 100,
      count: result._count,
      currentPrice,
      marketValue: marketValue !== null ? Math.round(marketValue * 100) / 100 : null,
      profit: profit !== null ? Math.round(profit * 100) / 100 : null,
      priceUpdatedAt: priceInfo.updatedAt,
    }));
  } catch (err) { next(err); }
});

// 获取当前金价（从外部API拉取）
router.post('/golds/fetch-price', async (req, res, next) => {
  try {
    const result = await fetchGoldPrice();
    res.json(success(result, '金价更新成功'));
  } catch (err) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

// 新增黄金记录
router.post('/golds', async (req, res, next) => {
  try {
    const { purchaseDate, channel, weightGrams, purchaseAmount, remark } = req.body;
    if (!purchaseDate || !channel || weightGrams == null || purchaseAmount == null) {
      return res.status(400).json({ code: 400, message: '日期、渠道、克重和金额为必填项', data: null });
    }
    const pricePerGram = weightGrams > 0 ? purchaseAmount / weightGrams : 0;
    const record = await prisma.financeGold.create({
      data: {
        purchaseDate: new Date(purchaseDate),
        channel,
        weightGrams,
        purchaseAmount,
        pricePerGram,
        remark,
      },
    });
    res.status(201).json(success(record, '创建成功'));
  } catch (err) { next(err); }
});

// 修改黄金记录
router.put('/golds/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { purchaseDate, channel, weightGrams, purchaseAmount, remark } = req.body;
    const pricePerGram = weightGrams > 0 ? purchaseAmount / weightGrams : 0;
    const data = {
      channel,
      weightGrams,
      purchaseAmount,
      pricePerGram,
      remark,
    };
    if (purchaseDate) data.purchaseDate = new Date(purchaseDate);
    const record = await prisma.financeGold.update({
      where: { id },
      data,
    });
    res.json(success(record, '更新成功'));
  } catch (err) { next(err); }
});

// 删除黄金记录
router.delete('/golds/:id', async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.financeGold.delete({ where: { id } });
    res.json(success(null, '删除成功'));
  } catch (err) { next(err); }
});

module.exports = router;
