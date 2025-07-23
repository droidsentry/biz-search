import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "node_modules", 
      "dist",
      "tests/**",  // tests ディレクトリ配下を除外
    ],
  },
});