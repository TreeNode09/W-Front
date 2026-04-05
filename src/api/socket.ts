import { io, type Socket } from "socket.io-client"
import { ref } from "vue"

import { baseURL } from "./http"

// Used in the socket status indicator
export type SocketStatus = "online" | "offline" | "pending" | "reconnecting" | "failed"

export const socketStatus = ref<SocketStatus>("pending")
export const socketError = ref<string | null>(null)

let hadError = false

function setErrorFromUnknown(err: unknown) {
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
  // connect_error 后客户端会重试，此时 s.active 仍为 true；不能再显示成「正在连接」
  if (hadError && s.active) {
    socketStatus.value = "reconnecting"
    return
  }
  if (s.active) {
    socketStatus.value = "pending"
    return
  }
  if (hadError) {
    socketStatus.value = "failed"
    return
  }
  socketStatus.value = "offline"
}

export function watchStatus(): () => void {
  const s = getSocket()
  const onSync = () => updateStatus(s)
  const onConnectError = (err: Error) => {
    setErrorFromUnknown(err)
    updateStatus(s)
  }
  const onSocketError = (err: Error) => {
    setErrorFromUnknown(err)
    updateStatus(s)
  }
  const onManagerError = (err: unknown) => {
    setErrorFromUnknown(err)
    updateStatus(s)
  }
  updateStatus(s)
  s.on("connect", onSync)
  s.on("disconnect", onSync)
  s.on("connect_error", onConnectError)
  s.on("error", onSocketError)
  s.io.on("error", onManagerError)
  return () => {
    s.off("connect", onSync)
    s.off("disconnect", onSync)
    s.off("connect_error", onConnectError)
    s.off("error", onSocketError)
    s.io.off("error", onManagerError)
  }
}

/**
 * 与后端 Flask-SocketIO（Back.py）的约定 —— 当前只做「全局一条连接 + HTTP 里带 socket_id」。
 * 推送类逻辑后续再按需接。
 *
 * | 操作 | HTTP | 当前前端 | 后续可做（Socket 事件，payload 均含 job_id） |
 * |------|------|----------|-----------------------------------------------|
 * | 提示词生成 | `POST /generate/prompts` + body.socket_id | 发到返回 202 | `generate_prc`、`generate_waterlo`、`generate_done`、`generate_error` |
 * | 图像只打水印 | `POST /generate/images` + form socket_id | 同上 | `generate_waterlo`、`generate_done`、`generate_error` |
 * | PRC 解码 | `POST /decode/prc` | （Decode 页） | `decode_prc`、`decode_done`、`decode_error` |
 * | WaterLo 解码 | `POST /decode/waterlo` | （Decode 页） | `decode_waterlo`、`decode_done`、`decode_error` |
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
