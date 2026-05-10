<template>
  <Step num="3" title="指定数据" :locked="props.locked">

    <Subtitle title="提示词" style="margin-top: 5px;"><ChatDotSquare /></Subtitle>
    <div class="row" style="gap: 10px;">
      <el-input v-model="prompts" class="textarea" type="textarea" :rows="3" :disabled="locked"
        placeholder="可输入多条提示词，或设定数量后点击“随机”，从数据集拉取"/>
      <div class="col" style="gap: 10px; align-items: stretch;">
        <el-button disabled>导入</el-button>
        <div class="row" style="align-items: stretch; gap: 10px; width: 200px;">
          <el-button :disabled="locked || promptFetchCount<=0" :loading="promptsLoading" @click="getPrompts">
            随机
          </el-button>
          <el-input-number v-model="promptFetchCount" controls-position="right"
            :disabled="locked" :min="0" :max="ENCODE_MAX_UPLOAD" style="max-width: 130px; flex-shrink: 1;">
            <template #suffix>
              <span>条</span>
            </template>
          </el-input-number>
        </div>
      </div>
    </div>
  
    <div class="row" style="gap: 20px;">
      <Subtitle title="生成模型"><Cpu /></Subtitle>
      <el-radio-group v-model="model" :disabled="locked">
        <el-radio-button v-for="m in models" :key="m" :value="m" border>{{ m }}</el-radio-button>
      </el-radio-group>      
    </div>

    <div style="height: 1px; margin: 5px;"></div>

    <div v-if="usePRC" class="row" style="gap: 20px;">
      <Subtitle  title="密钥 ID"><Key /></Subtitle>
      <div class="row" style="gap: 10px; flex: 1;">
        <el-input v-model="key" :disabled="locked" placeholder="首次生成前，请先获取密钥" />
        <el-button :disabled="locked" :loading="keyLoading" @click="getKey">获取</el-button>
        <el-button disabled>导入</el-button>
      </div>
    </div>

    <div v-if="usePRC" class="row" style="gap: 20px;">
      <Subtitle title="来源追溯信息（可选）"><Document /></Subtitle>
      <el-input v-model="prcMessage" class="textarea" type="textarea"  placeholder="本次生成的所有图像共用此信息"
        :rows="1" :disabled="locked" maxlength="63" show-word-limit/>
    </div>

    <div style="height: 1px; margin: 5px;"></div>

    <div v-if="useWaterLo" class="row" style="gap: 20px;">
      <Subtitle title="篡改检测不透明度"><View /></Subtitle>
      <div class="row" style="align-items: center; gap: 20px; width: 200px; margin-left: 10px;">
        <el-slider v-model="waterloAlpha" :disabled="locked" :show-tooltip="false"
          :min="0.002" :max="0.01" :step="0.001" show-stops/>
        <div style="color: var(--main); font-weight: bold;">{{ waterloAlpha }}</div>
      </div>
    </div>

  </Step>
</template>

<script setup lang="ts">
import { ChatDotSquare, Cpu, Document, Key, View } from "@element-plus/icons-vue"
import { storeToRefs } from "pinia"
import { computed, ref } from "vue"

import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import { showSuccess, showError } from "./api/message"
import { http } from "./api/http"

import Step from "./components/Step.vue"
import Subtitle from "./components/Subtitle.vue"

const props = defineProps({
  locked: { type: Boolean, default: false },
  models: { type: Array<string> },
})

const locked = computed(() => props.locked ?? false)

const { usePRC, useWaterLo, key, prompts, model, waterloAlpha, prcMessage } = storeToRefs(useEncode())

const keyLoading = ref(false)
const promptFetchCount = ref(0)
const promptsLoading = ref(false)

const getKey = () => {
  keyLoading.value = true
  http
    .get("/key")
    .then((res) => {
      const d = res.data
      const raw = d && typeof d === "object" ? (d as Record<string, unknown>).key_id : undefined
      const id = typeof raw === "string" ? raw.trim() : ""
      if (!id) {
        showError("密钥获取失败", "数据格式异常")
        return
      }
      key.value = id
      showSuccess("密钥获取成功", "请复制保存密钥 ID")
    })
    .catch((err) => {
      showError("密钥获取失败", err)
    })
    .finally(() => {
      keyLoading.value = false
    })
}

const getPrompts = () => {
  const n = Math.floor(Number(promptFetchCount.value))
  if (!Number.isFinite(n) || n < 1 || n > ENCODE_MAX_UPLOAD) {
    showError("提示词获取失败", `请输入 1-${ENCODE_MAX_UPLOAD} 之间的条数`)
    return
  }

  promptsLoading.value = true
  http
    .get("/prompts", { params: { num: String(n) } })
    .then((res) => {
      const d = res.data
      if (!d || typeof d !== "object") {
        showError("提示词获取失败", "数据格式异常")
        return
      }
      const list = (d as Record<string, unknown>).prompts
      if (!Array.isArray(list)) {
        showError("提示词获取失败", "数据格式异常")
        return
      }
      const lines = list.map((p) => String(p))
      prompts.value = lines.join("\n")
      showSuccess("提示词获取成功", `已获取 ${lines.length} 条`)
    })
    .catch((err) => {
      showError("提示词获取失败", err)
    })
    .finally(() => {
      promptsLoading.value = false
    })
}
</script>

<style scoped>
.textarea :deep(.el-textarea), .textarea :deep(.el-textarea__inner) {
  transition-property: color, background-color, border-color, box-shadow, opacity !important;
  transition-duration: 0.5s;
}

.el-slider *{
  transition: none;
}
</style>