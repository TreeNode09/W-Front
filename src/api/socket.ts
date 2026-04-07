import { io, type Socket } from "socket.io-client"
import { ref } from "vue"

import { baseURL } from "./http"

// Used during image gereration
export type EncodeSocketPayload = {
  job_id?: string
  current?: number
  total?: number
  count?: number
  images?: string[]
  image?: string
  error?: string
}

// Used during watermark decoding
export type DecodeSocketPayload = {
  job_id?: string
  current?: number
  total?: number
  count?: number
  method?: "prc" | "waterlo"
  results?: Array<Record<string, unknown>>
  maps?: string[]
  preds?: unknown[]
  error?: string
}

// Used in the socket status indicator
export type SocketStatus = "online" | "offline" | "pending" | "reconnecting" | "failed"

export const socketStatus = ref<SocketStatus>("pending")
export const socketError = ref<string | null>(null)

let hadError = false

const setError = (err: unknown) => {
  hadError = true
  if (err instanceof Error && err.message) socketError.value = err.message
  else if (typeof err === "string" && err) socketError.value = err
  else socketError.value = "连接失败"
}

const updateStatus = (s: Socket) => {
  if (s.connected) {
    hadError = false
    socketError.value = null
    socketStatus.value = "online"
    return
  }
  socketStatus.value =
    hadError && s.active ? "reconnecting"
    : s.active ? "pending"
    : hadError ? "failed"
    : "offline"
}

export function watchStatus(): () => void {
  const s = getSocket()
  const sync = () => updateStatus(s)
  const onError = (err: unknown) => {
    setError(err)
    updateStatus(s)
  }
  updateStatus(s)
  s.on("connect", sync)
  s.on("disconnect", sync)
  s.on("connect_error", onError)
  s.on("error", onError)
  s.io.on("error", onError)

  return () => {
    s.off("connect", sync)
    s.off("disconnect", sync)
    s.off("connect_error", onError)
    s.off("error", onError)
    s.io.off("error", onError)
  }
}

/**
 * 与后端 Flask-SocketIO（Back.py）的约定 —— 当前只做「全局一条连接 + HTTP 里带 socket_id」。
 * 推送类逻辑后续再按需接。
 *
 * | 操作 | HTTP | 当前前端 | 后续可做（Socket 事件，payload 均含 job_id） |
 * |------|------|----------|-----------------------------------------------|
 * | 提示词生成 | `POST /generate/prompts` + body.socket_id | 发到返回 202 | 先 `generate_prc` 再（若开启）`generate_waterlo`；最后 `generate_done`（`images` base64）、`generate_error` |
 * | 图像只打水印 | `POST /generate/images` + form socket_id | 同上 | 仅 `generate_waterlo`、`generate_done`、`generate_error` |
 * | 解码（选项） | `POST /decode` + form（`use_prc` / `use_waterlo` 等） | DecodeView | 同一 `job_id` 下 `decode_prc` / `decode_waterlo`；各分支 `decode_done`（`method`）；`decode_error`（含 `method`） |
 *
 * 连接时机：`App.vue` 根组件 `onMounted` 调用 `initSocket()`，子页面用 `getSocketIdWhenReady()` 取 id。
 */

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) socket = io(baseURL, { transports: ["websocket", "polling"] })
  return socket
}

// Try to get socket id immediately (otherwise re-connect andwait for 15 seconds)
export function getSocketId(): Promise<string> {
  const s = getSocket()
  if (s.connected && s.id) return Promise.resolve(s.id)
  return new Promise((resolve, reject) => {
    const sec = 15
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error(`Socket 连接超时（${sec}s）`))
    }, sec * 1000)
    const cleanup = () => {
      window.clearTimeout(timer)
      s.off("connect", onOk)
      s.off("connect_error", onBad)
    }
    const onOk = () => {
      cleanup()
      if (s.id) resolve(s.id)
      else reject(new Error("Socket 未分配 id"))
    }
    const onBad = (err: Error) => {
      cleanup()
      reject(err)
    }
    s.once("connect", onOk)
    s.once("connect_error", onBad)
    if (!s.connected) s.connect()
  })
}
