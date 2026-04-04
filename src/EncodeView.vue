<template>
<div class="col" style="gap: 20px; padding-top: 20px;">

  <div class="row" style="gap: 20px; width: 100%;">
    <Step num="1" title="选择生成起点" row style="flex: 1;">
      <el-radio-group v-model="isPrompt" style="padding-bottom: 2px;">
        <el-radio-button :value="true" border>提示词</el-radio-button>
        <el-radio-button :value="false" border>图像</el-radio-button>
      </el-radio-group>    
    </Step>

    <Step v-if="isPrompt" num="2" title="选择水印类型" row style="flex: 1;">
      <div class="row" style="gap: 20px;">
        <el-switch v-model="usePRC" active-text="版权信息"/>
        <el-switch v-model="useWaterLo" active-text="篡改检测"/>         
      </div>
    </Step>
  </div>

  <Step v-if="isPrompt" num="3" title="指定数据">

    <Subtitle v-if="usePRC" title="密钥ID"><Key /></Subtitle>
    <div v-if="usePRC" class="row" style="gap: 10px;">
      <el-input v-model="key" placeholder="首次生成前，请先获取密钥" />
      <el-button>获取</el-button>
      <el-button>导入</el-button>      
    </div>

    <Subtitle title="提示词"><ChatDotSquare /></Subtitle>
    <div class="row" style="gap: 10px;">
      <el-input v-model="prompts" type="textarea" :rows="3"
        placeholder="可输入多条提示词，或设定数量后点击“随机”，从数据集拉取" style="flex: 1;" />
      <div class="col" style="gap: 10px; align-items: stretch;">
        <el-button>导入</el-button>
        <div class="row" style="gap: 10px">
          <el-button :disabled="imageNum<=0" :loading="promptsLoading"
            style="flex: 1;">
            随机
          </el-button>
          <el-input-number v-model="imageNum" :min="0" :max="256" controls-position="right"
            style="flex: 2;">
            <template #suffix>
              <span>条</span>
            </template>
          </el-input-number>
        </div>
      </div>
    </div>

    <Subtitle title="模型"><Cpu /></Subtitle>
    <div>
      <el-radio-group v-model="model">
        <el-radio-button v-for="m in models" :value="m" border>{{ m }}</el-radio-button>
      </el-radio-group>      
    </div>

  </Step>

  <Step v-if="!isPrompt" num="2" title="指定数据">
    <div>敬请期待！</div>
  </Step>

  <Step :num="isPrompt ? 4 : 3" title="生成图像">
    <div class="row" style="justify-content: space-around;">
      <DisplayData name="图像数量" :value="imageNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="imageNum" />
      <div style="width: 1px; height: 46px; background-color: var(--pale);"></div>
      <DisplayData name="图像数量" :value="imageNum" />
    </div>

    <el-button type="primary" plain :disabled="imageNum<=0" style="font-weight: bold;">
      开始生成
    </el-button>
  </Step>

</div>
</template>

<script setup lang="ts">
import { ChatDotSquare, Cpu, Key } from '@element-plus/icons-vue'
import { onMounted, ref } from 'vue'
import Step from './Components/Step.vue'
import Subtitle from './Components/Subtitle.vue'
import DisplayData from './Components/DisplayData.vue'

const apiBase = import.meta.env.VITE_API_BASE
const models = ["Stable Diffusion 2.1", "Unstable 3.4"]

const isPrompt = ref(true)
const procStatus = ref("prepare")   // prepare, working, finish, error

const usePRC = ref(true)
const useWaterLo = ref(true)
const key = ref("")
const prompts = ref("")
const model = ref("")

const imageNum = ref(0)
const promptsLoading = ref(false)

onMounted(() => {
  // Fetch model list from backend
  model.value = models[0] ?? ''
})
</script>