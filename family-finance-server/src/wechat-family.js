const prisma = require('./prisma');

const isOpenid = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);

// Returns the member for this openid, recording a pending request on first login.
function findOrRequest(openid) {
  return prisma.wechatFamilyMember.upsert({ where: { openid }, update: {}, create: { openid } });
}

module.exports = { isOpenid, findOrRequest };
