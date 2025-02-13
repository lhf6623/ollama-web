<template>
  <NButton
    size="small"
    type="primary"
    title="启动ollama服务"
    v-if="isConnection"
    @click="openServe()"
  >
    <i class="i-mdi:connection"></i>
  </NButton>
</template>

<script setup lang="tsx">
  import { Command } from "@tauri-apps/plugin-shell";
  import ollama from "ollama";
  import { useStore } from "./store";
  import { onMounted, ref } from "vue";
  import { useDialog } from "naive-ui";

  const store = useStore();
  const isConnection = ref(true);
  const dialog = useDialog();

  async function openServe() {
    try {
      await openOllamaServe();
      const { models } = await ollama.list();

      if (!models.find((m) => m.name === store.model)) {
        const m = models[0].name;
        store.model = m;
      }
      isConnection.value = false;
      store.models = models;
    } catch (e) {
      store.model = "";
      isConnection.value = true;
      // TODO: tauri 的 shell 插件还没弄懂 先这样搞
      dialog.warning({
        title: "ollama服务未启动",
        content: () => {
          return (
            <>
              <h1>ollama安装：</h1>
              <p>
                1、
                <a
                  href='https://ollama.com/download'
                  class='text-#409eff'
                  target='_blank'
                >
                  下载ollama
                </a>
              </p>
              <p>
                2、
                <a
                  href='https://ollama.com/search'
                  class='text-#409eff'
                  target='_blank'
                >
                  选择一个模型
                </a>
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;安装模型，比如：
                <code class='px6px rounded-6px bg-#818b981f mx3px text-#343639 '>
                  ollama run deepseek-r1
                </code>
              </p>
              <p>
                3、在终端中输入
                <code class='px6px rounded-6px bg-#818b981f mx3px'>
                  ollama serve
                </code>
                启动服务
              </p>
            </>
          );
        },
        positiveText: "确定",
      });
    }
  }

  onMounted(async () => {
    openServe();
  });

  async function openOllamaServe() {
    await Command.create("ollama-shell", ["serve"]).execute();
  }

  // function stopOllama(model: string) {
  //   return Command.create("ollama-shell", ["stop", model]).execute();
  // }
</script>

<style>
  .a {
    color: #343639;
  }
</style>
