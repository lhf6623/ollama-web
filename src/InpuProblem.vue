<template>
  <div class="h160px relative flex flex-col flex-shrink-0">
    <div
      class="h5px wfull absolute top-0 left-0 after:bg-#e0e0e0 after:top-0 after:wfull after:h1px after:content-[''] after:absolute"
      v-drag.vertical="[100, 300]"
    ></div>

    <div class="flex items-center justify-between flex-row mt6px mx16px">
      <div class="flex items-center justify-end gap-2">
        <NButton text title="展示菜单" @click="showMenu()">
          <i class="i-material-symbols:menu-book-outline"></i>
        </NButton>
        <NButton text title="生成图片">
          <i class="i-lets-icons:img-box-duotone-line"></i>
        </NButton>
        <NTag
          v-if="isEdit"
          size="small"
          type="warning"
          closable
          @close="exitEdit()"
        >
          正在编辑
        </NTag>
      </div>
      <div class="flex items-center justify-end gap-2">
        <NButton
          v-if="store.loading"
          type="primary"
          circle
          size="small"
          @click="submitChat()"
        >
          <i class="i-mdi:pause"></i>
        </NButton>
        <ModelList></ModelList>
      </div>
    </div>
    <textarea
      v-model="input"
      placeholder=""
      class="flex-1 resize-none focus-visible:outline-none focus:outline-none mx16px"
      @keydown.enter="submitChat"
    />
  </div>
</template>

<script setup lang="ts">
  import ModelList from "./ModelList.vue";
  import ollama, { Ollama } from "ollama";
  import { computed, ref, watch } from "vue";
  import { useStore } from "./store";
  import { vDrag } from "./drag-directives";
  const store = useStore();
  const input = ref("");
  const display = computed(() => {
    const val = input.value.trim();
    return !val.length;
  });
  const abortable = ref<Ollama | null>(null);

  async function submitChat(e?: KeyboardEvent) {
    if (store.loading && abortable.value) {
      store.addChat(store.currentAnswer);
      abortable.value.abort();

      store.loading = false;
      abortable.value = null;
      store.initCurrentAnswer();
      return;
    }
    if (isEdit.value) {
      store.editList = [];
    }
    // 空输入不提交
    if (display.value) return;

    // 本地服务没开启，模型没返回
    if (!store.model) {
      await store.getModels();
    }
    // 组合键 上档键 和 回车键才能继续走下去
    if (e && e.key == "Enter" && e.shiftKey) {
      return;
    }
    // Enter 阻止默认事件
    if (e && e.key == "Enter") {
      e.preventDefault();
    }

    store.addChat({
      role: "user",
      content: `${input.value}`,
    });
    store.loading = true;
    input.value = "";

    console.log(JSON.stringify(store.list));

    ollama
      .chat({
        model: store.model,
        stream: true,
        messages: store.list,
      })
      .then(async (asyncIterator) => {
        abortable.value = asyncIterator as unknown as Ollama;

        store.currentAnswer.model = store.model;
        for await (const chunk of asyncIterator) {
          if (chunk.done) {
            break;
          }
          store.currentAnswer.content += chunk.message.content;
          store.currentAnswer.role = chunk.message.role;
        }
        if (abortable.value) {
          store.addChat(store.currentAnswer);
          store.initCurrentAnswer();
        }
      })
      .catch((e) => {
        if (abortable.value) {
          store.addChat({
            role: "assistant",
            content: e.message,
            model: store.model,
          });
        }
      })
      .finally(() => {
        store.loading = false;
        abortable.value = null;
      });
  }

  const isEdit = computed(() => {
    return !!store.editList.length;
  });
  watch(
    () => store.editList,
    (newValue) => {
      if (newValue.length) {
        input.value = newValue[0].content;
      }
    },
    { deep: true, immediate: true }
  );

  const exitEdit = () => {
    input.value = "";
    store.exitEditChat();
  };

  watch(
    () => store.currentId,
    () => {
      input.value = "";
    }
  );

  const showMenu = () => {
    store.showMenu = !store.showMenu;
  };
</script>
