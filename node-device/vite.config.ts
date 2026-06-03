import path from "node:path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  root: path.resolve(__dirname, "src/renderer"),
  base: "./",
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/renderer"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
