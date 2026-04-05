<template>
  <Step num="2" title="指定数据">
    <Subtitle title="图像"><Picture /></Subtitle>
    <el-upload v-model:file-list="images" list-type="picture-card" multiple :auto-upload="false" accept="image/*"
      :limit="ENCODE_MAX_UPLOAD" :on-exceed="onImageExceed">
      <el-icon><Plus /></el-icon>
    </el-upload>

    <Subtitle title="模型"><Cpu /></Subtitle>
    <el-radio-group v-model="model">
      <el-radio-button v-for="m in models" :key="m" :value="m" border>{{ m }}</el-radio-button>
    </el-radio-group>
  </Step>
</template>

<script setup lang="ts">
import { Cpu, Picture, Plus } from "@element-plus/icons-vue"
import type { UploadRawFile, UploadUserFile } from "element-plus"
import { genFileId } from "element-plus"
import { storeToRefs } from "pinia"
import { nextTick, onMounted } from "vue"

import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import { showWarning } from "./api/message"

import Step from "./components/Step.vue"
import Subtitle from "./components/Subtitle.vue"

const props = defineProps(
  {"models": { type: Array<string> }
})

const { model, images } = storeToRefs(useEncode())

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