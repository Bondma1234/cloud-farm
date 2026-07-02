<template>
  <div class="page">
    <el-card>
          <template #header>
            <div class="head">
              <strong>认养套餐</strong>
              <el-space>
                <el-tag v-if="!loading && !error" type="success" size="small">
                  {{ list.length }} 个(active {{ activeCount }} / archived {{ archivedCount }})
                </el-tag>
                <el-checkbox v-model="includeArchived" @change="load">看下架</el-checkbox>
                <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
                <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
              </el-space>
            </div>
          </template>

          <el-alert
            v-if="error"
            type="error"
            :title="`接口调用失败: ${error}`"
            description="检查后端是否启动 (pnpm dev:api),或代理配置 vite.config.ts /api → :3000"
            :closable="false"
            show-icon
          />

          <el-skeleton v-else-if="loading" :rows="3" animated />

          <el-table v-else :data="list" stripe>
            <el-table-column label="封面" width="100">
              <template #default="{ row }">
                <el-avatar :size="56" shape="square" :src="row.cover">
                  <span style="font-size: 12px">无图</span>
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="id" label="ID" width="120" />
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="area" label="面积(㎡)" width="90" align="center" />
            <el-table-column label="年费" width="100" align="center">
              <template #default="{ row }">
                <span style="color: #e57373; font-weight: 600">¥ {{ row.price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tag" label="标签" width="90">
              <template #default="{ row }">
                <el-tag :type="tagType(row.tag)">{{ row.tag }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="作物" min-width="180">
              <template #default="{ row }">
                <span class="crops">
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
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="onEdit(row)">编辑</el-button>
                <el-button
                  v-if="row.status === 'active'"
                  size="small"
                  type="warning"
                  @click="onToggle(row, 'archived')"
                  >下架</el-button
                >
                <el-button v-else size="small" type="success" @click="onToggle(row, 'active')"
                  >上架</el-button
                >
                <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

    <package-edit-dialog
      v-model="dialogOpen"
      :package="editing"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listPackages,
  setPackageStatus,
  deletePackage,
  ApiError,
} from '@cloud-farm/api-client';
import type { Package } from '@cloud-farm/shared';
import PackageEditDialog from '@/components/PackageEditDialog.vue';

const list = ref<Package[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const includeArchived = ref(false);
const dialogOpen = ref(false);
const editing = ref<Package | null>(null);

const activeCount = computed(() => list.value.filter((p) => p.status === 'active').length);
const archivedCount = computed(() => list.value.filter((p) => p.status === 'archived').length);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listPackages({ includeArchived: includeArchived.value });
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
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

function onAdd() {
  editing.value = null;
  dialogOpen.value = true;
}

function onEdit(p: Package) {
  editing.value = p;
  dialogOpen.value = true;
}

async function onToggle(p: Package, status: 'active' | 'archived') {
  try {
    await setPackageStatus(p.id, status);
    ElMessage.success(`已${status === 'active' ? '上架' : '下架'}`);
    await load();
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`操作失败:${msg}`);
  }
}

async function onDelete(p: Package) {
  try {
    await ElMessageBox.confirm(
      `确定物理删除套餐 ${p.name}(${p.id})?\n\n如果套餐已被订单使用,会失败,请改用下架。`,
      '危险操作',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );
  } catch {
    return;
  }
  try {
    await deletePackage(p.id);
    ElMessage.success(`已删除 ${p.id}`);
    await load();
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessageBox.alert(msg, '删除失败');
  }
}

function onSaved() {
  load();
}

onMounted(load);
</script>

<style scoped>
.page {
  /* layout 管高度 */
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
