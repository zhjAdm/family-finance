/**
 * 统一成功响应
 */
function success(data = null, message = 'success') {
  return { code: 0, message, data };
}

/**
 * 统一错误响应
 */
function error(message = '服务器错误', code = 500) {
  return { code, message, data: null };
}

module.exports = { success, error };
