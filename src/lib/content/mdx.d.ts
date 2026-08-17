/**
 * Ambient type for compiled MDX modules.
 *
 * `@types/mdx` would supply this, but `tsconfig.json` pins `types` to
 * `["vitest/globals"]`, which switches off automatic `@types/*` inclusion — so
 * the package would install and do nothing. Nine lines here beat a dependency
 * that only works if an unrelated compiler option is loosened.
 *
 * The `components` prop is how an article receives its element mapping. See
 * `src/components/content/mdx-components.tsx` for what is passed and why the
 * mapping is a prop rather than an MDX provider.
 */
declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXComponent: ComponentType<{
    components?: Readonly<Record<string, unknown>>;
  }>;

  export default MDXComponent;
}
