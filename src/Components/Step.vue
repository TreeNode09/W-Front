<template>
<div class="col" style="gap: 10px; padding: 20px; border: solid 1px var(--pale); border-radius: 10px;
background-color: #FFF; box-shadow: var(--shadowDark) 0 0 4px;">
  <div class="row" style="gap: 10px; color: var(--main);">
    <span class="col" style="flex-shrink: 0; align-items: center; justify-content: center; width: 20px; height: 20px;
      font-size: 12px; font-weight: bold; line-height: 1; border: solid 1px var(--main); border-radius: 50%;">
      {{ props.num }}
    </span>
    <div style="font-weight: bold;">{{ props.title }}</div>
  </div>
  <slot></slot>
</div>
</template>

<script setup lang="ts">
const props = defineProps(["num", "title"])
</script>