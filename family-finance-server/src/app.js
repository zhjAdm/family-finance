const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const dashboardRoutes = require('./routes/dashboard.routes');
const yearGoalRoutes = require('./routes/yearGoal.routes');
const ownerRoutes = require('./routes/owner.routes');
const assetTypeRoutes = require('./routes/assetType.routes');
const accountRoutes = require('./routes/account.routes');
const snapshotRoutes = require('./routes/snapshot.routes');
const optionRoutes = require('./routes/option.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 路由
app.use('/api', dashboardRoutes);
app.use('/api', yearGoalRoutes);
app.use('/api', ownerRoutes);
app.use('/api', assetTypeRoutes);
app.use('/api', accountRoutes);
app.use('/api', snapshotRoutes);
app.use('/api', optionRoutes);
app.use('/api', exportRoutes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理
app.use(errorHandler);

module.exports = app;
