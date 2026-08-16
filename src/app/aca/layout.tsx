import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The ACA section — "the clinical margin".
 *
 * The wrapper's `data-section="aca"` attribute is the entire theming
 * mechanism. `globals.css` redefines the six semantic colour tokens
 * (`--paper --ink --rule --dim --signal --flag`) for this subtree, so every
 * ported component changes identity without a single line of component code
 * changing. There are no colour values in this file and no per-section CSS
 * import — a seventh token, or a literal hex here, would break that contract.
 *
 * `flex-1` is a no-op when the shell's `<main>` is not a flex column and makes
 * the section's paper fill the viewport when it is; either way the attribute
 * repaints the ground under everything below it.
 */

export const metadata: Metadata = {
  title: {
    default: "ACA Subsidy Cliff Calculator — Distance to 400% FPL",
    template: "%s · Health cover · Bracketsight",
  },
  description:
    "Your household's exact distance to the 400% federal poverty line subsidy cliff, what one more dollar costs, and every legal lever back under it. Free, no signup.",
};

export default function AcaSectionLayout({ children }: { children: ReactNode }) {
  return (
    <div data-section="aca" className="flex-1">
      {children}
    </div>
  );
}
