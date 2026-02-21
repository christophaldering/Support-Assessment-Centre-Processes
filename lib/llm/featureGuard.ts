import type { AiGovernanceSettings, LlmResponse } from "./types";
import { getGovernanceSettings } from "./governance";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  fallbackResponse?: LlmResponse;
}

function createFallbackResponse(feature: string): LlmResponse {
  return {
    data: {
      message: `Die KI-Funktion "${feature}" ist derzeit deaktiviert.`,
      status: "disabled",
      feature,
    },
    provider: "openai",
    model: "none",
    blocked: true,
    fallback: true,
  };
}

export async function checkFeatureAccess(workspaceId: string, feature: string): Promise<GuardResult> {
  const settings = await getGovernanceSettings(workspaceId);
  return checkFeatureAccessWithSettings(settings, feature);
}

export function checkFeatureAccessWithSettings(settings: AiGovernanceSettings, feature: string): GuardResult {
  if (settings.aiMasterDisabled) {
    return {
      allowed: false,
      reason: "AI Master-Switch ist deaktiviert. Alle KI-Funktionen sind gesperrt.",
      fallbackResponse: createFallbackResponse(feature),
    };
  }

  if (settings.aiFeaturesDisabled.includes(feature)) {
    return {
      allowed: false,
      reason: `Die KI-Funktion "${feature}" wurde einzeln deaktiviert.`,
      fallbackResponse: createFallbackResponse(feature),
    };
  }

  return { allowed: true };
}
