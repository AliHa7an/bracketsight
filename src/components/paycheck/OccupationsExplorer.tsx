"use client";

import * as React from "react";
import { resolveRules, searchOccupations } from "@/engines/paycheck";
import { Field, Input, LedgerTable } from "@/components/ui";
import { TAX_YEAR } from "@/lib/paycheck/rules-meta";

/**
 * Search-as-you-type over the qualified occupation list, returning an instant
 * qualified / not-qualified verdict — one of this section's three engagement
 * hooks. There is no submit: the verdict arrives with the second character.
 */
export function OccupationsExplorer() {
  const [query, setQuery] = React.useState("");
  const occupationRules = React.useMemo(() => resolveRules(TAX_YEAR).occupations, []);

  const matches = React.useMemo(
    () => (query.trim().length > 1 ? searchOccupations(query, occupationRules, 12) : []),
    [query, occupationRules],
  );

  const byCategory = React.useMemo(() => {
    const groups = new Map<string, typeof occupationRules.occupations>();
    for (const occupation of occupationRules.occupations) {
      const list = groups.get(occupation.category) ?? [];
      list.push(occupation);
      groups.set(occupation.category, list);
    }
    return [...groups.entries()];
  }, [occupationRules]);

  const searching = query.trim().length > 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-xl">
        <Field
          htmlFor="occ-query"
          label="Search the qualified occupation list"
          hint="Two characters is enough. The verdict updates as you type."
        >
          <Input
            id="occ-query"
            type="search"
            value={query}
            autoComplete="off"
            placeholder="waiter, nail tech, rideshare driver, DJ…"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </Field>

        <div aria-live="polite" className="mt-3">
          {searching && matches.length > 0 ? (
            <LedgerTable
              caption={`Occupations matching "${query.trim()}"`}
              columns={[
                { id: "title", label: "Occupation", align: "left" },
                { id: "category", label: "Category", align: "left" },
                { id: "code", label: "Code", numeric: true },
              ]}
              rows={matches.map((match) => ({
                id: match.occupation.code,
                disabled: !match.occupation.qualified,
                disabledReason: "Not on the IRS qualified list — tips from it don't deduct.",
                cells: {
                  title: match.occupation.title,
                  category: match.occupation.category,
                  code: match.occupation.code,
                },
              }))}
            />
          ) : null}

          {searching && matches.length === 0 ? (
            <p className="text-flag" style={{ fontWeight: 500 }}>
              <span className="micro-label text-flag">Money left behind — </span>
              nothing on the qualified list matches that. Tips earned in an unlisted occupation
              do not qualify for the deduction, even when they are genuinely tips.
            </p>
          ) : null}

          {!searching ? (
            <p className="text-dim" style={{ fontSize: "var(--text-step--1)" }}>
              Type at least two characters, or read the full list below.
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {byCategory.map(([category, occupations]) => {
          const anchor = `cat-${category.replace(/\W+/g, "-").toLowerCase()}`;
          return (
            <section key={category} aria-labelledby={anchor}>
              <h2 id={anchor}>{category}</h2>
              {/*
               * REMOVED: a "Status" column reading "Qualified" on every row of
               * a page whose whole subject is the qualified list. A column
               * where every value is identical is a column that separates
               * nothing. The exceptions still show — an unqualified occupation
               * greys out and states its reason inline.
               */}
              <LedgerTable
                className="mt-2"
                caption={`Qualified tipped occupations — ${category}`}
                columns={[
                  { id: "title", label: "Occupation", align: "left" },
                  { id: "code", label: "Code", numeric: true },
                ]}
                rows={occupations.map((occupation) => ({
                  id: occupation.code,
                  disabled: !occupation.qualified,
                  disabledReason: "Not on the IRS qualified list.",
                  cells: { title: occupation.title, code: occupation.code },
                }))}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
