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
      <div ref="mainScrollBottomAnchor" class="app-main-scroll-bottom" aria-hidden="true" />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

import type { GenerateSocketPayload } from './api/socket'
import { showError, showSuccess } from './api/message'
import { getSocket } from './api/socket'
import { toDisplayImageSrc, useEncode } from './stores/encode'
import { useJob } from './stores/job'

import Header from './components/Header.vue'
import SocketInfo from './components/SocketInfo.vue'
import EncodeView from './EncodeView.vue'
import DecodeView from './DecodeView.vue'

const isEncode = ref(true)
const mainScrollBottomAnchor = ref<HTMLElement | null>(null)

const scrollMainContentToBottom = () => {
  nextTick(() => {
    mainScrollBottomAnchor.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

const job = useJob()
const encode = useEncode()
const { isBusy } = storeToRefs(job)

const onGeneratePrc = (data: GenerateSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  encode.prcNum += 1
  if (data.image) {
    const src = toDisplayImageSrc(data.image)
    if (src) encode.results = [...encode.results, src]
  }
}

const onGenerateWaterLo = (data: GenerateSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  encode.waterloNum += 1
  if (data.image) {
    const src = toDisplayImageSrc(data.image)
    if (src) encode.results = [...encode.results, src]
  }
}

const onGenerateDone = (data: GenerateSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  if (Array.isArray(data.images) && data.images.length > 0) {
    encode.results = data.images.map(toDisplayImageSrc).filter(Boolean)
  } else if (data.image) {
    const src = toDisplayImageSrc(data.image)
    if (src) encode.results = [...encode.results, src]
  }
  encode.prcNum = 0
  encode.waterloNum = 0
  job.setJob("finish")
  const n = data.count ?? encode.results.length
  showSuccess("生成完成", `共 ${n} 张`)
  if (isEncode.value) scrollMainContentToBottom()
}

const onGenerateError = (data: GenerateSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  job.setJob("idle")
  showError("生成失败", data.error ?? "未知错误")
}

onMounted(() => {
  getSocket()
  const socket = getSocket()
  socket.on("generate_prc", onGeneratePrc)
  socket.on("generate_waterlo", onGenerateWaterLo)
  socket.on("generate_done", onGenerateDone)
  socket.on("generate_error", onGenerateError)
})

onUnmounted(() => {
  const socket = getSocket()
  socket.off("generate_prc", onGeneratePrc)
  socket.off("generate_waterlo", onGenerateWaterLo)
  socket.off("generate_done", onGenerateDone)
  socket.off("generate_error", onGenerateError)
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

.app-main-scroll-bottom {
  height: 1px;
  width: 100%;
  flex-shrink: 0;
}
</style>