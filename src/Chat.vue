<template>
  <div
    v-if="show"
    ref="chatRef"
    class="flex gap-2"
    :class="isUser ? 'mt16px first-of-type:mt0' : ''"
  >
    <div>
      <NCheckbox
        :checked="select"
        v-if="index !== undefined && store.isSelect"
        @update:checked="handleUpdateChecked"
      ></NCheckbox>
    </div>
    <NSpin v-if="!hasValue"></NSpin>
    <div v-if="hasValue" :id="`img_chat_${index ?? ''}`" class="group flex-1">
      <div v-if="!isUser" class="flex items-center justify-start mb-5px">
        <span class="text-sm text-gray-500">{{ chat.model }}</span>
      </div>
      <div
        :class="`${
          chat.role == 'user' ? 'flex items-center justify-center' : ''
        } `"
      >
        <div v-if="isUser" class="rounded-full" v-html="htmlStr"></div>
        <div v-else class="markdown-body" v-html="htmlStr"></div>
      </div>
      <div class="text-center" v-if="isUser && !store.loading">
        <p
          class="h20px *:hidden group-hover:*:inline-block *:text-12px *:mr-8px"
        >
          <NButton text title="复制" @click="copyChat()">
            <i :class="copyIcon"></i>
          </NButton>
          <NButton text title="修改" @click="editChat()">
            <i class="i-material-symbols:edit-square-outline text-12px"></i>
          </NButton>
          <NButton text title="删除" @click="deleteChat()" class="!mr-0">
            <i class="i-material-symbols:delete-forever-outline-sharp"></i>
          </NButton>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    computed,
    onDeactivated,
    onMounted,
    PropType,
    ref,
    toRefs,
    useTemplateRef,
  } from "vue";
  import { Marked } from "marked";
  import { markedHighlight } from "marked-highlight";
  import hljs from "highlight.js";
  import DOMPurify from "dompurify";
  import "github-markdown-css/github-markdown-light.css";
  import "highlight.js/styles/vs.css";
  import { useStore } from "./store";

  const store = useStore();
  const chatRef = useTemplateRef<HTMLDivElement>("chatRef");

  const props = defineProps({
    chat: {
      type: Object as PropType<ChatMessage>,
      required: true,
    },
    show: {
      type: Boolean,
      default: true,
    },
    index: Number,
  });
  const marked = new Marked(
    markedHighlight({
      emptyLangClass: "hljs",
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        const { value } = hljs.highlight(code, { language });

        const _code = encodeURI(code);
        const codeBox = `<div class="code-title">
          <span>${lang || "&nbsp;"}</span>
          <button data-code="${_code}" class="__copy-code">复制</button>
        </div>${value}`;
        return codeBox;
      },
    })
  );
  const copyIcon = ref("i-mdi:content-copy");
  const { chat, show } = toRefs(props);
  const hasValue = computed(() => {
    const value = [...new Set(Object.values(chat.value))];
    return value.length !== 1;
  });
  const select = computed(() => {
    return store.selectChat.includes(props.index!);
  });

  function handleUpdateChecked(val: boolean) {
    if (!val) {
      store.selectChat = store.selectChat.filter(
        (item) => item !== props.index
      );
      return;
    }
    store.selectChat.push(props.index!);
  }
  const htmlStr = computed(() => {
    const result = chat.value.content
      .replace(/\<think\>/g, "<div class='think'>")
      .replace(/\<\/think\>/g, "</div>");

    const renderer = new marked.Renderer();

    // 覆盖 link 渲染方法
    renderer.link = function ({ href, title, text }) {
      // 添加 target="_blank" 和 rel="noopener noreferrer"（推荐安全做法）
      return `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    };
    marked.setOptions({
      renderer: renderer,
    });
    const md = marked.parse(result) as string;

    return DOMPurify.sanitize(md, {
      ADD_ATTR: ["target"],
    });
  });

  const isUser = computed(() => {
    return props.chat.role === "user";
  });

  const editChat = () => {
    const { index } = props;
    if (typeof index === "number") {
      store.editChat(index);
    }
  };

  let tim: number | null = null;
  const copyChat = async () => {
    try {
      await navigator.clipboard.writeText(chat.value.content);

      copyIcon.value = "i-mdi:success text-green-500";
    } catch (error) {
      copyIcon.value = "i-mdi:error-outline text-red-500";
    }
    if (tim) {
      clearTimeout(tim);
      tim = null;
    }
    tim = setTimeout(() => {
      copyIcon.value = "i-mdi:content-copy";
    }, 4000);
  };

  const deleteChat = () => {
    const { index } = props;
    if (typeof index === "number") {
      store.deleteChat(index);
    }
  };

  let timCode: number | null = null;
  async function copyChatCode(e: MouseEvent) {
    const { target } = e;

    if (
      target instanceof HTMLElement &&
      target.classList.contains("__copy-code")
    ) {
      const { code } = target.dataset;
      try {
        await navigator.clipboard.writeText(decodeURI(code!));
        target.innerHTML = "已复制";
      } catch (error) {
        target.innerHTML = "复制失败";
      }
      if (timCode) {
        clearTimeout(timCode);
        timCode = null;
      }
      timCode = setTimeout(() => {
        target.innerHTML = "复制";
      }, 4000);
    }
  }
  onMounted(() => {
    if (chatRef.value) {
      chatRef.value.addEventListener("click", copyChatCode);
    }
  });
  onDeactivated(() => {
    if (chatRef.value) {
      chatRef.value.removeEventListener("click", copyChatCode);
    }
  });
</script>

<style lang="css">
  .think {
    font-size: 14px;
    color: #8b8b8b;
    padding-left: 14px;
    position: relative;

    text-indent: 28px;
  }
  .think::before {
    position: absolute;
    content: "";
    height: 100%;
    width: 3px;
    background: #e5e5e5;
    left: 0;
    top: 0;
  }

  pre {
    position: relative;
    padding-top: 40px !important;
    border: 1px solid #d2d2d0;
  }
  .code-title {
    position: absolute;
    top: 0;
    left: 0;
    background: #eaeae8;
    border-bottom: 1px solid #d2d2d0;
    width: 100%;
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 10px;
    padding-bottom: 10px;

    display: flex;
    justify-content: space-between;
    color: #464646;

    button {
      background: none;
      display: flex;
      align-items: center;
      gap: 6px;

      &:hover {
        opacity: 0.8;
      }
      &:active {
        opacity: 0.6;
      }

      i {
        display: inline-block;
      }
    }
  }
</style>
