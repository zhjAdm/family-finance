// 支持 BigInt 的 JSON 序列化
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🏦 家庭财务管理系统后端已启动: http://localhost:${PORT}`);
});
