const { request, requireLogin, confirm, toast } = require('../../lib/api');

function formatExpiry(value) {
  const date = new Date(value);
  const pad = number => String(number).padStart(2, '0');
  return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

Page({
  data: { ready: false, busy: false, error: '', openid: '', configured: [], members: [], invitation: null },
  onShow() { if (requireLogin()) this.load(); },
  async load() {
    try {
      const { configured, members } = await request('/family/members');
      this.setData({ ready: true, error: '', configured, members });
    } catch (error) {
      this.setData({ error: error.message });
    }
  },
  async perform(action) {
    if (!this.data.ready || this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try {
      await action();
    } catch (error) {
      this.setData({ error: error.message });
    } finally {
      this.setData({ busy: false });
    }
  },
  generate() {
    return this.perform(async () => {
      const { code, expiresAt } = await request('/family/invites', 'POST');
      this.setData({ invitation: { code, expiresAt: formatExpiry(expiresAt) } });
    });
  },
  copyInvite() {
    if (this.data.invitation) wx.setClipboardData({ data: this.data.invitation.code });
  },
  inputOpenid(e) { this.setData({ openid: e.detail.value }); },
  addMember() {
    const openid = this.data.openid.trim();
    if (!openid) return toast('请输入绑定编号');
    return this.perform(async () => {
      await request('/family/members', 'POST', { openid });
      this.setData({ openid: '' });
      await this.load();
    });
  },
  removeMember(e) {
    const id = e.currentTarget.dataset.id;
    return this.perform(async () => {
      if (!(await confirm('移除该成员？该成员将退出登录，需要新邀请码才能再次加入。'))) return;
      await request('/family/members/' + encodeURIComponent(id), 'DELETE');
      await this.load();
    });
  },
});
