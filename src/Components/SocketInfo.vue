<template>
<div class="row" style="align-items: flex-start; gap: 10px; line-height: 16px; color: var(--black);"
  :title="detailTitle">
  <span class="dot" :class="socketStatus" style="flex-shrink: 0; width: 10px; height: 10px;
    margin-top: 3px; border-radius: 50%;" />
  <span style="user-select: none;">{{ statusLabel }}</span>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue"

import { getSocket, socketError, socketStatus, watchStatus } from "@/api/socket"

const statusLabel = computed(() => {
  switch (socketStatus.value) {
    case "online": return "已连接"
    case "pending": return "正在连接…"
    case "reconnecting": return "连接异常，重试中…"
    case "failed": return "连接失败"
    default: return "未连接"
  }
})

const detailTitle = computed(() => {
  switch (socketStatus.value) {
    case "reconnecting": return `连接异常：${socketError.value}`
    case "failed": return `连接失败：${socketError.value}`
    default: return "Socket.IO 当前的连接状态"
  }
})

let endWatch: (() => void) | undefined

onMounted(() => {
  getSocket()
  endWatch = watchStatus()
})

onUnmounted(() => {
  endWatch?.()
})
</script>

<style scoped>
.dot {
  user-select: none;
}

.dot.online {
  background-color: var(--el-color-success);
}

.dot.pending {
  background-color: var(--main);
  animation: pulse 1.2s ease-in-out infinite;
}

.dot.reconnecting {
  background-color: var(--el-color-warning);
  animation: pulse 1.2s ease-in-out infinite;
}

.dot.offline {
  background-color: var(--el-color-info-light-7);
}

.dot.failed {
  background-color: var(--el-color-error);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
