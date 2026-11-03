import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      output: { manualChunks: { supabase: ["@supabase/supabase-js"] } },
    },
  },
  base: process.env.GITHUB_ACTIONS === "true" ? "/dco-academy/" : "/",
});
