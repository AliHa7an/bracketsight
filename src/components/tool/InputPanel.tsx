import type { ReactNode } from "react";

import styles from "./tool.module.css";

/**
 * InputPanel — the input column, promoted from a bordered box to a panel.
 *
 * "It reads like a form" is the complaint that triggered the hub redesign, and
 * the input column was still the purest example of it on the site: one hairline
 * rectangle, fields inside, no internal hierarchy and nothing tying it to the
 * section it belonged to. Three changes, none of them decoration:
 *
 *   • a ruled head that names the panel and says how far through it you are, in
 *     the same 10.5px mono small caps the hub labels everything with;
 *   • a recessed `--band` ground, so the answer beside it reads as the lit
 *     surface and the inputs as the working one;
 *   • a 2px seam of `--signal` on the leading edge — the section's accent used
 *     structurally rather than as a hairline nobody notices.
 *
 * `as="form"` because four of the five tools want a real <form> here and a
 * wrapper <div> around one would put the panel's chrome outside the landmark.
 */

export type InputPanelProps = {
  /** The panel's name, in mono small caps: "Your details", "The job". */
  label: string;
  /** The right-hand end of the head rule: "step 1 of 3", a count. */
  meta?: ReactNode;
  /** The panel's own controls — Back / Continue — on a ruled foot. */
  foot?: ReactNode;
  children: ReactNode;
  className?: string;
} & (
  | { as?: "div" }
  | ({ as: "form" } & Pick<
      React.ComponentPropsWithoutRef<"form">,
      "onSubmit" | "aria-label" | "noValidate"
    >)
);

export function InputPanel(props: InputPanelProps) {
  const { label, meta, foot, children, className } = props;
  const isForm = "as" in props && props.as === "form";

  const inner = (
    <>
      <div className={styles.panelHead}>
        <span className={styles.panelHeadName}>{label}</span>
        {meta ? <span>{meta}</span> : null}
      </div>
      <div className={styles.panelBody}>
        {children}
        {foot ? <div className={styles.panelFoot}>{foot}</div> : null}
      </div>
    </>
  );

  const shell = [styles.panel, className].filter(Boolean).join(" ");

  if (isForm) {
    const { onSubmit, noValidate } = props as { onSubmit?: React.FormEventHandler<HTMLFormElement>; noValidate?: boolean };
    return (
      <form
        className={shell}
        aria-label={props["aria-label"]}
        onSubmit={onSubmit}
        noValidate={noValidate}
      >
        {inner}
      </form>
    );
  }

  return <div className={shell}>{inner}</div>;
}

/**
 * The recessed strip. The hub's proof row at a tool page's scale: what the page
 * can say about ITSELF — how complete the inputs are, when the rules were last
 * checked — on the third surface, which is what stops the page reading as
 * paper, ink, paper.
 */
export function ToolStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={[styles.strip, className].filter(Boolean).join(" ")}>{children}</div>;
}
