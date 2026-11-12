const base = 'https://bwg.zhjadm.top/mini-api';
const storageKey = 'family-finance-session';
const loginPage = '/pages/login/index';
let redirecting = false;

function token() {
  return wx.getStorageSync(storageKey);
}

function requireLogin() {
  if (token()) return true;
  if (!redirecting) {
    redirecting = true;
    wx.reLaunch({ url: loginPage, complete: () => { redirecting = false; } });
  }
  return false;
}

function logout() {
  wx.removeStorageSync(storageKey);
  requireLogin();
}

function request(path, method = 'GET', data) {
  const session = token();
  return new Promise((resolve, reject) => {
    wx.request({
      url: base + path, method, data, timeout: 15000,
      header: session ? { Authorization: 'Bearer ' + session } : {},
      success({ statusCode, data: body }) {
        if (statusCode >= 200 && statusCode < 300 && body && body.code === 0) {
          resolve(body.data);
          return;
        }
        if (statusCode === 401 && (path !== '/session' || method !== 'POST') && token() === session) logout();
        reject(Object.assign(new Error((body && body.message) || '请求失败'), { data: body && body.data }));
      },
      fail() { reject(new Error('无法连接家庭财务服务')); },
    });
  });
}

async function login(inviteCode) {
  const code = await new Promise((resolve, reject) => {
    wx.login({
      success: result => result.code ? resolve(result.code) : reject(new Error('微信登录失败')),
      fail: () => reject(new Error('微信登录失败')),
    });
  });
  const data = inviteCode ? { code, inviteCode } : { code };
  const { token: session } = await request('/session', 'POST', data);
  wx.setStorageSync(storageKey, session);
}

function exportFile(name) {
  const session = token();
  wx.downloadFile({
    url: base + '/export/' + name,
    header: { Authorization: 'Bearer ' + session },
    success(result) {
      if (result.statusCode === 401 && token() === session) return logout();
      if (result.statusCode !== 200) return toast('导出失败');
      if (!wx.shareFileMessage) return toast('请更新微信后再导出');
      wx.shareFileMessage({ filePath: result.tempFilePath, fileName: name });
    },
    fail: () => toast('导出失败'),
  });
}

function toast(title) {
  wx.showToast({ title, icon: 'none' });
}

function confirm(content) {
  return new Promise(resolve => wx.showModal({
    title: '请确认', content, success: ({ confirm }) => resolve(confirm), fail: () => resolve(false),
  }));
}

module.exports = { request, requireLogin, login, logout, exportFile, toast, confirm };
