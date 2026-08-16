/**
 * The statistics behind the over-assessment check. Deliberately boring:
 * median, mean, and the IAAO coefficient of dispersion. No estimation,
 * no fitting, no AI — arithmetic a hearing officer can re-run by hand.
 */

/** Arithmetic mean. Throws on an empty input — callers must guard. */
export function mean(values: number[]): number {
  if (values.length === 0) throw new Error("mean of empty array");
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Median (average of the two middle values for even counts). Throws on empty input. */
export function median(values: number[]): number {
  if (values.length === 0) throw new Error("median of empty array");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] as number;
  }
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * Coefficient of dispersion, in percent — the IAAO ratio-study statistic:
 * COD = 100 × mean(|ratio_i − median|) / median.
 *
 * Reads as "how much comps disagree with each other." IAAO's standard treats
 * COD ≤ 15 as acceptable uniformity for single-family residential.
 * Throws if the median is zero or the input is empty.
 */
export function cod(ratios: number[]): number {
  const med = median(ratios);
  if (med === 0) throw new Error("COD undefined: median ratio is zero");
  const absDeviations = ratios.map((r) => Math.abs(r - med));
  return (100 * mean(absDeviations)) / med;
}
