# 云上田园 · 项目记忆

> 让 Claude / 开发者打开仓库就知道项目背景、技术约定和当前进度。
> 修改后随代码一起 commit,所有机器都能同步到。

## 1. 项目定位

**云上田园 · 河南云农场** —— 面向北上广深一线城市消费者,提供"远程认养 + 24h 慢直播 + 农产品直送"的沉浸式云种植服务。完整定位、市场分析、商业模式、6 个月路线图见仓库根目录:

- `01_云上田园_项目书_v2.docx` / `.md` —— 商业计划书
- `02_云上田园_需求说明书_v1.docx` / `.md` —— 需求清单
- `03_云上田园_软件架构图_v1.docx` / `.md` —— 软件架构

核心套餐(同时也是 mock 数据的依据):

| 套餐 | 面积 | 年费 | 包含 |
|---|---|---|---|
| 基础版 | 10㎡ | ¥499 | 1 种作物 / 保底 10 斤 / 包邮 2 次 / 共享摄像头 |
| 进阶版 | 15㎡ | ¥799 | 2 种作物 / 保底 20 斤 / 包邮 3 次 / 专属遥控摄像头 |
| 亲子版 | 10㎡ | ¥699 | 自然教育 3 节 / 工具包 / 孩子名字立牌 |

## 2. 仓库结构

```
Cloud_Farm_project/
├── apps/miniapp/             # Taro 4 + Vue 3 小程序 + H5 源码(主战场)
├── prototype/                # 早期纯 HTML/CSS 原型(可参考视觉)
├── diagrams/                 # 架构图 svg/png
├── 01_..._项目书_v2.docx     # 三份正式文档(docx + md 双份)
├── 02_..._需求说明书_v1.docx
├── 03_..._软件架构图_v1.docx
└── CLAUDE.md                 # 本文件
```

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

### 4.3 图片 URL 必须经过 `src/mock/images.js`

所有 mock 图片都从 `public/images/xxx.jpg` 出。**绝对不要**在组件里写 `'/images/xxx.jpg'` 字面量,而是 `import { PKG_COVER, CROP, FARM, LIVE, MISC } from '@/mock/images'` 然后用 `PKG_COVER.basic` 这种引用。

**原因**:未来接后台 CMS 时,只需把 `images.js` 里的 `/images/xxx.jpg` 换成 `https://cdn.cloud-farm.com/...`,前端组件零改动。

`images.js` 还导出 `fallbackImage(emoji, palette)` 和预制的 `FB.{pkg,crop,live,farm,ship}` —— 任何 `<image>` 加载失败都用 emoji + 渐变色兜底。

### 4.4 Taro shim 在浏览器里的覆盖范围

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

## 9. 当前进度(2026-04-27)

✅ **已完成**

- Batch A1: 13 个 C 端页面 + Pinia mock store + Taro shim + 17 张真图
- 浏览器关键补丁: `<image>→<img>` MutationObserver + `@tap` 桥接
- `mock/images.js` 单一来源架构
- H5 构建 OK(57 modules,~66 KB gzip + 2.1 MB images)

🚧 **进行中 / 待做**

- 拖 `apps/miniapp/dist/` 到 Cloudflare Pages Dashboard 部署
- Batch A2(可选): 田园动态详情、指令历史、作物百科、用户照片墙
- Batch A3(可选): 评价、邀请、消息、客服、设置、关于
- 接真实后端(Node + 微信支付 + 海康摄像头流)
- 上架微信小程序

## 10. 关于 Claude Code 自身

- **项目级配置**: `.claude/settings.local.json` 是这台机器的 Bash 白名单,**不入 git**(.gitignore 里已加),换电脑后第一次打开会被问几次"允许吗",允许过就持久化了
- **会话历史**: `~/.claude/projects/C--TestProject-Cloud-Farm-project/*.jsonl`,本地存,**不会跟着 git 走**。所以这份 `CLAUDE.md` 才是项目记忆的"主备份"
- **想 Claude 记住一件新约定**: 直接写到这个文件里 + commit,所有机器、所有新会话立刻生效
