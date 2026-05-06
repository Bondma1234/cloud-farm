<template>
  <el-container class="page">
    <admin-aside />

    <el-container>
      <admin-header title="套餐管理" />

      <el-main>
        <el-card>
          <template #header>
            <div class="head">
              <strong>认养套餐</strong>
              <el-space>
                <el-tag v-if="!loading && !error" type="success" size="small">
                  {{ list.length }} 个套餐
                </el-tag>
                <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
                <el-button type="primary" :icon="Plus" disabled>新增 (P3)</el-button>
              </el-space>
            </div>
          </template>

          <!-- 错误态 -->
          <el-alert
            v-if="error"
            type="error"
            :title="`接口调用失败: ${error}`"
            description="检查后端是否启动 (pnpm dev:api),或代理配置 vite.config.ts /api → :3000"
            :closable="false"
            show-icon
          />

          <!-- 加载态 -->
          <el-skeleton v-else-if="loading" :rows="3" animated />

          <!-- 数据 -->
          <el-table v-else :data="list" stripe>
            <el-table-column label="封面" width="100">
              <template #default="{ row }">
                <el-avatar :size="56" shape="square" :src="resolveImage(row.cover)">
                  <span style="font-size: 12px">无图</span>
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="ID" width="120" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="area" label="面积(㎡)" width="100" align="center" />
            <el-table-column label="年费" width="120" align="center">
              <template #default="{ row }">
                <span style="color: #e57373; font-weight: 600">¥ {{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tag" label="标签" width="100">
              <template #default="{ row }">
                <el-tag :type="tagType(row.tag)">{{ row.tag }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="作物" min-width="160">
              <template #default="{ row }">
                <span v-if="row.crops?.length" class="crops">
                  <el-tag
                    v-for="c in row.crops.slice(0, 4)"
                    :key="c"
                    size="small"
                    effect="plain"
                    style="margin-right: 4px"
                  >
                    {{ c }}
                  </el-tag>
                  <span v-if="row.crops.length > 4" style="color: #999; font-size: 12px">
                    +{{ row.crops.length - 4 }}
                  </span>
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === 'active' ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default>
                <el-button size="small" disabled>编辑 (P3)</el-button>
                <el-button size="small" type="danger" disabled>下架 (P3)</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-alert
          style="margin-top: 16px"
          type="success"
          show-icon
          :closable="false"
          title="P2+B 阶段"
          description="本页数据走真实链路: NestJS API (:3000) → axios + 拦截器解包 {code,message,data} → Element Plus Table。P3 阶段会加 CRUD 编辑能力。"
        />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { listPackages, ApiError } from '@cloud-farm/api-client';
import type { Package } from '@cloud-farm/shared';
import AdminAside from '@/components/AdminAside.vue';
import AdminHeader from '@/components/AdminHeader.vue';

const list = ref<Package[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listPackages();
    ElMessage.success(`加载 ${list.value.length} 个套餐`);
  } catch (e) {
    if (e instanceof ApiError) {
      error.value = `${e.message} (code=${e.code})`;
    } else {
      error.value = (e as Error).message ?? '未知错误';
    }
  } finally {
    loading.value = false;
  }
}

function tagType(tag: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (tag === '热销') return 'danger';
  if (tag === '推荐') return 'success';
  if (tag === '亲子') return 'warning';
  return 'info';
}

/**
 * 套餐封面是 /images/xxx.jpg, 直接走 admin 自己的 public 是没的,
 * 实际要从 miniapp 那边复用。dev 阶段先暂时把图标当封面占位.
 * P5+ OSS 接通后会变成绝对 URL.
 */
function resolveImage(_path: string): string {
  return '';
}

onMounted(load);
</script>

<style scoped>
.page {
  height: 100vh;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.crops {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
