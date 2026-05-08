<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    :title="isEdit ? '编辑套餐' : '新增套餐'"
    width="640px"
    :close-on-click-modal="false"
    @close="onClose"
  >
    <el-form :model="form" label-width="100px" label-position="right">
      <el-form-item label="ID" required>
        <el-input
          v-model="form.id"
          :disabled="isEdit"
          placeholder="pkg-xxx (3-30 位小写英文/数字/连字符)"
        />
      </el-form-item>
      <el-form-item label="名称" required>
        <el-input v-model="form.name" placeholder="基础版 · 10㎡" />
      </el-form-item>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="面积(㎡)" required>
            <el-input-number v-model="form.area" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年费(元)" required>
            <el-input-number v-model="form.price" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="排序" required>
            <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="标签" required>
        <el-select v-model="form.tag" style="width: 100%">
          <el-option v-for="t in TAGS" :key="t" :value="t" :label="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="封面 URL" required>
        <el-input v-model="form.cover" placeholder="/images/pkg-basic.jpg" />
      </el-form-item>
      <el-form-item label="图集" required>
        <el-input
          v-model="galleryText"
          type="textarea"
          :rows="2"
          placeholder="多张图 URL,逗号或换行分隔"
        />
      </el-form-item>
      <el-form-item label="卖点" required>
        <el-input
          v-model="highlightsText"
          type="textarea"
          :rows="3"
          placeholder="一行一个卖点(或逗号分隔):1 种作物,保底 10 斤"
        />
      </el-form-item>
      <el-form-item label="作物" required>
        <el-input
          v-model="cropsText"
          type="textarea"
          :rows="2"
          placeholder="逗号分隔:红薯,胡萝卜,土豆"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">
        {{ isEdit ? '保存修改' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  createPackage,
  updatePackage,
  ApiError,
} from '@cloud-farm/api-client';
import type { Package } from '@cloud-farm/shared';

const props = defineProps<{
  modelValue: boolean;
  /** 传入说明编辑模式;不传是新增 */
  package?: Package | null;
}>();
const emit = defineEmits<{
  'update:modelValue': [boolean];
  saved: [Package];
}>();

const isEdit = computed(() => !!props.package);
const saving = ref(false);

const TAGS = ['热销', '推荐', '亲子', '企业', '新品', '限定'];

const form = reactive({
  id: '',
  name: '',
  area: 10,
  price: 499,
  tag: '热销',
  cover: '',
  sortOrder: 99,
});
const galleryText = ref('');
const highlightsText = ref('');
const cropsText = ref('');

watch(
  () => [props.modelValue, props.package],
  () => {
    if (!props.modelValue) return;
    const p = props.package;
    if (p) {
      form.id = p.id;
      form.name = p.name;
      form.area = p.area;
      form.price = p.price;
      form.tag = p.tag;
      form.cover = p.cover;
      form.sortOrder = (p as Package & { sortOrder?: number }).sortOrder ?? 99;
      galleryText.value = p.gallery.join(',\n');
      highlightsText.value = p.highlights.join(',\n');
      cropsText.value = p.crops.join(', ');
    } else {
      form.id = '';
      form.name = '';
      form.area = 10;
      form.price = 499;
      form.tag = '热销';
      form.cover = '/images/pkg-basic.jpg';
      form.sortOrder = 99;
      galleryText.value = '/images/pkg-basic.jpg';
      highlightsText.value = '';
      cropsText.value = '';
    }
  },
  { immediate: true },
);

function parseList(s: string): string[] {
  return s
    .split(/[,，\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function onSave() {
  // 客户端简单校验
  if (!form.name) return ElMessage.warning('请填名称');
  if (!isEdit.value && !/^[a-z0-9-]{3,30}$/.test(form.id)) {
    return ElMessage.warning('ID 格式不对(3-30 位小写英文/数字/连字符)');
  }
  const gallery = parseList(galleryText.value);
  const highlights = parseList(highlightsText.value);
  const crops = parseList(cropsText.value);
  if (!gallery.length) return ElMessage.warning('图集至少 1 项');
  if (!highlights.length) return ElMessage.warning('卖点至少 1 项');
  if (!crops.length) return ElMessage.warning('作物至少 1 项');

  saving.value = true;
  try {
    const payload = {
      name: form.name,
      area: form.area,
      price: form.price,
      tag: form.tag,
      cover: form.cover,
      gallery,
      highlights,
      crops,
      sortOrder: form.sortOrder,
    };
    let saved: Package;
    if (isEdit.value) {
      saved = await updatePackage(form.id, payload);
      ElMessage.success(`已更新:${saved.name}`);
    } else {
      saved = await createPackage({ id: form.id, ...payload });
      ElMessage.success(`已创建:${saved.name}`);
    }
    emit('saved', saved);
    emit('update:modelValue', false);
  } catch (e) {
    const msg = e instanceof ApiError ? e.message : (e as Error).message;
    ElMessage.error(`保存失败:${msg}`);
  } finally {
    saving.value = false;
  }
}

function onClose() {
  // 关掉时清空,避免下次打开残留
  galleryText.value = '';
  highlightsText.value = '';
  cropsText.value = '';
}
</script>
