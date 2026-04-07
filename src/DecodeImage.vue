<template>
  <Step num="2" title="指定数据" :locked="props.locked">
    <template v-if="usePRC">
      <Subtitle title="密钥 ID"><Key /></Subtitle>
      <div class="row" style="gap: 10px; margin-top: 6px;">
        <el-input v-model="key" :disabled="locked" placeholder="请输入用于解码的密钥 ID" />
      </div>
    </template>
    <Subtitle title="水印图像"><Picture /></Subtitle>
    <el-upload v-model:file-list="images" list-type="picture-card" multiple :auto-upload="false" accept="image/*"
      :disabled="locked" :limit="DECODE_MAX_UPLOAD" :on-exceed="onImageExceed" :on-preview="onPictureCardPreview">
      <el-icon><Plus /></el-icon>
    </el-upload>

    <Subtitle title="模型"><Cpu /></Subtitle>
    <el-radio-group v-model="model" :disabled="locked">
      <el-radio-button v-for="m in models" :key="m" :value="m" border>{{ m }}</el-radio-button>
    </el-radio-group>
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
import { Cpu, Picture, Plus } from "@element-plus/icons-vue"
import type { UploadProps, UploadRawFile, UploadUserFile } from "element-plus"
import { genFileId } from "element-plus"
import { storeToRefs } from "pinia"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { Key } from "@element-plus/icons-vue"

import { showWarning } from "./api/message"
import { DECODE_MAX_UPLOAD, useDecode } from "./stores/decode"

import Step from "./components/Step.vue"
import Subtitle from "./components/Subtitle.vue"

const props = defineProps({
  models: {type: Array<string>},
  locked: {type: Boolean, default: false}
})

const { usePRC, key, images, model } = storeToRefs(useDecode())

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
  const slots = DECODE_MAX_UPLOAD - current.length
  const added = newFiles.slice(0, Math.max(0, slots)).map(toPictureCardFile)
  images.value = [...current, ...added]
  showWarning("图像数量已达上限", `已保留前 ${DECODE_MAX_UPLOAD} 张`)
}
</script>