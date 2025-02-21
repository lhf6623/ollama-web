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
        <NButton text title="生成图片" @click="setSelect">
          <i
            :class="`${
              store.isSelect
                ? 'i-mdi:location-exit'
                : 'i-lets-icons:img-box-duotone-line'
            }`"
          ></i>
        </NButton>
        <NButton
          v-if="store.isSelect"
          @click="selectAll"
          type="primary"
          ghost
          text
          >{{ selectAllId ? "取消" : "全选" }}</NButton
        >
        <NButton
          v-if="store.selectChat.length"
          @click="downloadImg"
          type="primary"
          ghost
          text
        >
          保存图片
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
        <NSelect
          v-model:value="store.model"
          :options="store.models"
          label-field="name"
          value-field="name"
          size="small"
          class="min-w-120px"
          :disabled="store.loading"
        >
          <template #empty>
            <NEmpty description="暂无模型"></NEmpty>
          </template>
        </NSelect>
        <OllamaServe></OllamaServe>
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
  import ollama, { Ollama } from "ollama";
  import { computed, ref, watch, onMounted } from "vue";
  import { useStore } from "./store";
  import { vDrag } from "./drag-directives";
  import OllamaServe from "./OllamaServe.vue";
  import html2canvas from "html2canvas";
  import { invoke } from "@tauri-apps/api/core";
  import { useMessage } from "naive-ui";
  import { name } from "../package.json";

  const message = useMessage();
  const store = useStore();
  const input = ref("");
  const display = computed(() => {
    const val = input.value.trim();
    return !val.length;
  });
  const selectAllId = computed(() => {
    return store.selectChat.length === store.chatList.length;
  });
  const abortable = ref<Ollama | null>(null);

  onMounted(() => {
    store.selectChat = [];
    store.isSelect = false;
  });
  function setSelect() {
    store.selectChat = [];
    store.isSelect = !store.isSelect;
  }

  function selectAll() {
    if (!selectAllId.value) {
      store.selectChat = store.chatList.map((_, i) => i);
    } else {
      store.selectChat = [];
    }
  }

  async function downloadImg() {
    const imgs = store.selectChat.sort().map((item) => {
      const id = `img_chat_${item}`;
      return html2canvas(document.getElementById(id)!, {
        logging: false,
      });
    });
    const fileName = `${name}_${store.selectChat.sort().join("")}.png`;

    const canvas = await Promise.all(imgs);
    const interval = 100;
    // 宽度一样，高度不同，把高度加起来算出总高度
    const totalHeight =
      canvas.reduce((pre, acc) => {
        return pre + acc.height;
      }, 0) +
      interval * 2;
    const totalWidth = canvas[0].width + interval * 2;

    // 创建目标Canvas
    const mergedCanvas = document.createElement("canvas");
    mergedCanvas.width = totalWidth;
    mergedCanvas.height = totalHeight;
    const ctx = mergedCanvas.getContext("2d")!;

    // 填充背景
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // 合并操作
    let drawY = 0;
    canvas.forEach((can) => {
      ctx.drawImage(can, (totalWidth - can.width) / 2, drawY + interval);
      drawY += can.height;
    });

    const res = (await invoke("save_base64_image", {
      base64String: mergedCanvas.toDataURL("image/png"),
      fileName,
    })) as {
      message: string;
      path: string;
      success: boolean;
    };

    if (res.success) {
      message.success(res.message);
    } else {
      message.error(res.message);
    }
  }
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
      return;
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
