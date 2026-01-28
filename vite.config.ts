import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

const ReactCompilerConfig = {
  target: "19",
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      include: ["**/*.res.mjs", "**/*.tsx", "**/*.ts"],
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
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
}));
