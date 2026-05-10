<template>
<div class="row" style="gap: 5px; align-items: center; user-select: none; white-space: nowrap;;">
  <el-icon :size="16" color="var(--main)">
    <slot></slot>    
  </el-icon>
  <div style="color: var(--main); font-size: 16px;">{{ props.title }}</div>
</div>
</template>

<script setup lang="ts">
const props = defineProps(["title"])
</script>