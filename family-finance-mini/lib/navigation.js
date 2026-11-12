const tabs = [
  { name: 'dashboard', label: '看板', icon: 'data-analysis' },
  { name: 'snapshots', label: '记录', icon: 'camera' },
  { name: 'golds', label: '攒金', icon: 'coin' },
  { name: 'year-goals', label: '目标', icon: 'flag' },
  { name: 'settings', label: '配置', icon: 'setting' },
];

function selectTab(page, selected) {
  const bar = page.getTabBar && page.getTabBar();
  if (bar) bar.setData({ selected });
}

module.exports = { tabs, selectTab };
