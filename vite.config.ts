import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import UnoCSS from "unocss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import nodeStdlibBrowser from "vite-plugin-node-stdlib-browser";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(),
    nodePolyfills({
      protocolImports: !isDev,
    }),
    nodeStdlibBrowser(),
  ],
  // 打包文件分类 css js
  build: {
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 打包文件分类
          "highlight.js": ["highlight.js"],
          ollama: ["ollama"],
          vue: ["vue", "pinia", "pinia-plugin-persistedstate"],
          marked: ["marked", "marked-highlight", "dompurify"],
          util: ["dayjs", "lodash-es"],
          tauri: ["@tauri-apps/plugin-shell", "@tauri-apps/api"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
