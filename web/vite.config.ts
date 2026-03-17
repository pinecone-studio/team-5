import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

function shouldIgnoreVinextChunkWarning(message: string) {
  return (
    message.includes("dynamic import will not move module into another chunk") &&
    (message.includes("virtual:vinext-app-ssr-entry") ||
      message.includes("/node_modules/vinext/dist/shims/navigation.js") ||
      message.includes("/node_modules/react/index.js?commonjs-es-import"))
  );
}

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (shouldIgnoreVinextChunkWarning(warning.message ?? "")) {
          return;
        }

        defaultHandler(warning);
      },
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
