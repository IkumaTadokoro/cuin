import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import Icons from "unplugin-icons/vite";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid(), Icons({ compiler: "solid", scale: 1 })],
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          include: ["src/**/*.unit.{test,spec}.{ts,tsx}"],
          name: "unit",
          environment: "jsdom",
        },
      },
      {
        extends: true,
        plugins: [tailwindcss()],
        test: {
          include: ["src/**/*.browser.{test,spec}.{ts,tsx}"],
          name: "browser",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              {
                browser: "chromium",
                viewport: { width: 1280, height: 720 },
              },
            ],
          },
          setupFiles: ["./test/setup-css.mjs"],
        },
      },
    ],
  },
});
