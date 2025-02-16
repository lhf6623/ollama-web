<template>
  <div class="flex" v-if="isConnection">
    <NInput size="small" v-model:value="input" readonly></NInput>
    <NButton
      size="small"
      type="primary"
      title="启动ollama服务"
      v-if="isConnection"
      @click="openServe()"
    >
      <i class="i-mdi:connection"></i>
    </NButton>
  </div>
</template>

<script setup lang="tsx">
  import { invoke } from "@tauri-apps/api/core";
  import ollama, { ModelResponse } from "ollama";
  import { useStore } from "./store";
  import { onMounted, ref } from "vue";
  import { useDialog } from "naive-ui";

  const store = useStore();
  const isConnection = ref(true);
  const dialog = useDialog();
  const input = ref("ollama serve");

  // 获取 command 路径
  async function getCommandPath(command: string): Promise<string> {
    return await invoke("get_command_path", {
      command,
    });
  }

  async function openServe() {
    let models: ModelResponse[] = [];
    // 判断 ollama serve 是否开启
    try {
      const list = await ollama.list();
      models = list.models;
      console.log("log: list.models", models);
    } catch (e) {
      console.log(`err: ollama.list`, e);
      try {
        await openOllamaServe();
        console.log("log: openOllamaServe");
      } catch (err) {
        console.log("err: openOllamaServe", err);
      }
    }

    try {
      if (!models.length) {
        const list = await ollama.list();

        models = list.models;
        console.log("log: ollama.list2", models);
      }

      if (!models.find((m) => m.name === store.model)) {
        const m = models[0].name;
        store.model = m;
      }
      isConnection.value = false;
      store.models = models;
    } catch (e) {
      console.log("err: ollama.list2", e);

      store.model = "";
      isConnection.value = true;
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

  onMounted(() => {
    openServe();
  });

  async function openOllamaServe() {
    const [comm, ...arg] = input.value.split(" ");
    const path = await getCommandPath(comm);
    console.log(path);

    const result = (await invoke("execute_command", {
      command: `${path} ${arg.join(" ")}`,
      isLong: false,
    })) as string;
    console.log(result);
  }
</script>
