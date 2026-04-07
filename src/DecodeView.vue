<template>
<div ref="decodeTopAnchor" class="col" style="gap: 20px; min-width: 780px; padding: 20px 0;">

  <Step num="1" title="选择水印选项" row :locked="isBusy">
    <div class="row" style="gap: 20px; margin-bottom: 1px;">
      <el-switch v-model="usePRC" :disabled="isBusy" active-text="版权信息"/>
      <el-switch v-model="useWaterLo" :disabled="isBusy" active-text="篡改检测"/>
    </div>
  </Step>

  <DecodeImage :models="models" :locked="isBusy" />

  <Step ref="decodeBottomAnchor" num="3" title="检测图像" :locked="isBusy">
    <div class="row" style="justify-content: center; gap: 40px;">
      <DisplayData name="图像总数" unit="张">
        <div style="font-size: 32px; font-weight: bold; color: var(--main);">{{ imageNum }}</div>
      </DisplayData>
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="检测进度">
        <div v-if="['idle', 'finish'].includes(procStatus)"
          style="font-weight: bold; font-size: 32px; color: var(--main);">--</div>
        <div v-else class="row" style="gap: 5px; align-items: center; font-weight: bold; color: var(--main);">
          <template v-if="usePRC">
            <div style="font-size: 12px;">版权信息</div>
            <div style="font-size: 32px;">{{ prcNum }}</div>
          </template>
          <div v-if="usePRC && useWaterLo" style="width: 1px; height: 20px; background-color: var(--pale);"></div>
          <template v-if="useWaterLo">
            <div style="font-size: 12px;">篡改检测</div>
            <div style="font-size: 32px;">{{ waterloNum }}</div>
          </template>
        </div>
      </DisplayData>
    </div>

    <el-button type="primary" :plain="isClickable" style="font-weight: bold;" color="var(--main)"
      :disabled="isClickable" :loading="procStatus === 'submitting'" @click="onButtonClick">
      {{ buttonText }}
    </el-button>

    <template v-if="procStatus==='finish'">
      <Subtitle title="检测结果" style="margin-top: 10px;"><DataAnalysis /></Subtitle>
      <el-table v-if="procStatus==='finish'" :data="resultRows" border style="width: 100%;">
        <el-table-column label="原图" min-width="1" align="center">
          <template #default="{ row }">
            <el-image v-if="row.original" :src="row.original" preview-teleported :preview-src-list="[row.original]"
              fit="contain" style="width: 100%; height: 100%; padding: 20px;" />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="篡改检测" min-width="1" align="center">
          <template #default="{ row }">
            <el-image v-if="row.waterlo" :src="row.waterlo" preview-teleported :preview-src-list="[row.waterlo]"
              fit="contain" style="width: 100%; height: 100%; padding: 20px;" />
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="版权信息" prop="prc" min-width="1" />
      </el-table>      
    </template>
  </Step>
</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue"

import { http } from "./api/http"
import { showError, showSuccess } from "./api/message"
import { getSocket, getSocketId, socketStatus, type DecodeSocketPayload } from "./api/socket"
import { DECODE_MAX_UPLOAD, useDecode } from "./stores/decode"
import { toDisplayImageSrc, useJob } from "./stores/job"

import DecodeImage from "./DecodeImage.vue"
import Step from "./components/Step.vue"
import DisplayData from "./components/DisplayData.vue"
import Subtitle from "./components/Subtitle.vue"
import { DataAnalysis } from "@element-plus/icons-vue"

const models = ["Stable Diffusion 2.1", "Unstable 3.4"]
const decodeTopAnchor = ref<HTMLElement | null>(null)
const decodeBottomAnchor = ref<{ $el?: HTMLElement } | null>(null)

const scrollUp = () => {
  nextTick(() => {
    decodeTopAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" })
  })
}

const scrollDown = () => {
  nextTick(() => {
    decodeBottomAnchor.value?.$el?.scrollIntoView({ behavior: "smooth", block: "start" })
  })
}

const decode = useDecode()
const {
  usePRC, useWaterLo, model, key, imageNum, images,
  prcNum, waterloNum, prcDone, waterloDone, resultRows
} = storeToRefs(decode)
const job = useJob()
const { procStatus, isBusy } = storeToRefs(job)

const canStartDetect = computed(() => {
  if (procStatus.value !== "idle" || socketStatus.value !== "online") return false
  if (imageNum.value <= 0 || imageNum.value > DECODE_MAX_UPLOAD) return false
  if (!usePRC.value && !useWaterLo.value) return false
  if (usePRC.value && !model.value.trim()) return false
  if (usePRC.value && !key.value.trim()) return false
  return true
})

