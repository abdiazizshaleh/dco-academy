import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "cloud-e2e",
  use: { baseURL: "http://127.0.0.1:5174" },
  workers: 1,
  reporter: "list",
});
