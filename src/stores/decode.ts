import type { UploadUserFile } from "element-plus"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const DECODE_MAX_UPLOAD = 8
export type DecodeResultRow = {
  original: string
  waterlo: string
  prc: string
}

export const useDecode = defineStore("decode", () => {

  const usePRC = ref(true)
  const useWaterLo = ref(true)

  const images = ref<UploadUserFile[]>([])
  const model = ref("")
  const key = ref("")

  const imageNum = computed(() => images.value.filter((f) => !!f.raw).length)

  const prcNum = ref(0)
  const waterloNum = ref(0)

  const prcDone = ref(false)
  const waterloDone = ref(false)
  const resultRows = ref<DecodeResultRow[]>([])

  function resetDecode() {
    prcDone.value = false
    waterloDone.value = false
    prcNum.value = 0
    waterloNum.value = 0
    resultRows.value = []
  }

  return {
    usePRC, useWaterLo, images, model, key,
    imageNum, prcNum, waterloNum, prcDone, waterloDone, resultRows,
    resetDecode
  }
})