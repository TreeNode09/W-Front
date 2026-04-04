import axios from 'axios'
import { ElNotification } from 'element-plus'

export function analyzeMessage(message: unknown, fallback = '请求失败'): string {
  if (typeof message === 'string')
    return message  // message: string

  if (axios.isAxiosError(message)) {
    const d = message.response?.data
    if (d && typeof d === 'object' && 'error' in d) {
      const msg = (d as { error: unknown }).error
      if (typeof msg === 'string' && msg)
        return msg  // AxiosError + message.response.data: { error: string }
    }
    if (message.message)
      return message.message  // AxiosError + message.message
  }
  if (message instanceof Error && message.message)
    return message.message  // message: Error：{ name, message }

  return fallback
}

export function showSuccess(title: string, message: string, fallback = '请求成功'): void {
  ElNotification.success({
    title: title,
    message: analyzeMessage(message, fallback),
    duration: 0
  })
}

export function showWarning(title: string, message: string, fallback = '注意'): void {
  ElNotification.warning({
    title: title,
    message: analyzeMessage(message, fallback),
    duration: 0
  })
}

export function showError(title: string, error: unknown, fallback = '请求失败'): void {
  ElNotification.error({
    title: title,
    message: analyzeMessage(error, fallback),
    duration: 0
  })
}