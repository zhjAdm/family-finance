const palette = ['#409EFF', '#67C23A', '#7C6FF7', '#E6A23C', '#F56C6C', '#36CFC9', '#FF85C0', '#B37FEB'];
const axisColor = '#86909C';
const gridColor = 'rgba(0,0,0,0.06)';
const currency = value => '¥' + Number(value).toFixed(2);
const tenThousands = value => (value / 10000).toFixed(2) + '万';

function domain(values) {
  let min = 0;
  let max = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (min === max) max = min + 1;
  return [min, max];
}

function trace(ctx, points) {
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const middle = (from.x + to.x) / 2;
    ctx.bezierCurveTo(middle, from.y, middle, to.y, to.x, to.y);
  }
}

function drawLine(ctx, width, height, chart) {
  const { months, series } = chart;
  if (!months.length || !series.length) return () => null;
  const [min, max] = domain(series.flatMap(item => item.values));
  const left = 53;
  const right = width - 15;
  const top = 12;
  const bottom = height - 26;
  const x = i => months.length === 1 ? (left + right) / 2 : left + i * (right - left) / (months.length - 1);
  const y = value => bottom - (value - min) / (max - min) * (bottom - top);
  ctx.font = '10px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const value = min + (max - min) * i / 4;
    const position = y(value);
    ctx.fillStyle = axisColor;
    ctx.fillText(tenThousands(value), left - 5, position, left - 8);
    ctx.strokeStyle = gridColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(left, position);
    ctx.lineTo(right, position);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.textAlign = 'center';
  const labelStep = Math.max(1, Math.ceil(months.length * 34 / Math.max(1, right - left)));
  months.forEach((month, i) => {
    if (i % labelStep === 0 || i === months.length - 1) ctx.fillText(month, x(i), bottom + 13);
  });
  for (const item of series) {
    const points = item.values.map((value, i) => ({ x: x(i), y: y(value) }));
    if (!points.length) continue;
    if (item.area && points.length > 1) {
      const gradient = ctx.createLinearGradient(0, top, 0, bottom);
      gradient.addColorStop(0, 'rgba(64,158,255,0.18)');
      gradient.addColorStop(1, 'rgba(64,158,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      trace(ctx, points);
      ctx.lineTo(points[points.length - 1].x, y(0));
      ctx.lineTo(points[0].x, y(0));
      ctx.closePath();
      ctx.fill();
    }
    ctx.lineWidth = item.area ? 2.5 : 2;
    ctx.strokeStyle = item.color;
    ctx.beginPath();
    trace(ctx, points);
    ctx.stroke();
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, item.area ? 3 : 2, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }
  return (px, py) => {
    if (px < left - 10 || px > right + 10 || py < 0 || py > bottom + 15) return null;
    const index = Math.max(0, Math.min(months.length - 1, Math.round((px - left) / (right - left) * (months.length - 1))));
    return { title: months[index], items: series.map((item, key) => ({ key, label: item.name, color: item.color, value: currency(item.values[index] || 0) })) };
  };
}

function drawPie(ctx, width, height, chart) {
  const entries = chart.items.filter(item => item.amount > 0);
  const total = entries.reduce((sum, item) => sum + item.amount, 0);
  const x = width / 2;
  const y = height / 2;
  const radius = Math.min(width, height) * (chart.type === 'donut' ? 0.36 : 0.34);
  const inner = chart.type === 'donut' ? radius * 45 / 72 : 0;
  const turn = Math.PI * 2;
  let angle = -Math.PI / 2;
  const segments = entries.map(item => {
    const start = angle;
    const percent = item.amount / total;
    angle += percent * turn;
    ctx.beginPath();
    ctx.arc(x, y, radius, start, angle);
    if (inner) ctx.arc(x, y, inner, angle, start, true);
    else ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    return { ...item, start, end: angle, percent };
  });
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  for (const item of segments) {
    if (item.percent < 0.06) continue;
    const middle = (item.start + item.end) / 2;
    const labelRadius = (radius + inner) / 2 + (inner ? 0 : radius / 8);
    ctx.fillText((item.percent * 100).toFixed(1) + '%', x + Math.cos(middle) * labelRadius, y + Math.sin(middle) * labelRadius);
  }
  return (px, py) => {
    const distance = Math.hypot(px - x, py - y);
    if (distance < inner || distance > radius) return null;
    let tapped = Math.atan2(py - y, px - x);
    if (tapped < -Math.PI / 2) tapped += turn;
    const item = segments.find(part => tapped >= part.start && tapped < part.end);
    return item ? { title: item.name, items: [{ key: 0, label: (item.percent * 100).toFixed(1) + '%', color: item.color, value: currency(item.amount) }] } : null;
  };
}

function drawBars(ctx, width, height, { items }) {
  if (!items.length) return () => null;
  const [min, max] = domain(items.map(item => item.amount));
  const left = Math.min(108, width / 3);
  const right = width - 54;
  const top = 8;
  const bottom = height - 23;
  const rowHeight = (bottom - top) / items.length;
  const x = value => left + (value - min) / (max - min) * (right - left);
  const zero = x(0);
  ctx.font = '10px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const value = min + (max - min) * i / 4;
    const position = x(value);
    ctx.strokeStyle = gridColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(position, top);
    ctx.lineTo(position, bottom);
    ctx.stroke();
    ctx.fillStyle = axisColor;
    ctx.fillText(tenThousands(value), position, bottom + 13);
  }
  ctx.setLineDash([]);
  items.forEach((item, index) => {
    const end = x(item.amount);
    const center = top + rowHeight * (index + 0.5);
    const barHeight = Math.min(24, rowHeight * 0.65);
    if (end !== zero) {
      const gradient = ctx.createLinearGradient(Math.min(zero, end), 0, Math.max(zero, end), 0);
      gradient.addColorStop(0, '#409EFF');
      gradient.addColorStop(1, '#6BCBFF');
      ctx.fillStyle = gradient;
      const radius = Math.min(6, barHeight / 2, Math.abs(end - zero));
      const edge = end - Math.sign(end - zero) * radius;
      const upper = center - barHeight / 2;
      const lower = center + barHeight / 2;
      ctx.beginPath();
      ctx.moveTo(zero, upper);
      ctx.lineTo(edge, upper);
      ctx.quadraticCurveTo(end, upper, end, upper + radius);
      ctx.lineTo(end, lower - radius);
      ctx.quadraticCurveTo(end, lower, edge, lower);
      ctx.lineTo(zero, lower);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#4E5969';
    ctx.textAlign = 'right';
    if (rowHeight >= 10) ctx.fillText(item.name, left - 6, center, left - 8);
    ctx.textAlign = 'left';
    if (rowHeight >= 14) ctx.fillText(tenThousands(item.amount), Math.max(end, zero) + 4, center, 50);
  });
  return (_px, py) => {
    const item = items[Math.floor((py - top) / rowHeight)];
    return item ? { title: item.name, items: [{ key: 0, label: '余额', color: palette[0], value: currency(item.amount) }] } : null;
  };
}

function drawChart(ctx, width, height, chart) {
  if (chart.type === 'line') return drawLine(ctx, width, height, chart);
  if (chart.type === 'bar') return drawBars(ctx, width, height, chart);
  return drawPie(ctx, width, height, chart);
}

module.exports = { palette, drawChart };
