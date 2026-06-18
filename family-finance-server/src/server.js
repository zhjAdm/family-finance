// 支持 BigInt 的 JSON 序列化
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const app = require('./app');
const cron = require('node-cron');
const { fetchGoldPrice } = require('./services/gold-price.service');

const PORT = process.env.PORT || 3000;

// 每天早上10点自动获取金价
cron.schedule('0 10 * * *', async () => {
  console.log('[Cron] 开始获取每日金价...');
  try {
    const result = await fetchGoldPrice();
    console.log(`[Cron] 金价更新成功: ${result.price} 元/克 (${result.updatedAt})`);
  } catch (err) {
    console.error(`[Cron] 金价获取失败: ${err.message}`);
  }
}, { timezone: 'Asia/Shanghai' });

app.listen(PORT, () => {
  console.log(`🏦 家庭财务管理系统后端已启动: http://localhost:${PORT}`);
  console.log('⏰ 金价定时任务已注册: 每天 10:00 自动获取 AU9999 昨日收盘价');
});
