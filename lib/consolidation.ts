export function computeMean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

export function computeTrimmedMean(values: number[]): number {
  if (values.length <= 2) return computeMean(values);
  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  return computeMean(trimmed);
}

export function consolidate(
  values: number[],
  method: "mean" | "median" | "trimmed_mean"
): number {
  switch (method) {
    case "median":
      return computeMedian(values);
    case "trimmed_mean":
      return computeTrimmedMean(values);
    default:
      return computeMean(values);
  }
}
