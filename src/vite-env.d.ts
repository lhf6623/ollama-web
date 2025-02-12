/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

import { Message } from "ollama";
declare global {
  interface ChatMessage extends Message {
    model: string;
  }
  interface Menu {
    date: number;
    title: string;
    chatList: ChatMessage[];
    type?: string;
  }
  type PromiseType<T> = T extends Promise<infer U> ? U : T;
}
