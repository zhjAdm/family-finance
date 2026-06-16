# familyFinance — 家庭财务管理系统

一个部署在家用 NAS 上的轻量级家庭财务管理系统。核心思路是**定期记录资产快照**，通过快照数据追踪年度存款目标完成情况、资产变化趋势、家庭成员资产分布。

不记录每一笔消费流水，而是关注某个时间点的整体资产状态。

## 功能特性

- **财务看板** — 当前总资产、净资产、年度目标完成率、资产趋势图、资产类型分布、账户余额分布、所有人资产分布、负债卡片
- **资产快照** — 按日期逐条录入各账户余额，支持单条新增、编辑、删除，重复组合自动提示覆盖
- **年度目标** — 设置每年存款目标金额，看板自动计算完成率
- **基础配置** — 所有人管理、账户管理、资产类型管理（数据库可配置，不硬编码）
- **数据导出** — CSV 格式导出快照记录、账户配置、资产类型配置
- **移动端适配** — 768px 断点响应式布局，支持手机浏览器访问

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts + Vue Router + Pinia |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose + Nginx 反向代理 |

## 项目结构

```
familyFinance/
├── family-finance-server/     # 后端服务（Express + Prisma）
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库模型定义
│   │   └── seed.js            # 初始化数据
│   ├── src/
│   │   ├── routes/            # 路由层
│   │   └── middleware/        # 中间件
│   ├── Dockerfile
│   └── package.json
├── family-finance-web/        # 前端应用（Vue 3 + Element Plus）
│   ├── src/
│   │   ├── api/               # 接口封装
│   │   ├── router/            # 路由配置
│   │   ├── layout/            # 布局组件
│   │   ├── views/             # 页面视图
│   │   ├── styles/            # 全局样式
│   │   ├── App.vue
│   │   └── main.js
│   ├── nginx.conf             # Nginx 反向代理配置
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml         # 三服务编排
```

## 快速开始（本地开发）

### 前置条件

- Node.js 20+
- PostgreSQL 16（或 Docker 运行 PostgreSQL）

### 1. 启动数据库

使用 Docker 启动 PostgreSQL：

```bash
docker run -d \
  --name family_finance_db \
  -e POSTGRES_USER=finance \
  -e POSTGRES_PASSWORD=finance_password \
  -e POSTGRES_DB=family_finance \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. 启动后端

```bash
cd family-finance-server
cp .env.example .env        # 确认数据库连接配置
npm install
npx prisma migrate deploy   # 执行数据库迁移
npx prisma generate         # 生成 Prisma Client
node prisma/seed.js         # 导入初始数据
npm run dev                 # 启动后端，默认端口 3000
```

### 3. 启动前端

```bash
cd family-finance-web
npm install
npm run dev                 # 启动前端，默认端口 5173
```

访问 `http://localhost:5173` 即可使用。前端开发服务器已配置 API 代理，`/api` 请求会自动转发到 `http://localhost:3000`。

## Docker 部署（NAS）

一键部署全部服务：

```bash
docker compose up -d --build
```

服务启动后访问 `http://<NAS_IP>:8088`。

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 8088 | Nginx + Vue 静态资源，API 请求自动代理到后端 |
| 后端 | 3000 | Express API 服务 |
| 数据库 | 5432 | PostgreSQL，数据持久化到 `./data/postgres` 目录 |

查看服务状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f backend
```

## 核心概念

**资产快照**是系统的核心。每次定期记录各账户在某一天的余额，系统通过快照数据计算资产净值、年度目标进度、资产分布等统计信息。

**负债处理**：录入负债时填写正数，系统根据资产类型方向（`DEBT`）自动以负数计入净资产。

**可配置项**：所有人和资产类型都是数据库配置项，通过管理页面维护，不硬编码在代码中。

## API 概览

所有接口使用 `/api` 前缀，统一返回格式：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

| 模块 | 路径 | 方法 |
|------|------|------|
| 看板 | `/api/dashboard?year=2026` | GET |
| 年度目标 | `/api/year-goals` | GET, POST, PUT, DELETE |
| 所有人 | `/api/owners` | GET, POST, PUT, DELETE, PATCH(启用/停用) |
| 资产类型 | `/api/asset-types` | GET, POST, PUT, DELETE, PATCH(启用/停用) |
| 账户 | `/api/accounts` | GET, POST, PUT, DELETE, PATCH(启用/停用) |
| 资产快照 | `/api/snapshots` | GET, POST, PUT, DELETE |
| 下拉选项 | `/api/options/{owners\|accounts\|asset-types}` | GET |
| CSV 导出 | `/api/export/{snapshots\|accounts\|asset-types}.csv` | GET |

## 环境变量

后端环境变量（`family-finance-server/.env`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `postgresql://finance:finance_password@localhost:5432/family_finance` | 数据库连接字符串 |
| `PORT` | `3000` | 后端服务端口 |
