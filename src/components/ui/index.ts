/**
 * @/components/ui — the design system, public surface.
 *
 * One system, five identities. Every component here reads ONLY the six
 * semantic colour tokens (`--paper --ink --rule --dim --signal --flag`) and
 * the shared scale from `apps/web/src/styles/globals.css`. A section changes
 * identity by redefining those six values on its own `[data-section]` subtree;
 * nothing in this package knows a section exists.
 *
 * Component APIs are frozen by DESIGN-CONTRACT.md. Section code is written
 * against these exact signatures — do not change a public prop.
 *
 * Import surface:
 *   import { Button, LedgerTable, formatCents, useReducedMotion } from "@/components/ui";
 *
 * The barrel re-exports everything, including the formatting and motion
 * helpers, so a section never needs a deep path. Two subpaths exist for code
 * that wants the helpers without pulling the component graph into its module
 * scope — useful in a server module or a plain unit test:
 *   import { formatCents, formatMonths } from "@/components/ui/format";
 *   import { DUR_BASE, prefersReducedMotion } from "@/components/ui/motion";
 * `@/components/ui/components/Button` also resolves, but prefer the barrel.
 *
 * Zero runtime dependencies. React and react-dom are peers.
 */

/* ---- Group A: primitives ------------------------------------------------ */
export { Button } from "./components/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/Button";
export { Field } from "./components/Field";
export type { FieldProps } from "./components/Field";
export { Input, CONTROL_BORDER } from "./components/Input";
export type { InputProps } from "./components/Input";
export { NumberInput } from "./components/NumberInput";
export type { NumberInputProps, NumberUnit } from "./components/NumberInput";
export { Select } from "./components/Select";
export type { SelectOption, SelectProps } from "./components/Select";
export { RadioGroup } from "./components/RadioGroup";
export type { RadioGroupProps, RadioOption } from "./components/RadioGroup";
export { Checkbox } from "./components/Checkbox";
export type { CheckboxProps } from "./components/Checkbox";
export { Stepper } from "./components/Stepper";
export type { Step, StepperProps } from "./components/Stepper";
export { Tabs, tabId, tabPanelId } from "./components/Tabs";
export type { TabItem, TabsProps } from "./components/Tabs";
export { Disclosure } from "./components/Disclosure";
export type { DisclosureProps } from "./components/Disclosure";
export { Tooltip } from "./components/Tooltip";
export type { TooltipProps } from "./components/Tooltip";
export { Dialog } from "./components/Dialog";
export type { DialogProps } from "./components/Dialog";

/* ---- Group B: the nine interaction mechanics ---------------------------- */
export { ConfidenceMeter } from "./components/ConfidenceMeter"; // M1 no gate on the answer
export type { ConfidenceMeterProps } from "./components/ConfidenceMeter";
export { LiveNumber } from "./components/LiveNumber"; // M2 values tween
export type { LiveNumberProps } from "./components/LiveNumber";
export { MarginalProbe } from "./components/MarginalProbe"; // M3 the derivative, not the level
export type { MarginalProbeProps } from "./components/MarginalProbe";
export { ScrubTrack } from "./components/ScrubTrack"; // M4 scrubbing time
export type { ScrubTrackProps } from "./components/ScrubTrack";
export { RankedRows } from "./components/RankedRows"; // M5 rankings reorder in front of you
export type { RankedRowsProps } from "./components/RankedRows";
export { LiveWarnings } from "./components/LiveWarnings"; // M6 warnings that live
export type {
  LiveWarning,
  LiveWarningSeverity,
  LiveWarningsProps,
} from "./components/LiveWarnings";
export {
  ScenarioPins,
  useScenarioPins,
  MAX_PINS,
  PINS_STORAGE_KEY,
} from "./components/ScenarioPins"; // M7 pinned scenarios
export type { ScenarioPin, ScenarioPinsProps } from "./components/ScenarioPins";
export { TraceDisclosure } from "./components/TraceDisclosure"; // M9 traces on tap
export type { TraceDisclosureProps, TraceInput } from "./components/TraceDisclosure";
// M8 (reactive copy) is not a component — it is a deterministic template
// function per section. No LLM in that path; the numbers must be engine-exact.

/* ---- Group C: data display ---------------------------------------------- */
// The phone corollary to M1/M2: on a narrow screen the form and the answer
// cannot share the fold, so the answer is pinned rather than scrolled away.
export { StickyAnswer } from "./components/StickyAnswer";
export type { StickyAnswerProps } from "./components/StickyAnswer";
export { HeroNumber } from "./components/HeroNumber";
export type { HeroNumberDelta, HeroNumberProps } from "./components/HeroNumber";
export { LedgerTable } from "./components/LedgerTable";
export type { LedgerColumn, LedgerRow, LedgerTableProps } from "./components/LedgerTable";
export { WarningStack } from "./components/WarningStack";
export type { Warning, WarningSeverity, WarningStackProps } from "./components/WarningStack";
export { LastVerified } from "./components/LastVerified";
export type { LastVerifiedProps } from "./components/LastVerified";
export { AnswerBox } from "./components/AnswerBox";
export type { AnswerBoxProps } from "./components/AnswerBox";
export { FactTable } from "./components/FactTable";
export type { FactRow, FactTableProps } from "./components/FactTable";
export { SourceCitation } from "./components/SourceCitation";
export type { SourceCitationProps } from "./components/SourceCitation";
export { AdSlot, ToolBoundary, useInsideTool } from "./components/AdSlot";
export type { AdSlotProps } from "./components/AdSlot";
export { SkeletonBlock, EmptyState, ErrorState } from "./components/States";
export type {
  EmptyStateProps,
  ErrorStateProps,
  SkeletonBlockProps,
} from "./components/States";

/* ---- Helpers ------------------------------------------------------------ */
export {
  usd,
  usdExact,
  formatCents,
  formatCentsExact,
  formatDate,
  formatPct,
  formatBps,
  formatMonths,
  durationLabel,
  monthLabel,
} from "./format";
export type { Cents } from "./format";

export {
  DUR_FAST,
  DUR_BASE,
  DUR_SIGNATURE,
  EASE_CSS,
  cubicBezier,
  easeAtlas,
  prefersReducedMotion,
  useReducedMotion,
} from "./motion";
