# 云上田园 · 河南云农场

> 让每个城市家庭都有一块"看得见的安心农田"。
>
> 远程认养 + 摄像头远程监控 + 农产品直送 的一线城市消费者云种植服务。

## 项目状态(2026-05-22)

🚧 **MVP 软件层 ≈ 98%**,完整业务闭环跑通(看套餐 → 选地块 → 下单 → 真支付 → 摄像头 → 发指令 → 农技员接单 + 上传完成照片 → 用户看到生长日记)。

| 模块 | 状态 |
|---|---|
| 三份正式文档(项目书 v3 / 需求 v2 / 架构 v2),md + docx 双份 | ✅ |
| C 端 miniapp(Taro 4 + Vue 3,17 页面) | ✅ **17/17 全走真后端**,完全无 mock |
| 后端 API(NestJS + Prisma,**14 个业务模块** + JWT + RBAC) | ✅ |
| 数据库(SQLite 开发 / 切 MySQL 改 3 行配置) | ✅ |
| Admin 后台(Vue 3 + Element Plus + **ECharts 看板**) | ✅ 真 JWT 登录 + Package CRUD + 跨用户订单 + 指令工单 + **用户管理 + 看板 + 错误日志** |
| 指令工单完整闭环 / 订单支付 mock flow / 文件上传 | ✅ |
| **后端 e2e 测试**(jest + supertest,8 个场景) | ✅ |
| **GitHub Actions CI**(每次 push 自动跑全栈检查) | ✅ |
| **前端错误收集**(Vue errorHandler + unhandledrejection,上报到后端) | ✅ |
| Cloudflare Pages 静态部署 | 🟡 早期 mock 版部署在 cloud-farm-web.pages.dev,真后端版部署待 |
| 摄像头接萤石云(真硬件) | 🟡 P5-mock 已通,等萤石账号 |
| C 端 Web Portal(独立 Vue 3,大屏看摄像头) | 🚧 P6 待做(用户决定暂缓) |

## 技术栈

- **monorepo**: pnpm workspace(4 apps + 3 packages)
- **微信小程序**: Taro 4 + Vue 3 + Pinia + vue-router
- **C 端 H5(临时,等 P6 拆出独立 Web Portal)**: Vite 4 同源 miniapp 编译
- **B 端 Admin**: Vue 3 + Vite + Element Plus
- **后端**: NestJS 10 + Prisma 6 + JWT(passport-jwt)+ class-validator + Swagger
- **数据库**: SQLite(本地开发)/ MySQL 8(生产,切 datasource provider 即可)
- **摄像头**: 萤石云 OpenAPI(P5)
- **支付**: 微信支付(P5+,需要营业执照 + 食品证 + 商户号)

## 快速开始

```bash
# 一次性环境(每台机器装一次):Node 20 + pnpm 10
git clone https://github.com/Bondma1234/cloud-farm.git
cd cloud-farm
pnpm install

# 后端首次初始化(一次)
cd apps/api
cp .env.example .env
pnpm exec prisma migrate dev    # 建 SQLite 表
pnpm db:seed                     # 灌种子数据(3 套餐 + 12 地块 + demo 用户 + 6 动态 + 8 作物 + ...)
cd ../..

# 启动 3 个服务(各开一个终端)
pnpm dev:api          # http://localhost:3000/api/health   + /api/docs (Swagger)
pnpm dev:miniapp      # http://localhost:5180  (C 端 H5)
pnpm dev:admin        # http://localhost:5183  (B 端后台)
```

## 演示完整购买闭环(本仓库的"杀手级 demo")

启动 API + miniapp 后,浏览器打开 <http://localhost:5180/>:

