<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="head">
          <strong>作物百科</strong>
          <el-space>
            <el-checkbox v-model="includeArchived" @change="load">含已下架</el-checkbox>
            <el-select v-model="seasonFilter" placeholder="按季节" clearable style="width: 130px" @change="load">
              <el-option value="春" label="🌸 春" />
              <el-option value="夏" label="☀️ 夏" />
              <el-option value="秋" label="🍂 秋" />
              <el-option value="冬" label="❄️ 冬" />
            </el-select>
            <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增作物</el-button>
          </el-space>
        </div>
      </template>

      <el-alert
        v-if="error"
        type="error"
        :title="`接口失败: ${error}`"
        :closable="false"
        show-icon
      />

      <el-skeleton v-else-if="loading" :rows="5" animated />

      <el-empty v-else-if="!list.length" description="还没有作物" :image-size="80">
        <el-button type="primary" @click="openCreate">新增第一个作物</el-button>
      </el-empty>

      <el-table v-else :data="list" stripe>
        <el-table-column label="作物" width="220">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-image :src="row.cover" fit="cover" style="width: 48px; height: 48px; border-radius: 6px">
                <template #error>
                  <div class="cover-fallback">{{ row.emoji }}</div>
                </template>
              </el-image>
              <div>
                <div><span style="font-size: 16px">{{ row.emoji }}</span> {{ row.name }}</div>
                <div style="color: #888; font-size: 12px">{{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="season" label="季节" width="110" />
        <el-table-column label="难度" width="110">
          <template #default="{ row }">
            <el-rate v-model="row.difficulty" disabled :max="5" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="daysToHarvest" label="生长期" width="120" />
        <el-table-column prop="yieldPerSqm" label="产量/㎡" width="110" />
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="t in row.tags" :key="t" size="small" effect="plain" style="margin-right: 4px; margin-bottom: 4px">
              {{ t }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success" size="small">上架中</el-tag>
            <el-tag v-else type="info" size="small">已下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status === 'active'" size="small" type="warning" plain @click="onToggleStatus(row, 'archived')">下架</el-button>
            <el-button v-else size="small" type="success" plain @click="onToggleStatus(row, 'active')">上架</el-button>
            <el-button size="small" type="danger" plain @click="onDelete(row)">删</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-text type="info" size="small" style="margin-top: 12px; display: block">
        共 {{ list.length }} 种 · 下架后小程序不展示, 但订单引用不受影响;物理删除前会检测订单引用
      </el-text>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogOpen"
      :title="editing ? '编辑作物' : '新增作物'"
      width="640px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px" label-position="right">
        <el-form-item label="ID" required>
          <el-input v-model="form.id" :disabled="!!editing" placeholder="crop-grape (3-30 位小写英文/数字/连字符)" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="14">
            <el-form-item label="名称" required>
              <el-input v-model="form.name" placeholder="葡萄" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="Emoji" required>
              <el-input v-model="form.emoji" placeholder="🍇" maxlength="4" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="封面" required>
          <div style="display: flex; align-items: center">
            <el-upload
              :show-file-list="false"
              :before-upload="coverBeforeUpload"
              :http-request="uploadCover"
              accept="image/*"
            >
              <el-button :loading="coverUploading" plain>
                {{ coverUploading ? '上传中…' : '📤 上传封面' }}
              </el-button>
            </el-upload>
            <el-image
              v-if="form.cover"
              :src="form.cover"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 6px; margin-left: 10px"
            />
          </div>
          <el-input v-model="form.cover" size="small" placeholder="或直接粘贴 URL" style="margin-top: 6px" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="季节" required>
              <el-input v-model="form.season" placeholder="春种秋收 / 春秋" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度" required>
              <el-rate v-model="form.difficulty" :max="5" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="生长期" required>
              <el-input v-model="form.daysToHarvest" placeholder="90-110 天" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产量/㎡" required>
              <el-input v-model="form.yieldPerSqm" placeholder="5-8 斤" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="简介" required>
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="作物特性,推荐种植场景..." />
        </el-form-item>
        <el-form-item label="标签" required>
          <el-input v-model="tagsText" placeholder="逗号分隔: 耐储运, 高观赏, 适合亲子" />
        </el-form-item>
        <el-form-item label="推荐套餐" required>
          <el-input v-model="recommendText" placeholder="逗号分隔: 基础版, 亲子版" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">
          {{ editing ? '保存修改' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  listCrops,
  createCrop,
  updateCrop,
  setCropStatus,
  deleteCrop,
  ApiError,
} from '@cloud-farm/api-client';
import type { Crop } from '@cloud-farm/shared';
import { useUpload } from '@/composables/useUpload';

const list = ref<Crop[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const seasonFilter = ref('');
const includeArchived = ref(false);

const dialogOpen = ref(false);
const editing = ref<Crop | null>(null);
const saving = ref(false);

const form = reactive({
  id: '',
  name: '',
  emoji: '🌱',
  cover: '',
  season: '春秋',
  difficulty: 3,
  daysToHarvest: '',
  yieldPerSqm: '',
  intro: '',
  sortOrder: 99,
});
const tagsText = ref('');
const recommendText = ref('');

const { uploadOne: uploadCover, beforeUpload: coverBeforeUpload, uploading: coverUploading } = useUpload(
  (url) => { form.cover = url; }
);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    list.value = await listCrops(seasonFilter.value || undefined, includeArchived.value);
  } catch (e) {
    error.value = e instanceof ApiError ? `${e.message} (code=${e.code})` : (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, {
    id: '', name: '', emoji: '🌱', cover: '',
    season: '春秋', difficulty: 3,
    daysToHarvest: '', yieldPerSqm: '', intro: '', sortOrder: 99,
  });
  tagsText.value = '';
  recommendText.value = '';
  dialogOpen.value = true;
}

function openEdit(c: Crop) {
  editing.value = c;
  Object.assign(form, {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    cover: c.cover,
    season: c.season,
    difficulty: c.difficulty,
    daysToHarvest: c.daysToHarvest,
    yieldPerSqm: c.yieldPerSqm,
    intro: c.intro,
    sortOrder: c.sortOrder ?? 99,
  });
  tagsText.value = (c.tags || []).join(', ');
  recommendText.value = (c.recommendPkg || []).join(', ');
  dialogOpen.value = true;
}

function parseList(s: string): string[] {
  return s.split(/[,，\n]/).map(x => x.trim()).filter(Boolean);
}

async function onSave() {
  if (!form.name) return ElMessage.warning('请填名称');
  if (!editing.value && !/^[a-z0-9-]{3,30}$/.test(form.id)) {
    return ElMessage.warning('ID 格式不对 (3-30 位 a-z0-9-)');
  }
  const tags = parseList(tagsText.value);
  const recommendPkg = parseList(recommendText.value);
  if (!tags.length) return ElMessage.warning('标签至少 1 项');
  if (!recommendPkg.length) return ElMessage.warning('推荐套餐至少 1 项');

  saving.value = true;
  try {
    const payload = {
      name: form.name,
      emoji: form.emoji,
      cover: form.cover,
      season: form.season,
      difficulty: form.difficulty,
      daysToHarvest: form.daysToHarvest,
      yieldPerSqm: form.yieldPerSqm,
      intro: form.intro,
      tags,
      recommendPkg,
      sortOrder: form.sortOrder,
    };
    let saved: Crop;
    if (editing.value) {
      saved = await updateCrop(form.id, payload);
      ElMessage.success(`已更新:${saved.name}`);
    } else {
      saved = await createCrop({ id: form.id, ...payload });
      ElMessage.success(`已创建:${saved.name}`);
    }
    // 同步 list
    const idx = list.value.findIndex(c => c.id === saved.id);
    if (idx >= 0) list.value[idx] = saved;
    else list.value.unshift(saved);
    dialogOpen.value = false;
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`保存失败:${msg}`);
  } finally {
    saving.value = false;
  }
}

async function onToggleStatus(row: Crop, next: 'active' | 'archived') {
  try {
    const updated = await setCropStatus(row.id, next);
    Object.assign(row, updated);
    ElMessage.success(next === 'active' ? '已上架' : '已下架');
  } catch (e) {
    ElMessage.error(`操作失败:${e instanceof ApiError ? e.message : (e as Error).message}`);
  }
}

async function onDelete(row: Crop) {
  try {
    await ElMessageBox.confirm(
      `物理删除 ${row.emoji} ${row.name}?如被订单引用则无法删除,建议改"下架"`,
      '删除作物',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    );
  } catch { return; }
  try {
    await deleteCrop(row.id);
    list.value = list.value.filter(c => c.id !== row.id);
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
.cover-fallback {
  width: 100%;
  height: 100%;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 6px;
}
</style>
