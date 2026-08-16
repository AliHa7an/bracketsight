/**
 * `@fineprint/ui` targets the DOM, not Node, so it does not take `@types/node`.
 * One component (AnswerBox) reads `process.env.NODE_ENV` to fire a development
 * -only console warning; every bundler in the stack statically replaces that
 * expression. Declaring just the shape we use keeps the Node globals — `fs`,
 * `Buffer`, `__dirname` — out of reach of a package that must never touch them.
 *
 * Not exported and never imported, so this file stays inside this package's
 * compilation and cannot leak into the app's type graph.
 */
declare const process: {
  readonly env: { readonly NODE_ENV?: string | undefined };
};
