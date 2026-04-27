// Hand-craft SVG diagrams for Cloud-Farm architecture doc, render to PNG via resvg.
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const OUT = 'C:/TestProject/Cloud_Farm_project/diagrams';
const FONT = "'Microsoft YaHei','SimHei','PingFang SC','Noto Sans CJK SC',sans-serif";
const MONO = "'Consolas','Courier New',monospace";

const C = {
  primary:   '#4CA777',
  primaryDk: '#2E7D32',
  primaryLt: '#E8F4EA',
  accent:    '#F4B942',
  accentLt:  '#FFF8E1',
  ext:       '#6D4C41',
  extLt:     '#EFEBE9',
  user:      '#1976D2',
  userLt:    '#E3F2FD',
  warn:      '#D84315',
  warnLt:    '#FFEBEE',
  data:      '#7B1FA2',
  dataLt:    '#F3E5F5',
  text:      '#1B1B1B',
  textMute:  '#555',
  line:      '#555',
  lineLt:    '#999',
  bg:        '#FFFFFF',
};

// ---------- SVG helpers ----------
function svgOpen(w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <marker id="a" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${C.line}"/></marker>
    <marker id="ad" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${C.lineLt}"/></marker>
  </defs>
  <rect width="${w}" height="${h}" fill="${C.bg}"/>
  <style>
    text { font-family: ${FONT}; }
    .mono { font-family: ${MONO}; }
    .title { font-size: 18px; font-weight: 700; fill: ${C.text}; }
    .subtitle { font-size: 12px; fill: ${C.textMute}; }
    .h { font-size: 14px; font-weight: 600; }
    .b { font-size: 13px; }
    .s { font-size: 11px; fill: ${C.textMute}; }
    .lbl { font-size: 11px; fill: ${C.textMute}; }
  </style>`;
}
const svgClose = () => `</svg>`;

function box(x, y, w, h, title, subs = [], opt = {}) {
  const fill = opt.fill || C.primaryLt;
  const stroke = opt.stroke || C.primary;
  const textColor = opt.textColor || C.text;
  const radius = opt.radius ?? 8;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const lines = [title, ...subs];
  const total = lines.length;
  const lineH = 16;
  const startY = y + h/2 - ((total - 1) * lineH)/2 + 4;
  lines.forEach((t, i) => {
    const cls = i === 0 ? 'h' : 's';
    out += `<text x="${x + w/2}" y="${startY + i*lineH}" text-anchor="middle" class="${cls}" fill="${textColor}">${escapeXml(t)}</text>`;
  });
  return out;
}

function group(x, y, w, h, title, opt = {}) {
  const fill = opt.fill || 'rgba(76,167,119,0.04)';
  const stroke = opt.stroke || '#BDBDBD';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ry="6" fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="${x + 10}" y="${y + 16}" class="s" font-weight="600" fill="${C.textMute}">${escapeXml(title)}</text>`;
}

function arrow(x1, y1, x2, y2, label = '', opt = {}) {
  const color = opt.color || C.line;
  const dash = opt.dashed ? 'stroke-dasharray="5,4"' : '';
  const m = opt.dashed ? 'url(#ad)' : 'url(#a)';
  let out = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash} marker-end="${m}"/>`;
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 4;
    out += `<rect x="${mx - label.length*4 - 4}" y="${my - 11}" width="${label.length*8 + 8}" height="14" fill="white" opacity="0.92"/>`;
    out += `<text x="${mx}" y="${my}" text-anchor="middle" class="lbl">${escapeXml(label)}</text>`;
  }
  return out;
}

function biArrow(x1, y1, x2, y2, label = '', opt = {}) {
  const color = opt.color || C.line;
  let out = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-start="url(#a)" marker-end="url(#a)"/>`;
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 4;
    out += `<rect x="${mx - label.length*4 - 4}" y="${my - 11}" width="${label.length*8 + 8}" height="14" fill="white" opacity="0.92"/>`;
    out += `<text x="${mx}" y="${my}" text-anchor="middle" class="lbl">${escapeXml(label)}</text>`;
  }
  return out;
}

