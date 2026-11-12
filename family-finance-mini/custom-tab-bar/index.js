const { tabs } = require('../lib/navigation');

Component({
  data: { tabs, selected: 'dashboard' },
  methods: {
    switchTab(e) {
      const name = e.currentTarget.dataset.name;
      if (name !== this.data.selected) wx.switchTab({ url: '/pages/' + name + '/index' });
    },
  },
});
