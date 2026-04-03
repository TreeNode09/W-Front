<template>
<div>
  {{ props.name }}: 
  <span style="color: var(--main); font-size: 32px; font-weight: bold;">{{ props.value }}</span>
</div>
</template>

<script setup lang="ts">
const props = defineProps(["name", "value"])
</script>