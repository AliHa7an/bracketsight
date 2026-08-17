/**
 * JSON-LD serialisation, with the one escape that matters.
 *
 * A `</script>` sequence inside a string value ends the script element early,
 * and everything after it is parsed as HTML. On this site the strings come
 * from article frontmatter and FAQ items rather than from a visitor, so this
 * is not an injection route today — but "today" is doing a lot of work in that
 * sentence, and the fix is one replace.
 *
 * `<` is escaped to `<` rather than the sequence being special-cased: it
 * is valid JSON, unicode-escaped output is what every serious serialiser
 * emits, and it also neutralises `<!--`, which closes a script element in the
 * HTML parser for its own separate reason.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
