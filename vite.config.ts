/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("/react-dom/") || id.includes("/react/")) {
            return "react";
          }
          if (id.includes("/react-router/")) {
            return "router";
          }
          if (id.includes("/@tanstack/react-query/")) {
            return "query";
          }
          if (id.includes("/@radix-ui/")) {
            return "radix";
          }
          if (id.includes("/@dnd-kit/")) {
            return "dndkit";
          }
          if (
            id.includes("/react-hook-form/") ||
            id.includes("/@hookform/") ||
            id.includes("/zod/")
          ) {
            return "forms";
          }
          if (id.includes("/@supabase/")) {
            return "supabase";
          }
          if (id.includes("/lucide-react/")) {
            return "icons";
          }

          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
