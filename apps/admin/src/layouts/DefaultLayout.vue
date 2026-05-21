<template>
  <!--
    根布局:AdminAside / AdminHeader 只挂一次,router-view 在 main 里切换。
    之前每个 view 各自包 <admin-aside /> + <admin-header />,切 tab 整个左侧栏
    被 unmount/mount 重建,el-menu 重新计算 active,el-table 重新初始化 —— INP 直冲 200ms+。
  -->
  <el-container class="root">
    <admin-aside />
    <el-container>
      <admin-header :title="title" />
      <el-main>
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AdminAside from '@/components/AdminAside.vue';
import AdminHeader from '@/components/AdminHeader.vue';

const route = useRoute();
const title = computed(() => (route.meta.title as string) || '运营后台');
</script>

<style scoped>
.root {
  height: 100vh;
}
</style>
