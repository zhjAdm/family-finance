# 家庭财务微信小程序

小程序与网页版共用现有 Express API 和 PostgreSQL。现有公网 Caddy、frps 和飞牛 frpc 继续转发 HTTPS 请求。Nginx 将 `/mini-api/` 转发到 Express，由 Express 校验微信会话。所有获准登录的微信账号共用同一份数据与操作权限。

## 部署与首次绑定

1. 在微信公众平台取得小程序 AppID 和 AppSecret。将 `https://bwg.zhjadm.top` 加入 `request` 和 `downloadFile` 合法域名。金价设置、记录写入和 CSV 导出都通过同一个 HTTPS 域名。
2. 在飞牛部署目录的私有 `.env` 中设置以下变量。会话密钥可用 `openssl rand -hex 32` 生成。

   ```dotenv
   WECHAT_APP_ID=微信小程序AppID
   WECHAT_APP_SECRET=微信小程序AppSecret
   WECHAT_SESSION_SECRET=随机生成的会话密钥
   WECHAT_ALLOWED_OPENIDS=
   ```

3. 部署更新后的后端和 Nginx 镜像，并使用本仓库更新后的 Compose 配置。生产镜像版本已提高，发布后可用 `docker compose -f docker-compose.prod.yml pull backend frontend` 拉取，再用 `docker compose -f docker-compose.prod.yml up -d backend frontend` 应用。部署后访问 `/mini-api/dashboard`，未携带会话时应返回 JSON 格式的 HTTP 401。
4. 用微信开发者工具导入本目录，在项目详情中确认 AppID 与飞牛的 `WECHAT_APP_ID` 一致。AppSecret 和会话密钥只放服务端。
5. 家人在小程序点「微信登录」，复制界面上的绑定编号。把编号添加到服务端 `WECHAT_ALLOWED_OPENIDS`，多个编号用英文逗号分隔。运行 `docker compose -f docker-compose.prod.yml up -d backend` 让后端容器加载更新后的环境变量，再点微信登录。
6. 移除绑定编号并更新后端容器后，该成员的旧会话会被拒绝。登录会话有效期为七天。

## 验收与停用网页

用真机验证登录、总览、快照新增与修改、攒金、年度目标、基础设置和 CSV 文件分享。资产类型导入支持从微信聊天选择 UTF-8 CSV，表头使用系统导出的模板。导入按编码更新已有配置。当前导入沿用原接口对启用状态的处理，启用和停用可在列表单独操作。

网页版仍随当前 Nginx 镜像部署。切换时可将该站点限制为仅提供 `/mini-api/` 并关闭页面和旧 `/api/` 路由。小程序需要继续使用公网 HTTPS、frp、Nginx 的 `/mini-api/` 反代以及 Express 服务。
