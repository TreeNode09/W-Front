import type { UploadUserFile } from "element-plus"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const ENCODE_MAX_UPLOAD = 8

function countPromptLines(s: string): number {
  const normalized = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  if (!normalized.trim()) return 0
  return normalized.trimEnd().split("\n").length
}

export const useEncode = defineStore("encode", () => {
  const usePrompt = ref(true)
  const usePRC = ref(true)
  const useWaterLo = ref(true)

  const key = ref("")
  const prompts = ref("")
  const model = ref("")
  const imageFileList = ref<UploadUserFile[]>([])

  /** 提示词模式：有效行数（用于生成数量展示） */
  const prmoptNum = computed(() => countPromptLines(prompts.value))
  /** 图像模式：已选本地文件数 */
  const imageNum = computed(() => imageFileList.value.length)

  return {
    usePrompt, usePRC, useWaterLo,
    key, prompts, model, imageFileList,
    prmoptNum, imageNum,
  }
})
