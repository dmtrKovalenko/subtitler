import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: ["**/*.res.mjs", "**/*.tsx", "**/*.ts"],
      babel: {
        //plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
      },
    }),
  ],
});
