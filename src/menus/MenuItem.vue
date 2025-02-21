<template>
  <div
    :data-menu_date="menu.type == 'date' ? '' : menu.date"
    class="text-16px flex items-center p6px relative rounded-10px cursor-pointer"
    :class="
      menu.type == 'date'
        ? '!text-12px !pl6px text-#5d5d5d font-500'
        : store.currentId == menu.date
        ? 'bg-#cacaca'
        : ''
    "
    @click="store.changeChat(menu.date)"
  >
    <span class="flex-1 overflow-hidden whitespace-nowrap">
      {{ menu.title || "&nbsp;" }}
    </span>

    <div
      v-if="menu.type !== 'date'"
      :style="{
        '--bg': bg,
        background: bg,
      }"
      class="h-full flex items-center box"
      @click.stop="() => {}"
    >
      <NButton text @click="menuOperate">
        <i class="i-mdi:ellipsis-horizontal"></i>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import { useStore } from "../store";
  const store = useStore();
  const props = defineProps<{
    menu: {
      title: string;
      date: string | number;
      type?: string;
    };
  }>();

  const bg = computed(() => {
    return store.currentId == props.menu.date ? "#cacaca" : "#eaeaea";
  });

  const emit = defineEmits<{
    menuOperate: [
      menu: {
        id: number | string;
        x: number;
        y: number;
      }
    ];
  }>();

  function menuOperate(e: MouseEvent) {
    emit("menuOperate", {
      id: props.menu.date,
      x: e.clientX,
      y: e.clientY,
    });
  }
</script>

<style lang="css" scoped>
  .box {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      width: 20px;
      left: -20px;
      z-index: 100;
      height: 100%;
      background: linear-gradient(to right, transparent, var(--bg));
    }
  }
</style>
