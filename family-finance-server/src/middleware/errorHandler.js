const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err);

  // Prisma 已知错误
  if (err.code === 'P2025') {
    return res.status(404).json(error('记录不存在', 404));
  }
  if (err.code === 'P2002') {
    return res.status(400).json(error('数据唯一性冲突，请检查是否已存在相同记录', 400));
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  return res.status(statusCode).json(error(message, statusCode));
}

module.exports = errorHandler;
