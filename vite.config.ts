import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";
import path from "path";

const ReactCompilerConfig = {
  target: "19",
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      include: ["**/*.res.mjs", "**/*.tsx", "**/*.ts"],
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
        targets: {
          browsers: [
            "chrome >= 94",
            "edge >= 94",
            "firefox >= 100",
            "safari >= 16.4",
          ],
        },
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: mode === "production" ? "auto" : false,
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"],
      },
    }),
  ],
  resolve: {
    alias: {
      // Use modern ESM build instead of ES5 transpiled version
      "workbox-window": path.resolve(
        __dirname,
        "node_modules/workbox-window/build/workbox-window.prod.mjs"
      ),
    },
  },
  build: {
    target: "esnext",
  },
}));
