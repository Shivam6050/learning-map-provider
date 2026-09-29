import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    exclude: [...configDefaults.exclude, "**/.kilo/**", "**/.worktrees/**"],
  },
});