1. 进 **"我的"** tab → 点头像区域去登录页
2. 手机号填 `13800000001` → 同意协议 → 点"获取验证码"(自动填 `123456`)→ 登录
3. 拿到 JWT,跳回首页
4. 进 **"认养" tab** → 看到 3 个真套餐(SQLite 数据)
5. 点 **"进阶版 · 15㎡"** → 详情页 → **选地块** → 12 块网格(已售置灰)
6. 选一块 available 的 → **"确定并结算"** → checkout 页
7. 顶部地址栏显示真实 demo 地址(可点击换地址)
8. 选 1-2 个作物 → 点 **"提交订单"**
9. 看到 `订单 ORD-2026-XXXXXX 创建成功` → 自动跳订单详情
10. 进 **"我的" → "全部订单"** → 看到刚创建的订单出现在列表里
11. 同时去 admin 后台(<http://localhost:5183>)→ 套餐管理可看到真实数据

整条链路:**Vue 3 → axios + 拦截器 → vite proxy → NestJS Controller → Prisma 事务 → SQLite**,**没有一个 mock**,而且 `POST /api/orders` 用事务保证两个用户同时点同一地块**有且只有一个能成功**(409 冲突防双倍认养)。

## 演示指令工单闭环(P8 W1 新增)

跟上面同一个用户(`13800000001`)登 miniapp,**另外开一个浏览器**(或无痕窗口)登 admin:

1. miniapp:进 **"我的田"** → 看到 P-A-07 小番茄 + 摄像头画面
2. 点 **💧 浇水** → 确认 → toast "浇水指令已下单"
3. 进 **"指令历史"** → 看到一条 **待执行** 工单
4. **另一窗口** 打开 admin <http://localhost:5183>,用 **`19999999999` / `123456`**(role=agronomist)登录
5. 左栏 **"🔔 指令工单"** → 看到刚发的工单 → 点 **接单** → 状态变执行中
6. 点 **完成** → 弹窗 → **el-upload 选张图直接上传**(走真 `POST /api/upload`)→ 写完成备注 → 确认
7. 回 miniapp → "田园动态" 或 my-plot 的"生长日记" → 看到 **"农技员小李给你浇水了"** + 你刚上传的图

这套流程后端实现是 **Prisma 事务**:`PATCH /api/admin/commands/:id/complete` 一次性更新 Command 状态 + 写一条 JournalEntry,失败原子回滚,用户感知不到中间态。

## 演示订单 mock 支付(P8 W1 新增)

1. miniapp 创建一个新订单(走上面的"完整购买闭环"步骤 1-9,会得到 status=pending 的订单)
2. 进订单详情或订单列表的 **"待付款"** tab
3. 点 **"去支付"** → toast `支付成功 · 种植中`
4. 订单状态变为 **growing**(认养类直接进种植中;产地直送类会变 shipped)
5. 重复点支付 → 后端 400 守卫住 "订单当前状态(种植中)不能支付"

P5+ 接真微信支付时,前端 0 改 — 这条 mock 接口换成调 prepay + 接 wx.requestPayment 回调即可。

## 仓库结构

```
cloud-farm/
├── apps/
│   ├── miniapp/        # Taro 4 + Vue 3       C 端微信小程序 + H5(主战场)
│   ├── api/            # NestJS 10            后端 API(9 模块 + JWT)
│   ├── admin/          # Vue 3 + Element Plus B 端运营后台
│   └── web/  🚧 P6      # Vue 3 + Vite         C 端 Web Portal(待拆)
├── packages/
│   ├── shared/         # TS 类型 + 业务常量 + 纯函数(四端共用)
│   ├── api-client/     # ✅ axios + 拦截器 + 全套 SDK(auth/users/orders/.../plots)
│   └── ui-tokens/  🚧   # 设计 token(P6 抽出来)
├── docs/               # 项目书 / 需求 / 架构 / 设计稿 / 架构图集
│   ├── 01_项目书_v3.{md,docx}      # 商业计划书(当前)
│   ├── 02_需求说明书_v2.{md,docx}   # 需求清单(当前)
│   ├── 03_软件架构图_v2.{md,docx}   # 软件架构(当前)
│   ├── design/                    # P6 Web Portal 北极星设计稿等
│   └── diagrams/                  # 架构图 svg/png
├── docker-compose.yml  # MySQL 8 + Redis 7(切生产时启)
├── pnpm-workspace.yaml
├── md_to_docx.js       # md → docx 一键脚本(从 docs/ 读)
├── CLAUDE.md           # 项目记忆 / 架构约定 / 当前进度(主备份)
└── README.md
```

## 后端模块清单

`apps/api/src/modules/` 下 **14 个** NestJS 模块,全部带 Swagger 注解,见 `/api/docs`:

| 模块 | 路由 | 鉴权 |
|---|---|---|
| Auth | POST `/api/auth/login`(mock SMS,任意 6 位数字) | 公开 |
| User | GET `/api/users/me`,Address CRUD,`/me/plot` | JWT |
| Package | GET / POST / PATCH / DELETE / PATCH:status | 公开 / admin·operator |
| Plot | GET `/api/plots[/available][/:id]` | 公开 |
| Order | GET / GET:id / **POST 创建** / **PATCH cancel** / **POST :id/pay** | JWT |
| Camera | GET `:plotId/url` / POST `:plotId/ptz` / POST `:plotId/snapshot`(P5-mock,自动写 Journal) | JWT |
| Journal | GET `?type=&plotId=` + `:id` | 公开 |
| Crop | GET `?season=` + `:id` | 公开 |
| Photo | GET `/photos`(at 已格式化"刚刚 / X 天前") | 公开 |
| Command | GET `?type=`(用户自己的) / **POST 发指令**(JWT + assertOwn plot) | JWT |
| **Upload** | **POST `/api/upload`**(multipart,5MB,只图片);静态 `/uploads/*` | JWT |
| Admin · Order | GET `/admin/orders?status=&userId=&q=` / PATCH `:id/status` | admin·operator·cs |
| **Admin · Command** | **GET / PATCH `:id/accept` / PATCH `:id/complete`**(完成时事务内写 Journal) | admin·operator·agronomist |
| **Admin · User** | **GET / PATCH `:id/role` / PATCH `:id/status`**(改自己拒绝,不能禁其他 admin) | admin |
| **Admin · Stats** | **GET `/admin/stats`** 聚合(totals/userByRole/订单&工单按状态/gmv30d 补 0 值/packageTop/cameraOnline) | admin·operator |
| **ErrorLog** | **POST `/api/errors`**(匿名公开上报) + **GET `/admin/error-logs`** | 公开 / admin·operator |
| **Admin · Crop** | Crop POST/PATCH/PATCH:status/DELETE(被订单引用时 409) | admin·operator (delete 仅 admin) |
| **Admin · Journal** | POST `/admin/journal` 主动发布 + DELETE | admin·operator·agronomist |
| **Admin · Photo** | GET `/admin/photos` 全状态 + PATCH :id/status + DELETE | admin·operator·cs |
| **Coupon** | GET `/users/me/coupons`(过期自动标记) | JWT |
| **Invite** | GET `/users/me/invite`(邀请码 + 统计) + login 带 inviteCode 发券 | JWT / 公开 |

横切关注:全局 `ValidationPipe` + `TransformInterceptor`(统一 `{code,message,data}` 包装)+ `AllExceptionsFilter` + CORS + Swagger。

## C 端 17 个页面

| 模块 | 页面 | 状态 |
|---|---|---|
| 用户 | login | ✅ 真 JWT 登录 |
| 首页 | home | ✅ 真套餐 + 真动态 feed |
| 认养 | packages / package-detail / **plot-picker** / **checkout** | ✅ 全套真接口,**完整下单** |
| 我的田 | my-plot | ✅ P5-mock 已通,摄像头 + PTZ + 抓拍 + **真发指令**全真接口 |
| 我的田 | commands(指令历史) | ✅ 真指令,**支持发新指令**;状态 pending/executing/completed 实时联动 |
| 内容 | journal(动态)/ crops(作物百科)/ photos(照片墙) | ✅ |
| 订单 | orders / order-detail | ✅(取消订单走真接口) |
| 地址 | address / address-edit | ✅ POST/PATCH/DELETE 全真 |
| 个人中心 | profile | ✅ 真用户 + 4 张统计卡 |
| 直播 | live(临时占位) | 🚧 P5 改造为摄像头详情 |

## 进度路线图(架构 v2 §10)

| 阶段 | 内容 | 状态 |
|---|---|---|
| **P1** 架构地基 | pnpm workspace + apps/api/admin/miniapp + packages/shared + docker-compose | ✅ |
| **P2** API 最小切口 | NestJS + Prisma + 7 张表 + GET /api/packages + Swagger + ValidationPipe | ✅ |
| **P2+B** Admin 端到端打通 | packages/api-client + Admin 显示真实套餐 | ✅ |
| **P4-C** miniapp 套餐接 API | home / packages / package-detail / checkout 走真 API + mock 兜底 | ✅ |
| **P2+D** 后端扩 Auth + User + Order | JWT + /users/me + /users/me/addresses + /orders | ✅ |
| **P4-E** miniapp 接 Auth/User/Order | login / profile / orders / order-detail / address 5 页接真 API | ✅ |
| **P4-G** 内容模块全打通 | Journal/Crop/Photo/Command 4 模块 + 4 页接真 API | ✅ |
| **P4-H** 业务流程闭环 | Plot/Address CRUD/Order create+cancel + 5 页全接,完整购买链路 | ✅ |
| **P3** Admin 完整版 | 真 JWT 登录 + 套餐 CRUD + 订单管理 + RBAC | ✅ |
| **P5-mock** 摄像头模块 | CameraModule + my-plot 接通真后端(mock 地址) | ✅ |
| **P8 W1** 指令/支付/上传 | Command 完整闭环 + 订单 mock pay + UploadModule + Admin /commands 页 + 性能优化(layout 抽离 + EP optimizeDeps,主 chunk -85%) | ✅ |
| **P8 W2** 工程质量(本轮) | Admin 用户管理 + ECharts 看板 + 后端 jest e2e(8 测试)+ GitHub Actions CI + 错误收集 | ✅ |
| **P5** 摄像头接萤石云(真硬件) | CameraService 里把 mock 地址换 EZOPEN OpenAPI 即可 | 🚧 待萤石账号 |
| **P6** C 端 Web Portal 拆分 | apps/web/ 独立 Vue 3,大屏看监控 | 🚧 待开始(用户决定暂缓) |
| **P7** 部署上云 | 域名 / ICP / ECS / Docker / 微信支付商户号 | 🚧 待开始(法务先行) |

完整架构变更历史与 ADR 见 [`docs/03_云上田园_软件架构图_v2.md`](./docs/03_云上田园_软件架构图_v2.md)。

## 数据库切换:开发 SQLite → 生产 MySQL

只改 3 处即可上生产:

1. `apps/api/prisma/schema.prisma` 第 12 行:`provider = "sqlite"` → `"mysql"`
2. `apps/api/.env` 的 `DATABASE_URL`:`file:./dev.db` → `mysql://user:pwd@host:3306/cloud_farm`
3. `pnpm exec prisma migrate deploy && pnpm db:seed`

业务代码 0 改动,Prisma Client 屏蔽方言差异。schema.prisma 里只用跨方言安全的字段类型(JSON 数组用 String 存,Decimal 走 Prisma 抽象)。详见 [CLAUDE.md §2](./CLAUDE.md)。

## 协作约定

本项目使用 [Claude Code](https://claude.com/claude-code) 协作开发。所有架构约定、关键补丁、视觉规范、当前进度都记录在 **[CLAUDE.md](./CLAUDE.md)** 里 —— 改任何一条约定时记得同步更新。

特别注意:

- **monorepo 用 pnpm**,根目录 `pnpm install` 一次装好所有 4 apps + 3 packages
- **三份正式文档以 v 当前为准**(项目书 v3 / 需求 v2 / 架构 v2),v1/v2 历史保留 + 头部 superseded 标记
- **图片必须经过 `apps/miniapp/src/mock/images.js`**,不要在组件里写字面量
- **miniapp 三层浏览器补丁**(`<image>→<img>` / `@tap` 桥接 / `<scroll-view>` 滚轮拖拽)在 `main.web.js`,不要误删
- **添加新 API 模块**:NestJS module → packages/api-client SDK → miniapp/admin store → 页面接入,4 步标准流程,见架构 v2

## License

私有项目,暂未开源。
