<template>
  <div
    :data-menu_date="menu.type == 'date' ? '' : menu.date"
    class="text-16px p6px relative rounded-10px truncate cursor-pointer"
    :class="
      menu.type == 'date'
        ? '!text-12px !pl6px text-#5d5d5d font-500'
        : store.currentId == menu.date
        ? 'bg-#cacaca'
        : ''
    "
    @click="store.changeChat(menu.date)"
  >
    <span>{{ menu.title || "&nbsp;" }}</span>

    <div
      v-if="menu.type !== 'date'"
      :class="store.currentId == menu.date ? 'bg-#cacaca' : 'bg-#eaeaea'"
      class="absolute right-16px top-0 hfull flex items-center"
      @click.stop="() => {}"
    >
      <NButton text @click="menuOperate">
        <i class="i-mdi:ellipsis-horizontal"></i>
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
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
