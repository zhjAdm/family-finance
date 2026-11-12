const { createHmac, timingSafeEqual } = require('node:crypto');
const { success, error } = require('./utils/response');

const sessionDuration = 7 * 24 * 60 * 60 * 1000;

function getConfig() {
  const { WECHAT_APP_ID: appId, WECHAT_APP_SECRET: appSecret, WECHAT_SESSION_SECRET: secret } = process.env;
  const allowed = new Set((process.env.WECHAT_ALLOWED_OPENIDS || '').split(',').map(id => id.trim()).filter(Boolean));
  return appId && appSecret && secret && Buffer.byteLength(secret) >= 32
    ? { appId, appSecret, secret, allowed }
    : null;
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function issueToken(openid, config, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ openid, exp: now + sessionDuration })).toString('base64url');
  return `${payload}.${sign(payload, config.secret)}`;
}

function verifyToken(token, config, now = Date.now()) {
  if (!/^[\w-]{1,400}\.[\w-]{43}$/.test(token)) return null;
  const [payload, signature] = token.split('.');
  const expected = sign(payload, config.secret);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const { openid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return Number.isSafeInteger(exp) && exp > now && config.allowed.has(openid) ? openid : null;
  } catch {
    return null;
  }
}

async function login(req, res) {
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
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok) return res.status(502).json(error('微信登录服务暂时不可用', 502));
    const { openid, errcode } = await response.json();
    if (errcode || typeof openid !== 'string' || !openid) {
      return res.status(401).json(error('微信登录失败，请重试或检查小程序配置', 401));
    }
    if (!config.allowed.has(openid)) {
      return res.status(403).json({ ...error('请将绑定编号交给部署者加入家庭名单', 403), data: { openid } });
    }
    return res.json(success({ token: issueToken(openid, config) }));
  } catch {
    return res.status(502).json(error('微信登录服务暂时不可用', 502));
  }
}

function requireSession(req, res, next) {
  const config = getConfig();
  if (!config) return res.status(503).json(error('微信登录尚未配置', 503));
  const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
  if (!match || !verifyToken(match[1], config)) return res.status(401).json(error('请重新登录', 401));
  return next();
}

module.exports = { login, requireSession, issueToken, verifyToken };
