import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const ReactCompilerConfig = {};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: ["**/*.res.mjs", "**/*.tsx", "**/*.ts"],
      babel: {
        //plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
  ],
});
