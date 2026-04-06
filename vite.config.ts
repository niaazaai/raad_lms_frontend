import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  const isBuild = command === "build";
  
  const backendUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  if (!isBuild) {
    console.log(`[Vite] Proxy target for /api: ${backendUrl}`);
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: !isBuild,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      host: true,
      // Proxy for development - forwards API requests to backend
      // Simple: all /api/* requests go to backend
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/sanctum": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/auth": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 3000,
    },
  };
});
