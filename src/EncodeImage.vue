<template>
  <Step num="2" title="指定数据" :locked="props.locked">
    <Subtitle title="图像" style="margin-top: 5px;"><Picture /></Subtitle>
    <el-upload v-model:file-list="images" list-type="picture-card" multiple :auto-upload="false" accept="image/*"
      :disabled="locked" :limit="ENCODE_MAX_UPLOAD" :on-exceed="onImageExceed" :on-preview="onPictureCardPreview">
      <el-icon><Plus /></el-icon>
    </el-upload>

    <div class="row" style="gap: 20px;">
      <Subtitle title="篡改检测不透明度"><View /></Subtitle>
      <div class="row" style="align-items: center; gap: 20px; width: 200px; margin-left: 10px;">
        <el-slider v-model="waterloAlpha" :disabled="locked" :show-tooltip="false"
          :min="0.002" :max="0.01" :step="0.001" show-stops/>
        <div style="color: var(--main); font-weight: bold;">{{ waterloAlpha }}</div>
      </div>
    </div>

  </Step>

  <Teleport to="body">
    <div v-if="previewOpen" style="position: fixed; inset: 0; z-index: 3100;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; box-sizing: border-box; background: rgba(0, 0, 0, 0.7);" @click.self="closePreview">
      <img style="max-width: min(100%, 70vw); max-height: min(100%, 70vh); width: auto; height: auto;
        object-fit: contain; border-radius: 10px; border: 10px solid #FFF;" :src="previewUrl" @click.stop />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Picture, Plus, View } from "@element-plus/icons-vue"
import type { UploadProps, UploadRawFile, UploadUserFile } from "element-plus"
import { genFileId } from "element-plus"
import { storeToRefs } from "pinia"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"

import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import { showWarning } from "./api/message"

import Step from "./components/Step.vue"
import Subtitle from "./components/Subtitle.vue"

const props = defineProps({
  locked: { type: Boolean, default: false },
  models: { type: Array<string> },
})

const { images, useWaterLo, waterloAlpha } = storeToRefs(useEncode())

function formatAlphaTooltip(val: number) {
  return `α = ${val.toFixed(3)}（约 ${(val * 100).toFixed(1)}%）`
}

const locked = computed(() => props.locked ?? false)

const previewOpen = ref(false)
const previewUrl = ref("")

function closePreview() {
  previewOpen.value = false
  previewUrl.value = ""
}

const onPictureCardPreview: UploadProps["onPreview"] = (uploadFile) => {
  previewUrl.value = uploadFile.url ?? ""
  previewOpen.value = true
}

let removeEsc: (() => void) | null = null
watch(previewOpen, (open) => {
  removeEsc?.()
  removeEsc = null
  if (!open) return
  const onEsc = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      closePreview()
    }
  }
  document.addEventListener("keydown", onEsc)
  removeEsc = () => document.removeEventListener("keydown", onEsc)
})

onUnmounted(() => {
  removeEsc?.()
})

onMounted(async () => {
  await nextTick()
  const next = images.value.map((item) => {
    const raw = item.raw
    if (!raw) return item
    if (item.url?.startsWith("blob:")) URL.revokeObjectURL(item.url)
    return { ...item, url: URL.createObjectURL(raw) }
  })
  images.value = next
})

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
  const slots = ENCODE_MAX_UPLOAD - current.length
  const added = newFiles.slice(0, Math.max(0, slots)).map(toPictureCardFile)
  images.value = [...current, ...added]
  showWarning("图像数量已达上限", `已保留前 ${ENCODE_MAX_UPLOAD} 张`)
}
</script>

<style scoped>
.el-slider *{
  transition: none;
}
</style>