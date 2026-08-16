import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The property-tax section — "the plat book".
 *
 * `data-section="property"` is the whole theme switch: `globals.css` redefines
 * the six semantic colour tokens for this subtree and nothing else moves. No
 * colour values live in this file, and no per-section stylesheet is imported.
 */

export const metadata: Metadata = {
  title: {
    default: "Property Tax Assessment Check — Is Your Home Over-Assessed?",
    template: "%s · Property tax · Fineprint",
  },
  description:
    "Compare your assessment against comparable homes using the median-ratio statistics assessors use, then get your county's deadline, fee and forms. Free, no signup.",
};

export default function PropertySectionLayout({ children }: { children: ReactNode }) {
  return (
    <div data-section="property" className="flex-1">
      {children}
    </div>
  );
}
