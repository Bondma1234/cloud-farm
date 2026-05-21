# 云上田园 · 项目记忆

> 让 Claude / 开发者打开仓库就知道项目背景、技术约定和当前进度。
> 修改后随代码一起 commit,所有机器都能同步到。

## 1. 项目定位

**云上田园 · 河南云农场** —— 面向北上广深一线城市消费者,提供"远程认养 + 摄像头远程监控 + 农产品直送"的沉浸式云种植服务。完整定位、市场分析、商业模式、6 个月路线图见 [`docs/`](./docs/):

- **[`docs/01_云上田园_项目书_v3.md`](./docs/01_云上田园_项目书_v3.md)**(+ docx) —— 商业计划书(**当前版本**,v2 已 superseded)
- **[`docs/02_云上田园_需求说明书_v2.md`](./docs/02_云上田园_需求说明书_v2.md)**(+ docx) —— 需求清单(**当前版本**,v1 已 superseded)
- **[`docs/03_云上田园_软件架构图_v2.md`](./docs/03_云上田园_软件架构图_v2.md)**(+ docx) —— 软件架构(**当前版本**,v1 已 superseded)
- `md_to_docx.js`(根目录)+ `package.json` —— 把 `docs/` 下的 md 转成 docx(`pnpm docs:gen` 或 `node md_to_docx.js`)
- [`docs/design/`](./docs/design) —— UI 设计稿(P6 Web Portal 北极星图等)
- [`docs/diagrams/`](./docs/diagrams) —— 架构图集(SVG + PNG)

> 2026-05-12 起根目录整理:所有正式文档、架构图、设计稿统一放在 `docs/`,根目录只留 `README.md` / `CLAUDE.md` / 顶层构建脚本。详见 [`docs/README.md`](./docs/README.md)。

⚠️ **关键澄清**:摄像头是**用户私有监控**,**不是直播** —— 1 个摄像头对应 1 个用户(他自己看自己的地块),没有"1 推流 N 观众"那种并发。这一点 v1 架构文档曾经写错,v2 已纠正。

核心套餐(同时也是 mock 数据的依据):

| 套餐 | 面积 | 年费 | 包含 |
|---|---|---|---|
| 基础版 | 10㎡ | ¥499 | 1 种作物 / 保底 10 斤 / 包邮 2 次 / 共享摄像头 |
| 进阶版 | 15㎡ | ¥799 | 2 种作物 / 保底 20 斤 / 包邮 3 次 / 专属遥控摄像头 |
| 亲子版 | 10㎡ | ¥699 | 自然教育 3 节 / 工具包 / 孩子名字立牌 |

## 2. 仓库结构

### 当前(2026-05-01,P1 完成)

```
Cloud_Farm_project/
├── apps/
│   ├── miniapp/              # Taro 4 + Vue 3              微信小程序 + H5(主战场,17 页 mock)
│   ├── api/        ★ P1      # NestJS 10 + ConfigModule    后端 (跑通 /api/health)
│   ├── admin/      ★ P1      # Vue 3 + Vite + Element Plus B 端后台 (登录页 + 工作台壳)
│   └── web/         🚧 P6     # Vue 3 + Vite                C 端 Web Portal (待 P6 拆)
├── packages/
│   ├── shared/     ★ P1      # TS 类型 + 业务常量 + 纯函数
│   ├── ui-tokens/   🚧        # 设计 token(目前在 miniapp/app.scss,P6 拆出来)
│   └── api-client/  🚧        # 自动生成的 API SDK(P2 起,从 NestJS Swagger 生成)
├── docker-compose.yml ★ P1   # MySQL 8 + Redis 7(可选)
├── pnpm-workspace.yaml ★ P1
├── package.json              # 根 monorepo 配置 + 顶层 dev/build 脚本
├── prototype/                # 早期纯 HTML/CSS 原型(可参考视觉)
├── docs/                     # 项目书 / 需求 / 架构 / 设计稿 / 架构图集
│   ├── 01..03_*.docx / .md   # 三份正式文档(v3/v2/v2 是当前,v1 历史 superseded)
│   ├── design/               # P6 Web Portal 北极星稿等
│   ├── diagrams/             # 架构图 svg/png
│   └── project_original.txt  # 最早期 126 行文字稿
├── md_to_docx.js             # md → docx 转换(node md_to_docx.js,源在 docs/)
└── CLAUDE.md / README.md
```

★ = P1 阶段已建立  🚧 = 待后续阶段建立

### 顶层 npm 脚本(根目录跑)

```bash
pnpm install            # 一次装好所有 app 的依赖
pnpm dev:miniapp        # 起 miniapp H5 (5180)
pnpm dev:admin          # 起 admin (5183)
pnpm dev:api            # 起 api (3000) — 需先 docker compose up 启 MySQL
pnpm build:all          # 全部 app 并行 build
pnpm docs:gen           # 重新生成 3 份 docx
```

### 本地全栈启动顺序

