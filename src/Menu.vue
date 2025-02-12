<template>
  <div
    :class="store.showMenu ? 'w200px' : '!w-0px !p-0'"
    class="flex-shrink-0 relative overflow-hidden flex flex-col bg-#eaeaea relative"
    p="t34px b10px"
  >
    <div
      class="w5px hfull absolute right-0 top-0 flex justify-end after:bg-#e0e0e0 after:w1px after:hfull after:content-[''] after:absolute"
      v-drag.horizontal="[50, 300]"
    ></div>
    <Title></Title>
    <div class="text-center pb6px">
      <NButton @click="store.addNewMenu()" ghost type="primary">
        <i class="i-mdi:chat-plus-outline mr-6px"></i>
        <span>开启新对话</span>
      </NButton>
    </div>
    <div ref="menuRef" class="overflow-auto px10px">
      <div
        v-for="menu in menus"
        :key="menu.date"
        :data-menu_date="menu.type == 'date' ? '' : menu.date"
        class="text-16px p6px rounded-10px truncate cursor-pointer"
        :class="
          menu.type == 'date'
            ? '!text-12px !pl6px text-#5d5d5d font-500'
            : store.currentId == menu.date
            ? 'bg-#cacaca'
            : ''
        "
        @click="store.changeChat(menu.date)"
      >
        {{ menu.title || "&nbsp;" }}
      </div>
    </div>

    <NPopover :show="showPopover" :x="xy.x" :y="xy.y" trigger="manual">
      <NButton text size="small" :block="true" class="mb-6px">重新命名</NButton>
      <NButton text size="small" @click="delMenu" :block="true">删除</NButton>
    </NPopover>
  </div>
</template>

<script setup lang="ts">
  import { useStore } from "./store";
  import dayjs from "dayjs";
  import relativeTime from "dayjs/plugin/relativeTime";
  import "dayjs/locale/zh-cn";
  import { computed, onMounted, onUnmounted, ref, useTemplateRef } from "vue";
  import Title from "./Title.vue";
  import { vDrag } from "./drag-directives";
  import { getCurrentWindow } from "@tauri-apps/api/window";

  const menuRef = useTemplateRef("menuRef");

  const xy = ref({
    x: 0,
    y: 0,
  });
  const showPopover = ref(false);
  const currId = ref("");

  dayjs.extend(relativeTime);
  const store = useStore();

  onMounted(() => {
    document.addEventListener("click", showMenu);
    document.addEventListener("contextmenu", showMenu);

    getCurrentWindow().listen("tauri://blur", hideMenu);
    getCurrentWindow().listen("tauri://move", hideMenu);

    menuRef.value!.addEventListener("scroll", hideMenu);
  });

  onUnmounted(() => {
    document.removeEventListener("click", showMenu);
    document.removeEventListener("contextmenu", showMenu);

    menuRef.value!.removeEventListener("scroll", hideMenu);
  });

  function hideMenu() {
    showPopover.value = false;
  }
  function showMenu(e: MouseEvent) {
    const el = e.target as HTMLElement;

    if (e.type == "click" || !el.dataset.hasOwnProperty("menu_date")) {
      hideMenu();
      return;
    }

    e.preventDefault();
    currId.value = el.dataset.menu_date!;
    showPopover.value = true;
    xy.value = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  function delMenu() {
    store.menu = store.menu.filter((item) => {
      return item.date != +currId.value;
    });
  }

  // 按时间归类
  // 今天 昨天 前天 三天前 七天前 15天前
  // 一个月前 两个月前 三个月前
  // 半年前 一年前 两年前 三年前 更早
  // 按天数分组
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
