import { defineConfig } from "vitest/config";

export default defineConfig({
  // Sin @vitejs/plugin-react: esbuild compila el JSX (runtime automático) y evita el error de "preamble".
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
