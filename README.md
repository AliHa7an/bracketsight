# Bracketsight

Five US consumer-finance decision engines on one site. Each answers a question a
calculator cannot: not "what is my payment" but "which choice costs least, and
which of them cannot be undone".

| Section | Decides |
|---|---|
| `/loans` | Which of 9 federal student loan plans costs least over 30 years |
| `/paycheck` | Which OBBBA deductions a household gets, and what they save |
| `/aca` | How close a household is to the 400% FPL subsidy cliff, and which levers pull it back |
| `/property` | Whether a home is over-assessed, and whether appealing is worth it |
| `/trades` | What a trades job should cost, and which clauses the contract legally needs |

## Layout

```
src/app             all routes; five sections under /loans /paycheck /aca /property /trades
src/engines/*       the five calculation engines. pure TypeScript, no dependencies,
                    no AI, no network. integer cents. rules in versioned, cited JSON.
src/components/ui   the design system: one system, five identities
src/components/*    per-section components
tests/engines/*     399 engine tests; the app's own 69 sit beside their modules
docs/               the specs the build answers to
```

One Next.js app, one `package.json`, no workspace. npm, yarn or pnpm all work.

```bash
npm install
npm run dev         # http://localhost:3000
npm test            # 468 tests
npm run typecheck && npm run build
```

## How five identities share one system

Every component reads only six semantic colour tokens — `--paper --ink --rule
--dim --signal --flag` — plus a shared type and spacing scale. A section changes
identity by redefining those six on its own subtree via `data-section`. Nothing
else moves. That is why five separate apps could merge without the components
knowing it happened.

`NEXT_PUBLIC_SITE_URL` drives `metadataBase`, canonicals, `robots.txt` and
`sitemap.xml`. It is inlined at **build** time — setting it only on the running
server has no effect. See `apps/web/.env.example`.

## What is not verified

`KNOWN-GAPS.md` is the register: 55 open items, grouped by what unblocks each,
with a code marker at 28 locations. Nothing in it is filled with an estimate,
and a gap closes only against a primary source. Per-engine detail is in each
package's `VERIFICATION-STATUS.md`.

Two places deliberately refuse to answer rather than answer wrongly: contract
generation is blocked for states whose statutory notice text has not been
transcribed, and a New Jersey assessment verdict is withheld when the governing
Director's Ratio is unavailable.

These tools produce estimates from published rules. Not financial, tax or legal
advice. No credentialed reviewer is engaged for any section yet — portfolio
invariant 8 is unmet, and that is a launch blocker, not a detail.
