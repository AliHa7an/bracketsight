import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * One config for the whole site. Engine tests live in tests/engines/<name>/ and
 * import their engine through the same `@/` alias the app uses, so there is a
 * single module-resolution story rather than one per package.
 */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
