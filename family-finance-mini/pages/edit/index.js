const { request, requireLogin, toast, confirm } = require('../../lib/api');
const { resources } = require('../../lib/resources');

Page({
  data: { fields: [], ready: false, saving: false, error: '' },
  onLoad({ type, id, date }) {
    if (!Object.prototype.hasOwnProperty.call(resources, type)) return wx.navigateBack();
    this.resource = resources[type];
    this.type = type;
    this.id = id;
    this.date = date;
    wx.setNavigationBarTitle({ title: (id ? '编辑' : '新增') + this.resource.title });
    this.load();
  },
  async load() {
    if (!requireLogin()) return;
    this.setData({ error: '', ready: false });
    try {
      const sources = [...new Set(this.resource.fields.map(field => field.source).filter(source => typeof source === 'string'))];
      const [record, lists] = await Promise.all([
        this.id ? request('/' + this.type).then(rows => rows.find(row => row.id === this.id)) : {},
        Promise.all(sources.map(source => request('/' + source))),
      ]);
      if (!record) throw new Error('记录已删除');
      this.options = Object.fromEntries(sources.map((source, index) => [source, lists[index]]));
      this.values = { ...this.resource.defaults(), ...record };
      if (!this.id && this.type === 'snapshots' && this.date) this.values.snapshotDate = this.date;
      this.renderFields();
      this.setData({ ready: true });
    } catch (error) { this.setData({ error: error.message }); }
  },
  renderFields() {
    this.setData({ fields: this.resource.fields.map(field => {
      const { key, source, type, required, label } = field;
      let value = this.values[key];
      if (type === 'date') value = value?.slice(0, 10);
      if (type !== 'choice') {
        return { ...field, value: type === 'switch' ? Boolean(value) : String(value ?? '') };
      }
      let choices;
      if (typeof source === 'string') {
        choices = this.options[source].filter(item => {
          if (item.id === value) return true;
          if (item.enabled === false) return false;
          return source !== 'accounts' || this.type !== 'snapshots' || item.ownerId === this.values.ownerId;
        }).map(item => ({ value: item.id, label: item.displayName || item.name }));
      } else {
        choices = Object.entries(source).map(([value, label]) => ({ value, label }));
      }
      choices.unshift({ value: null, label: required ? '请选择' + label : '无' });
      const selected = Math.max(0, choices.findIndex(item => item.value === value));
      return { key, label, type, required, choices, selected, value: choices[selected].label };
    }) });
  },
  input(e) { this.values[e.currentTarget.dataset.key] = e.detail.value; },
  pick(e) {
    const key = e.currentTarget.dataset.key;
    const field = this.data.fields.find(item => item.key === key);
    const selected = field.choices[Number(e.detail.value)];
    if (!selected) return;
    this.values[key] = selected.value;
    if (this.type === 'snapshots') {
      if (key === 'ownerId') {
        this.values.accountId = null;
        this.values.assetTypeId = null;
      }
      if (key === 'accountId') {
        const account = this.options.accounts.find(item => item.id === selected.value);
        const asset = this.options['asset-types'].find(item => item.id === account.defaultAssetTypeId && item.enabled);
        this.values.assetTypeId = asset?.id || null;
      }
    }
    this.renderFields();
  },
  changeDate(e) {
    this.input(e);
    this.renderFields();
  },
  async save() {
    if (!this.data.ready || this.data.saving) return;
    const body = {};
    for (const { key, label, required, type } of this.resource.fields) {
      let value = this.values[key];
      if (typeof value === 'string') value = value.trim();
      if (required && (value == null || value === '')) return toast('请填写' + label);
      if (type === 'integer' || type === 'decimal') {
        if (value == null || value === '') value = '0';
        if (type === 'integer' && (!Number.isSafeInteger(Number(value)) || Number(value) < 0)) {
          return toast(label + '必须是非负整数');
        }
        if (type === 'decimal' && !/^-?\d+(?:\.\d+)?$/.test(String(value))) return toast('请输入有效的' + label);
        if (type === 'integer') value = Number(value);
      }
      if (type === 'date') value = value.slice(0, 10);
      body[key] = value ?? (type === 'choice' ? null : '');
      if (this.type === 'accounts' && key === 'code' && !value) body[key] = null;
    }
    this.setData({ saving: true, error: '' });
    try {
      let id = this.id;
      if (this.type === 'snapshots') {
        const matches = await request('/snapshots', 'GET', {
          snapshotDate: body.snapshotDate, ownerId: body.ownerId, accountId: body.accountId, assetTypeId: body.assetTypeId,
        });
        const duplicate = matches.find(record => record.id !== id);
        if (duplicate) {
          if (id) throw new Error('该日期、账户和资产类型已有快照，请编辑已有记录');
          if (!(await confirm('这个账户在所选日期已有同类型快照，覆盖已有金额和备注？'))) return;
          id = duplicate.id;
        }
      }
      const path = '/' + this.type + (id ? '/' + id : '');
      await request(path, id ? 'PUT' : 'POST', body);
      wx.navigateBack();
    } catch (error) {
      this.setData({ error: error.message });
    } finally {
      this.setData({ saving: false });
    }
  },
});
