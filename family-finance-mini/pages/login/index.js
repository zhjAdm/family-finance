const { login } = require('../../lib/api');

Page({
  data: { loading: false, error: '', openid: '', inviteCode: '' },
  async signIn() {
    if (this.data.loading) return;
    this.setData({ loading: true, error: '' });
    try {
      await login(this.data.inviteCode.trim());
      wx.reLaunch({ url: '/pages/dashboard/index' });
    } catch (error) {
      this.setData({ error: error.message, openid: error.data?.openid || this.data.openid });
    } finally {
      this.setData({ loading: false });
    }
  },
  inputInvite(e) { this.setData({ inviteCode: e.detail.value }); },
  copyId() { wx.setClipboardData({ data: this.data.openid }); },
});
