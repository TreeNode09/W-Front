<template>
<div class="col" style="gap: 20px; padding: 20px 0;">

  <div class="row" style="gap: 20px; width: 100%;">
    <Step num="1" title="选择生成起点" row style="flex: 1;">
      <el-radio-group v-model="isPrompt" style="padding-bottom: 2px;">
        <el-radio-button :value="true" border>提示词</el-radio-button>
        <el-radio-button :value="false" border>图像</el-radio-button>
      </el-radio-group>    
    </Step>

    <Step v-if="isPrompt" num="2" title="选择水印类型" row style="flex: 1;">
      <div class="row" style="gap: 20px;">
        <el-switch v-model="usePRC" active-text="版权信息"/>
        <el-switch v-model="useWaterLo" active-text="篡改检测"/>         
      </div>
    </Step>
  </div>

  <Step v-if="isPrompt" num="3" title="指定数据">

    <Subtitle v-if="usePRC" title="密钥ID"><Key /></Subtitle>
    <div v-if="usePRC" class="row" style="gap: 10px;">
      <el-input v-model="key" placeholder="首次生成前，请先获取密钥" />
      <el-button :loading="keyLoading" @click="getKey">获取</el-button>
      <el-button disabled>导入</el-button>      
    </div>

    <Subtitle title="提示词"><ChatDotSquare /></Subtitle>
    <div class="row" style="gap: 10px;">
      <el-input v-model="prompts" class="textarea" type="textarea" :rows="3"
        placeholder="可输入多条提示词，或设定数量后点击“随机”，从数据集拉取"/>
      <div class="col" style="gap: 10px; align-items: stretch;">
        <el-button disabled>导入</el-button>
        <div class="row" style="align-items: stretch; gap: 10px; width: 200px;">
          <el-button :disabled="promptFetchCount<=0" :loading="promptsLoading" @click="getPrompts">
            随机
          </el-button>
          <el-input-number v-model="promptFetchCount" :min="0" :max="MAX_UPLOAD" controls-position="right"
            style="max-width: 130px; flex-shrink: 1;">
            <template #suffix>
              <span>条</span>
            </template>
          </el-input-number>
        </div>
      </div>
    </div>

    <Subtitle title="模型"><Cpu /></Subtitle>
    <el-radio-group v-model="model">
      <el-radio-button v-for="m in models" :value="m" border>{{ m }}</el-radio-button>
    </el-radio-group>

  </Step>

  <Step v-if="!isPrompt" num="2" title="指定数据">
    <Subtitle title="图像"><Picture /></Subtitle>
    <el-upload v-model:file-list="imageFileList" list-type="picture-card" multiple :auto-upload="false" accept="image/*"
      :limit="MAX_UPLOAD" :on-exceed="onImageExceed">
      <el-icon><Plus /></el-icon>
    </el-upload>

    <Subtitle title="模型"><Cpu /></Subtitle>
    <el-radio-group v-model="model">
      <el-radio-button v-for="m in models" :value="m" border>{{ m }}</el-radio-button>
    </el-radio-group>
  </Step>

  <Step :num="isPrompt ? 4 : 3" title="生成图像">
    <div class="row" style="justify-content: center; gap: 40px;">
      <DisplayData name="图像数量" :value="imageNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="imageNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="imageNum" />
    </div>

    <el-button type="primary" plain :disabled="imageNum<=0 || imageNum>MAX_UPLOAD" style="font-weight: bold;">
      开始生成
    </el-button>
  </Step>

</div>
</template>

<script setup lang="ts">
import { ChatDotSquare, Cpu, Key, Picture, Plus } from "@element-plus/icons-vue"
import type { UploadRawFile, UploadUserFile } from "element-plus"
import { genFileId } from "element-plus"
import { nextTick, onMounted, ref, watch } from "vue"

import { showSuccess, showWarning, showError } from "./api/message"
import { http } from "./api/http"

import Step from "./Components/Step.vue"
import Subtitle from "./Components/Subtitle.vue"
import DisplayData from "./Components/DisplayData.vue"

const MAX_UPLOAD = 8
const models = ["Stable Diffusion 2.1", "Unstable 3.4"]

const isPrompt = ref(true)
const procStatus = ref("prepare")   // prepare, working, finish, error
const usePRC = ref(true)
const useWaterLo = ref(true)
const keyLoading = ref(false)
const imageNum = ref(0)
const promptFetchCount = ref(0)
const promptsLoading = ref(false)

const key = ref("")
const prompts = ref("")
const model = ref("")
const imageFileList = ref<UploadUserFile[]>([])

// Set imageNum based on isPrompt (i.e. generation mode)
watch(
  [isPrompt, imageFileList, prompts],
  () => {
    if (isPrompt.value) {
      // valid lines of prompts
      const normalized = prompts.value.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
      imageNum.value =
        !normalized.trim() ? 0 : normalized.trimEnd().split("\n").length
    } else {
      // number of uploaded images
      imageNum.value = imageFileList.value.length
    }
  },
  { deep: true, immediate: true }
)

// Generate URLs for uploaded images during re-entry
watch(
  isPrompt,
  async (newValue) => {
    if (newValue) return
    await nextTick()
    const next = imageFileList.value.map((item) => {
      const raw = item.raw
      if (!raw) return item
      if (item.url?.startsWith("blob:")) URL.revokeObjectURL(item.url)
      return { ...item, url: URL.createObjectURL(raw) }
    })
    imageFileList.value = next
  }
)

const toPictureCardFile = (raw: File): UploadUserFile => {
  const file = raw as UploadRawFile
  if (file.uid == null) file.uid = genFileId()
  const item: UploadUserFile = {
    name: file.name, percentage: 0, status: "ready", size: file.size, raw: file, uid: file.uid,
  }
  item.url = URL.createObjectURL(file)
  return item
}

const onImageExceed = (newFiles: File[], current: UploadUserFile[]) => {
  const slots = MAX_UPLOAD - current.length
  const added = newFiles.slice(0, Math.max(0, slots)).map(toPictureCardFile)
  imageFileList.value = [...current, ...added]
  showWarning("图像数量已达上限", `已保留前 ${MAX_UPLOAD} 张`)
}

const getKey = () => {
  keyLoading.value = true
  http
    .get("/key")
    .then((res) => {
      // res.data.key_id: non-empty string
      const d = res.data
      const raw = d && typeof d === "object" ? (d as Record<string, unknown>).key_id : undefined
      const id = typeof raw === "string" ? raw.trim() : ""
      if (!id) {
        showError( "密钥获取失败", "数据格式异常")
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
  if (!Number.isFinite(n) || n < 1 || n > MAX_UPLOAD) {
    showError("提示词获取失败", `请输入 1-${MAX_UPLOAD} 之间的条数`)
    return
  }

  promptsLoading.value = true
  http
    .get("/prompts", { params: { num: String(n) } })
    .then((res) => {
      // res.data.propmts: non-empty Array<string>
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

onMounted(() => {
  // Fetch model list from backend
  model.value = models[0] ?? ""
})
</script>

<style scoped>
.textarea :deep(.el-textarea), .textarea :deep(.el-textarea__inner) {
  transition-property: color, background-color, border-color, box-shadow, opacity !important;
  transition-duration: 0.5s;
}
</style>