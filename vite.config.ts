import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

function copyOfflineResources(): Plugin {
  const root = process.cwd();
  const files = ["data/exercises.json"];
  const visit = (directory: string) => {
    for (const entry of readdirSync(resolve(root, directory), {
      withFileTypes: true,
    })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) visit(path);
      else files.push(path);
    }
  };
  visit("assets");

  return {
    name: "gymmy-offline-resources",
    buildStart() {
      for (const file of files) {
        this.emitFile({
          type: "asset",
          fileName: relative(root, resolve(root, file)).split(sep).join("/"),
          source: readFileSync(resolve(root, file)),
        });
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/gymmy/" : "/",
  plugins: [
    vue(),
    copyOfflineResources(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "assets/icons/gymmy-192.svg",
        "assets/icons/gymmy-maskable.svg",
      ],
      manifest: {
        id: "./",
        name: "Gymmy — tu compañero de gimnasio",
        short_name: "Gymmy",
        description:
          "Registra tus ejercicios, series y progreso incluso sin conexión.",
        lang: "es",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#101612",
        theme_color: "#101612",
        icons: [
          {
            src: "assets/icons/gymmy-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "assets/icons/gymmy-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "assets/icons/gymmy-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globDirectory: "dist",
        globPatterns: ["**/*.{html,js,css,json,svg,webp,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}));
