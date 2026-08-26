import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { AnswerBox } from "@/components/ui";

import InvoiceView from "@/components/trades/InvoiceView";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where all 55 routes are measured against each other
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/trades/invoice");

/**
 * The invoice.
 *
 * Like the contract, the tool has nothing to render until an estimate is
 * saved, so a first-time visitor and every crawler saw an h1, one sentence and
 * an empty state: 41 words, the thinnest page on the site, and — until the
 * link from /trades was added — one no page linked to at all. The explanation
 * below renders unconditionally and describes what the invoice engine actually
 * does, so the route earns its place whether or not there is an estimate in
 * this browser.
 */

const link = "rounded-atlas underline underline-offset-4 hover:text-ink";

export default function InvoicePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <div className="no-print space-y-6">
        <h1>Your invoice</h1>

        <AnswerBox>
          An invoice built from a saved takeoff carries the same lines, in the same order, at the
          same prices, for the same total — to the cent. The deposit already taken comes off the
          face of it, and what the customer owes now is the only figure they have to read.
        </AnswerBox>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Built from the estimate you saved — same lines, same total, to the cent.
        </p>
      </div>

      <InvoiceView />

      <div className="no-print space-y-6">
        <h2>Why does it have to match the estimate exactly?</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Because a total that moves between the estimate and the invoice is the most common way a
          job turns into an argument, and the customer is always the one who spots it. The invoice
          is the same sheet re-headed: it does not re-price anything, it does not re-apply a
          regional multiplier, it does not round a second time. It reads the saved estimate and
          reproduces it. The reconciliation is shown on the document in an expandable trace rather
          than asserted, so if you ever do need to defend the number you can open the arithmetic in
          front of the customer.
        </p>

        <h2>How is money already taken handled?</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          A deposit is entered as a figure and subtracted from the total, and the balance due is
          what the invoice leads with. The deposit can never exceed the job total — enter a larger
          one and it is clamped — so an invoice cannot be produced showing a negative balance. Both
          figures stay on the document, because a customer who paid a deposit needs to see it
          credited, not merely see a smaller number than they were quoted.
        </p>

        <h2>Why overhead and profit arrive as one line</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          The line items on an invoice are the takeoff&rsquo;s line items, and they sum to the
          takeoff&rsquo;s subtotal. Everything above that — your overhead percentage and your
          profit percentage — is carried as a single &ldquo;Overhead &amp; profit&rdquo; row,
          and that row is computed as the difference between the estimate total and the line
          subtotal rather than by re-running the percentages. It is a subtraction, not a
          second calculation, which is what makes the equality structural: there is no
          arrangement of rounding that lets the invoice total drift from the estimate total,
          because the margin line absorbs whatever the difference is. The trade is
          visibility: your margin arrives as one figure on the customer&rsquo;s copy instead
          of being spread thinly across the line items, which is the honest way round and
          occasionally an uncomfortable one.
        </p>

        <h2>When is it due?</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          You set the issue date and the number of days, and the due date is computed from them
          rather than typed — a due date that contradicts the terms printed beside it is worth
          nothing in a dispute. The default is net 14. Nothing here calculates interest, a late fee
          or a lien deadline: those are set by your state and your contract, and this tool will not
          guess at them.
        </p>

        <h2>What is missing from this invoice on purpose</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          There is no sales-tax line, no retainage line and no late-fee line, and none of
          them is an oversight. The invoice engine has no tax field at all: what is taxable,
          at what rate, and whether labor is treated differently from materials is not
          something this tool knows about your job, and a tax line that is wrong is worse
          than no tax line, because it looks authoritative. The same goes for retainage held
          back against completion, and for anything you charge on a balance that goes past
          due. Add them where your accounting already handles them.
        </p>

        <h2>The invoice number is yours to keep track of</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          It is a free-text field that starts at INV-001 and is never checked against
          anything. Nothing is stored on a server, so the tool has no way of knowing what you
          numbered the last one — it cannot warn you about a duplicate and will not
          auto-increment behind your back. If you invoice from a book or a ledger, carry your
          own sequence across; if two customers ever hold the same number, the argument that
          follows is about which one you meant.
        </p>

        <h2>Does it print?</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Yes — the page is designed for it. Everything that is screen furniture is dropped from
          the printed sheet, so what comes out is the document and nothing else, from a browser
          print dialogue and with no export step. Print to PDF and it is a PDF.
        </p>

        <h2>Where is the invoice stored?</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          Nowhere but your own browser. There is no account, no upload and no server-side copy —
          the estimate the invoice is built from lives in your browser&rsquo;s local storage, and
          clearing your site data deletes it. That also means an invoice does not follow you to a
          different device or a different browser, which is the trade for not asking you to hand
          over a customer&rsquo;s job details.
        </p>

        <h2>What this invoice is not</h2>

        <p className="text-dim" style={{ maxWidth: "var(--measure)" }}>
          It is not a binding quote, not a lien notice and not a tax document. Prices in the{" "}
          <Link href="/trades" className={`${link} text-ink`}>
            takeoff sheet
          </Link>{" "}
          are reference data on a dated basis, not a live market feed — see the{" "}
          <Link href="/trades/pricing-methodology" className={`${link} text-ink`}>
            pricing methodology
          </Link>{" "}
          for what they rest on and how stale they are allowed to get. The paperwork that carries
          legal weight is the{" "}
          <Link href="/trades/contract" className={`${link} text-ink`}>
            contract
          </Link>
          , and its clause language is still awaiting attorney review.
        </p>
      </div>
    </div>
  );
}
