<template>
<div class="row" style="gap: 5px; align-items: center;">
  <div style="user-select: none;">{{ props.name }}：</div>
  <slot></slot>
  <div style="user-select: none;">{{ props.unit }}</div>
</div>
</template>

<script setup lang="ts">
const props = defineProps({
  name: {type: String},
  value: {type: [String, Number]},
  unit: {type: String, default: ""}
})
</script>