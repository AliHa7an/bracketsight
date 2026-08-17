import type { ReactNode } from "react";

import { loansScenarioHref, toolHref, type LoansPrefill } from "@/lib/content/tool-links";
import { SECTIONS, type SectionSlug } from "@/lib/site";

/**
 * ToolCTA — the link from the article into the tool it explains.
 *
 * For loans it carries the article's worked example: the scenario is encoded
 * by the calculator's OWN encoder (`encodeScenario` in
 * `src/lib/loans/url-state.ts`) and handed over in the URL fragment, which is
 * exactly what the calculator writes when a reader shares a scenario and the
 * first thing it reads on load. The reader lands on the article's numbers,
 * already computed, and edits from there.
 *
 * For the other four tools there is no scenario transport to reuse — paycheck,
 * health cover, property and trades seed from defaults and persist to
 * `localStorage`, and none of them reads a search parameter. So the CTA is a
 * plain link to the tool, and the prop that would carry an example is typed
 * out of existence for those tools. Inventing a query string here would
 * produce a link that looks pre-filled, loads somebody else's defaults, and
 * shows the reader an answer that is not the article's. See
 * `src/lib/content/tool-links.ts`.
 *
 * Rendered as an anchor wearing the Button's classes rather than as a
 * `<Button>`: this navigates, so it has to be a link — right-clickable,
 * middle-clickable, and announced as a link. The classes are copied from
 * `Button`'s primary variant so the two cannot drift apart visually while
 * staying honest about what the element is.
 */

interface ToolCTABase {
  /** One sentence: what the reader will see when they arrive. */
  children: ReactNode;
  /** The button label. Names the outcome, never "Click here". */
  label: string;
  /** Named in build errors when a worked example does not validate. */
  context?: string;
}

export type ToolCTAProps =
  | (ToolCTABase & {
      tool: "loans";
      /** The article's worked example, pre-filled into the calculator. */
      prefill?: LoansPrefill;
    })
  | (ToolCTABase & {
      tool: Exclude<SectionSlug, "loans">;
      /** No transport exists for these tools yet — see the note above. */
      prefill?: never;
    });

const TOOL_NAMES = new Map(SECTIONS.map((section) => [section.slug, section.name]));

const BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-atlas bg-ink px-4 " +
  "font-medium text-paper no-underline transition-colors select-none hover:bg-ink/90";

export function ToolCTA(props: ToolCTAProps) {
  const { tool, children, label, context } = props;
  const href =
    tool === "loans" && props.prefill
      ? loansScenarioHref(props.prefill, context ?? "a guide")
      : toolHref(tool);

  const prefilled = tool === "loans" && Boolean(props.prefill);

  return (
    <aside
      className="hairline-all rounded-atlas my-8 p-4"
      style={{ background: "var(--paper-raised)" }}
      aria-label={`Open the ${TOOL_NAMES.get(tool) ?? tool} tool`}
    >
      <p className="m-0">{children}</p>

      <p className="mt-3 mb-0">
        <a
          href={href}
          className={BUTTON_CLASSES}
          style={{
            fontSize: "var(--text-step-0)",
            transitionDuration: "var(--dur-fast)",
            transitionTimingFunction: "var(--ease)",
          }}
        >
          {label}
        </a>
      </p>

      <p className="mt-3 mb-0 text-dim" style={{ fontSize: "var(--text-step--2)" }}>
        {prefilled
          ? "This link carries the example above, in the address bar only. Nothing is sent anywhere and nothing is stored on a server."
          : "The tool opens on a worked example you can edit. Nothing you enter leaves your browser."}
      </p>
    </aside>
  );
}
