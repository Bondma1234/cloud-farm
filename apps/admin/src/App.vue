<template>
  <!-- A3: Element Plus 全局中文(表格空态/分页/日期选择器等内置文案) -->
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn';
</script>
