<template>
<Step num="1" title="test">
  <div class="row" style="gap: 10px;">
    <el-input type="textarea" :row="3" />
    <el-button>click</el-button>
  </div>
</Step>
</template>

<script setup lang="ts">
import Step from './Components/Step.vue'
</script>