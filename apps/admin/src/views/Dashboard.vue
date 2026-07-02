<template>
  <div class="dashboard">
    <el-alert
      v-if="error"
      type="error"
      :title="`后端连接失败: ${error}`"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />
    <el-skeleton v-else-if="loading" :rows="8" animated />

    <template v-else-if="data">
      <!-- 4 KPI 卡(A2: count-up + 顶部色条 + hover 浮起) -->
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="kpi-card accent-primary">
            <div class="kpi">
              <div class="kpi-l">👥 用户总数</div>
              <div class="kpi-v primary">{{ userCountUp }}</div>
              <div class="kpi-s">含 customer / 农技员 / 客服 / 运营 / 管理员</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="kpi-card accent-danger">
            <div class="kpi">
              <div class="kpi-l">💰 累计 GMV</div>
              <div class="kpi-v danger">¥ {{ gmvCountUp }}</div>
              <div class="kpi-s">已付款及以后状态的订单求和</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="kpi-card accent-warning">
            <div class="kpi">
              <div class="kpi-l">📦 订单总数</div>
              <div class="kpi-v warning">{{ orderCountUp }}</div>
              <div class="kpi-s">含取消在内</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card
            shadow="hover"
            class="kpi-card"
            :class="data.totals.commandPending > 0 ? 'accent-danger alert' : 'accent-success'"
          >
            <div class="kpi">
              <div class="kpi-l">📋 待处理工单</div>
              <div class="kpi-v" :class="data.totals.commandPending > 0 ? 'danger' : 'success'">
                {{ cmdCountUp }}
              </div>
              <div class="kpi-s">农技员请尽快接单</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 第二行:GMV 30 天趋势 + 摄像头在线率 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="16">
          <el-card>
            <template #header>
              <strong>近 30 天 GMV(¥)</strong>
            </template>
            <v-chart :option="gmvOption" autoresize style="height: 260px" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <strong>摄像头在线率</strong>
            </template>
            <v-chart :option="cameraOption" autoresize style="height: 260px" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 第三行:订单分布 + 工单分布 + 用户分布 -->
      <el-row :gutter="16" style="margin-top: 16px">
        <el-col :span="8">
          <el-card>
            <template #header>
              <strong>订单状态分布</strong>
            </template>
            <v-chart :option="orderPieOption" autoresize style="height: 240px" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <strong>工单状态分布</strong>
            </template>
            <v-chart :option="commandPieOption" autoresize style="height: 240px" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <template #header>
              <strong>用户角色分布</strong>
            </template>
            <v-chart :option="userPieOption" autoresize style="height: 240px" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 套餐 top 3 -->
      <el-card style="margin-top: 16px">
        <template #header>
          <strong>套餐销量 Top 3</strong>
        </template>
        <v-chart v-if="data.packageTop.length" :option="packageBarOption" autoresize style="height: 240px" />
        <el-empty v-else description="还没有套餐订单" :image-size="80" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, PieChart, BarChart, GaugeChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { getAdminStats, type AdminStats, ApiError } from '@cloud-farm/api-client';
import { useCountUp } from '@/composables/useCountUp';

use([
  CanvasRenderer,
  LineChart, PieChart, BarChart, GaugeChart,
  TitleComponent, TooltipComponent, GridComponent, LegendComponent, DatasetComponent,
]);

const data = ref<AdminStats | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    data.value = await getAdminStats();
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// A2: KPI 数字滚动
const userCountUp = useCountUp(() => data.value?.totals.userCount ?? 0);
const gmvCountUp = useCountUp(() => data.value?.totals.gmvAll ?? 0);
const orderCountUp = useCountUp(() => data.value?.totals.orderCount ?? 0);
const cmdCountUp = useCountUp(() => data.value?.totals.commandPending ?? 0);

// ============ ECharts options ============
// 主色 #4ca777, 警告 #f4b942, 危险 #e57373

const gmvOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 50, right: 24, top: 24, bottom: 40 },
  xAxis: {
    type: 'category',
    data: data.value?.gmv30d.map((p) => p.date.slice(5)) ?? [],
    axisLabel: { interval: 4, fontSize: 11 },
  },
  yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
  series: [
    {
      name: 'GMV',
      type: 'line',
      data: data.value?.gmv30d.map((p) => p.gmv) ?? [],
      smooth: true,
      lineStyle: { color: '#4ca777', width: 2 },
      areaStyle: { color: 'rgba(76,167,119,0.18)' },
      itemStyle: { color: '#4ca777' },
    },
  ],
}));

const cameraOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      progress: { show: true, width: 18 },
      axisLine: { lineStyle: { width: 18, color: [[1, '#ebeef5']] } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      itemStyle: { color: '#4ca777' },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '20%'],
        fontSize: 30,
        fontWeight: 700,
        formatter: `${data.value?.cameraOnline.online ?? 0} / ${data.value?.cameraOnline.total ?? 0}`,
        color: '#2e7d32',
      },
      data: [{ value: Math.round((data.value?.cameraOnline.rate ?? 0) * 100), name: '' }],
    },
  ],
}));

const orderPieOption = computed(() => makePieOption(data.value?.orderByStatus ?? []));
const commandPieOption = computed(() => makePieOption(data.value?.commandByStatus ?? []));
const userPieOption = computed(() => makePieOption(data.value?.userByRole ?? []));

function makePieOption(kvs: { label: string; value: number }[]) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0, textStyle: { fontSize: 11 } },
    // A2: 品牌绿系为主的统一色板(替换原蓝/紫混色)
    color: ['#4ca777', '#f4b942', '#2e7d32', '#a5d6a7', '#e57373', '#90a4ae', '#6db997'],
    series: [
      {
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['50%', '45%'],
        data: kvs.map((kv) => ({ name: kv.label, value: kv.value })),
        label: { show: false },
        labelLine: { show: false },
      },
    ],
  };
}

const packageBarOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 100, right: 50, top: 12, bottom: 30 },
  xAxis: { type: 'value', axisLabel: { fontSize: 11 } },
  yAxis: {
    type: 'category',
    data: data.value?.packageTop.map((p) => p.name) ?? [],
    axisLabel: { fontSize: 12 },
  },
  series: [
    {
      name: '订单数',
      type: 'bar',
      data: data.value?.packageTop.map((p) => p.orderCount) ?? [],
      itemStyle: { color: '#4ca777' },
      barWidth: 22,
      label: {
        show: true,
        position: 'right',
        fontSize: 12,
        formatter: (param: { dataIndex: number; value: number }) => {
          const gmv = data.value?.packageTop[param.dataIndex]?.gmv ?? 0;
          return `${param.value} 单 · ¥${gmv.toLocaleString()}`;
        },
      },
    },
  ],
}));
</script>

<style scoped>
.dashboard {
  /* layout 管高度 */
}
/* A2: KPI 卡顶部品牌色条 + hover 浮起 */
.kpi-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 3px;
}
.kpi-card.accent-primary::before { background: linear-gradient(90deg, #4ca777, #2e7d32); }
.kpi-card.accent-danger::before  { background: linear-gradient(90deg, #e57373, #d35454); }
.kpi-card.accent-warning::before { background: linear-gradient(90deg, #f4b942, #e09b18); }
.kpi-card.accent-success::before { background: linear-gradient(90deg, #4ca777, #a5d6a7); }
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(38, 68, 51, 0.12);
}
.kpi {
  text-align: center;
  padding: 4px 0;
}
.kpi-l {
  font-size: 13px;
  color: #888;
}
.kpi-v {
  font-size: 28px;
  font-weight: 700;
  margin: 6px 0 2px;
  color: #555;
  font-variant-numeric: tabular-nums;
}
.kpi-v.primary { color: #2e7d32; }
.kpi-v.danger { color: #e57373; }
.kpi-v.warning { color: #c08400; }
.kpi-v.success { color: #4ca777; }
.kpi-s {
  font-size: 11px;
  color: #bbb;
}
.alert {
  border-color: #e57373;
}
</style>
