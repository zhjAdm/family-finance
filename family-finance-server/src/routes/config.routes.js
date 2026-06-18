const { Router } = require('express');
const prisma = require('../prisma');
const { success } = require('../utils/response');

const router = Router();

// 读取配置
router.get('/config/:key', async (req, res, next) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: req.params.key },
    });
    res.json(success(config?.value || null));
  } catch (err) { next(err); }
});

// 写入配置（upsert）
router.put('/config/:key', async (req, res, next) => {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ code: 400, message: 'value 不能为空', data: null });
    }
    const config = await prisma.systemConfig.upsert({
      where: { key: req.params.key },
      update: { value: String(value) },
      create: { key: req.params.key, value: String(value) },
    });
    res.json(success(config, '保存成功'));
  } catch (err) { next(err); }
});

module.exports = router;
