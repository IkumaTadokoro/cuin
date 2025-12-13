import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    Icons({
      compiler: "solid",
      scale: 1,
    }),
  ],
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
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
});
