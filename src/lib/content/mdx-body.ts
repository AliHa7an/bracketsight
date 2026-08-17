import type { ComponentType } from "react";

/**
 * Loads a compiled article body.
 *
 * The dynamic `import()` with a literal prefix is what makes the bundler
 * compile every `.mdx` file under `content/posts` and hand back the right one
 * by slug. It is written once, here, so the relative path from this file to
 * the content directory exists in exactly one place — a route that built its
 * own `../../../../content/...` would break the first time a directory moved.
 *
 * The slug is never user input: `generateStaticParams` enumerates the
 * directory and `dynamicParams = false` turns anything else into a 404 before
 * this is reached. Even so, the import is scoped to a fixed directory and a
 * fixed extension, so it cannot reach outside `content/posts`.
 */
export async function loadArticleBody(
  slug: string,
): Promise<ComponentType<{ components?: Readonly<Record<string, unknown>> }>> {
  const mod = (await import(`../../../content/posts/${slug}.mdx`)) as {
    default: ComponentType<{ components?: Readonly<Record<string, unknown>> }>;
  };
  return mod.default;
}
