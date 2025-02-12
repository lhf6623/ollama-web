<template>
  <NSelect
    v-model:value="store.model"
    :options="store.models"
    label-field="name"
    value-field="name"
    size="small"
    class="w-210px"
    :disabled="store.loading"
    :on-update:show="getModels"
  />
</template>

<script setup lang="ts">
  import { onMounted } from "vue";
  import { useStore } from "./store";
  const store = useStore();

  onMounted(() => {
    store.getModels();
  });

  function getModels(show: boolean) {
    if (show) {
      store.getModels();
    }
  }
</script>
