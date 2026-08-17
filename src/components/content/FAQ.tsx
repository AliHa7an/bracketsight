import { Disclosure } from "@/components/ui";
import { jsonLd } from "@/lib/content/json-ld";

/**
 * FAQ — one list of questions, rendered once and marked up once.
 *
 * The `FAQPage` structured data is generated FROM the same `items` array the
 * page renders, in this component, and there is no way to pass one and not the
 * other. That is the entire design: the common failure is a page whose FAQ
 * markup carries questions the reader cannot see, or answers that were edited
 * in the prose and not in the JSON-LD, which is the structured-data mismatch
 * publisher policies treat as deceptive. Here the two cannot disagree, because
 * they are the same strings.
 *
 * Answers are plain text, not React children, for the same reason. Rich
 * children would have to be flattened to a string for the markup, and the
 * flattening is where the two versions start to differ. An answer that needs a
 * figure interpolates one as text:
 *
 *     answer={`RAP forgives after ${figureText("loans.rap.forgivenessPayments")}.`}
 *
 * so the number in the markup is the number on the page is the number in the
 * rule file. Blank lines split an answer into paragraphs.
 *
 * Accessibility comes from `<Disclosure>`: a real button, `aria-expanded`,
 * `aria-controls`, Escape to close, and the global focus ring. Every answer is
 * in the DOM whether or not it is expanded, so it is findable by in-page
 * search and readable by a crawler.
 *
 * One FAQ block per article. Two would emit two `FAQPage` objects for one URL.
 */

export interface FAQItem {
  readonly question: string;
  readonly answer: string;
}

export interface FAQProps {
  items: readonly FAQItem[];
  /** The heading above the list. */
  heading?: string;
  /**
   * Set false on a page that already emits `FAQPage` markup, or where the
   * questions are not the page's main subject. The list still renders.
   */
  structuredData?: boolean;
}

export function FAQ({ items, heading = "Common questions", structuredData = true }: FAQProps) {
  if (items.length === 0) return null;

  const markup = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section aria-labelledby="faq" className="my-8">
      {structuredData ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(markup) }} />
      ) : null}

      <h2 id="faq">{heading}</h2>

      <div className="mt-4 space-y-1">
        {items.map((item) => (
          <Disclosure key={item.question} summary={item.question}>
            {item.answer.split(/\n{2,}/).map((paragraph, index) => (
              <p key={paragraph} className={index === 0 ? "" : "mt-3"}>
                {paragraph}
              </p>
            ))}
          </Disclosure>
        ))}
      </div>
    </section>
  );
}
