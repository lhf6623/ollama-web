<script setup lang="ts">
  import ChatList from "./ChatList.vue";
  import InpuProblem from "./InpuProblem.vue";
  import Menus from "./menus/Menus.vue";
  import pck from "../package.json";
  import Title from "./Title.vue";
</script>

<template>
  <NDialogProvider>
    <NMessageProvider>
      <div class="hfull wfull flex">
        <Menus></Menus>
        <main
          class="overflow-hidden relative hfull flex flex-1 flex-col pt34px"
        >
          <Title :title="pck.name"></Title>
          <ChatList></ChatList>
          <InpuProblem></InpuProblem>
        </main>
      </div>
    </NMessageProvider>
  </NDialogProvider>
</template>
