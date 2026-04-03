<template>
<div class="col" style="gap: 12px; padding-top: 20px;">
  <h2>后端连接测试</h2>
  <div class="row" style="gap: 10px; align-items: center;">
    <el-button type="primary" :loading="loading" @click="testBackend">
      调用 /test
    </el-button>
    <span style="color: var(--dark);">{{ baseURL }}</span>
  </div>

  <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" />

  <el-card shadow="never">
    <template #header>随机字符串</template>
    <code v-if="token">{{ token }}</code>
    <span v-else style="color: var(--dark);">还没有结果，点击上方按钮开始测试。</span>
  </el-card>

  <el-card shadow="never">
    <template #header>Socket.IO</template>
    <div class="col" style="gap: 6px;">
      <div>
        状态：
        <el-tag v-if="socketConnected" type="success">已连接</el-tag>
        <el-tag v-else type="info">未连接</el-tag>
      </div>
      <div v-if="socketId">
        <span style="color: var(--dark);">socket_id：</span>
        <code>{{ socketId }}</code>
      </div>
      <div style="color: var(--dark); font-size: 12px;">
        连接地址：{{ baseURL }}
      </div>
      <el-alert v-if="socketError" :title="socketError" type="warning" show-icon :closable="false" />
    </div>
  </el-card>
</div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { onMounted, onUnmounted, ref } from 'vue'
import type { Socket } from 'socket.io-client'
import { baseURL, http } from './api/http'
import { createSocket } from './api/socket'

const loading = ref(false)
const token = ref('')
const errorMsg = ref('')

const socket = ref<Socket | null>(null)
const socketConnected = ref(false)
const socketId = ref('')
const socketError = ref('')

onMounted(() => {
  const s = createSocket()
  socket.value = s
  s.on('connect', () => {
    socketConnected.value = true
    socketId.value = s.id ?? ''
    socketError.value = ''
  })
  s.on('disconnect', () => {
    socketConnected.value = false
    socketId.value = ''
  })
  s.on('connect_error', (err) => {
    socketConnected.value = false
    socketId.value = ''
    socketError.value = err.message
  })
})

onUnmounted(() => {
  socket.value?.disconnect()
  socket.value = null
})

function testBackend() {
  loading.value = true
  errorMsg.value = ''
  http.get<{ data: string }>('/test')
    .then((res) => {
      if (typeof res.data?.data !== 'string') {
        throw new Error('返回数据格式异常')
      }
      token.value = res.data.data
    })
    .catch((error) => {
      token.value = ''
      if (axios.isAxiosError(error)) {
        errorMsg.value = error.response?.data?.error ?? error.message ?? '连接后端失败'
      } else {
        errorMsg.value = error instanceof Error ? error.message : '连接后端失败'
      }
    })
    .finally(() => {
      loading.value = false
    })
}
</script>