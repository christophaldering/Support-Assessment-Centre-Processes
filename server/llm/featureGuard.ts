import type { LlmDisabledOutput } from "./types";

export function isAIDisabled(featureName: string): boolean {
  if (process.env.AI_DISABLED === "true") return true;

  const disabledFeatures = (process.env.AI_FEATURES_DISABLED || "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  return disabledFeatures.includes(featureName);
}

export function createDisabledResponse(featureName: string): LlmDisabledOutput {
  return {
    aiDisabled: true,
    content: null,
  };
}

export function create503Response(featureName: string) {
  return {
    status: 503,
    body: {
      error: "AI temporarily disabled",
      feature: featureName,
    },
  };
}
