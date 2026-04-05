<template>
<div>
  <span style="user-select: none; margin-right: 10px;">{{ props.name }}:</span>
  <span style="margin-right: 5px; color: var(--main); font-size: 32px; font-weight: bold;">{{ props.value }}</span>
  <span>{{ props.unit }}</span>
</div>
</template>

<script setup lang="ts">
const props = defineProps({
  name: {type: String},
  value: {type: [String, Number]},
  unit: {type: String, default: ""}
})
</script>