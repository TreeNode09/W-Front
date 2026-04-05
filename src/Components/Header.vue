<template>
<header class="row" style="padding: 0 20px; background-color: var(--main);">
  <div style="width: 180px; padding: 10px 0;">水印系统</div>
  <div class="row" :class="{ locked: props.switchDisabled }">
    <div class="option" :class="{ selected: model }" @click="onGenerate">生成</div>
    <div class="option" :class="{ selected: !model }" @click="onDetect">检测</div>
  </div>
</header>
</template>

<script setup lang="ts">
import { useColors } from '@/stores/colors'

const props = defineProps({
  switchDisabled: {type: Boolean}
})

const colors = useColors()
const model = defineModel<boolean>({ required: true })

const onGenerate = () => {
  if (props.switchDisabled) return
  colors.setPaletteIndex(0)
  model.value = true
}

const onDetect = () => {
  if (props.switchDisabled) return
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
  box-sizing: border-box;
  width: 100px;
  padding: 10px 0;
  text-align: center;
  user-select: none;
}

.option.selected {
  color: var(--main);
  background-color: var(--white);
  box-shadow: inset var(--shadowDark) 0 -3px 3px;
}

.option:not(.selected) {
  cursor: pointer;
}

.locked .option {
  cursor: not-allowed;
  opacity: 0.75;
}

.locked .option.selected {
  opacity: 1;
}
</style>