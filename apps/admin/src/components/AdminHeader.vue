<template>
  <el-header class="header">
    <div class="header-l">
      <span class="page-title">{{ title }}</span>
      <span class="subtitle">{{ subtitle }}</span>
    </div>
    <div class="header-r">
      <div class="clock">
        <span class="time">{{ now }}</span>
        <span class="day">{{ day }}</span>
      </div>
      <div class="divider" />
      <template v-if="auth.user">
        <span class="user">
          <span class="user-avatar">{{ auth.user.avatar }}</span>
          <span class="user-name">{{ auth.user.nickname }}</span>
          <el-tag :type="roleType" size="small" effect="dark" round style="margin-left: 4px">
            {{ roleLabel }}
          </el-tag>
        </span>
      </template>
      <el-button text @click="logout">
        <el-icon><SwitchButton /></el-icon>
        <span style="margin-left: 4px">退出</span>
      </el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

withDefaults(
  defineProps<{
    title?: string;
    phase?: string;
    phaseColor?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  }>(),
  {
    title: '运营后台',
    phase: 'P3 真接入',
    phaseColor: 'success',
  },
);

const router = useRouter();
const auth = useAuthStore();

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  operator: '运营',
  cs: '客服',
  agronomist: '农技员',
  customer: '用户',
};

const roleLabel = computed(() => ROLE_LABEL[auth.user?.role ?? ''] ?? auth.user?.role ?? '');

const roleType = computed<'primary' | 'success' | 'warning' | 'danger' | 'info'>(() => {
  if (auth.user?.role === 'admin') return 'danger';
  if (auth.user?.role === 'operator') return 'warning';
  if (auth.user?.role === 'cs') return 'success';
  if (auth.user?.role === 'agronomist') return 'primary';
  return 'info';
});

// 副标题:hour 显示问候语
const subtitle = computed(() => {
  const h = new Date().getHours();
  if (h < 6)  return '夜深了,记得早点休息';
  if (h < 11) return '早上好,今天也加油';
  if (h < 14) return '中午好,记得吃饭';
  if (h < 18) return '下午好,稳步推进';
  if (h < 22) return '晚上好,辛苦了';
  return '深夜好,注意休息';
});

// 实时时钟
const now = ref('');
const day = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
function updateClock() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  now.value = `${h}:${m}`;
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  day.value = `${d.getMonth() + 1}/${d.getDate()} 周${weeks[d.getDay()]}`;
}
onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 30_000); // 30s 刷一次(分钟级精度够)
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function logout() {
  try {
    await ElMessageBox.confirm('确定退出当前账号?', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  auth.clear();
  router.push('/login');
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(90deg, #f8fbf8 0%, #ffffff 60%);
  border-bottom: 1px solid #ebeef5;
  padding: 0 24px;
  position: relative;
}
.header::after {
  /* 顶部一条 1px 品牌色细线,品牌氛围 */
  content: '';
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 2px;
  background: linear-gradient(90deg, #4ca777 0%, #2e7d32 50%, #f4b942 100%);
  opacity: 0.65;
}
.header-l {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.page-title {
  font-weight: 600;
  font-size: 16px;
  color: #2e7d32;
  line-height: 1.2;
}
.subtitle {
  font-size: 11px;
  color: #999;
  line-height: 1.2;
}
.header-r {
  display: flex;
  align-items: center;
  gap: 14px;
}
.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.time {
  font-size: 16px;
  font-weight: 700;
  color: #2e7d32;
}
.day {
  font-size: 11px;
  color: #999;
}
.divider {
  width: 1px;
  height: 22px;
  background: #ebeef5;
}
.user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}
.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e8f4ea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.user-name {
  font-weight: 500;
}
</style>
