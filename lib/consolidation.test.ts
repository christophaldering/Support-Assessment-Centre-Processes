import { describe, it, expect } from "vitest";
import {
  computeMean,
  computeMedian,
  computeTrimmedMean,
  consolidate,
} from "@/lib/consolidation";

describe("computeMean", () => {
  it("berechnet Mittelwert korrekt", () => {
    expect(computeMean([1, 2, 3])).toBe(2);
  });

  it("berechnet Mittelwert für gerade Anzahl", () => {
    expect(computeMean([1, 2, 3, 4])).toBe(2.5);
  });

  it("einzelner Wert → gleicher Wert", () => {
    expect(computeMean([7])).toBe(7);
  });

  it("leeres Array → NaN (Ist-Verhalten der Route)", () => {
    expect(Number.isNaN(computeMean([]))).toBe(true);
  });

  it("negative Werte", () => {
    expect(computeMean([-2, -4, 0])).toBeCloseTo(-2);
  });
});

describe("computeMedian", () => {
  it("ungerade Anzahl: mittlerer Wert", () => {
    expect(computeMedian([3, 1, 2])).toBe(2);
  });

  it("gerade Anzahl: Durchschnitt der beiden mittleren", () => {
    expect(computeMedian([4, 1, 3, 2])).toBe(2.5);
  });

  it("einzelner Wert → gleicher Wert", () => {
    expect(computeMedian([5])).toBe(5);
  });

  it("zwei Werte → Durchschnitt", () => {
    expect(computeMedian([3, 7])).toBe(5);
  });

  it("bereits sortierte Werte", () => {
    expect(computeMedian([1, 2, 3, 4, 5])).toBe(3);
  });

  it("leeres Array → NaN (Ist-Verhalten der Route)", () => {
    expect(Number.isNaN(computeMedian([]))).toBe(true);
  });
});

describe("computeTrimmedMean", () => {
  it("entfernt höchsten und niedrigsten Wert, mittelt den Rest", () => {
    expect(computeTrimmedMean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("vier Werte: entfernt Extremwerte, mittelt die zwei mittleren", () => {
    expect(computeTrimmedMean([1, 3, 5, 7])).toBe(4);
  });

  it("drei Werte: nur mittlerer Wert bleibt", () => {
    expect(computeTrimmedMean([1, 5, 9])).toBe(5);
  });

  it("zwei Werte (≤2): Fallback auf computeMean", () => {
    expect(computeTrimmedMean([3, 7])).toBe(5);
  });

  it("einzelner Wert (≤2): Fallback auf computeMean", () => {
    expect(computeTrimmedMean([4])).toBe(4);
  });

  it("leeres Array (≤2): Fallback auf computeMean → NaN", () => {
    expect(Number.isNaN(computeTrimmedMean([]))).toBe(true);
  });

  it("sortiert vor dem Trimmen", () => {
    expect(computeTrimmedMean([9, 1, 5, 3, 7])).toBe(5);
  });
});

describe("consolidate (Dispatcher)", () => {
  it('dispatcht "mean" korrekt', () => {
    expect(consolidate([1, 2, 3], "mean")).toBe(2);
  });

  it('dispatcht "median" korrekt', () => {
    expect(consolidate([1, 2, 3, 4], "median")).toBe(2.5);
  });

  it('dispatcht "trimmed_mean" korrekt', () => {
    expect(consolidate([1, 2, 3, 4, 5], "trimmed_mean")).toBe(3);
  });

  it("mean ist Default-Verhalten", () => {
    expect(consolidate([2, 4, 6], "mean")).toBe(
      computeMean([2, 4, 6])
    );
  });
});
