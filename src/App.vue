<template>
<div class="col" style="height: 100vh;">
  <Header v-model="isEncode" :switch-disabled="isBusy" />
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
import { onMounted, onUnmounted, ref } from 'vue'

import { showError, showSuccess } from './api/message'
import { getSocket } from './api/socket'
import { useJob } from './stores/job'
import Header from './components/Header.vue'
import SocketInfo from './components/SocketInfo.vue'
import EncodeView from './EncodeView.vue'
import DecodeView from './DecodeView.vue'

const isEncode = ref(true)

const job = useJob()
const { isBusy } = storeToRefs(job)

onMounted(() => {
  getSocket()
  const socket = getSocket()

  const onGeneratePrc = (data: { job_id?: string }) => {
    if (!job.isCurrentJob(data.job_id)) return
    console.log("PRC")
  }

  const onGenerateWaterLo = (data: { job_id?: string }) => {
    if (!job.isCurrentJob(data.job_id)) return
    console.log("WaterLo")
  }

  const onGenerateDone = (data: { job_id?: string; count?: number }) => {
    if (!job.isCurrentJob(data.job_id)) return
    job.setJob("finish")
    showSuccess("生成完成", `共 ${data.count ?? 0} 张`)
  }

  const onGenerateError = (data: { job_id?: string; error?: string }) => {
    if (!job.isCurrentJob(data.job_id)) return
    job.setJob("error")
    showError("生成失败", data.error ?? "未知错误")
  }

  socket.on("generate_prc", onGeneratePrc)
  socket.on("generate_waterlo", onGenerateWaterLo)
  socket.on("generate_done", onGenerateDone)
  socket.on("generate_error", onGenerateError)

  onUnmounted(() => {
    socket.off("generate_prc", onGeneratePrc)
    socket.off("generate_waterlo", onGenerateWaterLo)
    socket.off("generate_done", onGenerateDone)
    socket.off("generate_error", onGenerateError)
  })
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