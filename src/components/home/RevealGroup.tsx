"use client";

import type * as React from "react";

import { useReveal } from "./reveal";

/**
 * One observer for a whole group, rather than one per child.
 *
 * The tool cards used to be client components purely so each could own a
 * `useReveal`. That put five component boundaries, five observers and the whole
 * card tree into the client bundle to buy a staggered fade — a bad trade on a
 * page whose largest paint is a paragraph of text. This wrapper is the only
 * client code the grid needs: it holds the ref and the phase, and the stagger
 * is a `--reveal-index` custom property the server already wrote onto each
 * child. The cards themselves are server components again.
 *
 * `as` exists because the group is a <ul> for the cards and could be something
 * else elsewhere; the reveal CSS selects on `[data-reveal]`, not on a tag.
 */
export function RevealGroup({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "ul" | "ol" | "div";
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, phase } = useReveal<HTMLElement>();

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={className}
      data-reveal={phase}
    >
      {children}
    </Tag>
  );
}
