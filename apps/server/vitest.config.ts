import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // Los tests de integración usan la DB local: los corremos en serie.
    fileParallelism: false,
    testTimeout: 15_000,
    env: { NODE_ENV: "test" },
    reporters: ["verbose"],
  },
});
