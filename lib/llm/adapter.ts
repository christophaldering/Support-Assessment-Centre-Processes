import type { LlmProvider, LlmRequest, LlmResponse, ProviderKey } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { NeulandProvider } from "./providers/neuland";
import { AzureOpenAIProvider } from "./providers/azure-openai";
import { getGovernanceSettings, resolveProvider } from "./governance";
import { checkFeatureAccessWithSettings } from "./featureGuard";
import { prisma } from "@/lib/db";

const providers: Record<ProviderKey, LlmProvider> = {
  openai: new OpenAIProvider(),
  neuland: new NeulandProvider(),
  azure_openai_eu: new AzureOpenAIProvider(),
};

interface ProviderResult {
  provider?: LlmProvider;
  blocked?: boolean;
  reason?: string;
}

function getProvider(key: ProviderKey, complianceMode: string): ProviderResult {
  const provider = providers[key];
  if (!provider) return { blocked: true, reason: `Unbekannter LLM Provider: ${key}` };

  if (!provider.isAvailable()) {
    if (complianceMode === "eu_secure" || (complianceMode === "hybrid" && key !== "openai")) {
      return {
        blocked: true,
        reason: `Der EU-konforme Provider "${provider.name}" ist nicht verfügbar. Im Compliance-Modus "${complianceMode}" kann kein Fallback auf OpenAI (US) erfolgen.`,
      };
    }
    const fallback = providers.openai;
    if (fallback.isAvailable()) return { provider: fallback };
    return { blocked: true, reason: `Provider ${key} ist nicht verfügbar und kein Fallback konfiguriert.` };
  }
  return { provider };
}

export const llm = {
  async chat(workspaceId: string, request: LlmRequest): Promise<LlmResponse> {
    const settings = await getGovernanceSettings(workspaceId);

    if (request.feature) {
      const guard = checkFeatureAccessWithSettings(settings, request.feature);
      if (!guard.allowed) {
        await logBlockedRequest(workspaceId, request.feature, guard.reason);
        return guard.fallbackResponse!;
      }
    }

    const providerKey = resolveProvider(settings);
    const result = getProvider(providerKey, settings.complianceMode);
    if (result.blocked || !result.provider) {
      await logBlockedRequest(workspaceId, request.feature || "chat", result.reason);
      return {
        data: { message: result.reason, status: "provider_unavailable" },
        provider: providerKey,
        model: "none",
        blocked: true,
        fallback: true,
      };
    }
    return result.provider.chat(request);
  },

  async generateStructuredAssessment<T>(
    workspaceId: string,
    input: string,
    schema: Record<string, unknown>,
    context?: Record<string, unknown>,
    feature?: string
  ): Promise<LlmResponse<T>> {
    const settings = await getGovernanceSettings(workspaceId);

    if (feature) {
      const guard = checkFeatureAccessWithSettings(settings, feature);
      if (!guard.allowed) {
        await logBlockedRequest(workspaceId, feature, guard.reason);
        return guard.fallbackResponse as LlmResponse<T>;
      }
    }

    const taskType = isSensitiveFeature(feature) ? "sensitive" : "creative";
    const providerKey = resolveProvider(settings, taskType);
    const result = getProvider(providerKey, settings.complianceMode);
    if (result.blocked || !result.provider) {
      await logBlockedRequest(workspaceId, feature || "structured", result.reason);
      return {
        data: { message: result.reason, status: "provider_unavailable" } as unknown as T,
        provider: providerKey,
        model: "none",
        blocked: true,
        fallback: true,
      };
    }
    return result.provider.generateStructured<T>(input, schema, context);
  },

  async isFeatureEnabled(workspaceId: string, feature: string): Promise<boolean> {
    const settings = await getGovernanceSettings(workspaceId);
    const guard = checkFeatureAccessWithSettings(settings, feature);
    return guard.allowed;
  },

  getProvider(key: ProviderKey): LlmProvider {
    return getProvider(key);
  },
};

function isSensitiveFeature(feature?: string): boolean {
  const sensitive = ["report_generation", "intelligence_predictive", "intelligence_development", "intelligence_hypotheses"];
  return feature ? sensitive.includes(feature) : false;
}

async function logBlockedRequest(workspaceId: string, feature: string, reason?: string) {
  try {
    await prisma.aiAuditLog.create({
      data: {
        workspaceId,
        action: "feature_blocked",
        previousValue: null,
        newValue: { feature, reason } as unknown as Record<string, unknown>,
        actor: "system",
      },
    });
  } catch (err) {
    console.error("Failed to log blocked AI request:", err);
  }
}

export type { LlmRequest, LlmResponse, ProviderKey } from "./types";
