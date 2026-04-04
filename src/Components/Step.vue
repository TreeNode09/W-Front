<template>
<div class="col" style="gap: 10px; padding: 20px; border: solid 1px var(--pale); border-radius: 10px;
  background-color: #FFF; box-shadow: var(--shadowDark) 0 0 4px;">
  <template v-if="row">
    <div class="row" style="align-items: center; gap: 10px; color: var(--main);">
      <span class="num">{{ num }}</span>
      <div class="title">{{ title }}</div>
      <div class="row" style="flex: 1; align-items: center; margin-left: 20px;">
        <slot></slot>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="row" style="gap: 10px; color: var(--main);">
      <span class="num">{{ num }}</span>
      <div class="title">{{ title }}</div>
    </div>
    <slot></slot>
  </template>
</div>
</template>

<script setup lang="ts">
const props = defineProps({
  num: {type: [String, Number]},
  title: {type: String},
  row: {type: Boolean, default: false}
})
</script>

<style scoped>
.num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  border: solid 1px var(--main);
  border-radius: 50%;
}

.title {
  font-weight: bold;
  flex-shrink: 0;
}

.step-slot-inline {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>
