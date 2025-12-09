import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        plugins: [
          visualizer({
            filename: "stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ],
      },
    },
  },
});