```bash
# 1. 装依赖(首次或拉新)
pnpm install

# 2. (P2 起)初始化后端数据库 - 首次或重置时
cd apps/api
pnpm exec prisma migrate dev    # 跑迁移建表(开发用 SQLite,跨方言安全)
pnpm db:seed                    # 灌套餐/地块/demo 用户数据
cd ../..

# 3. (可选)起 docker MySQL/Redis - 切到生产模式时
# docker compose up -d          # MySQL:3306, Redis:6379

# 4. 起后端
pnpm dev:api                    # http://localhost:3000/api/health
                                # http://localhost:3000/api/docs (Swagger)

# 5. (另开终端)起 admin
pnpm dev:admin                  # http://localhost:5183 (代理 /api → :3000)

# 6. (另开终端)起 miniapp H5
pnpm dev:miniapp                # http://localhost:5180
```

### 数据库切换:开发 SQLite ↔ 生产 MySQL

P2 阶段开发用 SQLite(`apps/api/dev.db`,不入 git),生产期切 MySQL。**切换 = 改 3 处**:

1. `apps/api/prisma/schema.prisma` 第 12 行:`provider = "sqlite"` → `"mysql"`
2. `apps/api/.env` 的 `DATABASE_URL`:`file:./dev.db` → `mysql://user:pwd@host:3306/cloud_farm`
3. `pnpm exec prisma migrate deploy && pnpm db:seed` 在 MySQL 上重建表 + 灌数据

业务代码 0 改动,Prisma Client 屏蔽了方言差异。schema.prisma 里只用跨方言安全的字段类型(JSON 数组用 String 存),不用 SQLite 专属特性。详见架构 v2 §4。

`apps/miniapp/` 内部:

```
src/
├── main.web.js               # ⚠️ H5 入口 + 两个关键浏览器补丁(见 §4)
├── app.scss                  # 全局样式 + 设计 token
├── pages/                    # 13 个页面,每个一个目录
│   ├── home/                 # 首页(顶部问候 + 快捷入口 + 热门套餐 + 直播)
│   ├── packages/             # 认养套餐列表
│   ├── package-detail/       # 套餐详情(轮播 + highlights + 作物选择)
│   ├── plot-picker/          # 选地块(12 块网格 sold/available)
│   ├── my-plot/              # 我的田(状态卡 + 摄像头 + 指令 + 生长日志)
│   ├── live/                 # 直播间列表 / 单个直播
│   ├── orders/               # 订单列表(6 个状态 tab)
│   ├── order-detail/         # 订单详情(状态卡 + 物流 / timeline)
│   ├── address/              # 收货地址列表
│   ├── address-edit/         # 新建/编辑地址(含 mock 省市区)
│   ├── profile/              # 我的(头像 + 订单缩略 + 菜单)
│   ├── login/                # mock 登录
│   └── checkout/             # 结算页
├── stores/mock.js            # Pinia store + 全部 mock 数据(套餐/订单/地址/直播...)
├── mock/images.js            # ⚠️ 图片 URL 单一来源(切 CDN 只改这里)
├── shims/taro.js             # 浏览器版 Taro API 实现(navigateTo / Toast / clipboard...)
└── plot/                     # (未来给地块组件用)

public/images/                # 17 张 Unsplash 真图(套餐/作物/农场/直播/快照)
vite.config.js                # H5 build 配置
```

## 3. 技术栈

- **框架**: Taro 4.0.9 + Vue 3.4 + Pinia 2.1 + vue-router 4.6
- **H5 构建**: Vite 4.5.3(独立于 Taro 的小程序构建)
- **样式**: SCSS + CSS Variables(token 在 `app.scss`)
- **目标**: 同源支持微信小程序 + H5(浏览器 / 微信 H5 / iOS Safari)

**npm 脚本**(`apps/miniapp/`):

```bash
npm run web              # 本地 H5 dev,默认 http://localhost:5180
npm run web:build        # 构建到 apps/miniapp/dist/
npm run web:preview      # build + 起 serve 在 5181
npm run web:deploy:cf    # build + wrangler 部署到 Cloudflare Pages
npm run dev:weapp        # 微信小程序 dev(目前未常态使用)
```

## 4. 关键约定与"千万不要踩"的坑

### 4.1 浏览器里 `<image>` 不渲染 —— 已用 MutationObserver 修

**问题**: Taro 的 `<image>` 在小程序里是内置组件,但浏览器把它当成 SVG 专用标签,什么都不显示。

**修复**: `src/main.web.js` 里有一段 MutationObserver,每次 DOM 出现 `<image>` 就在它内部插一个真实 `<img>`,自动同步 `src` / `mode` / `lazy-load`,并把 `mode` 映射成 `object-fit`(`aspectFill`→`cover`,`aspectFit`→`contain`,`scaleToFill`→`fill`)。

**注意**:`vite.config.js` 的 `isCustomElement` 列表里**不要**加 `image` —— 加了之后 Vue 不会把它当原生标签,我们的补丁会失效。

### 4.2 iOS Safari 上 `<view @tap>` 不触发 —— 已用事件桥

**问题**: `<div>` 在 iOS Safari 默认不响应 `click`,只响应 `touch*`。

**修复**: `main.web.js` 里同时监听 `click`(桌面)和 `touchend`(移动),用位移 ≤10px + 时长 ≤800ms 过滤滑动/长按,400ms 去重避免双触发。**所有页面写 `@tap` 即可,不用关心平台**。

### 4.3 浏览器里 `<scroll-view scroll-x>` 不能滑 —— 双层修

