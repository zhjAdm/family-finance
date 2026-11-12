const { createHash, randomBytes } = require('node:crypto');
const prisma = require('./prisma');

const invitationDuration = 24 * 60 * 60 * 1000;
const isOpenid = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const isInviteCode = value => typeof value === 'string' && /^[A-Za-z0-9_-]{16}$/.test(value);
const digest = code => createHash('sha256').update(code).digest('hex');

async function createInvite(ownerOpenid) {
  const code = randomBytes(12).toString('base64url');
  const expiresAt = new Date(Date.now() + invitationDuration);
  await prisma.wechatFamilyInvite.create({ data: { digest: digest(code), ownerOpenid, expiresAt } });
  return { code, expiresAt };
}

async function redeemInvite(code, ownerOpenid, openid) {
  try {
    return await prisma.$transaction(async tx => {
      const existing = await tx.wechatFamilyMember.findUnique({ where: { openid } });
      if (existing) return existing;
      const now = new Date();
      const claimed = await tx.wechatFamilyInvite.updateMany({
        where: { digest: digest(code), ownerOpenid, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (!claimed.count) return tx.wechatFamilyMember.findUnique({ where: { openid } });
      return tx.wechatFamilyMember.create({ data: { openid } });
    });
  } catch (err) {
    if (err.code !== 'P2002') throw err;
    // Another request added the member. The failed transaction releases its invitation.
    const existing = await prisma.wechatFamilyMember.findUnique({ where: { openid } });
    if (existing) return existing;
    throw err;
  }
}

module.exports = { isOpenid, isInviteCode, createInvite, redeemInvite };