const buttonText = computed(() => {
  switch (procStatus.value) {
    case "submitting": return "提交中…"
    case "running": return "检测中…"
    case "finish": return "清空结果，开始新的检测"
    default: return "开始检测"
  }
})

const isClickable = computed(() =>
  procStatus.value !== "finish" && (!canStartDetect.value || isBusy.value),
)

function appendImagesToFormData(fd: FormData) {
  for (const item of images.value) {
    const raw = item.raw
    if (raw) fd.append("images", raw)
  }
}

function initResultRows() {
  decode.resultRows = images.value.map((item) => ({
    original: item.url ?? "",
    waterlo: "",
    prc: "—",
  }))
}

function onButtonClick() {
  if (procStatus.value === "finish") {
    decode.images = []
    decode.resetDecode()
    job.setJob("idle")
    scrollUp()
    return
  }
  startDetect()
}

async function startDetect() {
  if (!canStartDetect.value || isBusy.value) return
  if (imageNum.value <= 0 || imageNum.value > DECODE_MAX_UPLOAD) return
  if (!usePRC.value && !useWaterLo.value) {
    showError("无法检测", "请至少启用一种检测方式")
    return
  }
  if (usePRC.value && !model.value.trim()) {
    showError("无法检测", "请选择模型")
    return
  }
  if (usePRC.value && !key.value.trim()) {
    showError("无法检测", "请输入密钥 ID")
    return
  }

  try {
    job.setJob("submitting")
    const socketId = await getSocketId()
    initResultRows()

    const fd = new FormData()
    appendImagesToFormData(fd)
    fd.append("socket_id", socketId)
    fd.append("use_prc", usePRC.value ? "true" : "false")
    fd.append("use_waterlo", useWaterLo.value ? "true" : "false")
    if (usePRC.value) {
      fd.append("model_id", model.value.trim())
      fd.append("key_id", key.value.trim())
    }

    const { data, status } = await http.post<{ job_id: string; status?: string }>("/decode", fd)
    if (status !== 202 || !data?.job_id) {
      job.setJob("idle")
      showError("检测失败", "任务提交响应异常")
      return
    }

    prcDone.value = !usePRC.value
    waterloDone.value = !useWaterLo.value
    job.setJob("running", data.job_id)
    showSuccess("任务已提交", `任务 ID 为 ${data.job_id}`)
  } catch (e) {
    job.setJob("idle")
    decode.resetDecode()
    showError("检测失败", e)
  }
}

const onDecodePrc = (data: DecodeSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  if (typeof data.current === "number") decode.prcNum = data.current
  else decode.prcNum += 1
}

const onDecodeWaterlo = (data: DecodeSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  if (typeof data.current === "number") decode.waterloNum = data.current
  else decode.waterloNum += 1
}

const onDecodeDone = (data: DecodeSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return

  if (data.method === "prc") {
    const rows = Array.isArray(data.results) ? data.results : []
    rows.forEach((row, i) => {
      if (!decode.resultRows[i]) return
      const combined = typeof row?.combined === "boolean" ? row.combined : null
      decode.resultRows[i].prc = combined == null ? "—" : combined ? "是" : "否"
    })
    decode.prcDone = true
  }
  else if (data.method === "waterlo") {
    const maps = Array.isArray(data.maps) ? data.maps : []
    maps.forEach((map, i) => {
      if (!decode.resultRows[i]) return
      decode.resultRows[i].waterlo = toDisplayImageSrc(String(map))
    })
    decode.waterloDone = true
  }

  if (decode.usePRC && !decode.prcDone) return
  if (decode.useWaterLo && !decode.waterloDone) return
  if (job.procStatus !== "running") return
  decode.prcNum = 0
  decode.waterloNum = 0
  job.setJob("finish")
  showSuccess("检测完成", `已检测${imageNum.value}张图像`)
  scrollDown()
}

const onDecodeError = (data: DecodeSocketPayload) => {
  if (!job.isCurrentJob(data.job_id)) return
  job.setJob("idle")
  decode.resetDecode()
  const branch = data.method === "prc" ? "版权检测" : data.method === "waterlo" ? "篡改检测" : "检测"
  showError(`${branch}失败`, data.error ?? "未知错误")
}

onMounted(() => {
  if (!model.value) model.value = models[0] ?? ""
  getSocket()
  const socket = getSocket()
  socket.on("decode_prc", onDecodePrc)
  socket.on("decode_waterlo", onDecodeWaterlo)
  socket.on("decode_done", onDecodeDone)
  socket.on("decode_error", onDecodeError)
})

onUnmounted(() => {
  const socket = getSocket()
  socket.off("decode_prc", onDecodePrc)
  socket.off("decode_waterlo", onDecodeWaterlo)
  socket.off("decode_done", onDecodeDone)
  socket.off("decode_error", onDecodeError)
})
</script>