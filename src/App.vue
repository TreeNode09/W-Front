<template>
<Header v-model="isEncode" />
<EncodeView v-if="isEncode"/>
<DecodeView v-else />
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Header from './Components/Header.vue'
import EncodeView from './EncodeView.vue'
import DecodeView from './DecodeView.vue'

const isEncode = ref(false)
</script>

<style>
* {
  transition: all 0.25s;
}

.col {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: row;
}
</style>
