const { drawChart } = require('./draw');

Component({
  properties: { chart: { type: Object, value: null } },
  data: { tooltip: null },
  observers: {
    chart() { this.render(); },
  },
  lifetimes: {
    ready() {
      this.chartReady = true;
      this.render();
    },
    detached() { this.chartReady = false; },
  },
  pageLifetimes: {
    resize() { this.render(); },
  },
  methods: {
    render() {
      if (!this.chartReady || !this.data.chart) return;
      const chart = this.data.chart;
      const revision = this.revision = (this.revision || 0) + 1;
      this.hit = null;
      if (this.data.tooltip) this.setData({ tooltip: null });
      wx.nextTick(() => {
        if (!this.chartReady || revision !== this.revision) return;
        this.createSelectorQuery().select('.finance-canvas').fields({ node: true, size: true }).exec(([size]) => {
          if (!this.chartReady || revision !== this.revision || !size?.node || !size.width || !size.height) return;
          const canvas = size.node;
          const ratio = wx.getWindowInfo().pixelRatio || 1;
          canvas.width = Math.round(size.width * ratio);
          canvas.height = Math.round(size.height * ratio);
          const context = canvas.getContext('2d');
          context.scale(ratio, ratio);
          this.chartSize = { width: size.width, height: size.height };
          this.hit = drawChart(context, size.width, size.height, chart);
        });
      });
    },
    showValue(e) {
      if (!this.hit) return;
      const point = e.changedTouches?.[0];
      if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
        this.placeTooltip(point.x, point.y);
      } else if (Number.isFinite(point?.clientX) && Number.isFinite(point?.clientY)) {
        const hit = this.hit;
        this.createSelectorQuery().select('.finance-canvas').boundingClientRect(rect => {
          if (rect && hit === this.hit) this.placeTooltip(point.clientX - rect.left, point.clientY - rect.top);
        }).exec();
      }
    },
    placeTooltip(x, y) {
      const tooltip = this.hit(x, y);
      if (!tooltip) return this.closeTooltip();
      const { width, height } = this.chartSize;
      const gap = 8;
      const popupWidth = Math.min(216, width);
      const bodyHeight = Math.min(tooltip.items.length * 24, Math.max(24, height - 42), 144);
      const popupHeight = bodyHeight + 40;
      const left = x + popupWidth + gap <= width ? x + gap : Math.max(0, x - popupWidth - gap);
      const top = y + popupHeight + gap <= height ? y + gap : Math.max(0, y - popupHeight - gap);
      this.setData({ tooltip: { ...tooltip, left, top, width: popupWidth, bodyHeight } });
    },
    closeTooltip() { this.setData({ tooltip: null }); },
  },
});
