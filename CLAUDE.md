# 云上田园 · 项目记忆

> 让 Claude / 开发者打开仓库就知道项目背景、技术约定和当前进度。
> 修改后随代码一起 commit,所有机器都能同步到。

## 1. 项目定位

**云上田园 · 河南云农场** —— 面向北上广深一线城市消费者,提供"远程认养 + 摄像头远程监控 + 农产品直送"的沉浸式云种植服务。完整定位、市场分析、商业模式、6 个月路线图见仓库根目录:

- **`01_云上田园_项目书_v3.docx` / `.md`** —— 商业计划书(**当前版本**,v2 已 superseded)
- **`02_云上田园_需求说明书_v2.md` / `.docx`** —— 需求清单(**当前版本**,v1 已 superseded)
- **`03_云上田园_软件架构图_v2.md` / `.docx`** —— 软件架构(**当前版本**,v1 已 superseded)
- `md_to_docx.js`(根目录)+ `package.json` —— 把 md 文档转成 docx 的脚本(`node md_to_docx.js` 即可重新生成 3 份当前版 docx)

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
├── diagrams/                 # 架构图 svg/png
├── 01..03_*.docx / .md       # 项目书 / 需求 / 架构(项目书 v3、需求 v2、架构 v2 是当前)
├── md_to_docx.js             # md → docx 转换(node md_to_docx.js)
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
- **★ P2+B Admin 端到端打通(本次)** ——
  - **packages/api-client** 落地 ★(axios + 拦截器 + Package API + ApiError 类型)
    - 自动解开后端 `{code, message, data}` envelope,业务代码拿到的就是 data
    - 类型从 `@cloud-farm/shared` 来,前后端类型同源
    - admin / miniapp / web 三端共享,P4 miniapp 接 API 时直接复用
  - Admin 抽公共布局组件 `AdminAside` / `AdminHeader`(供后续多页面复用)
  - Admin Dashboard 顶部"上架套餐"卡片改拉 `listPackages()`,真实显示 **3**
  - Admin 新增 `/packages` 套餐管理页,Element Plus Table 展示真实 3 条数据(封面/名称/面积/价格/标签/作物/状态)
  - Vite 代理 `/api → :3000` 自动转发,无 CORS 问题
  - 端到端验收:登录 → Dashboard 显示真实 3 套餐 → 点 sidebar 进 /packages → Table 显示完整数据

🚧 **下一步路线**(架构 v2 §10)

| 阶段 | 内容 | 当前状态 |
|---|---|---|
| **P1 架构地基** | pnpm workspace + docker-compose + apps/api/admin 空项目 + packages/shared | ✅ 已完成 |
| **P2 API 最小切口** | NestJS + Prisma schema + GET /api/packages | ✅ 已完成 |
| **P2+B Admin 端到端打通** | packages/api-client + Admin 显示真实套餐 | ✅ 已完成 |
| **P2+ API 扩展** | 加 User/Order/Plot/Camera 等模块,登录 / JWT / 业务 CRUD | 待开始 |
| **P3 Admin 完整版** | 真 JWT 登录,套餐 CRUD(增删改),订单管理 | 待 P2+ |
| **P4 miniapp 接 API** | 替换 mock.js 为真实接口 | 待 P3 |
| **P5 摄像头接萤石云** | CameraModule + EZOPEN 播流 + 拍照抓帧 | 待 P4 |
| **P6 C 端 Web Portal 拆分** | apps/web/ 独立 Vue 3,翻译现有 17 个页面 | 用户决定暂缓,排在 P5 后 |
| 旁路任务 | Cloudflare Pages 接 Git 自动部署 / 装 Docker(切真 MySQL 用) | 已搭好基建,暂搁置 |

## 10. 关于 Claude Code 自身

- **项目级配置**: `.claude/settings.local.json` 是这台机器的 Bash 白名单,**不入 git**(.gitignore 里已加),换电脑后第一次打开会被问几次"允许吗",允许过就持久化了
- **会话历史**: `~/.claude/projects/C--TestProject-Cloud-Farm-project/*.jsonl`,本地存,**不会跟着 git 走**。所以这份 `CLAUDE.md` 才是项目记忆的"主备份"
- **想 Claude 记住一件新约定**: 直接写到这个文件里 + commit,所有机器、所有新会话立刻生效