**问题 1**: Taro `<scroll-view>` 是内置组件,浏览器里只是未知元素,没 `overflow` 行为。

**修复 1(CSS)**: `app.scss` 全局规则给 `scroll-view[scroll-x]` 加 `overflow-x: auto + white-space: nowrap`,移动端 touch 滑动直接生效。

**问题 2**: 桌面浏览器默认鼠标滚轮不滚横向、也不能拖卡片。

**修复 2(JS)**: `main.web.js` 里给所有 `scroll-view[scroll-x]` 加桌面增强 —— 鼠标滚轮 deltaY → scrollLeft、鼠标按住拖拽跟手、拖拽 >5px 后拦截后续 click 避免误触。

### 4.4 图片 URL 必须经过 `src/mock/images.js`

所有 mock 图片都从 `public/images/xxx.jpg` 出。**绝对不要**在组件里写 `'/images/xxx.jpg'` 字面量,而是 `import { PKG_COVER, CROP, FARM, LIVE, MISC } from '@/mock/images'` 然后用 `PKG_COVER.basic` 这种引用。

**原因**:未来接后台 CMS 时,只需把 `images.js` 里的 `/images/xxx.jpg` 换成 `https://cdn.cloud-farm.com/...`,前端组件零改动。

`images.js` 还导出 `fallbackImage(emoji, palette)` 和预制的 `FB.{pkg,crop,live,farm,ship}` —— 任何 `<image>` 加载失败都用 emoji + 渐变色兜底。

### 4.5 Taro shim 在浏览器里的覆盖范围

`src/shims/taro.js` 通过 `vite.config.js` 的 alias 顶替 `@tarojs/taro`。已实现:

- `navigateTo` / `switchTab` / `redirectTo` / `navigateBack` / `reLaunch` —— 走 vue-router
- `showToast` / `showLoading` / `hideLoading` / `showModal` —— 走轻量 DOM toast
- `setClipboardData` —— 走 `navigator.clipboard` + textarea fallback
- `getStorageSync` / `setStorageSync` —— 走 `localStorage`

**新增页面如果用了别的 Taro API**,先在 shim 里补一个空实现/最小实现,否则 H5 一打开就报错。

## 5. 视觉与设计

- 主色: `#4CA777`(绿色,品牌色,定义在 `app.scss` 的 `--color-primary`)
- 强调: 琥珀 `#F2C94C` / 危险 `#E57373`(价格、LIVE 角标)
- 圆角: 12px / 16px(卡片) / 999px(胶囊)
- 阴影: 用 `var(--shadow-sm)` / `var(--shadow-md)`
- 字体: 系统默认,15px 正文 / 22px 主标题 / 12px 辅助

## 6. 数据 / 登录约定(当前阶段)

- **全部 mock**:无后端,数据写死在 `stores/mock.js`,刷新页面就重置
- **登录默认已登录**:`useAppStore().isLoggedIn = true`,头像 / 昵称都是 mock
- **手机号验证**:`/^1[3-9]\d{9}$/`,保存时自动脱敏成 `138****5412`
- **下一步接真实后端时**: `mock.js` 拆成 `api.js`(fetch)+ store(只放状态),组件不动

## 7. 部署

- **H5**: Cloudflare Pages,项目名 `cloud-farm-web`
  - `public/_headers` —— 缓存策略
  - `public/_redirects` —— SPA fallback (`/* /index.html 200`)
  - `vite.config.js` 里 `base: './'` —— 相对路径,任何静态主机都能跑
- **小程序**: 暂未上架,本地 `dev:weapp` 调试

## 8. 开发流程提示

- **新加一个 C 端页面**: 在 `pages/<name>/index.vue` 写一个,用 `<view @tap>`、Taro 风格的 `<image :src :mode>`,导航走 `Taro.navigateTo({ url: '/pages/.../index' })` —— 路由会自动识别(`vite.config.js` 用了 `import.meta.glob('./pages/*/index.vue')` 全自动注册)
- **新加一类 mock 图**: 加进 `public/images/`,然后**只在** `src/mock/images.js` 里加常量
- **改全局样式**: `app.scss` 里加 token,组件里只用 `var(--xxx)`

## 9. 当前进度(2026-05-01)

✅ **已完成**

- **Batch A1** —— 13 个 C 端核心页面 + Pinia mock store + Taro shim + 17 张真图
- **Batch A2** —— 4 个延伸页面:journal / commands / crops / photos
  - 入口已接到 home / my-plot / profile
- 浏览器关键补丁: `<image>→<img>` MutationObserver + `@tap` 桥接 + `<scroll-view>` 桌面滚轮/拖拽增强
- `mock/images.js` 单一来源架构
- H5 构建 OK(65 modules,~76 KB gzip JS + ~9 KB gzip CSS + 2.1 MB images)
- **三份正式文档**(项目书 v3 / 需求 v2 / 架构 v2),md + docx 双份
- **P1 架构地基** ——
  - pnpm workspace 落地,4 apps + 1 package 全部跑通
  - apps/api: NestJS 10 + ConfigModule,`GET /api/health` 通过
  - apps/admin: Vue 3 + Vite + Element Plus,登录页 + 工作台壳子能跑
  - packages/shared: TS 类型 + 业务常量 + 纯函数(从 mock.js 抽出来)
  - docker-compose.yml: MySQL 8 + Redis 7
  - 三个 app 都能 build 通过,miniapp 在 pnpm 下不变 65 modules
