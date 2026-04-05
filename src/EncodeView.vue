<template>
<div class="col" style="gap: 20px; min-width: 780px; padding: 20px 0;">

  <div class="row" style="gap: 20px; width: 100%;">
    <Step num="1" title="选择生成起点" row style="flex: 1;">
      <el-radio-group v-model="usePrompt" style="padding-bottom: 2px;">
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

    <Step v-if="usePrompt" num="2" title="选择水印类型" row style="flex: 1;">
      <div class="row" style="gap: 20px;">
        <el-switch v-model="usePRC" active-text="版权信息"/>
        <el-switch v-model="useWaterLo" active-text="篡改检测"/>
      </div>
    </Step>
  </div>

  <EncodePrompt v-if="usePrompt" :models="models" />
  <EncodeImage v-if="!usePrompt" :models="models" />

  <Step :num="usePrompt ? 4 : 3" title="生成图像">
    <div class="row" style="justify-content: center; gap: 40px;">
      <DisplayData name="图像数量" :value="currentNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="currentNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="currentNum" unit="张" />
    </div>

    <el-button type="primary" plain style="font-weight: bold;"
      :disabled="currentNum<=0 || currentNum>ENCODE_MAX_UPLOAD || isBusy"
      :loading="procStatus === 'submitting'"
      @click="startGenerate">
      {{ generateButtonLabel }}
    </el-button>
  </Step>

</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, onMounted, ref } from "vue"
import { ChatDotSquare, Picture } from "@element-plus/icons-vue"

import { http } from "./api/http"
import { showError, showSuccess } from "./api/message"
import { getSocketId } from "./api/socket"
import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import { useJob } from "./stores/job"
import EncodeImage from "./EncodeImage.vue"
import EncodePrompt from "./EncodePrompt.vue"

import Step from "./components/Step.vue"
import DisplayData from "./components/DisplayData.vue"

const models = ["Stable Diffusion 2.1", "Unstable 3.4"]

const encode = useEncode()
const {
  usePrompt, usePRC, useWaterLo, model, promptNum, imageNum,
  key, prompts, images,
} = storeToRefs(encode)
const job = useJob()
const { procStatus, isBusy } = storeToRefs(job)

const currentNum = computed(() =>
  usePrompt.value ? promptNum.value : imageNum.value,
)

const generateButtonLabel = computed(() => {
  switch (procStatus.value) {
    case "submitting": return "提交中…"
    case "running": return "生成中…"
    case "error": return "开始生成"
    default: return "开始生成"
  }
})

function splitPromptLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return normalized.split("\n").map((l) => l.trim()).filter((l) => l.length > 0)
}

/** 仅提交任务到后端并接受 202；进度与结果走 Socket，后续再接 */
async function startGenerate() {
  if (isBusy.value) return
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
        job.setJob("running", data.job_id)
        showSuccess("任务已提交", `任务 ID 为 ${data.job_id}`)
      } else {
        job.setJob("error")
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
        job.setJob("running", data.job_id)
        showSuccess("任务已提交", `任务 ID 为 ${data.job_id}`)
      } else {
        job.setJob("error")
        showError("生成失败", "数据格式异常")
      }
    }
  } catch (e) {
    job.setJob("error")
    showError("生成失败", e)
  }
}

onMounted(() => {
  if (!model.value) model.value = models[0] ?? ""
})
</script>