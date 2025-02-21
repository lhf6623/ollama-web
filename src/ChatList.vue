<template>
  <div
    ref="chatListRef"
    trigger="none"
    class="px16px relative flex-1 mb6px overflow-scroll"
  >
    <Chat v-for="(chat, index) in store.chatList" :chat="chat" :index="index">
    </Chat>
    <Chat :show="store.loading" :chat="store.currentAnswer"> </Chat>
  </div>
</template>

<script lang="tsx" setup>
  import { watch, useTemplateRef, onMounted } from "vue";
  import Chat from "./Chat.vue";
  import { useStore } from "./store";
  import { throttle } from "lodash-es";

  const store = useStore();
  const chatListRef = useTemplateRef("chatListRef");

  function scrollToBottom() {
    if (chatListRef.value) {
      const { clientHeight, scrollHeight } = chatListRef.value || {
        clientHeight: 0,
        scrollHeight: 0,
      };

      chatListRef.value.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }

  const toScrollBottom = throttle(() => {
    if (chatListRef.value) {
      const { scrollHeight, scrollTop, clientHeight } = chatListRef.value || {
        scrollHeight: 0,
        scrollTop: 0,
        clientHeight: 0,
      };

      if (
        scrollHeight &&
        scrollTop &&
        scrollHeight - clientHeight - scrollTop < 200
      ) {
        scrollToBottom();
      }
    }
  }, 500);
  onMounted(scrollToBottom);
  watch(() => store.currentAnswer, toScrollBottom, {
    deep: true,
  });

  watch(() => store.loading, toScrollBottom);
  watch(() => store.chatList, toScrollBottom, { deep: true });

  watch(
    () => store.currentId,
    () => {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  );
</script>
