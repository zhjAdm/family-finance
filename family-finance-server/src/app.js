const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const { login, requireSession } = require('./wechat-auth');

const dashboardRoutes = require('./routes/dashboard.routes');
const yearGoalRoutes = require('./routes/yearGoal.routes');
const ownerRoutes = require('./routes/owner.routes');
const assetTypeRoutes = require('./routes/assetType.routes');
const accountRoutes = require('./routes/account.routes');
const snapshotRoutes = require('./routes/snapshot.routes');
const optionRoutes = require('./routes/option.routes');
const exportRoutes = require('./routes/export.routes');
const goldRoutes = require('./routes/gold.routes');
const configRoutes = require('./routes/config.routes');

const app = express();

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const financeApi = express.Router();
financeApi.use(
  dashboardRoutes, yearGoalRoutes, ownerRoutes, assetTypeRoutes, accountRoutes,
  snapshotRoutes, optionRoutes, exportRoutes, goldRoutes, configRoutes,
);

app.use('/mini-api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.post('/mini-api/session', login);
app.use('/mini-api', requireSession, financeApi);
app.use('/api', financeApi);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 错误处理
app.use(errorHandler);

module.exports = app;
