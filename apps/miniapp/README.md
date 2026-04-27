# 云上田园 · 小程序 (Taro 4 + Vue 3)

和架构文档 `03_云上田园_软件架构图_v1.md` 一致的技术栈：**Taro 4 + Vue 3 + Pinia**。
同一份源码可编译出 **微信小程序** 和 **H5 网页版**，便于开发、演示和提审。

## 目录

```
apps/miniapp/
├── config/              Taro 编译配置
├── src/
│   ├── app.config.js    全局路由 / TabBar
│   ├── app.js           入口、Pinia 挂载
│   ├── app.scss         全局样式
│   ├── pages/           8 个页面
│   │   ├── home/            首页（顶部问候 / 精选认养 / 直播 / 动态）
│   │   ├── packages/        套餐列表（筛选）
│   │   ├── package-detail/  套餐详情
│   │   ├── plot-picker/     地块地图
│   │   ├── checkout/        确认订单 / 选作物
│   │   ├── my-plot/         我的田（核心页，含直播 + 指令 + 时间轴）
│   │   ├── live/            直播间 + 小黄车
│   │   └── profile/         我的
│   ├── stores/mock.js   所有 Mock 数据 + Pinia store
│   └── styles/tokens.scss  设计 Token（颜色 / 字体 / 阴影 / 间距）
└── project.config.json  微信开发者工具配置
```

## 启动

```bash
cd apps/miniapp
npm install --legacy-peer-deps   # Taro 4 peer deps 需要
npm run dev:h5                   # 浏览器预览, 默认 http://localhost:10086
npm run dev:weapp                # 编译到微信小程序, dist/ 用微信开发者工具打开
```

### 在浏览器看效果（H5，最快）
1. `npm run dev:h5`
2. 开 Chrome，访问 `http://localhost:10086`
3. F12 → 左上角切换到 iPhone 13 尺寸（390×844）

### 在微信开发者工具看效果（真实小程序运行时）
1. `npm run dev:weapp`
2. 打开微信开发者工具 → 导入项目
   - 项目目录：`apps/miniapp/`
   - AppID：随便选「测试号」
3. 右侧预览窗口实时刷新

## 页面一览

| 路由 | 作用 | 核心组件 |
|------|------|----------|
| `/pages/home/index` | 首页 | 天气卡、精选套餐（横滑）、直播卡、田园动态 |
| `/pages/packages/index` | 套餐列表 | 筛选芯片 + 套餐大卡片 |
| `/pages/package-detail/index?id=` | 套餐详情 | 服务流程 4 步 + FAQ + 悬浮下单栏 |
| `/pages/plot-picker/index?pkg=` | 选地块 | 4×3 网格地图 + 土壤/日照数据 |
| `/pages/checkout/index?pkg=&plot=` | 结算 | 选作物、立牌、优惠券、微信支付 |
| `/pages/my-plot/index` | 我的田 | 作物进度、摄像头画面、PTZ、8 种指令、生长时间轴 |
| `/pages/live/index?id=` | 直播间 | 全屏播放、弹幕、小黄车、其它直播 |
| `/pages/profile/index` | 我的 | 统计卡片、订单、菜单网格、设置 |

## 和需求说明书映射

| 需求模块 | 页面 | 状态 |
|---|---|---|
| M-01 首页 | `pages/home` | ✅ Demo |
| M-02 套餐列表 | `pages/packages` | ✅ Demo |
| M-03 套餐详情 | `pages/package-detail` | ✅ Demo |
| M-04 地块选择 | `pages/plot-picker` | ✅ Demo |
| M-05 支付下单 | `pages/checkout` | ✅ 走通 Mock 流程 |
| M-06 我的田 / 直播 / 指令 | `pages/my-plot` | ✅ 核心页 |
| M-07 直播间 | `pages/live` | ✅ Demo |
| M-10 个人中心 | `pages/profile` | ✅ Demo |

## 下一步工程化

1. **接入真实后端**：`src/api/` 封装 axios/Taro.request，替换 `stores/mock.js`
2. **登录 / 鉴权**：`Taro.login` + 后端 `code2session`，JWT 存 Storage
3. **直播 SDK**：我的田 / 直播间页接入萤石云 OpenAPI 或腾讯云直播 SDK
4. **支付**：`Taro.requestPayment` 对接微信支付
5. **地图**：地块选择页接入 `map` 组件或自绘 SVG 地块图
6. **性能**：分包加载 (`subpackages`)、图片走 CDN

---

设计 Token（颜色 / 字体 / 阴影）见 `src/styles/tokens.scss`，和架构文档/原型保持一致。
