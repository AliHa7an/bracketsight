import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The five engines are workspace source packages, not built artefacts.
  transpilePackages: [
    "@/engines/repayment",
    "@/engines/paycheck",
    "@/engines/aca",
    "@/engines/property",
    "@/engines/trades",
    "@/components/ui",
  ],

  /*
   * The guide and glossary routes read three things off disk at build time:
   * the article bodies and frontmatter in `content/posts`, and `KNOWN-GAPS.md`,
   * which is the register a <KeyFigure> quotes when the figure it prints sits
   * on an unresolved verification item. Every one of those routes is fully
   * prerendered, so the reads happen during `next build` and never in a
   * request — but tracing the files keeps a standalone server honest if a
   * route is ever made dynamic. Cheap insurance against a silent empty page.
   */
  outputFileTracingIncludes: {
    "/guides": ["./content/**/*"],
    "/guides/[slug]": ["./content/**/*", "./KNOWN-GAPS.md"],
    "/glossary": ["./KNOWN-GAPS.md"],
  },
};

/*
 * MDX, kept to the smallest configuration that works.
 *
 * `remark-frontmatter` is the whole reason a plugin list exists here: without
 * it, the YAML block at the top of every article compiles into visible prose
 * (`---` becomes a horizontal rule and the keys become a paragraph). It parses
 * the block out of the document and emits nothing — the metadata itself is
 * read separately, by `gray-matter`, in `src/lib/content/posts.ts`, so the
 * compiler and the loader agree by construction rather than by convention.
 *
 * The plugin is named as a STRING, not imported and passed as a function.
 * Turbopack serialises loader options, so a function value cannot cross that
 * boundary; `@next/mdx` resolves the string from the project root for both the
 * Turbopack and webpack paths.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],

    /*
     * No MDX provider. `@next/mdx` defaults `providerImportSource` to a module
     * alias that falls back to `@mdx-js/react`, which calls
     * `React.createContext` at module scope — and a React Server Component
     * cannot create context, so every article fails to prerender with
     * "createContext is not a function".
     *
     * Setting it to null compiles articles without any provider lookup. The
     * element mapping arrives as the `components` prop instead, from
     * `src/components/content/mdx-components.tsx`, which is where it was
     * always meant to come from: one file lists everything an article can use,
     * the whole article tree stays server-rendered, and no article inherits a
     * component from a context it cannot see.
     */
    providerImportSource: null,
  },
});

export default withMDX(nextConfig);
