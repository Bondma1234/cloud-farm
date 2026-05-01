# 云上田园 · 河南云农场

> 让每个城市家庭都有一块"看得见的安心农田"。
>
> 远程认养 + 摄像头远程监控 + 农产品直送 的一线城市消费者云种植服务。

## 项目状态(2026-05-01)

🚧 **开发中** —— P1 架构地基完成,正准备进入 P2(后端 API 实现)阶段。

| 模块 | 状态 |
|---|---|
| C 端 miniapp(17 页 + mock 数据) | ✅ 已完成 |
| 三份正式文档(项目书 v3 / 需求 v2 / 架构 v2) | ✅ 已完成 |
| monorepo 骨架(4 apps + 1 package) | ✅ P1 完成 |
| 后端 API(NestJS + Prisma + 业务接口) | 🚧 P2 待开始 |
| Admin 真实功能 | 🚧 P3 待开始 |
| miniapp 接 API | 🚧 P4 待开始 |
| 摄像头接萤石云 | 🚧 P5 待开始 |
| C 端 Web Portal(独立 Vue 3) | 🚧 P6 待开始 |

## 技术栈

- **monorepo**: pnpm workspace
- **微信小程序**: Taro 4 + Vue 3 + Pinia
- **C 端 H5(临时,等 P6 拆出独立 Web Portal)**: Vite 4(同源 miniapp 编译)
- **B 端 Admin**: Vue 3 + Vite + Element Plus
- **后端**: NestJS 10 + Prisma(P2) + MySQL 8 + Redis 7(可选)
- **摄像头**: 萤石云 OpenAPI(P5)
- **支付**: 微信支付(P5+)

## 快速开始

```bash
git clone https://github.com/Bondma1234/cloud-farm.git
cd cloud-farm

# 一次装好所有 app 依赖
pnpm install

# (可选)起本地 MySQL + Redis
docker compose up -d

# 启动单个 app
pnpm dev:miniapp     # http://localhost:5180   (C 端 H5 / 小程序源码)
pnpm dev:admin       # http://localhost:5183   (B 端后台)
pnpm dev:api         # http://localhost:3000   (后端 API,/api/health)

# build 全部 app
pnpm build:all
```

## 仓库结构

```
cloud-farm/
├── apps/
│   ├── miniapp/        # Taro 4 + Vue 3       微信小程序 + H5
│   ├── api/            # NestJS 10            后端 API
│   ├── admin/          # Vue 3 + Element Plus B 端后台
│   └── web/  🚧 P6      # Vue 3 + Vite         C 端 Web Portal(待拆)
├── packages/
│   ├── shared/         # TS 类型 + 业务常量 + 纯函数(三端共用)
│   ├── ui-tokens/  🚧   # 设计 token (P6)
│   └── api-client/  🚧  # 自动生成 SDK (P2)
├── docker-compose.yml  # 本地 MySQL + Redis
├── 01_项目书_v3.{md,docx}      # 商业计划书
├── 02_需求说明书_v2.{md,docx}   # 需求清单
├── 03_软件架构图_v2.{md,docx}   # 软件架构
├── md_to_docx.js       # md → docx 一键脚本
├── CLAUDE.md           # 项目记忆 / 架构约定
└── README.md
```

## C 端已完成页面(17 个)

| 模块 | 页面 |
|---|---|
| 用户 | login |
| 首页 | home |
| 认养 | packages / package-detail / plot-picker / checkout |
| 我的田 | my-plot / commands(指令历史) |
| 内容 | journal(田园动态) / crops(作物百科) / photos(照片墙) |
| 订单 | orders / order-detail |
| 地址 | address / address-edit |
| 个人中心 | profile |
| 直播(临时占位) | live(P5 改造为摄像头详情) |

## 协作约定

本项目使用 [Claude Code](https://claude.com/claude-code) 协作开发。所有架构约定、关键补丁、视觉规范、当前进度都记录在 **[CLAUDE.md](./CLAUDE.md)** 里 —— 改任何一条约定时记得同步更新。

特别注意:

- **monorepo 用 pnpm**,根目录 `pnpm install` 一次装好所有
- **三份正式文档以 v 当前为准**(项目书 v3 / 需求 v2 / 架构 v2),v1/v2 历史保留 + 头部 superseded 标记
- **图片必须经过 `apps/miniapp/src/mock/images.js`**,不要在组件里写字面量
- **miniapp 三层浏览器补丁**(`<image>→<img>` / `@tap` 桥接 / `<scroll-view>` 滚轮拖拽)在 `main.web.js`,不要误删

## License

私有项目,暂未开源。
