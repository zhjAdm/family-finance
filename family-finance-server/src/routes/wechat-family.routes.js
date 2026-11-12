const { Router } = require('express');
const prisma = require('../prisma');
const { isOpenid, createInvite } = require('../wechat-family');
const { success, error } = require('../utils/response');

const router = Router();

router.use((req, res, next) => {
  if (!req.wechat.canManageFamily) return res.status(403).json(error('只有家庭成员管理者可以使用此功能', 403));
  return next();
});

router.get('/members', async (req, res, next) => {
  try {
    const members = await prisma.wechatFamilyMember.findMany({ orderBy: { joinedAt: 'asc' } });
    const configured = [...req.wechat.configuredMembers].map(openid => ({
      openid, owner: openid === req.wechat.openid,
    }));
    res.json(success({ configured, members: members.filter(member => !req.wechat.configuredMembers.has(member.openid)) }));
  } catch (err) { next(err); }
});

router.post('/members', async (req, res, next) => {
  const openid = typeof req.body?.openid === 'string' ? req.body.openid.trim() : '';
  if (!isOpenid(openid)) return res.status(400).json(error('请输入有效的绑定编号', 400));
  if (req.wechat.configuredMembers.has(openid)) return res.status(409).json(error('这个编号已在部署配置中', 409));
  try {
    const member = await prisma.wechatFamilyMember.upsert({
      where: { openid }, update: {}, create: { openid },
    });
    return res.status(201).json(success(member, '成员已添加'));
  } catch (err) { return next(err); }
});

router.delete('/members/:id', async (req, res, next) => {
  const { id } = req.params;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id)) {
    return res.status(400).json(error('无效的成员编号', 400));
  }
  try {
    await prisma.wechatFamilyMember.deleteMany({
      where: { id, openid: { notIn: [...req.wechat.configuredMembers] } },
    });
    return res.json(success(null, '成员已移除'));
  } catch (err) { return next(err); }
});

router.post('/invites', async (req, res, next) => {
  try {
    return res.status(201).json(success(await createInvite(req.wechat.openid)));
  } catch (err) { return next(err); }
});

module.exports = router;
