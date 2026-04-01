import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import { useColors } from '@/stores/colors'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

useColors(pinia).updateRoot()

app.mount('#app')