- **P2 API 最小切口** ——
  - Prisma 6.19 + SQLite,7 张表(User/Address/Package/Plot/Camera/Order/JournalEntry)
  - 第一次 migration `20260503082607_init` 建表完毕
  - seed 脚本灌入:3 套餐 + 12 地块 + 1 demo 用户
  - PrismaService(全局)+ PackageModule(controller + service + DTO)
  - 全局基础设施:ValidationPipe / TransformInterceptor({code,message,data}) / AllExceptionsFilter / CORS
  - Swagger 文档接入 `/api/docs`
  - 冒烟通过:`GET /api/packages` 返回真实 DB 数据
- **P2+B Admin 端到端打通** ——
  - **packages/api-client** 落地(axios + 拦截器 + Package API + ApiError 类型)
    - 自动解开后端 `{code, message, data}` envelope
    - 类型从 `@cloud-farm/shared` 来,前后端类型同源
    - admin / miniapp / web 三端共享
  - Admin 抽公共布局组件 `AdminAside` / `AdminHeader`
  - Admin Dashboard 顶部"上架套餐"卡片改拉真实数据
  - Admin 新增 `/packages` Element Plus Table 套餐管理页
  - Vite 代理 `/api → :3000`
- **P4-C miniapp 接 API + Mock 兜底** ——
  - miniapp 加 `@cloud-farm/api-client` + `@cloud-farm/shared` workspace 依赖
  - 新建 `stores/packages.js`(Pinia store): fetch + 60s 缓存 + mock fallback + source 标记
  - 改造 4 页:home / packages / package-detail / checkout
  - packages 页 ⚠️ 警告条提示后端未连接 + 重试
  - vite.config.js 加 proxy `/api → :3000`
  - 三态闭环验收(在线/挂了/恢复)全过
