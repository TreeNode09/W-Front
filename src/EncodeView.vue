<template>
<div class="col" style="gap: 20px; min-width: 780px; padding: 20px 0;">

  <div class="row" style="gap: 20px; width: 100%;">
    <Step num="1" title="选择生成起点" row style="flex: 1;" :locked="isBusy">
      <el-radio-group v-model="usePrompt" :disabled="isBusy" style="padding-bottom: 2px;">
        <el-radio-button :value="true" border>
          <el-icon><ChatDotSquare /></el-icon>
          提示词
        </el-radio-button>
        <el-radio-button :value="false" border>
          <el-icon><Picture /></el-icon>
          图像
        </el-radio-button>
      </el-radio-group>
    </Step>

    <Step v-if="usePrompt" num="2" title="选择水印类型" row style="flex: 1;" :locked="isBusy">
      <div class="row" style="gap: 20px;">
        <el-switch v-model="usePRC" :disabled="isBusy" active-text="版权信息"/>
        <el-switch v-model="useWaterLo" :disabled="isBusy" active-text="篡改检测"/>
      </div>
    </Step>
  </div>

  <EncodePrompt v-if="usePrompt" :models="models" :locked="isBusy" />
  <EncodeImage v-if="!usePrompt" :models="models" :locked="isBusy" />

  <Step :num="usePrompt ? 4 : 3" title="生成图像">
    <div class="row" style="justify-content: center; gap: 40px;">
      <DisplayData name="图像总数" unit="张">
        <div style="font-size: 32px; font-weight: bold; color: var(--main);">{{ currentNum }}</div>
      </DisplayData>
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="生成进度">
        <div v-if="procStatus === 'idle' || procStatus === 'finish'" style="font-weight: bold; font-size: 32px; color: var(--main);">—</div>
        <div v-else class="row" style="gap: 5px; align-items: center; font-weight: bold; color: var(--main);">
          <template v-if="usePrompt">
            <div style="font-size: 12px;">生成图像<br>{{usePRC ? "版权信息" : ""}}</div>
            <div style="font-size: 32px;">{{ prcNum }}</div>
          </template>
          <div v-if="usePrompt && useWaterLo" style="width: 1px; height: 20px; background-color: var(--pale);"></div>
          <template v-if="(usePrompt && useWaterLo) || !usePrompt">
            <div style="font-size: 12px;">篡改检测</div>
            <div style="font-size: 32px;">{{ waterloNum }}</div>
          </template>
        </div>
      </DisplayData>
    </div>

    <el-button type="primary" :plain="isClickable" style="font-weight: bold;" :disabled="isClickable"
      :loading="procStatus === 'submitting'" @click="onButtonClick">
      {{ buttonText }}
    </el-button>

    <Subtitle v-if="results.length" title="生成结果" style="margin-top: 10px;"><Picture /></Subtitle>
    <div v-if="results.length" class="row" style="flex-wrap: wrap; gap: 10px;">
      <el-image v-for="(src, i) in results" :key="`${i}-${src.slice(0, 48)}`" :src="src"
        :preview-src-list="results" :initial-index="i" fit="contain" class="encode-result-thumb"/>
    </div>
  </Step>

</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, onMounted } from "vue"
import { ChatDotSquare, Picture } from "@element-plus/icons-vue"

import { http } from "./api/http"
import { showError, showSuccess } from "./api/message"
import { getSocketId, socketStatus } from "./api/socket"
import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import { useJob } from "./stores/job"
import EncodeImage from "./EncodeImage.vue"
import EncodePrompt from "./EncodePrompt.vue"

import Step from "./components/Step.vue"
import DisplayData from "./components/DisplayData.vue"
import Subtitle from "./components/Subtitle.vue"

const models = ["Stable Diffusion 2.1", "Unstable 3.4"]

const encode = useEncode()
const {
  usePrompt, usePRC, useWaterLo, model, promptNum, imageNum,
  key, prompts, images,
  prcNum, waterloNum, results,
} = storeToRefs(encode)
const job = useJob()
const { procStatus, isBusy } = storeToRefs(job)

const splitPromptLines = (text: string): string[] => {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
}

const currentNum = computed(() =>
  usePrompt.value ? promptNum.value : imageNum.value,
)

const canGenerate = computed(() => {
  if (procStatus.value !== "idle" || socketStatus.value !== "online") return false
  if (!model.value.trim()) return false
  if (currentNum.value <= 0 || currentNum.value > ENCODE_MAX_UPLOAD) return false
  if (usePrompt.value && usePRC.value && !key.value.trim()) return false
  return true
})

const buttonText = computed(() => {
  switch (procStatus.value) {
    case "submitting": return "提交中…"
    case "running": return "生成中…"
    case "finish": return "清空结果，开始新的生成"
    default: return "开始生成"
  }
})

const isClickable = computed(() => {
  return procStatus.value !== 'finish' && (!canGenerate.value || isBusy.value)
})

const onButtonClick = () => {
  if (procStatus.value === "finish") {
    encode.results = []
    job.setJob("idle")
    return
  }
  startGenerate()
}

async function startGenerate() {
  if (!canGenerate.value || isBusy.value) return
  if (currentNum.value <= 0 || currentNum.value > ENCODE_MAX_UPLOAD) return

  let lines: string[] | null = null
  if (usePrompt.value) {
    if (usePRC.value && !key.value.trim()) {
      showError("无法生成", "请输入密钥 ID")
      return
    }
    lines = splitPromptLines(prompts.value)
    if (lines.length === 0) {
      showError("无法生成", "请输入提示词")
      return
    }
  }
  else {
    let n = 0
    for (const item of images.value) {
      if (item.raw) n += 1
    }
    if (n === 0) {
      showError("无法生成", "请上传图像文件")
      return
    }
  }

  try {
    job.setJob("submitting")
    const socketId = await getSocketId()

    if (usePrompt.value) {
      const { data, status } = await http.post<{ job_id: string; status: string }>(
        "/generate/prompts",
        {
          model_id: model.value.trim(),
          prompts: lines!,
          use_prc: usePRC.value,
          use_waterlo: useWaterLo.value,
          socket_id: socketId,
          key_id: usePRC.value ? key.value.trim() : null,
          alpha: 0.005
        }
      )
      if (status === 202 && data?.job_id) {
        encode.prcNum = 0
        encode.waterloNum = 0
        job.setJob("running", data.job_id)
        showSuccess("任务已提交", `任务 ID 为 ${data.job_id}`)
      }
      else {
        job.setJob("idle")
        showError("生成失败", "数据格式异常")
      }
    }
    else {
      const fd = new FormData()
      for (const item of images.value) {
        const raw = item.raw
        if (raw) fd.append("images", raw)
      }
      fd.append("socket_id", socketId)
      fd.append("alpha", "0.005")
      const { data, status } = await http.post<{ job_id: string; status: string }>(
        "/generate/images", fd
      )
      if (status === 202 && data?.job_id) {
        encode.prcNum = 0
        encode.waterloNum = 0
        job.setJob("running", data.job_id)
        showSuccess("任务已提交", `任务 ID 为 ${data.job_id}`)
      } else {
        job.setJob("idle")
        showError("生成失败", "数据格式异常")
      }
    }
  } catch (e) {
    job.setJob("idle")
    showError("生成失败", e)
  }
}

onMounted(() => {
  if (!model.value) model.value = models[0] ?? ""
})
</script>

<style scoped>
.encode-result-thumb {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  border: 1px solid var(--pale);
  background: var(--shadowLight);
}

.encode-result-thumb :deep(.el-image__inner) {
  object-fit: contain;
}
</style>