import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePluginRadar } from "vite-plugin-radar";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePluginRadar({
      analytics: {
        id: "G-FJ9XLLJSNQ",
      },
      gtm: {
        id: "GTM-T85B8426",
      },
    }),
  ],
});
