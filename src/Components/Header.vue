<template>
<header class="row" style="justify-content: space-around; padding: 0.5em 1em; background-color: var(--main);">
  <div style="flex: 1;">水印系统</div>
  <div class="row" style="flex: 3">
    <div class="option" @click="onGenerate">生成</div>
    <div class="option" @click="onDetect">检测</div>    
  </div>
</header>
</template>

<script setup lang="ts">
import { useColors } from '@/stores/colors'

const colors = useColors()
const model = defineModel()

const onGenerate = () => {
  colors.setPaletteIndex(0)
  model.value = true
}

const onDetect = () => {
  colors.setPaletteIndex(1)
  model.value = false
}
</script>

<style scoped>
* {
  color: var(--white);
  font-weight: bold;
}

.option {
  flex: 1;
  text-align: center;
}
</style>