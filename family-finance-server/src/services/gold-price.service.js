const prisma = require('../prisma');

const GOLD_PRICE_API = 'https://api.istero.com/resource/v1/gold/price';
const CONFIG_KEY_TOKEN = 'gold_api_token';
const CONFIG_KEY_PRICE = 'gold_current_price';
const CONFIG_KEY_UPDATED_AT = 'gold_price_updated_at';

async function getApiToken() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: CONFIG_KEY_TOKEN },
  });
  return config?.value || null;
}

async function getCurrentPrice() {
  const priceConfig = await prisma.systemConfig.findUnique({
    where: { key: CONFIG_KEY_PRICE },
  });
  const updatedAtConfig = await prisma.systemConfig.findUnique({
    where: { key: CONFIG_KEY_UPDATED_AT },
  });
  return {
    price: priceConfig?.value ? Number(priceConfig.value) : null,
    updatedAt: updatedAtConfig?.value || null,
  };
}

async function fetchGoldPrice() {
  const token = await getApiToken();
  if (!token) {
    throw new Error('未配置金价API Token，请先在攒金设置中配置');
  }

  const res = await fetch(GOLD_PRICE_API, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API请求失败: ${res.status} ${text}`);
  }

  const json = await res.json();
  if (json.code !== 0 && json.code !== 200) {
    throw new Error(`API返回错误: ${json.message || JSON.stringify(json)}`);
  }

  const data = json.data;
  if (!Array.isArray(data)) {
    throw new Error('API返回数据格式异常');
  }

  const au9999 = data.find(item =>
    item.dir === 'SH_Au9999' ||
    item.dir === 'au9999' ||
    item.title === 'AU9999' ||
    item.title === '黄金99.99'
  );
  if (!au9999) {
    throw new Error('未找到 AU9999 数据');
  }

  console.log('[GoldPrice] AU9999 原始数据:', JSON.stringify(au9999));

  // 优先取 buyprice，fallback 到 lastclosingprice / sellprice / price
  const rawPrice = au9999.buyprice ?? au9999.lastclosingprice ?? au9999.sellprice ?? au9999.price;
  const price = rawPrice != null && rawPrice !== 0 ? Number(rawPrice) : null;
  if (!price) {
    throw new Error('AU9999 价格数据为空（可能尚未开盘或非交易日），请稍后重试');
  }

  const now = new Date().toISOString();

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY_PRICE },
    update: { value: String(price) },
    create: { key: CONFIG_KEY_PRICE, value: String(price) },
  });

  await prisma.systemConfig.upsert({
    where: { key: CONFIG_KEY_UPDATED_AT },
    update: { value: now },
    create: { key: CONFIG_KEY_UPDATED_AT, value: now },
  });

  return { price: Number(price), updatedAt: now };
}

module.exports = {
  getApiToken,
  getCurrentPrice,
  fetchGoldPrice,
};
