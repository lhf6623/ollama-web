<script setup lang="ts">
  import ChatList from "./ChatList.vue";
  import InpuProblem from "./InpuProblem.vue";
  import Menu from "./Menu.vue";
  import pck from "../package.json";
  import Title from "./Title.vue";
</script>

<template>
  <NDialogProvider>
    <div class="hfull wfull flex">
      <Menu></Menu>
      <main class="overflow-hidden relative hfull flex flex-1 flex-col pt34px">
        <Title :title="pck.name"></Title>
        <ChatList></ChatList>
        <InpuProblem></InpuProblem>
      </main>
    </div>
  </NDialogProvider>
</template>

<style>
  .a {
    position: relative;
  }
</style>
