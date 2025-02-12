import { Message, ModelResponse } from "ollama";
import { createPinia, defineStore } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { openOllamaServe } from "./ollamaTool";
import ollama from "ollama";

export const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

type Store = {
  model: string;
  models: ModelResponse[];
  loading: boolean;
  currentAnswer: ChatMessage;
  editList: ChatMessage[];
  showMenu: boolean;
  menu: Menu[];
  currentId: number;
};

export const useStore = defineStore("store", {
  state: (): Store => ({
    /** 当前的模型 */
    model: "",
    /** AI 回答问题状态 */
    loading: false,
    /** 所有的模型列表 */
    models: [],
    /** 当前的回答 */
    currentAnswer: {
      role: "",
      content: "",
      model: "",
    },
    /** 当前的编辑列表 */
    editList: [],
    /** 显示菜单 */
    showMenu: true,
    /** 菜单列表 */
    menu: [],
    /** 当前的菜单 ID */
    currentId: Date.now(),
  }),
  getters: {
    chatList: (state): ChatMessage[] => {
      if (!state.menu.length || !state.currentId) return [];
      const id = state.currentId;
      const list = state.menu.find(({ date }) => date === id)?.chatList || [];
      return list;
    },
    list: (state): Message[] => {
      const id = state.currentId;
      const list = state.menu.find(({ date }) => date === id)?.chatList || [];
      return list.map((item) => {
        return {
          role: item.role,
          content: item.content,
        };
      });
    },
  },
  actions: {
    initCurrentAnswer() {
      this.currentAnswer = {
        model: "",
        role: "",
        content: "",
      };
    },
    deleteChat(index: number) {
      const list =
        this.menu.find((item) => item.date == this.currentId)?.chatList || [];
      list.splice(index, 2);
    },
    exitEditChat() {
      const list =
        this.menu.find((item) => item.date == this.currentId)?.chatList || [];
      const _list = [...list, ...this.editList];
      this.editList = [];

      this.menu.find((item) => item.date == this.currentId)!.chatList = _list;
    },
    editChat(index: number) {
      const list =
        this.menu.find((item) => item.date == this.currentId)?.chatList || [];

      list.splice(index);
      this.editList = list;
    },
    addChat(chat: Message | ChatMessage) {
      if (this.menu.length === 0) {
        this.addNewMenu();
        const menu = {
          date: this.currentId,
          title: chat?.content || "",
          chatList: [],
        };
        this.menu.push(menu);
      }
      const id = this.currentId;
      let index = this.menu.findIndex(({ date }) => date == id);
      if (index === -1) {
        const menu = {
          date: this.currentId,
          title: chat?.content || "",
          chatList: [],
        };
        this.menu.push(menu);
        index = this.menu.findIndex(({ date }) => date == id);
      }
      this.menu[index].chatList.push({
        ...chat,
        model: this.model,
      });
    },
    async getModels() {
      this.models = (await openOllamaServe(() => ollama.list())).models || [];
      if (this.models.length === 0) {
        this.model = "";
      }
      if (!this.models.find((m) => m.name === this.model)) {
        const m = this.models[0]?.name;
        this.model = m || "";
      }
    },
    addNewMenu() {
      this.currentId = Date.now();
    },
    changeChat(id?: number | string) {
      if (id && typeof id === "number") {
        this.currentId = id as number;
      }
    },
  },
  persist: {
    omit: ["models"],
  },
});
