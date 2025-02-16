<template>
  <div class="flex gap-2">
    <NInput
      size="small"
      v-model:value="input"
      :placeholder="menu.title"
    ></NInput>
    <NButton size="small" text color="#36ad6a" @click="changeTitle">
      <i class="i-mdi:check"></i>
    </NButton>
    <NButton size="small" text color="#36ad6a" @click="closeEdit">
      <i class="i-mdi:close"></i>
    </NButton>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";
  import { useStore } from "../store";
  const store = useStore();

  const props = defineProps<{
    menu: {
      title: string;
      date: string | number;
      type?: string;
    };
  }>();
  const emit = defineEmits<{
    showEdit: [show: boolean];
  }>();
  const input = ref("");

  function changeTitle() {
    const index = store.menu.findIndex(({ date }) => date == props.menu.date);
    if (index !== -1 && input.value) {
      store.menu[index].title = input.value;
      input.value = "";
      emit("showEdit", false);
    }
  }
  function closeEdit() {
    emit("showEdit", false);
  }
</script>
