import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          "study-content": [
            "./src/content.ts",
            "./src/glossary.ts",
            "./research/sources.json",
          ],
        },
      },
    },
  },
  base: process.env.GITHUB_ACTIONS === "true" ? "/dco-academy/" : "/",
});
