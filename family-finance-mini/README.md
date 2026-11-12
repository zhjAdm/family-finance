# 家庭财务微信小程序

小程序与网页版共用现有 Express API 和 PostgreSQL。现有公网 Caddy、frps 和飞牛 frpc 继续转发 HTTPS 请求。Nginx 将 `/mini-api/` 转发到 Express，由 Express 校验微信会话。所有获准登录的微信账号共用同一份数据与操作权限。

## 部署与首次绑定

1. 在微信公众平台取得小程序 AppID 和 AppSecret。将 `https://bwg.zhjadm.top` 加入 `request` 和 `downloadFile` 合法域名。金价设置、记录写入和 CSV 导出都通过同一个 HTTPS 域名。
2. 在飞牛部署目录的私有 `.env` 中设置以下变量。会话密钥可用 `openssl rand -hex 32` 生成。

   ```dotenv
   WECHAT_APP_ID=微信小程序AppID
   WECHAT_APP_SECRET=微信小程序AppSecret
   WECHAT_SESSION_SECRET=随机生成的会话密钥
   WECHAT_OWNER_OPENID=你的微信绑定编号
   WECHAT_ALLOWED_OPENIDS=
   ```

3. 部署支持家庭邀请的后端镜像（`1.0.6`）和支持 `/mini-api/` 转发的 Nginx 镜像（`1.0.5` 或更新），并把 `WECHAT_OWNER_OPENID` 传入后端容器。后端启动时会执行数据库迁移。未携带会话访问 `/mini-api/dashboard` 应返回 JSON 格式的 HTTP 401。
4. 用微信开发者工具导入本目录，在项目详情中确认 AppID 与飞牛的 `WECHAT_APP_ID` 一致。AppSecret 和会话密钥只放服务端。
5. 如果你还没有自己的绑定编号，先留空 `WECHAT_OWNER_OPENID`，用自己的微信点「微信登录」，然后点「复制绑定编号」。把编号填入服务端 `WECHAT_OWNER_OPENID` 并重新部署后端。你再次登录后，就能打开「配置 → 家庭成员」。
6. 在「家庭成员」生成并复制临时邀请码。家人点「微信登录」后填入邀请码，再点「加入家庭」。邀请码有效期 24 小时，每个码可供一个新成员加入。也可以在同一个页面粘贴家人的绑定编号手动添加。
7. 页面添加的成员保存在数据库里，新增和移除即时生效。移除后旧会话会被拒绝。已有的 `WECHAT_ALLOWED_OPENIDS` 会继续生效，这些成员仍由部署配置管理。所有获准账号共享同一份账本，家庭成员管理入口仅向 `WECHAT_OWNER_OPENID` 对应的账号开放。

## 验收与停用网页

用真机验证登录、总览、快照新增与修改、攒金、年度目标、基础设置和 CSV 文件分享。资产类型导入支持从微信聊天选择 UTF-8 CSV，表头使用系统导出的模板。导入按编码更新已有配置。当前导入沿用原接口对启用状态的处理，启用和停用可在列表单独操作。

网页版仍随当前 Nginx 镜像部署。切换时可将该站点限制为仅提供 `/mini-api/` 并关闭页面和旧 `/api/` 路由。小程序需要继续使用公网 HTTPS、frp、Nginx 的 `/mini-api/` 反代以及 Express 服务。
