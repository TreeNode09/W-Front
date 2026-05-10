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
