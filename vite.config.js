import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // 根据环境变量设置 base 路径，如果没有设置则默认为相对路径
  const base = env.VITE_API_BASE_URL || "./";

  return {
    base: "/cxxt/",
    plugins: [vue()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});
