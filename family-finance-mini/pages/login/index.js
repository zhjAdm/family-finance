const { login } = require('../../lib/api');

Page({
  data: { loading: false, error: '', openid: '' },
  async signIn() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: '', openid: '' });
    try {
      await login();
      wx.reLaunch({ url: '/pages/dashboard/index' });
    } catch (error) {
      this.setData({ error: error.message, openid: error.data?.openid || '' });
    } finally {
      this.setData({ loading: false });
    }
  },
  copyId() { wx.setClipboardData({ data: this.data.openid }); },
});
