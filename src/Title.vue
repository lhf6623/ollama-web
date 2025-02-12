<template>
  <div
    data-tauri-drag-region
    class="cursor-pointer z-10 h-34px absolute top-0px left-0 wfull flex justify-center items-center"
  >
    {{ title }}
  </div>
</template>

<script setup lang="ts">
  defineProps({
    title: {
      type: String,
      default: "",
    },
  });
</script>
