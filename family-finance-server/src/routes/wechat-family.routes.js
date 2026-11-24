const { Router } = require('express');
const prisma = require('../prisma');
const { success, error } = require('../utils/response');

const router = Router();
const isMemberId = id => /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);

router.use((req, res, next) => {
  if (!req.wechat.canManageFamily) return res.status(403).json(error('只有家庭成员管理者可以使用此功能', 403));
  return next();
});

router.get('/members', async (req, res, next) => {
  try {
    const rows = await prisma.wechatFamilyMember.findMany({
      where: { openid: { notIn: [...req.wechat.configuredMembers] } },
      orderBy: { joinedAt: 'asc' },
    });
    const configured = [...req.wechat.configuredMembers].map(openid => ({
      openid, owner: openid === req.wechat.openid,
    }));
    res.json(success({
      configured,
      pending: rows.filter(member => !member.approvedAt),
      members: rows.filter(member => member.approvedAt),
    }));
  } catch (err) { next(err); }
});

router.post('/members/:id/approve', async (req, res, next) => {
  const { id } = req.params;
  if (!isMemberId(id)) return res.status(400).json(error('无效的成员编号', 400));
  try {
    const { count } = await prisma.wechatFamilyMember.updateMany({
      where: { id, approvedAt: null }, data: { approvedAt: new Date() },
    });
    if (!count) return res.status(404).json(error('该申请不存在或已处理', 404));
    return res.json(success(null, '已批准'));
  } catch (err) { return next(err); }
});

// Rejects a pending request or removes an approved member.
router.delete('/members/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!isMemberId(id)) return res.status(400).json(error('无效的成员编号', 400));
  try {
    await prisma.wechatFamilyMember.deleteMany({
      where: { id, openid: { notIn: [...req.wechat.configuredMembers] } },
    });
    return res.json(success(null, '成员已移除'));
  } catch (err) { return next(err); }
});

module.exports = router;