function title(x, y, text) {
  return `<text x="${x}" y="${y}" class="title">${escapeXml(text)}</text>`;
}

function escapeXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

// ---------- Render SVG to PNG ----------
function renderToPng(svg, outFile, scale = 2) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'zoom', value: scale },
    font: { loadSystemFonts: true, defaultFontFamily: 'Microsoft YaHei' },
  });
  const png = r.render().asPng();
  fs.writeFileSync(outFile, png);
  console.log(`[OK] ${outFile}  ${png.length} bytes`);
}

// =====================================================
//  DIAGRAM 1 — System Context (C4-Context)
// =====================================================
function d1Context() {
  const W = 1280, H = 720;
  let s = svgOpen(W, H);
  s += title(20, 36, '图1 · 系统上下文图（System Context）');

  // Center platform
  s += box(480, 280, 320, 160, '云上田园 平台', ['Cloud-Farm Platform'],
    { fill: C.primaryLt, stroke: C.primaryDk });

  // Users (left)
  s += box(60, 140, 230, 80, '认养用户 / 企业员工', ['C 端 · 微信小程序'],
    { fill: C.userLt, stroke: C.user });
  s += box(60, 320, 230, 80, '运营 / 场长 / 农技员', ['B 端 · Web 管理后台'],
    { fill: C.userLt, stroke: C.user });
  s += box(60, 500, 230, 80, '田间摄像头 / 传感器', ['IoT 设备'],
    { fill: C.userLt, stroke: C.user });

  // External systems (right)
  s += box(990, 60, 260, 76, '微信开放平台 / 微信支付', ['OAuth · 支付 · 订阅消息'],
    { fill: C.extLt, stroke: C.ext });
  s += box(990, 170, 260, 76, '萤石云 OpenAPI', ['摄像头接入 · 取流'],
    { fill: C.extLt, stroke: C.ext });
  s += box(990, 280, 260, 76, '腾讯云直播 / CDN', ['自营直播 · 回放分发'],
    { fill: C.extLt, stroke: C.ext });
  s += box(990, 390, 260, 76, '顺丰 / 京东 物流 API', ['下单 · 单号回传'],
    { fill: C.extLt, stroke: C.ext });
  s += box(990, 500, 260, 76, '腾讯云短信 / SLS', ['告警 · 验证码 · 日志'],
    { fill: C.extLt, stroke: C.ext });
  s += box(990, 610, 260, 76, 'OSS / RDS / Redis', ['基础设施（云托管）'],
    { fill: C.dataLt, stroke: C.data });

  // Arrows from users to platform
  s += arrow(290, 180, 480, 320, '小程序');
  s += arrow(290, 360, 480, 360, 'Web 后台');
  s += arrow(290, 540, 480, 400, 'IoT 上报');

  // Platform to externals
  s += biArrow(800, 320, 990, 98);
  s += biArrow(800, 340, 990, 208);
  s += biArrow(800, 360, 990, 318);
  s += arrow(800, 380, 990, 428, '异步');
  s += arrow(800, 400, 990, 538, '异步');
  s += biArrow(800, 430, 990, 648);

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 2 — Container Architecture (C4-Container)
// =====================================================
function d2Container() {
  const W = 1400, H = 900;
  let s = svgOpen(W, H);
  s += title(20, 36, '图2 · 容器架构图（C4-Container）');

  // Layer 1: clients
  s += group(40, 60, 1320, 140, '用户侧');
  s += box(120, 90, 260, 90, '微信小程序（C 端）', ['Taro 4 + Vue 3', '认养 · 互动 · 直播 · 下单'],
    { fill: C.userLt, stroke: C.user });
  s += box(570, 90, 260, 90, '运营 Web 后台（B 端）', ['Vue 3 + Element Plus', '订单 · 地块 · 工单 · 财务'],
    { fill: C.userLt, stroke: C.user });
  s += box(1020, 90, 260, 90, '农技员移动 Web', ['Vue 3 响应式 / PWA', '工单执行 · 拍照上传'],
    { fill: C.userLt, stroke: C.user });

  // Gateway
  s += group(40, 230, 1320, 80, '接入层');
  s += box(300, 245, 800, 50, 'API 网关（Nginx / APISIX）', ['路由 · 限流 · JWT · 灰度 · 请求日志'],
    { fill: C.accentLt, stroke: C.accent, radius: 4 });

  // Backend services
  s += group(40, 340, 1320, 220, '应用服务层  (MVP: 模块化单体；v2 按域拆分)');
  // Main backend (wide)
  s += box(80, 370, 820, 90, '后端核心服务（NestJS / Spring Boot）',
    ['[鉴权] [用户] [订单] [支付] [认养] [地块] [工单] [商城]',
     '[库存] [直播] [内容] [消息] [营销] [物流] [财务] [报表]'],
    { fill: C.primaryLt, stroke: C.primary });
  // 4 peripheral services
  const periY = 370;
  s += box(80, 480, 190, 60, 'IoT 接入服务', ['MQTT / 设备桥接'], { fill: C.primaryLt, stroke: C.primary });
  s += box(285, 480, 190, 60, '直播代理服务', ['推拉流 · 鉴权'], { fill: C.primaryLt, stroke: C.primary });
  s += box(490, 480, 190, 60, '消息推送服务', ['模板 · 队列消费'], { fill: C.primaryLt, stroke: C.primary });
  s += box(695, 480, 190, 60, '定时任务调度', ['xxl-job / cron'], { fill: C.primaryLt, stroke: C.primary });
  s += box(920, 370, 400, 170, '事件总线 / RabbitMQ', [
    'domain.events  ──▶  notify / report',
    'finance / crm  ──▶  alert / device',
    '(幂等 · 重试 · 死信)'
  ], { fill: C.accentLt, stroke: C.accent });

  // Data layer
  s += group(40, 590, 1320, 160, '数据 & 中间件层');
  s += box(80, 620, 220, 110, 'MySQL 8', ['业务库（主+从）', '云 RDS · 双 AZ'], { fill: C.dataLt, stroke: C.data });
  s += box(320, 620, 220, 110, 'Redis 7', ['缓存 / 分布式锁', '哨兵 · 1G'], { fill: C.dataLt, stroke: C.data });
  s += box(560, 620, 220, 110, 'RabbitMQ', ['事件队列', '3 节点集群'], { fill: C.dataLt, stroke: C.data });
  s += box(800, 620, 220, 110, 'OSS / COS', ['图片 · 视频 · 凭证', '三副本'], { fill: C.dataLt, stroke: C.data });
  s += box(1040, 620, 280, 110, 'ElasticSearch', ['搜索 · 日志（v1 引入）'], { fill: C.dataLt, stroke: C.data });

  // External
  s += group(40, 780, 1320, 90, '外部服务');
  const exts = ['微信开放平台','微信支付','萤石云','腾讯云直播','顺丰 API','腾讯云短信','OSS'];
  exts.forEach((t, i) => {
    s += box(70 + i * 185, 810, 170, 40, t, [], { fill: C.extLt, stroke: C.ext, radius: 4 });
  });

  // Connect: clients -> gateway
  s += arrow(250, 180, 600, 245);
  s += arrow(700, 180, 700, 245);
  s += arrow(1150, 180, 800, 245);
  // gateway -> backend
  s += arrow(700, 295, 700, 370);
  // backend -> event bus
  s += biArrow(900, 420, 920, 420, '事件');
  // backend -> data
  s += arrow(300, 560, 190, 620);
  s += arrow(400, 560, 430, 620);
  s += arrow(700, 560, 670, 620);
  s += arrow(900, 560, 910, 620);
  // backend -> externals
  s += arrow(700, 730, 700, 800, '', { dashed: true });

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 3 — Backend Components (domain modules)
// =====================================================
function d3Components() {
  const W = 1280, H = 820;
  let s = svgOpen(W, H);
  s += title(20, 36, '图3 · 后端组件架构图（领域模块与事件总线）');

  // API layer
  s += box(240, 70, 800, 60, 'API 层（Controllers）',
    ['/api/v1/auth  /users  /adoptions  /commands  /lives  /orders ...'],
    { fill: C.accentLt, stroke: C.accent });

  // Common infra
  s += box(240, 150, 800, 60, '共享基础设施（Base）',
    ['鉴权拦截 · 统一异常 · 审计日志 · 参数校验 · 分页 · 幂等中间件'],
    { fill: C.primaryLt, stroke: C.primary });

  // Three domain groups
  s += group(60, 240, 380, 150, '用户域 User');
  s += box(80, 270, 160, 45, 'Auth / JWT', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(260, 270, 160, 45, 'Profile', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(80, 325, 160, 45, 'Enterprise', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(260, 325, 160, 45, 'RBAC', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  s += group(450, 240, 380, 150, '农场域 Farm');
  s += box(470, 270, 160, 45, 'Base / Plot', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(650, 270, 160, 45, 'Crop', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(470, 325, 160, 45, 'Plan', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(650, 325, 160, 45, 'Command / Growth', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  s += group(840, 240, 380, 150, '交易域 Order');
  s += box(860, 270, 160, 45, 'Adoption', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1040, 270, 160, 45, 'Shop Order', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(860, 325, 160, 45, 'Payment / Refund', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1040, 325, 160, 45, 'Shipment', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  // Event bus
  s += box(240, 430, 800, 60, '领域事件总线（In-Process EventBus / RabbitMQ）',
    ['UserRegistered · AdoptionCreated · CommandCompleted · OrderPaid · DeviceOffline ...'],
    { fill: C.accentLt, stroke: C.accent });

  // Three consumer groups
  s += group(60, 520, 380, 240, '通知 & 内容');
  s += box(80, 550, 160, 45, 'Notify', ['订阅消息'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(260, 550, 160, 45, 'Content', ['图文素材'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(80, 610, 160, 45, 'Live', ['直播间'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(260, 610, 160, 45, 'Campaign', ['营销活动'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(80, 670, 160, 45, 'Coupon', ['优惠券'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(260, 670, 160, 45, 'BulletChat', ['评论/弹幕'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  s += group(450, 520, 380, 240, '设备 & 告警');
  s += box(470, 550, 160, 45, 'Device', ['摄像头/传感器'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(650, 550, 160, 45, 'Alert', ['离线/超阈值'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(470, 610, 160, 45, 'Heartbeat', ['心跳上报'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(650, 610, 160, 45, 'OTA', ['固件升级(v2)'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  s += group(840, 520, 380, 240, '财务 & 报表');
  s += box(860, 550, 160, 45, 'Billing', ['流水'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1040, 550, 160, 45, 'Invoice', ['发票'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(860, 610, 160, 45, 'Recon', ['对账'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1040, 610, 160, 45, 'Export', ['导出 Excel'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(860, 670, 340, 45, 'BI / Dashboard', [], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  // arrows API → Base → Domains → EventBus → Consumers
  s += arrow(640, 130, 640, 150);
  s += arrow(640, 210, 640, 240);
  s += arrow(250, 390, 640, 430);
  s += arrow(640, 390, 640, 430);
  s += arrow(1030, 390, 640, 430);
  s += arrow(250, 490, 240, 520, '事件', { dashed: true });
  s += arrow(640, 490, 640, 520, '事件', { dashed: true });
  s += arrow(1030, 490, 1030, 520, '事件', { dashed: true });

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 4 — Deployment Topology
// =====================================================
function d4Deployment() {
  const W = 1400, H = 900;
  let s = svgOpen(W, H);
  s += title(20, 36, '图4 · 生产环境部署拓扑');

  // User terminal
  s += box(560, 60, 280, 60, '用户终端', ['小程序 / 浏览器'], { fill: C.userLt, stroke: C.user });
  // CDN/WAF
  s += box(480, 150, 440, 60, 'CDN / WAF / DDoS 清洗', ['阿里云 / 腾讯云 边缘节点'], { fill: C.accentLt, stroke: C.accent });
  // SLB
  s += box(540, 240, 320, 50, 'SLB 负载均衡', [], { fill: C.accentLt, stroke: C.accent });

  // Two branches: static + API
  s += box(140, 330, 360, 70, 'Web 静态资源（Nginx）', ['运营后台 + 落地页  (OSS + CDN)'],
    { fill: C.primaryLt, stroke: C.primary });
  s += box(880, 330, 380, 70, 'API 网关（APISIX）', ['2 实例 · 限流 · JWT · 灰度'],
    { fill: C.primaryLt, stroke: C.primary });

  // K8s cluster
  s += group(820, 420, 500, 220, 'K8s 集群（ACK / TKE，3 Node × 4c8g）');
  s += box(850, 450, 200, 55, 'backend-api', ['2+ Pod / HPA'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1080, 450, 200, 55, 'iot-bridge', ['1 Pod'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(850, 520, 200, 55, 'notify-worker', ['1-2 Pod'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });
  s += box(1080, 520, 200, 55, 'scheduler', ['1 Pod · xxl-job'], { fill: C.primaryLt, stroke: C.primary, radius: 4 });

  // Data plane
  s += group(140, 660, 1180, 220, '数据 & 中间件（云托管，跨 AZ）');
  s += box(170, 690, 200, 60, '云 RDS MySQL', ['主从 · 2c4g'], { fill: C.dataLt, stroke: C.data });
  s += box(400, 690, 200, 60, '云 Redis', ['哨兵 · 1G'], { fill: C.dataLt, stroke: C.data });
  s += box(630, 690, 200, 60, '云 MQ RabbitMQ', ['3 节点'], { fill: C.dataLt, stroke: C.data });
  s += box(860, 690, 200, 60, 'OSS / COS', ['图/视频/备份'], { fill: C.dataLt, stroke: C.data });
  s += box(1090, 690, 200, 60, 'ES / 日志', ['v1 引入'], { fill: C.dataLt, stroke: C.data });

  s += box(170, 780, 320, 60, '监控：Prometheus + Grafana', ['业务/系统指标，告警 → 企微/钉钉'],
    { fill: C.accentLt, stroke: C.accent });
  s += box(510, 780, 320, 60, '错误：Sentry（前端） + SkyWalking（链路）', [],
    { fill: C.accentLt, stroke: C.accent });
  s += box(850, 780, 440, 60, '日志：SLS / ELK', ['业务日志 90 天 · 审计 6 月 · 财务 5 年'],
    { fill: C.accentLt, stroke: C.accent });

  // Arrows
  s += arrow(700, 120, 700, 150);
  s += arrow(700, 210, 700, 240);
  s += arrow(600, 290, 320, 330);
  s += arrow(800, 290, 1070, 330);
  s += arrow(1070, 400, 1070, 420);
  // k8s -> data
  s += arrow(950, 640, 270, 690, '', { dashed: true });
  s += arrow(1050, 640, 500, 690, '', { dashed: true });
  s += arrow(1150, 640, 730, 690, '', { dashed: true });
  s += arrow(1250, 640, 960, 690, '', { dashed: true });

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 5 — IoT Integration
// =====================================================
function d5IoT() {
  const W = 1280, H = 720;
  let s = svgOpen(W, H);
  s += title(20, 36, '图5 · 物联网（IoT）接入架构');

  // Field devices
  s += group(40, 70, 420, 280, '田间设备');
  s += box(70, 110, 160, 80, '4G 摄像头 ×N', ['萤石 C6 / 海康', '1080p · 夜视 · 云台'],
    { fill: C.warnLt, stroke: C.warn });
  s += box(260, 110, 160, 80, '土壤 / 光照传感器', ['温湿 · 光 · PH', 'LoRa 通信'],
    { fill: C.warnLt, stroke: C.warn });
  s += box(70, 220, 350, 80, 'LoRa 网关（4G 聚合路由）', ['设备汇聚 · MQTT 上行'],
    { fill: C.warnLt, stroke: C.warn });

  // Middle: ez-cloud
  s += box(540, 140, 220, 80, '萤石云 OpenAPI', ['设备注册 · 取流', 'HLS/FLV URL'],
    { fill: C.extLt, stroke: C.ext });

  // IoT bridge
  s += box(820, 140, 220, 80, 'IoT 接入服务', ['Node.js + MQTT', 'WebSocket 转发'],
    { fill: C.primaryLt, stroke: C.primary });

  // Backend domains
  s += group(540, 260, 700, 120, '后端服务域');
  s += box(570, 290, 160, 70, 'Device 域', ['设备/心跳/SN'], { fill: C.primaryLt, stroke: C.primary });
  s += box(750, 290, 160, 70, 'Command 域', ['指令工单'], { fill: C.primaryLt, stroke: C.primary });
  s += box(930, 290, 160, 70, 'Live 域', ['直播地址'], { fill: C.primaryLt, stroke: C.primary });
  s += box(1110, 290, 110, 70, 'Alert 域', ['告警'], { fill: C.primaryLt, stroke: C.primary });

  // Event bus
  s += box(540, 420, 700, 50, '事件总线（RabbitMQ）', [],
    { fill: C.accentLt, stroke: C.accent });

  // Consumers
  s += box(540, 510, 210, 80, '告警服务', ['离线 · 超流量', '→ 企微 / 短信'],
    { fill: C.primaryLt, stroke: C.primary });
  s += box(780, 510, 210, 80, '设备看板', ['在线率 · 心跳', '场长 Web'],
    { fill: C.primaryLt, stroke: C.primary });
  s += box(1020, 510, 220, 80, '用户推送', ['"您的田已浇水"', '订阅消息'],
    { fill: C.primaryLt, stroke: C.primary });

  // Arrows
  s += arrow(230, 150, 540, 160, 'RTMP/ISUP', { dashed: false });
  s += arrow(260, 300, 540, 200, 'MQTT', { dashed: false });
  s += arrow(760, 180, 820, 180, 'Token');
  s += arrow(930, 220, 770, 260);
  s += arrow(930, 220, 930, 260);
  s += arrow(930, 380, 890, 420);
  s += arrow(640, 470, 640, 510);
  s += arrow(890, 470, 890, 510);
  s += arrow(1130, 470, 1130, 510);

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 6 — Live streaming pipeline
// =====================================================
function d6Live() {
  const W = 1280, H = 700;
  let s = svgOpen(W, H);
  s += title(20, 36, '图6 · 直播与内容分发链路');

  // Two sources
  s += box(60, 100, 220, 80, '人工直播（手机）', ['大疆云台 + 麦克风', 'RTMP 推流'],
    { fill: C.userLt, stroke: C.user });
  s += box(60, 260, 220, 80, '慢直播摄像头', ['萤石 C6 太阳能', '24h 自动推流'],
    { fill: C.userLt, stroke: C.user });

  // Cloud live services
  s += box(360, 100, 260, 80, '腾讯云直播 (LVB)', ['推拉流 · 截图回调'],
    { fill: C.extLt, stroke: C.ext });
  s += box(360, 260, 260, 80, '萤石云服务', ['代理拉流 · Token'],
    { fill: C.extLt, stroke: C.ext });

  // CDN
  s += box(700, 180, 220, 80, 'CDN 分发', ['边缘节点 · 就近分发'],
    { fill: C.accentLt, stroke: C.accent });

  // Backend services
  s += box(360, 400, 560, 90, '后端 Live 服务', ['直播间状态机 · 商品弹窗调度', '点赞/评论聚合 · 转化埋点'],
    { fill: C.primaryLt, stroke: C.primary });

  // Consumers
  s += box(1000, 100, 220, 80, '小程序 / H5', ['HLS / FLV 播放'],
    { fill: C.userLt, stroke: C.user });
  s += box(1000, 260, 220, 80, 'Web / 大屏', ['回放管理'],
    { fill: C.userLt, stroke: C.user });

  // Related domains
  s += box(60, 560, 260, 80, '订单域', ['商品下单 · 转化'],
    { fill: C.primaryLt, stroke: C.primary });
  s += box(360, 560, 260, 80, '内容域', ['素材 · 回放切片'],
    { fill: C.primaryLt, stroke: C.primary });
  s += box(660, 560, 260, 80, 'OSS', ['回放 90 天'],
    { fill: C.dataLt, stroke: C.data });
  s += box(960, 560, 260, 80, 'BI / 看板', ['观看 / GMV / UV'],
    { fill: C.primaryLt, stroke: C.primary });

  // Arrows
  s += arrow(280, 140, 360, 140, 'RTMP');
  s += arrow(280, 300, 360, 300, 'ISUP');
  s += arrow(620, 140, 700, 200, 'HLS');
  s += arrow(620, 300, 700, 240, 'HLS');
  s += arrow(920, 200, 1000, 140);
  s += arrow(920, 240, 1000, 300);
  s += arrow(490, 180, 490, 400, '开播回调', { dashed: true });
  s += arrow(490, 260, 490, 400, '截图/状态', { dashed: true });
  s += arrow(490, 490, 190, 560);
  s += arrow(550, 490, 490, 560);
  s += arrow(700, 490, 790, 560);
  s += arrow(860, 490, 1090, 560);

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 7 — Sequence: Adoption / Placing Order
// =====================================================
function d7SeqAdoption() {
  const W = 1400, H = 760;
  let s = svgOpen(W, H);
  s += title(20, 36, '图7 · 时序图 · 用户认养下单');

  // Actors (lifeline)
  const actors = [
    { x: 100, name: '用户',      sub: '(客户端)' },
    { x: 300, name: '小程序',    sub: '前端' },
    { x: 500, name: '网关',      sub: 'APISIX' },
    { x: 700, name: '订单服务',  sub: 'Backend' },
    { x: 900, name: '库存/地块', sub: 'Redis+DB' },
    { x: 1100,name: '微信支付',  sub: 'External' },
    { x: 1300,name: '消息服务',  sub: 'Notify' },
  ];
  actors.forEach(a => {
    s += box(a.x - 70, 80, 140, 48, a.name, [a.sub],
      { fill: C.primaryLt, stroke: C.primary });
    s += `<line x1="${a.x}" y1="128" x2="${a.x}" y2="700" stroke="${C.lineLt}" stroke-width="1" stroke-dasharray="3,3"/>`;
  });

  // Messages
  const steps = [
    { from: 100, to: 300, y: 170, label: '(1)选套餐' },
    { from: 300, to: 500, y: 210, label: '(2)  创建认养单' },
    { from: 500, to: 700, y: 250, label: '(3)  路由' },
    { from: 700, to: 900, y: 290, label: '(4)  锁地块/校验' },
    { from: 900, to: 700, y: 330, label: '(5)  库存 OK', back: true },
    { from: 700, to: 1100, y: 370, label: '(6)  请求 prepay_id' },
    { from: 1100,to: 700, y: 410, label: '(7)  prepay_id', back: true },
    { from: 700, to: 300, y: 450, label: '(8)  返回支付参数', back: true },
    { from: 300, to: 100, y: 490, label: '(9)  唤起微信支付', back: true },
    { from: 100, to: 1100,y: 530, label: '(10)  输入支付密码' },
    { from: 1100,to: 700, y: 570, label: '(11) 支付成功回调 (异步)', back: true, dashed: true },
    { from: 700, to: 1300,y: 610, label: '(12) AdoptionCreated 事件', dashed: true },
    { from: 1300,to: 100, y: 650, label: '(13) 订阅消息"认养成功"', back: true },
  ];
  steps.forEach(st => {
    s += arrow(st.from + (st.from < st.to ? 0 : 0), st.y, st.to - (st.from < st.to ? 3 : -3), st.y, st.label, { dashed: !!st.dashed });
  });

  s += svgClose();
  return s;
}

// =====================================================
//  DIAGRAM 8 — Sequence: Command Ticket
// =====================================================
function d8SeqCommand() {
  const W = 1400, H = 650;
  let s = svgOpen(W, H);
  s += title(20, 36, '图8 · 时序图 · 互动指令（浇水/施肥）执行');

  const actors = [
    { x: 110, name: '用户',      sub: '小程序' },
    { x: 330, name: '后端',      sub: 'Command 域' },
    { x: 560, name: 'Redis',     sub: '冷却/配额' },
    { x: 780, name: '农技员',    sub: '移动 Web' },
    { x: 1010,name: 'OSS',       sub: '照片存储' },
    { x: 1240,name: '消息服务',  sub: 'Notify' },
  ];
  actors.forEach(a => {
    s += box(a.x - 80, 80, 160, 48, a.name, [a.sub],
      { fill: C.primaryLt, stroke: C.primary });
    s += `<line x1="${a.x}" y1="128" x2="${a.x}" y2="600" stroke="${C.lineLt}" stroke-width="1" stroke-dasharray="3,3"/>`;
  });

  const steps = [
    { from: 110, to: 330, y: 170, label: '(1)点击"浇水"' },
    { from: 330, to: 560, y: 210, label: '(2)  查询冷却/限额' },
    { from: 560, to: 330, y: 250, label: '(3)  通过', back: true },
    { from: 330, to: 110, y: 290, label: '(4)  返回"已安排"', back: true },
    { from: 330, to: 780, y: 330, label: '(5)  推送新工单 (WS)', dashed: true },
    { from: 780, to: 1010,y: 370, label: '(6)  执行+上传照片' },
    { from: 1010,to: 330, y: 410, label: '(7)  回调照片 URL', back: true },
    { from: 330, to: 560, y: 450, label: '(8)  更新工单状态' },
    { from: 330, to: 1240,y: 490, label: '(9)  CommandCompleted 事件', dashed: true },
    { from: 1240,to: 110, y: 540, label: '(10)  订阅消息"浇水完成"', back: true },
  ];
  steps.forEach(st => {
    s += arrow(st.from, st.y, st.to - (st.from < st.to ? 3 : -3), st.y, st.label, { dashed: !!st.dashed });
  });

  s += svgClose();
  return s;
}

// ---------- Main ----------
const diagrams = [
  ['01_context',     d1Context,    '系统上下文图'],
  ['02_container',   d2Container,  '容器架构图'],
  ['03_components',  d3Components, '后端组件架构图'],
  ['04_deployment',  d4Deployment, '生产部署拓扑'],
  ['05_iot',         d5IoT,        'IoT 接入架构'],
  ['06_live',        d6Live,       '直播分发链路'],
  ['07_seq_adoption',d7SeqAdoption,'时序图-认养下单'],
  ['08_seq_command', d8SeqCommand, '时序图-指令工单'],
];

for (const [name, fn] of diagrams) {
  const svg = fn();
  const svgPath = path.join(OUT, name + '.svg');
  const pngPath = path.join(OUT, name + '.png');
  fs.writeFileSync(svgPath, svg);
  renderToPng(svg, pngPath, 1.8);
}
console.log('all done');
