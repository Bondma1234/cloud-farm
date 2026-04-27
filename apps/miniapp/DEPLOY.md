# 云上田园 C 端 Web · 部署指南

本目录下是 Taro 小程序源码 + Vite 浏览器 Demo 的产物。
本文只讲 **浏览器 Demo（展示型）** 的线上部署 —— 1–2 小时内能拿到公网可访问的 HTTPS 链接。

> 浏览器 Demo 走的是 `src/main.web.js` 这条 Vite 入口（独立于 Taro 的 H5 build），
> 作用是让投资人/合作方在不装小程序的情况下扫码/点链接就能看交互。
> 所有数据依然来自 `stores/mock.js`，**不涉及任何后端接口**。

---

## 一、本地构建 & 预览

```bash
cd apps/miniapp
npm install              # 首次
npm run web:build        # 生成 dist/
npm run web:preview      # 本地 http://localhost:5181 起静态服务器预览
```

构建产物：

```
dist/
├── index.html           # 5.5 KB
├── _headers             # Cloudflare/Netlify 缓存策略
├── _redirects           # SPA fallback
└── assets/
    ├── index-xxx.css    # 26 KB
    ├── index-xxx.js     # 33 KB
    └── vue-xxx.js       # 94 KB（vue/router/pinia 独立 chunk）
```

总 gzipped ≈ **55 KB**，首屏 1s 内加载完。

---

## 二、三个部署方案（推荐按顺序选）

### 🥇 方案 A：Cloudflare Pages（推荐）

**优点**：免费、免备案、全球 CDN、1 分钟上线、自带 HTTPS、国内访问可用（走香港/新加坡节点，延迟 100–200ms）

**前置**：注册 [Cloudflare](https://dash.cloudflare.com/) 账号（免费）

#### 方式 1：Dashboard 拖拽（最快，推荐首次使用）

1. 登录 Cloudflare → 左侧 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 项目名填 `cloud-farm-web`
3. 把 `apps/miniapp/dist/` 整个文件夹拖进去
4. 点 **Deploy site**
5. 30 秒后拿到 `https://cloud-farm-web.pages.dev` 永久域名

#### 方式 2：CLI 一键发布（自动化）

```bash
cd apps/miniapp

# 首次：登录 Cloudflare
npx wrangler@3 login

# 部署（会自动 build）
npm run web:deploy:cf
```

后续每次迭代，改完代码只需一条 `npm run web:deploy:cf` 就自动发版。

#### 方式 3：Git 自动部署（团队协作推荐）

1. 把项目推到 GitHub
2. Cloudflare Pages → **Connect to Git** → 选仓库
3. Build 配置：
   - Build command: `cd apps/miniapp && npm install && npm run web:build`
   - Build output directory: `apps/miniapp/dist`
   - Root directory: `/`（保留默认）
4. 保存后每次 `git push` 自动触发构建部署

---

### 🥈 方案 B：Vercel

**优点**：同 Cloudflare，免费 + 免备案 + HTTPS + 自动 Git 触发部署
**缺点**：国内访问比 Cloudflare Pages 稍慢

```bash
cd apps/miniapp
npx vercel@latest         # 按提示登录 + 一路回车
```

`vercel.json` 已配好，会自动识别 build 命令和输出目录。

---

### 🥉 方案 C：阿里云 OSS / 腾讯云 COS（国内访问最快）

**优点**：国内访问速度最快，延迟 <50ms
**缺点**：OSS 静态网站需要绑定**已备案**域名；只用默认 `*.oss-cn-xxx.aliyuncs.com` 会被阿里云强制下载而不是浏览；做 Demo 需要买域名 + 备案（15–25 天）

**推荐**：先用 Cloudflare Pages 上线做 Demo，等 ICP 备案下来后再切到阿里云。

简要步骤：
```bash
# 安装 ossutil 后
ossutil cp -r apps/miniapp/dist/ oss://your-bucket/ --update
```

---

## 三、域名配置（可选）

### 不买域名：直接用 `cloud-farm-web.pages.dev`（Cloudflare 送的）

### 买域名方案：

| 方案 | 域名后缀 | 备案 | 说明 |
|---|---|---|---|
| **A. 境外域名** | `.app / .io / .dev / .co` | ❌ 不用 | 最快，Cloudflare 买 + 解析 10 分钟搞定 |
| **B. 国内域名** | `.cn / .com.cn / .com` + 阿里云 | ✅ 必须 | 要公司资质，周期 15–25 天 |

**建议首次 Demo 选 A**，花 20 美元买一个 `cloudfarm.app`，当天就能用。

---

## 四、发布到微信分享（小程序 Webview / 朋友圈链接）

H5 想在微信里顺畅分享（不是"已停止访问"），域名需要：

1. **有 HTTPS** ✅（Cloudflare Pages / Vercel 自带）
2. **没被微信封** ✅（新域名默认没被封）
3. 想要**朋友圈/好友分享卡片自定义标题封面**，需要接 JS-SDK + 配置白名单 ——
   这一步已经**超出展示 Demo 范围**，放到后端阶段再做。

当前状态下，把链接扔微信里，用户点开能正常打开站点 + 看内容 + 扫码登录（没做），已经满足 Demo 需求。

---

## 五、部署完成后的验证清单

部署后访问你的公网链接，依次检查：

- [ ] 首页能打开，顶部绿色 hero 渐变、天气卡片显示
- [ ] 点"认养地" → 跳转到套餐页
- [ ] 点一张套餐卡的"立即认养" → 跳转到详情页
- [ ] 桌面端 ≥768px 时：顶部出现 Logo+导航+CTA，下方居中白色柱，底部有深绿色页脚
- [ ] 手机端 <768px 时：顶部导航隐藏，底部 TabBar 出现
- [ ] Chrome DevTools → Network：全部资源 200、总体积 gzip <60KB
- [ ] Lighthouse Performance 分数 ≥ 90（静态站通常 95+）

---

## 六、后续迭代流程

当前 Demo 是**纯前端**，所有"下单/支付/直播/指令"都是假的。
下一阶段（2–3 周体验型 Demo）要做的事：

1. 加后端 API → 前端 Pinia mock 换成真 `fetch`
2. 加微信登录 → 生成真实 `user_plot`
3. 接萤石云 → my-plot 页真播一路测试摄像头
4. 加场长后台 + 工单队列

上述完成后重新 `npm run web:build` + `npm run web:deploy:cf`，
**前端部署流程完全不变**，只是数据从假变真。

---

## 七、快速回滚

Cloudflare Pages / Vercel 都保留每次部署的快照。
出问题随时在 Dashboard 点 **Rollback to this deployment** 一键回滚到上一个版本，无需重新构建。
