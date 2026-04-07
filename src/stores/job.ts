import { defineStore } from "pinia"
import { computed, ref } from "vue"

export type ProcStatus = "idle" | "submitting" | "running" | "error" | "finish"

// Handle base64, data URL or http(s)
export function toDisplayImageSrc(s: string): string {
  const t = s.trim()
  if (!t) return ""
  if (/^(data:|blob:|https?:\/\/)/i.test(t)) return t
  return `data:image/png;base64,${t}`
}

export const useJob = defineStore("job", () => {
  const jobId = ref<string | null>(null)
  const procStatus = ref<ProcStatus>("idle")

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