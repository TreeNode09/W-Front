import { defineStore } from "pinia"
import { computed, ref } from "vue"

export type ProcStatus = "idle" | "submitting" | "running" | "error" | "finish"

export const useJob = defineStore("job", () => {
  const jobId = ref<string | null>(null)
  const procStatus = ref<ProcStatus>("idle")

  /** 提交中、生成中或完成待确认：锁定顶栏与生成向导内控件 */
  const isBusy = computed(() =>
    ["submitting", "running", "finish"].includes(procStatus.value),
  )

  const setJob = (status: ProcStatus, id: string | null = null) => {
    if (status === "running") jobId.value = id
    else jobId.value = null
    procStatus.value = status
  }

  const isCurrentJob = (id: unknown): id is string => {
    return typeof id === "string" && id.length > 0 && id === jobId.value
  }

  return {
    jobId, procStatus, isBusy,
    setJob, isCurrentJob
  }
})