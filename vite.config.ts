import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const previewBuild = mode === "development";
  const host = process.env.FIGMA_DEV_SERVER_HOST || "0.0.0.0";

  return {
    base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
    },
    build: {
      sourcemap: previewBuild ? "inline" : false,
      minify: !previewBuild,
    },
    server: {
      host,
      port: Number(process.env.PORT || 5173),
      watch: { ignored: ["**/.figma/**", "**/server/**"] },
      proxy: {
        "/api": { target: "http://localhost:3001", changeOrigin: true },
      },
    },
    preview: {
      host,
      port: Number(process.env.PORT || 8443),
    },
  };
});
