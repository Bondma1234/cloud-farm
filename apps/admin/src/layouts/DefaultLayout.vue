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
          <transition name="cf-admin-page" mode="out-in">
            <component :is="Component" />
          </transition>
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

<!-- 非 scoped: transition 类名要全局可用 -->
<style>
.cf-admin-page-enter-active, .cf-admin-page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.cf-admin-page-enter-from {
  opacity: 0;
  transform: translate3d(0, 6px, 0);
}
.cf-admin-page-leave-to {
  opacity: 0;
  transform: translate3d(0, -3px, 0);
}
</style>
