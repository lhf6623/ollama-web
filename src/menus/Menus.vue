<template>
  <div
    :class="store.showMenu ? 'w200px' : '!w-0px !p-0'"
    class="flex-shrink-0 relative overflow-hidden flex flex-col bg-#eaeaea relative"
    p="t34px b10px"
  >
    <Title></Title>
    <div class="text-center pb6px">
      <NButton @click="store.addNewMenu()" ghost type="primary">
        <i class="i-mdi:chat-plus-outline mr-6px"></i>
        <span>开启新对话</span>
      </NButton>
    </div>
    <div class="overflow-auto px10px">
      <template v-for="menu in menus" :key="menu.date">
        <MenuItem
          :menu="menu"
          @menuOperate="menuOperate"
          v-if="menu.date !== editId"
        ></MenuItem>
        <EditMenu :menu="menu" v-else @showEdit="editId = ''"></EditMenu>
      </template>
    </div>

    <NPopover
      :show="showPopover"
      :x="xy.x"
      :y="xy.y"
      trigger="manual"
      class="z-100"
    >
      <NButton
        text
        size="small"
        @click="editMenuTitle"
        :block="true"
        class="mb-6px"
        type="primary"
      >
        <i class="i-mdi:edit-outline mr-10px text-18px"></i>
        重新命名
      </NButton>
      <NButton text size="small" @click="delMenu" type="error" :block="true">
        <i
          class="i-material-symbols:delete-forever-outline-rounded mr-10px text-18px"
        ></i>
        删除
      </NButton>
    </NPopover>
    <div
      class="fixed top-0 left-0 wfull hfull z-10"
      @click="hideMenu"
      v-if="showPopover"
    ></div>
  </div>
</template>

<script setup lang="ts">
  import { useStore } from "../store";
  import dayjs from "dayjs";
  import relativeTime from "dayjs/plugin/relativeTime";
  import "dayjs/locale/zh-cn";
  import { computed, ref, onMounted } from "vue";
  import Title from "../Title.vue";
  import MenuItem from "./MenuItem.vue";
  import EditMenu from "./EditMenu.vue";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  dayjs.extend(relativeTime);
  const xy = ref({
    x: 0,
    y: 0,
  });
  const showPopover = ref(false);
  const currId = ref("");
  const editId = ref("");

  const store = useStore();

  onMounted(() => {
    getCurrentWindow().listen("tauri://blur", hideMenu);
    getCurrentWindow().listen("tauri://move", hideMenu);
  });

  function hideMenu() {
    showPopover.value = false;
  }

  function menuOperate(menu: { id: string | number; x: number; y: number }) {
    const { id, x, y } = menu;

    currId.value = id as string;
    showPopover.value = true;
    xy.value = { x, y };
  }

  function delMenu() {
    if (store.currentId == +currId.value && store.loading) return;
    store.menu = store.menu.filter((item) => {
      return item.date != +currId.value;
    });

    currId.value = "";
    showPopover.value = false;
  }
  function editMenuTitle() {
    editId.value = currId.value;
    showPopover.value = false;
  }
  const menus = computed(() => {
    const menuObj = store.menu.reduce((pre, acc) => {
      const { date } = acc;
      const dateStr = dayjs(date).format("YYYY-MM-DD");

      pre[dateStr] = [...(pre[dateStr] || []), acc];
      return pre;
    }, {} as Record<string, Menu[]>);

    return Object.entries(menuObj)
      .sort((a, b) => {
        return dayjs(b[0]).unix() - dayjs(a[0]).unix();
      })
      .flatMap(([key, menu]) => {
        return [
          {
            type: "date",
            title: dayjs(key).locale("zh-cn").toNow(),
            date: key,
          },
          ...menu,
        ];
      });
  });
</script>

<style>
  .a {
    color: #404040;
  }
</style>
