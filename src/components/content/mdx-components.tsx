import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

import { FAQ } from "./FAQ";
import { FigureTable } from "./FigureTable";
import { KeyFigure } from "./KeyFigure";
import { ToolCTA } from "./ToolCTA";

/**
 * What an article can use, and how its prose is set.
 *
 * Passed as the `components` prop to the compiled MDX module rather than
 * installed through an MDX provider. A provider is React context, which means
 * a client boundary and a set of components an article can silently inherit
 * from anywhere; passing the map explicitly keeps every article's vocabulary
 * visible in one file and keeps the whole article tree server-rendered.
 *
 * The element styles below are the only prose styling on the site. They use
 * the six semantic tokens and the type scale and nothing else — no prose
 * plugin, no per-article CSS. An article that wants a treatment not in this
 * list should get a component here, not a `<div style>` in the markdown.
 */

/** Anything not starting with a scheme or `//` is ours and routes client-side. */
function isInternal(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function A({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const target = href ?? "";
  const className =
    "rounded-atlas underline decoration-rule underline-offset-4 hover:decoration-current";

  if (isInternal(target)) {
    return (
      <Link href={target} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} className={className} target="_blank" rel="noreferrer" {...rest}>
      {children}
    </a>
  );
}

export const articleComponents = {
  /* ---- prose ------------------------------------------------------------ */

  h2: ({ children, ...rest }: { children?: ReactNode }) => (
    <h2 className="mt-10 mb-3" {...rest}>
      {children}
    </h2>
  ),
  h3: ({ children, ...rest }: { children?: ReactNode }) => (
    <h3 className="mt-8 mb-2" {...rest}>
      {children}
    </h3>
  ),
  p: ({ children, ...rest }: { children?: ReactNode }) => (
    <p className="my-4" {...rest}>
      {children}
    </p>
  ),
  ul: ({ children, ...rest }: { children?: ReactNode }) => (
    <ul className="my-4 list-disc space-y-2 pl-6" {...rest}>
      {children}
    </ul>
  ),
  ol: ({ children, ...rest }: { children?: ReactNode }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6" {...rest}>
      {children}
    </ol>
  ),
  li: ({ children, ...rest }: { children?: ReactNode }) => <li {...rest}>{children}</li>,
  a: A,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote
      className="my-6 pl-4 text-dim"
      style={{ borderLeft: "2px solid var(--rule)" }}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8" style={{ border: 0, borderTop: "var(--hairline)" }} />,
  /* Inline code carries statutory citations far more often than code, so it is
     set in the data face at body size rather than in a tinted code pill. */
  code: ({ children }: { children?: ReactNode }) => (
    <code className="num" style={{ fontSize: "0.95em" }}>
      {children}
    </code>
  ),
  pre: ({ children }: { children?: ReactNode }) => (
    <pre className="hairline-all rounded-atlas num my-6 overflow-x-auto p-3" style={{ fontSize: "var(--text-step--1)" }}>
      {children}
    </pre>
  ),
  /* A markdown table is the one element that can push a 375px page sideways.
     It scrolls inside its own box instead. */
  table: ({ children }: { children?: ReactNode }) => (
    <div className="density-instrument hairline-all rounded-atlas my-6 w-full min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th
      scope="col"
      className="micro-label hairline-b align-bottom"
      style={{ padding: "var(--cell-pad-y) var(--cell-pad-x)" }}
    >
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="hairline-b" style={{ padding: "var(--cell-pad-y) var(--cell-pad-x)" }}>
      {children}
    </td>
  ),

  /* ---- the article vocabulary ------------------------------------------ */

  KeyFigure,
  FigureTable,
  FAQ,
  ToolCTA,
} as const;
