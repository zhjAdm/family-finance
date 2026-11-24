const { createHmac, timingSafeEqual } = require('node:crypto');
const prisma = require('./prisma');
const { isOpenid, findOrRequest } = require('./wechat-family');
const { success, error } = require('./utils/response');

const sessionDuration = 7 * 24 * 60 * 60 * 1000;

function getConfig() {
  const { WECHAT_APP_ID: appId, WECHAT_APP_SECRET: appSecret, WECHAT_SESSION_SECRET: secret } = process.env;
  const owner = (process.env.WECHAT_OWNER_OPENID || '').trim();
  const allowed = new Set((process.env.WECHAT_ALLOWED_OPENIDS || '').split(',').map(id => id.trim()).filter(Boolean));
  if (owner) allowed.add(owner);
  return appId && appSecret && secret && Buffer.byteLength(secret) >= 32
    ? { appId, appSecret, secret, allowed, owner }
    : null;
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function issueToken(openid, config, membershipId) {
  const claims = { openid, exp: Date.now() + sessionDuration, membershipId };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(payload, config.secret)}`;
}

function readToken(token, config) {
  if (!/^[\w-]{1,400}\.[\w-]{43}$/.test(token)) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload, config.secret);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return isOpenid(claims.openid) && Number.isSafeInteger(claims.exp) && claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

async function login(req, res, next) {
  const config = getConfig();
  if (!config) return res.status(503).json(error('微信登录尚未配置', 503));
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim() || code.length > 256) {
    return res.status(400).json(error('缺少有效的微信登录凭证', 400));
  }
  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.search = new URLSearchParams({
    appid: config.appId, secret: config.appSecret, js_code: code, grant_type: 'authorization_code',
  });
  let result;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok) return res.status(502).json(error('微信登录服务暂时不可用', 502));
    result = await response.json();
  } catch {
    return res.status(502).json(error('微信登录服务暂时不可用', 502));
  }

  const { openid, errcode } = result || {};
  if (errcode || !isOpenid(openid)) {
    return res.status(401).json(error('微信登录失败，请重试或检查小程序配置', 401));
  }
  if (config.allowed.has(openid)) return res.json(success({ token: issueToken(openid, config) }));

  try {
    const member = await findOrRequest(openid);
    if (!member.approvedAt) {
      return res.status(403).json(error('已提交加入申请，请等待家庭成员管理者批准', 403));
    }
    return res.json(success({ token: issueToken(openid, config, member.id) }));
  } catch (err) {
    return next(err);
  }
}

async function requireSession(req, res, next) {
  const config = getConfig();
  if (!config) return res.status(503).json(error('微信登录尚未配置', 503));
  const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
  const claims = match && readToken(match[1], config);
  if (!claims) return res.status(401).json(error('请重新登录', 401));

  try {
    if (!config.allowed.has(claims.openid)) {
      if (typeof claims.membershipId !== 'string') return res.status(401).json(error('请重新登录', 401));
      const member = await prisma.wechatFamilyMember.findUnique({ where: { openid: claims.openid } });
      if (member?.id !== claims.membershipId || !member.approvedAt) return res.status(401).json(error('请重新登录', 401));
    }
    req.wechat = {
      openid: claims.openid,
      canManageFamily: claims.openid === config.owner,
      configuredMembers: config.allowed,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, requireSession };
