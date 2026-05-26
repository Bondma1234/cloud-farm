<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="head">
          <strong>照片墙审核</strong>
          <el-space>
            <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 130px" @change="load">
              <el-option value="active" label="✅ 上架中" />
              <el-option value="removed" label="🚫 已下架" />
            </el-select>
            <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
          </el-space>
        </div>
      </template>

      <el-alert v-if="error" type="error" :title="`接口失败: ${error}`" :closable="false" show-icon />

      <el-skeleton v-else-if="loading" :rows="5" animated />

      <el-empty v-else-if="!list.length" description="没有照片" :image-size="80" />

      <div v-else class="photo-grid">
        <div v-for="p in list" :key="p.id" class="photo-cell" :class="{ removed: p.status === 'removed' }">
          <el-image
            :src="p.photo"
            fit="cover"
            class="photo-img"
            :preview-src-list="[p.photo]"
            preview-teleported
          />
          <div class="photo-meta">
            <div class="photo-user">
              <span class="photo-avatar">{{ p.user.avatar }}</span>
              <span class="photo-name">{{ p.user.nickname }}</span>
              <el-tag v-if="p.status === 'removed'" type="info" size="small">已下架</el-tag>
            </div>
            <div class="photo-cap">{{ p.caption }}</div>
            <div class="photo-info">
              <span v-if="p.plotId">📍 {{ p.plotId }}</span>
              <span v-if="p.crop">🌱 {{ p.crop }}</span>
              <span>{{ p.at }}</span>
            </div>
            <div class="photo-actions">
              <el-button v-if="p.status === 'active'" size="small" type="warning" plain @click="onSet(p, 'removed')">下架</el-button>
              <el-button v-else size="small" type="success" plain @click="onSet(p, 'active')">恢复</el-button>
              <el-button size="small" type="danger" plain @click="onDelete(p)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-text type="info" size="small" style="margin-top: 12px; display: block">
        共 {{ list.length }} 张 · 下架后用户端 /photos 不显示;物理删除不可恢复
      </el-text>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listAdminPhotos,
  setPhotoStatus,
  deletePhoto,
  ApiError,
  type AdminPhotoPost,
} from '@cloud-farm/api-client';

const list = ref<AdminPhotoPost[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const statusFilter = ref<'' | 'active' | 'removed'>('');

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listAdminPhotos(statusFilter.value || undefined);
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

async function onSet(row: AdminPhotoPost, next: 'active' | 'removed') {
  try {
    const updated = await setPhotoStatus(row.id, next);
    Object.assign(row, updated);
    ElMessage.success(next === 'active' ? '已恢复' : '已下架');
  } catch (e) {
    ElMessage.error(`操作失败:${e instanceof ApiError ? e.message : (e as Error).message}`);
  }
}

async function onDelete(row: AdminPhotoPost) {
  try {
    await ElMessageBox.confirm(
      `物理删除 ${row.user.nickname} 的这张照片?不可恢复。`,
      '删除照片',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
  } catch { return; }
  try {
    await deletePhoto(row.id);
    list.value = list.value.filter(p => p.id !== row.id);
    ElMessage.success('已删除');
  } catch (e) {
    ElMessage.error(`删除失败:${e instanceof ApiError ? e.message : (e as Error).message}`);
  }
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
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.photo-cell {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.photo-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.photo-cell.removed {
  opacity: 0.6;
  filter: grayscale(0.3);
}
.photo-img {
  width: 100%;
  height: 180px;
  display: block;
  background: #f5f7f6;
}
.photo-meta {
  padding: 12px;
}
.photo-user {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.photo-avatar {
  font-size: 18px;
}
.photo-cap {
  font-size: 13px;
  color: #555;
  margin-top: 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.photo-info {
  font-size: 11px;
  color: #999;
  margin-top: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.photo-actions {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}
</style>
