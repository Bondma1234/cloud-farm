# 云上田园 · 河南云农场

> 让每个城市家庭都有一块"看得见的安心农田"。
>
> 远程认养 + 24h 慢直播 + 农产品直送 的一线城市消费者云种植服务。

## 项目状态

🚧 **开发中** —— C 端 H5 已完成 13 个页面 + 全套 mock 数据,等待部署到 Cloudflare Pages。后端、微信支付、摄像头流接入未启动。

## 技术栈

- **同源双端**: Taro 4 + Vue 3 → 微信小程序 + H5 一份代码
- **H5 构建**: Vite 4(独立于 Taro 小程序构建,见 `apps/miniapp/vite.config.js`)
- **状态**: Pinia 2
- **路由**: vue-router 4(H5)/ Taro Router(小程序)
- **样式**: SCSS + CSS Variables

## 快速开始

```bash
git clone https://github.com/Bondma1234/cloud-farm.git
cd cloud-farm/apps/miniapp
npm install

# H5 本地预览(默认 http://localhost:5180)
npm run web

# 构建到 dist/
npm run web:build

# 微信小程序开发(可选)
npm run dev:weapp
```

## 仓库结构

```
.
├── apps/miniapp/           # 主战场:Taro 4 + Vue 3 源码
│   ├── src/pages/          # 13 个页面(home / packages / my-plot / live ...)
│   ├── src/stores/mock.js  # Pinia store + 全部 mock 数据
│   ├── src/mock/images.js  # 图片 URL 单一来源(切 CDN 改这里)
│   ├── src/main.web.js     # H5 入口 + 浏览器关键补丁
│   ├── src/shims/taro.js   # 浏览器版 Taro API
│   └── public/images/      # 17 张真图(套餐/作物/农场/直播)
├── prototype/              # 早期 HTML/CSS 原型
├── diagrams/               # 架构图 svg/png
├── 01_..._项目书_v2.docx    # 商业计划书
├── 02_..._需求说明书_v1.docx # 需求清单
├── 03_..._软件架构图_v1.docx # 软件架构
├── CLAUDE.md               # 项目记忆 / 架构约定(详见此文件)
└── README.md
```

## 已完成页面(C 端)

| 页面 | 路径 |
|---|---|
| 首页(快捷入口 + 热门套餐 + 直播) | `/pages/home` |
| 认养套餐列表 | `/pages/packages` |
| 套餐详情 | `/pages/package-detail` |
| 选地块 | `/pages/plot-picker` |
| 我的田(摄像头 + 指令 + 生长日志) | `/pages/my-plot` |
| 直播 | `/pages/live` |
| 订单列表 / 详情 | `/pages/orders` / `/pages/order-detail` |
| 收货地址列表 / 编辑 | `/pages/address` / `/pages/address-edit` |
| 我的 | `/pages/profile` |
| 登录 / 结算 | `/pages/login` / `/pages/checkout` |

## 协作约定

本项目使用 [Claude Code](https://claude.com/claude-code) 协作开发。所有架构约定、关键补丁、视觉规范、当前进度都记录在 **[CLAUDE.md](./CLAUDE.md)** 里 —— 改任何一条约定时记得同步更新。

特别注意:

- **图片必须经过 `src/mock/images.js`**,不要在组件里写 `/images/xxx.jpg` 字面量
- **`<image>→<img>` 是浏览器补丁**(MutationObserver,见 `main.web.js`),不要误删
- **iOS Safari 上 `<view @tap>`** 靠 `touchend` 桥接(见 `main.web.js`)

## License

私有项目,暂未开源。
