import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The tests are ported verbatim from the five original repositories, where
 * `@engine` was a tsconfig path alias for the engine source. Providing the same
 * alias here keeps every test file byte-identical to the version that was
 * verified in Batch A — the alternative, rewriting ~40 import lines, would mean
 * the tests running in this monorepo are not the tests that were reviewed.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      // FairParcel shipped a real package name; its tests import it by that name.
      "@fairparcel/engine": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
  test: { globals: true, include: ["tests/**/*.test.ts"] },
});
