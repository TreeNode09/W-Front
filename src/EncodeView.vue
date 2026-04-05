<template>
<div class="col" style="gap: 20px; min-width: 780px; padding: 20px 0;">

  <div class="row" style="gap: 20px; width: 100%;">
    <Step num="1" title="选择生成起点" row style="flex: 1;">
      <el-radio-group v-model="usePrompt" style="padding-bottom: 2px;">
        <el-radio-button :value="true" border>
          <el-icon><ChatDotSquare /></el-icon>
          提示词
        </el-radio-button>
        <el-radio-button :value="false" border>
          <el-icon><Picture /></el-icon>
          图像
        </el-radio-button>
      </el-radio-group>
    </Step>

    <Step v-if="usePrompt" num="2" title="选择水印类型" row style="flex: 1;">
      <div class="row" style="gap: 20px;">
        <el-switch v-model="usePRC" active-text="版权信息"/>
        <el-switch v-model="useWaterLo" active-text="篡改检测"/>
      </div>
    </Step>
  </div>

  <EncodePrompt v-if="usePrompt" :models="models" />
  <EncodeImage v-if="!usePrompt" :models="models" />

  <Step :num="usePrompt ? 4 : 3" title="生成图像">
    <div class="row" style="justify-content: center; gap: 40px;">
      <DisplayData name="图像数量" :value="currentNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="currentNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="currentNum" unit="张" />
    </div>

    <el-button type="primary" plain  style="font-weight: bold;"
      :disabled="currentNum<=0 || currentNum>ENCODE_MAX_UPLOAD">
      开始生成
    </el-button>
  </Step>

</div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, onMounted, ref } from "vue"
import { ChatDotSquare, Picture } from "@element-plus/icons-vue"

import { ENCODE_MAX_UPLOAD, useEncode } from "./stores/encode"
import EncodeImage from "./EncodeImage.vue"
import EncodePrompt from "./EncodePrompt.vue"

import Step from "./components/Step.vue"
import DisplayData from "./components/DisplayData.vue"


const models = ["Stable Diffusion 2.1", "Unstable 3.4"]

const procStatus = ref("prepare")   // prepare, working, finish, error

const { usePrompt, usePRC, useWaterLo, model, prmoptNum, imageNum } = storeToRefs(useEncode())

const currentNum = computed(() =>
  usePrompt.value ? prmoptNum.value : imageNum.value,
)

onMounted(() => {
  if (!model.value) model.value = models[0] ?? ""
})
</script>