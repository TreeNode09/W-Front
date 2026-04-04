<template>
<div class="col" style="height: 100vh;">
 <Header v-model="isEncode" />
 <div style="flex: 1; padding: 0 200px; background-color: var(--white);">
  <EncodeView v-if="isEncode"/>
  <DecodeView v-else />   
 </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Header from './Components/Header.vue'
import EncodeView from './EncodeView.vue'
import DecodeView from './DecodeView.vue'

const isEncode = ref(true)
</script>

<style>
body {
  margin: 0;
}

* {
  transition: all 0.5s;
}

h1 {
  margin: 0.25em 0;
}

hr {
  width: 100%;
  border: none;
  border-top: solid 1px var(--pale);
}

.col {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: row;
}
</style>

<style>
* {
  --el-color-primary: var(--main);
  --el-color-primary-light-5: var(--pale);
  --el-color-primary-light-9: var(--shadowLight);
}

.el-button+.el-button {
  margin: 0;
}

.el-switch__label {
  color: var(--el-text-color-placeholder);
}
</style>