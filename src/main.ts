import { createApp } from "vue";
import App from "./App.vue";
import "@unocss/reset/tailwind-compat.css";
import "virtual:uno.css";
import { create, NButton, NSelect, NSpin, NPopover } from "naive-ui";

const naive = create({
  components: [NButton, NSelect, NSpin, NPopover],
});

import { pinia } from "./store";

const app = createApp(App);

app.use(pinia);
app.use(naive);
app.mount("#app");
