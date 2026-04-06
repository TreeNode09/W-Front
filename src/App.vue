<template>
<div class="col" style="height: 100vh;">
  <Header v-model="isEncode" :locked="isBusy" />
  <div class="row" style="flex: 1; background-color: var(--white);">
    <aside style="flex-shrink: 0; width: 180px; padding: 20px 14px;">
      <SocketInfo />
    </aside>
    <div style="flex: 1; min-width: 0; padding-right: 200px; overflow: auto;">
      <EncodeView v-if="isEncode" />
      <DecodeView v-else />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

import { getSocket } from './api/socket'
import { useJob } from './stores/job'

import Header from './components/Header.vue'
import SocketInfo from './components/SocketInfo.vue'
import EncodeView from './EncodeView.vue'
import DecodeView from './DecodeView.vue'

const isEncode = ref(true)

const job = useJob()
const { isBusy } = storeToRefs(job)

/** 未进入生成页时先建连，解码等流程也可复用同一 socket */
onMounted(() => {
  getSocket()
})
</script>

<style>
body {
  margin: 0;
}

* {
  transition: background-color 0.5s, box-shadow 0.5s, color 0.5s;
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

.el-upload, .el-upload-list {
  --el-upload-picture-card-size: 149px;
}

.el-upload-list--picture-card .el-upload-list__item {
  margin: 0 10px 10px 0;
}
</style>