- **P2+D 后端扩 Auth + User + Order** ——
  - 装 `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
  - 新增 `common/auth/`:JwtPayload / JwtStrategy / JwtAuthGuard / @CurrentUser()
  - 新增 **AuthModule**:`POST /api/auth/login`(mock SMS,任意 6 位数字通过) → 签 access(15m) + refresh(7d) JWT
  - 新增 **UserModule**(都需 JwtAuthGuard):
    - `GET /api/users/me` 返回当前用户(手机号脱敏)
    - `GET /api/users/me/addresses` 当前用户地址列表(默认地址置顶)
  - 新增 **OrderModule**(都需 JwtAuthGuard):
    - `GET /api/orders?status=` 当前用户订单列表(状态过滤,日期降序)
    - `GET /api/orders/:id` 订单详情(强制属于当前用户,否则 404)
  - **seed 扩展**:demo 用户 + 2 收货地址 + 3 订单(覆盖 growing/delivering/pending 状态)
  - **api-client 扩展**:加 `auth.ts` / `users.ts` / `orders.ts`,http.ts 加 `setAccessToken/getAccessToken`(localStorage 持久化)
  - **9 项 curl 闭环全过**:无 token 401 / 登录拿 token / /me / /addresses / /orders / 详情 / 状态过滤 / 错误码 401
- **P4-E miniapp 接 Auth + User + Order** ——
  - **API 调整**:OrderService.toDto 把 metadata JSON 解出来后**平铺**到顶层(subItems / timeline / logistics / expireIn / canReview),前端不用 `.meta.xxx` 二级访问
  - **stores/mock.js 的 useAppStore 重构**:加 `bootstrap()` / `loginReal(phone, code)` / `fetchAddresses()` / `logoutReal()` 真接口 actions,旧 `loginMock/logoutMock` 改为委托
  - **新建 stores/orders.js**(同 packages.js 套路):`fetch()` / `fetchOne(id)` + 30s 缓存 + mock fallback + source 标记
  - **5 页面改造完毕**:
    - `login`:走 `store.loginReal(phone, code)`,失败兜底 mock
    - `profile`:`onMounted` bootstrap + 拉 orders,顶部用户名 / 4 张统计卡 / 订单缩略全真
    - `orders`:列表全从 store,状态 tab 过滤可用,待付款 badge 真实
    - `order-detail`:订单 + subItems + timeline + logistics 全从 API
    - `address`:列表从 `/users/me/addresses`,默认地址置顶
  - **api-client 默认实例**:`http.ts` 加内置 token 管理(localStorage 持久化),`login()` 自动写 token,刷新页面自动恢复登录态
  - **5 页端到端验收全过**(填手机号 → 同意协议 → 验证码自动填 → 真 JWT 登录 → home/profile/orders/order-detail/address 真数据)
  - H5 build:123 modules(P4-C 后 +4),gzip 46KB JS / 9KB CSS
- **P4-G 内容模块全打通** ——
  - **schema 扩展**:加 `Crop` / `PhotoPost` / `Command` 三张表,migration `add_crop_photo_command` 落地(Journal 表本来就在)
  - **seed 扩展**:6 田园动态 + 8 作物 + 8 照片墙帖子 + 6 指令工单(全部对齐 mock 数据)
  - **NestJS 加 4 模块**:
    - `JournalModule`: `GET /api/journal?type=&plotId=` + `GET /api/journal/:id`(公开,不需登录)
    - `CropModule`: `GET /api/crops?season=` + `GET /api/crops/:id`(公开)
    - `PhotoModule`: `GET /api/photos`(公开,服务端时间已格式化为"刚刚/X小时前")
    - `CommandModule`: `GET /api/commands?type=`(需 JWT,只返当前用户的)
  - **api-client 加 4 SDK**:`journal.ts` / `crops.ts` / `photos.ts` / `commands.ts`
  - **miniapp 加 4 stores**(同 packages.js 套路):journal / crops / photos / commands
  - **4 页改造**:journal / crops / photos / commands 全部从 mock 切到 store,各自 onMounted fetch
  - **bug fix**:journal/crops 两页的 `filtered` computed 漏写 `.value`(用 storeToRefs 后 ref 解包要明确),已修
  - **e2e 验收全过**:journal 6/crops 8/photos 8/commands 6 全部从 SQLite 真出
  - H5 build:131 modules(P4-E 后 +8),gzip 46.6 KB JS / 9.3 KB CSS

- **P4-H 业务流程闭环** ——
  - **PlotModule** 新增:`GET /api/plots[/available][/:id]`,公开接口
  - **Address CRUD** 完整:`POST/PATCH/DELETE /api/users/me/addresses`(JWT,事务保证默认地址唯一)
  - **OrderModule 扩展**:
    - `POST /api/orders` 创建认养订单 → **事务原子操作**:校验套餐 + 校验地块可用 + 锁地块 (status=sold) + 校验地址 + 生成订单 ID + 写 metadata
    - `PATCH /api/orders/:id/cancel` 取消订单(待付款 / 待发货可取消)
  - **api-client 扩展**:`plots.ts` / `users.createAddress/updateAddress/deleteAddress` / `orders.createOrder/cancelOrder`,http.ts 加 `patch()` 方法
  - **5 页改造**:
    - `plot-picker`:GET /api/plots,可选择真实可认养地块,跳 checkout 透传 pkg + plot
    - `checkout`:POST /api/orders 真创建订单,自动跳 order-detail
    - `address-edit`:POST/PATCH/DELETE 真接口,失败 modal 详细提示
    - `address`:配合 fetchAddresses 自动刷新
    - `orders`:取消订单走 cancelOrder() 真接口
  - **e2e 验收全过**:
    - 选 P-A-02 → 创建订单 ORD-2026-050702 → 地块 status auto sold → 出现在我的订单
    - POST 地址 → PATCH 改 isDefault=true → DELETE 全过
    - PATCH cancel → status=cancelled

- **P3 Admin 完整版** ——
  - **后端:RBAC**
    - `common/auth/roles.decorator.ts` + `roles.guard.ts`(Reflector + 403 ForbiddenException)
    - 角色清单:`customer / agronomist / cs / operator / admin`
  - **后端:Package CRUD**(全部带 `@UseGuards(JwtAuthGuard, RolesGuard)`)
    - `POST /api/packages`(admin / operator)
    - `PATCH /api/packages/:id`(同上)
    - `PATCH /api/packages/:id/status`(同上,上下架,不删除数据)
    - `DELETE /api/packages/:id`(仅 admin,且未被订单引用,否则 409)
    - `GET /api/packages?includeArchived=true`(给后台看下架数据)
  - **后端:Admin Order**(独立 module `apps/api/src/modules/admin/`)
    - `GET /api/admin/orders?status=&userId=&q=`(admin / operator / cs)
    - `PATCH /api/admin/orders/:id/status`(admin / operator,cs 不可)
    - 返回 join 上 user 表,带脱敏手机号
    - `take: 200` 简单分页保护
  - **seed 加 admin 用户**:`18888888888` / nickname `管理员` / role `admin`
  - **api-client 扩展**:Package CRUD + admin/orders 全套 SDK
  - **Admin 重构**:
    - **真 JWT 登录** 替代原 mock 密码,失败/角色错误 toast
    - **`stores/auth.ts`** Pinia store(管 user + 持久化 localStorage,跟 api-client token 配合)
    - **路由守卫**:`requiresAuth` 路由没登录 → 跳 /login;已登录访问 /login → 跳 /dashboard
    - **AdminHeader 显示**:头像 + 昵称 + role tag(admin 红 / operator 黄 / cs 绿)
    - **Packages 页 CRUD**:`PackageEditDialog` 组件(新增/编辑共用,作物/卖点/图集 textarea + 逗号解析),上下架按钮(toggle),删除按钮(双确认)
    - **新增 Orders 页**:Element Plus Table + 状态筛选 + 模糊搜索(id/title)+ 改状态下拉
  - **12 项 curl 验收全过**:RBAC 403 / admin 创建 / 改 / 上下架 / 包含 archived / DELETE / admin 看所有订单 / admin 改状态 / 普通用户访问 admin 接口 403
  - **e2e 验收全过**:登录 → Dashboard 显示 🛡️ 管理员 + 套餐 3 → /packages 3 行 + CRUD 按钮 → /orders 5 条 + 真用户手机号 + 改状态下拉

至此 **miniapp 17 个页面 16 个走真后端**,只剩 1 个还在 mock:
- `my-plot`(我的田)— ✅ **P5-mock 已通**,等 P5 真萤石账号下来切真硬件

**Admin 后台从只读 → 真 CRUD + 订单跨用户管理 + RBAC 守护**,运营 / 客服 / 财务可以真实工作。

- **★ P5-mock 摄像头模块(本次)** ——
  - **schema 扩展**:Order 加 `plotId` / `crops` / `stake` 字段(migration `order_add_plot_crops_stake`)
    OrderService.create 同时存 plotId(之前只锁地块,没记录归属),为"我的田"查找用户认养地块铺路
  - **seed 扩展**:
    - 12 个 mock Camera,每个 Plot 各绑一个(`cam-p-a-01` ... `cam-p-a-12`)
    - 设 vendor='mock',真萤石上线只改这一字段
    - 演示用 P-A-03 标 `ptzSupported=false`(模拟"共享摄像头"基础版)
    - 已认养的地块(订单 status=growing)自动锁 sold
  - **CameraModule** 新增(`apps/api/src/modules/camera/`):
    - `GET /api/cameras/:plotId/url` → 返 mock 播放地址 + TTL(P5 真切萤石 EZOPEN)
    - `POST /api/cameras/:plotId/ptz` → 校验 ptzSupported,真接口 mock 返 ok(P5 调萤石 PTZ API)
    - `POST /api/cameras/:plotId/snapshot` → 返 mock 图 + **自动写一条 JournalEntry**(用户立刻在动态页看到抓拍)
    - 全部 JWT + **`assertOwn` 鉴权**:用户必须是该 plot 的认养人(查 order 表),否则 403,防别人偷看
  - **UserModule** 加 `GET /api/users/me/plot` 聚合接口:
    - 找当前用户 type=认养 + status=growing/paid/shipped 最新订单
    - 合成 plot + 摄像头 + 套餐 + 作物 + 进度(daysElapsed/daysTotal/stage)一次返
  - **api-client 扩展**:`cameras.ts` (getCameraUrl/cameraPtz/cameraSnapshot) + `users.getMyPlot` + `MyPlot` 类型
  - **miniapp**:
    - 新 `stores/myPlot.js`:fetch / refreshCameraUrl / ptz / snapshot,无 mock fallback(没认养就空态)
    - 重构 `pages/my-plot/index.vue`:
      - 加空态(未认养)/ 加载态 / 错误态 / 数据态四态
      - 状态卡:从 store.plot.{name/cropEmoji/crop/stage/progress/nextAction/weather} 拉真值
      - 摄像头:背景 url 从 store.cameraUrl 来 / PTZ 按钮按 ptzSupported 显隐 / **底部按钮改"抓拍"** 调真接口
      - "拍张照"指令拦截到 onSnapshot(走 camera.snapshot 而不是 mock toast)
      - 抓拍成功后摄像头画面立即换成新图 + 提示"已加入生长日记"
  - **e2e 验收全过**:
    - 后端 6 项 curl:/users/me/plot / camera url / 越权 403 / ptz / snapshot / journal 新增 ✅
    - miniapp DOM:**小祎的菜园 / P-A-07 / 🍅 小番茄 · 坐果期 / 75% / 摄像头在线 / 3 个 PTZ 按钮** ✅
    - PTZ left + snapshot → journal 7 → 8 条(自动写入)✅

**至此 miniapp 17 个页面 100% 走真后端,完全无 mock!**(P5 真硬件接入时只需把 CameraService 里 mock 地址换成萤石 OpenAPI 调用,前端 0 改动)

**Admin 后台从只读 → 真 CRUD + 订单跨用户管理 + RBAC 守护**,运营 / 客服 / 财务可以真实工作。

- **★ P8 W1 三件套(2026-05-21)** ——
  - **P8-1 指令工单完整闭环**:
    - 后端 `CommandModule` 加 `POST /api/commands`(用户发指令,assertOwn plot 鉴权,生成 `c-YYYYMMDD-NN` ID + icon/label 自动映射)
    - 新建 `AdminCommandController`(`/api/admin/commands/*`),RBAC=`admin|operator|agronomist`:
      - `GET ?status=&plotId=&type=` 列表
      - `PATCH /:id/accept` 接单(pending → executing,记 by=农技员昵称)
      - `PATCH /:id/complete { photo, note }` 完成(executing → completed),**事务内自动写一条 JournalEntry**,用户秒看到"农技员小李给你浇水了"
    - api-client 扩 `createCommand` / `listAdminCommands` / `acceptCommand` / `completeCommand`
    - miniapp `my-plot` 4 个指令按钮(浇水/施肥/除草/拍照)接真 `createCommand`,提交后刷新 commands store;"拍照"特殊处理走 camera.snapshot
    - Admin 新增 `/commands` Element Plus Table 工单管理页 + 完成对话框(el-upload 直接传图)
    - seed 加 **agronomist 账号 `19999999999`**(role=agronomist)用来接单
  - **P8-2 支付 mock flow**:
    - `POST /api/orders/:id/pay`(JWT + own + 状态守卫:仅 pending 可调)→ 认养类直接 paid → growing,产地直送 paid → shipped
    - api-client 加 `payOrder`,miniapp orders / order-detail 两页"去支付"按钮接真
    - 重复支付返 400 守卫住,P5+ 真接微信支付时换 prepay + jsapi 即可,前端 0 改
  - **P8-3 文件上传模块**:
    - `UploadModule`:`POST /api/upload`(JWT,multipart,字段 `file`,5MB 限制,只允许图片 MIME)
    - 本地磁盘存 `apps/api/uploads/YYYY-MM-DD/<rand>.ext`,`useStaticAssets('/uploads/')` 暴露静态访问
    - **注意路径不冲突**:接口 `/api/upload` (单数) / 静态 `/uploads/*` (复数)
    - Admin 工单完成对话框集成 el-upload(`:http-request` 自定义走 fetch + Bearer token)
    - vite proxy `/uploads → :3000` 让 admin / miniapp dev 服务器也能直链上传后的图
    - `.gitignore` 加 `apps/api/uploads/`(P7 切 OSS 后这行可删)
  - **W1 性能优化(顺手做掉的)**:
    - Admin 抽 `layouts/DefaultLayout.vue`,AdminAside / AdminHeader 全局挂一次,路由切 tab 不再整树重建
    - `vite.config.ts` 加 `optimizeDeps.include: ['element-plus', ...]` + `ElementPlusResolver({ importStyle: false })` + `main.ts` 一次性引整包 css —— **dev 模式 Element Plus chunk 从 74 → 0,每页 import 从 60+ → 26**
    - api-client 401 拦截器 dispatch `cloud-farm:unauthorized` 全局事件 → admin main.ts 桥接 → 自动跳 `/login?reason=expired`,避免在受限页持续 401 堆错
    - auth store 加 `_hasToken` reactive 标志,isLoggedIn 不再每次跑 localStorage 读
  - **e2e 验收**(Python 脚本 9 个场景全过):
    - 拉用户认养地块 → 发施肥指令 → 越权 P-A-99 返 403 → 农技员看到 pending → accept → complete with photo → journal 自动多一条 → 支付 pending 订单 → growing → 重复支付 400 → 文件上传 + HTTP 200 拉回
  - **构建确认**:admin prod build 主 chunk 1064KB → 153KB(gzip 353 → 60KB,降 83%),miniapp H5 build 136 modules 不变

🚧 **下一步路线**(架构 v2 §10)

| 阶段 | 内容 | 当前状态 |
|---|---|---|
| **P1 架构地基** | pnpm workspace + docker-compose + apps/api/admin 空项目 + packages/shared | ✅ 已完成 |
| **P2 API 最小切口** | NestJS + Prisma schema + GET /api/packages | ✅ 已完成 |
| **P2+B Admin 端到端打通** | packages/api-client + Admin 显示真实套餐 | ✅ 已完成 |
| **P4-C miniapp 套餐接 API** | home / packages / package-detail / checkout 走真 API + mock 兜底 | ✅ 已完成 |
| **P2+D Auth + User + Order** | JWT + 登录 + /users/me + /users/me/addresses + /orders | ✅ 已完成 |
| **P4-E miniapp 接 Auth/User/Order** | login/profile/orders/order-detail/address 5 页接真 API + mock fallback | ✅ 已完成 |
| **P4-G 内容模块全打通** | Journal/Crop/Photo/Command 4 模块 + 4 页接真 API | ✅ 已完成 |
| **P4-H 业务流程闭环** | Plot/Address/Order create+cancel + plot-picker/checkout/address-edit | ✅ 已完成 |
| **P3 Admin 完整版** | RBAC + Package CRUD + Admin Orders + 真 JWT 登录 + 路由守卫 | ✅ 已完成 |
| **P5-mock 摄像头模块** | CameraModule + /users/me/plot + my-plot 走真接口(mock 地址) | ✅ 已完成 |
| **★ P8 W1 指令/支付/上传** | Command 完整闭环 + 订单 mock 支付 + UploadModule + Admin /commands 页 + 性能优化(layout 抽离 + EP optimizeDeps) | ✅ 已完成 |
| **P8 W2 工程质量** | Admin 用户管理 + 简单看板 ECharts / 测试覆盖 / CI / 错误收集 | 🚧 待开始 |
| **P5 真萤石云接入** | CameraService 里把 mock 地址换成 EZOPEN OpenAPI 调用 | 待萤石账号 |
| **P6 C 端 Web Portal 拆分** | apps/web/ 独立 Vue 3,翻译现有 17 个页面 | 用户决定暂缓,排在 P5 后 |
| **P7 部署上云** | 域名 + ICP + ECS + Docker + 微信支付商户号 | 法务先行,暂搁置 |
| 旁路任务 | Cloudflare Pages 接 Git 自动部署 / 装 Docker(切真 MySQL 用) | 已搭好基建,暂搁置 |

## 10. 换电脑续作指南

任何 git 拉下仓库的新机器,按以下顺序操作:

### Step 1 - 一次性环境(每台机器装一次)

| 工具 | 版本 | 装法 |
|---|---|---|
| Git | 任意 | <https://git-scm.com> |
| Node.js | **20.x**(对齐 `apps/miniapp/.nvmrc`) | 官网 / nvm |
| pnpm | 10+ | `npm i -g pnpm@10` |
| Claude Code(可选) | 最新 | <https://claude.com/claude-code> |

### Step 2 - 拉代码

```bash
git clone https://github.com/Bondma1234/cloud-farm.git
cd cloud-farm
```

### Step 3 - 装依赖(一次)

```bash
pnpm install   # 一次装好 4 apps + 3 packages 的所有依赖,~2-3 分钟
```

### Step 4 - 后端首次初始化(一次)

```bash
cd apps/api

# 1. 创建本地 .env(从模板复制,默认值开发够用,生产必须改)
cp .env.example .env

# 2. 跑 Prisma 迁移建表(SQLite 文件 prisma/dev.db 自动产生)
pnpm exec prisma migrate dev

# 3. 灌种子数据:3 套餐 + 12 地块 + 1 demo 用户 + 2 地址 + 3 订单
pnpm db:seed

cd ../..
```

### Step 5 - 启动验证

3 个终端各起一个:

```bash
# 终端 1
pnpm dev:api          # http://localhost:3000/api/health
                       # http://localhost:3000/api/docs (Swagger)

# 终端 2
pnpm dev:admin        # http://localhost:5183 (任意 6 位密码登录)

# 终端 3
pnpm dev:miniapp      # http://localhost:5180
```

### Step 6 - GitHub 推送(若要 push)

私有仓库需要认证。两条路:

- **HTTPS + PAT**: `git push` 时弹账号 + Personal Access Token(从 GitHub Settings → Developer settings 生成)
- **SSH key**: 在新机器 `ssh-keygen` 生成密钥,公钥粘到 GitHub Settings → SSH keys,然后把 git remote 改成 `git@github.com:Bondma1234/cloud-farm.git`

### Step 7 - **不会跟着 git 走的东西**(每台机器各自有)

| 文件 / 目录 | 说明 | 怎么补 |
|---|---|---|
| `apps/api/.env` | 后端环境变量(JWT_SECRET 等) | 从 `.env.example` 复制 |
| `apps/api/prisma/dev.db` | SQLite 开发库 | `pnpm exec prisma migrate dev && pnpm db:seed` 重建 |
| `node_modules/` (各处) | 依赖 | `pnpm install` |
| `apps/*/dist/` | 构建产物 | `pnpm build:all` |
| `.claude/settings.local.json` | Claude Code 这台机器的 Bash 白名单 | 第一次跑会被问"允许吗",允许过就持久化 |
| `~/.claude/projects/<hash>/*.jsonl` | Claude 会话历史 | 不补,新机器从头新会话 |

### Step 8 - 当前进度查看

打开 Claude Code 之后,它会自动读这份 `CLAUDE.md` —— **§9 当前进度** 那张表就是真实状态(P1/P2/P2+B/P4-C/P2+D 都已完成,下一步是 P3 Admin CRUD 或 P4+ miniapp 其余模块)。

---

## 11. P6 Web Portal 设计参考(等到真做的时候用)

C 端 Web Portal(`apps/web/`)目前**没建**。用户决定暂缓,排在 P5 真萤石云之后。等真做时,**视觉北极星**是这张稿子:

- 位置:[`docs/design/web-portal-mockup.png`](./docs/design/web-portal-mockup.png)(用户后续放进去)
- 风格:水彩插画 + 自然绿主色,**跟现在 miniapp/admin 的 Element Plus + 实拍照片风格差异大**
- 核心元素:hero 大场景 / 4 套餐卡(基础/进阶/亲子/**企业**)/ 田块网格地图 / 我的田 / 直播 / 商城 / 个人中心 7 个 tab

**P6 启动前需要确认 3 件事**:

1. **企业版套餐**:稿子里有 `¥1999/季 · 50㎡起 · 企业版`,但后端 seed **没这条**。架构 v2 §3.1 提过企业版,P6 启动前补 seed
2. **直播 tab 命名**:架构 v2 说我们没直播只有私有摄像头,但 C 端 tab 叫"直播"用户认知友好。建议:**C 端称"直播",内部架构称"私有监控"**,两套术语并存
3. **视觉资源来源**:水彩插画需要素材,有 3 条路 ——
   - 设计师外包(¥3000-8000)
   - Midjourney AI 生成 + 调色(¥200 + 1-2 天)
   - 图库购买(¥500-2000)
   - **推荐 AI + 后期**

P6 工作量按这个稿子完整还原:**~8-10 天**(纯前端,后端不动)。详见 [`docs/design/README.md`](./docs/design/README.md)。

---

## 12. 关于 Claude Code 自身

- **项目级配置**: `.claude/settings.local.json` 是这台机器的 Bash 白名单,**不入 git**(.gitignore 里已加),换电脑后第一次打开会被问几次"允许吗",允许过就持久化了
- **会话历史**: `~/.claude/projects/C--TestProject-Cloud-Farm-project/*.jsonl`,本地存,**不会跟着 git 走**。所以这份 `CLAUDE.md` 才是项目记忆的"主备份"
- **想 Claude 记住一件新约定**: 直接写到这个文件里 + commit,所有机器、所有新会话立刻生效
