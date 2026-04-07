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
  const images = ref<UploadUserFile[]>([])

  const promptNum = computed(() => countPromptLines(prompts.value))
  const imageNum = computed(() => images.value.filter((f) => !!f.raw).length)

  const prcNum = ref(0)
  const waterloNum = ref(0)
  const results = ref<string[]>([])

  return {
    usePrompt, usePRC, useWaterLo,
    key, prompts, model, images,
    promptNum, imageNum,
    prcNum, waterloNum, results
  }
})
