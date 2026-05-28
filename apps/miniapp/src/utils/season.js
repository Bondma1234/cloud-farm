// ============ 季节文案工具(P8 视觉优化 A) ============
// 用 home 顶部"天气卡"取代原来硬编码"河南·周口 22°多云",
// 在不接真天气 API 的前提下,用日期+月份给个有种植感的轻文案。
//
// 后续接真天气(和风/心知)只需替换这一处。

const SEASONS = [
  // [起月, 名字, emoji, 主作物提示, 副文案]
  [3,  '春',  '🌸', '小番茄 / 草莓',     '宜播种,温度回升'],
  [6,  '夏',  '☀️', '南瓜 / 苦瓜',       '宜浇水,关注病虫害'],
  [9,  '秋',  '🍂', '红薯 / 萝卜',       '宜采收,土壤蓄水'],
  [12, '冬',  '❄️', '香椿 / 大蒜',       '宜养土,减少灌溉'],
];

function getSeason(month /* 1-12 */) {
  if (month >= 3 && month <= 5) return SEASONS[0];
  if (month >= 6 && month <= 8) return SEASONS[1];
  if (month >= 9 && month <= 11) return SEASONS[2];
  return SEASONS[3];
}

// 河南周口 各月典型气温(白天均温,°C)+ 天气倾向 —— 不接真天气 API,按月份给合理值
const HENAN_MONTHLY = [
  { temp: 4,  cond: '晴冷' }, // 1月
  { temp: 7,  cond: '多云' },
  { temp: 14, cond: '多云' },
  { temp: 21, cond: '晴' },
  { temp: 26, cond: '晴' },
  { temp: 31, cond: '多云' },
  { temp: 33, cond: '雷阵雨' },
  { temp: 32, cond: '多云' },
  { temp: 27, cond: '晴' },
  { temp: 21, cond: '晴' },
  { temp: 13, cond: '多云' },
  { temp: 6,  cond: '晴冷' }, // 12月
];

/**
 * 当前季节卡片信息
 * 返回:{ icon, season, crops, tip, monthLabel, temp, cond, location, weatherTip }
 */
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1;
  const [, season, icon, crops, tip] = getSeason(month);
  const w = HENAN_MONTHLY[month - 1] || { temp: 22, cond: '多云' };
  // 适宜度文案:15-30° 适宜生长
  const weatherTip = w.temp >= 15 && w.temp <= 30 ? '适宜生长'
    : w.temp > 30 ? '注意防暑遮阳'
    : '注意保温';
  return {
    icon, season, crops, tip, monthLabel: `${month}月`,
    temp: w.temp, cond: w.cond, location: '河南·周口', weatherTip,
  };
}

/**
 * 用户"种地天数":基于 createdAt(ISO) 跟今天差的天数
 * 没 createdAt 时返 null,UI 显示 fallback 文案
 */
export function getPlantedDays(createdAtIso) {
  if (!createdAtIso) return null;
  const created = new Date(createdAtIso);
  if (isNaN(created.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const c = new Date(created);
  c.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - c.getTime()) / 86_400_000);
  return Math.max(1, days + 1); // 注册当天算第 1 天
}

/** 格式化注册日期为 'YYYY-MM-DD' 用作 hero-card 副标签 */
export function formatJoinedDate(createdAtIso) {
  if (!createdAtIso) return '';
  const d = new Date(createdAtIso);
  if (isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day} 加入`;
}
