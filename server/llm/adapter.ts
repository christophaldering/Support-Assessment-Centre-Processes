/**
 * ============================================================================
 * AI GOVERNANCE – PHASE 1 (Lite, Enterprise-Ready)
 * ============================================================================
 *
 * This module is intentionally structured for future extension into Phase 2
 * (Enterprise AI Governance & Provider Management), which will include:
 *
 * - DB-backed runtime provider switching
 * - Compliance modes (innovation / eu_secure / hybrid)
 * - Admin UI controls
 * - Audit logging
 * - Budget and usage monitoring
 * - Per-customer provider routing
 *
 * Do not implement these yet, but ensure no structural decisions here would
 * prevent adding them later.
 *
 * Phase 2 integration points are marked with "// PHASE 2:" comments below.
 *
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * Provider Switching (later):
 *   Phase 1 uses process.env.ACTIVE_LLM_PROVIDER to select the provider.
 *   Phase 2 will override this with DB-backed per-workspace settings via
 *   getGovernanceSettings(workspaceId). The resolveProvider() function
 *   already exists in lib/llm/governance.ts for this purpose.
 *
 * Where Phase 2 plugs in:
 *   - getActiveProvider() → will check DB settings before ENV fallback
 *   - generateLLMOutput() → will add audit logging, compliance checks
 *   - featureGuard → will merge ENV toggles with DB-backed feature flags
 *   - Request logging → will write to ai_audit_log table instead of console
 * ============================================================================
 */

import type { LlmProvider, GenerateLLMInput, LlmOutput, LlmDisabledOutput, ProviderKey } from "./types";
import { OpenAIProvider } from "./providers/openai";
import { NeulandProvider } from "./providers/neuland";
import { AzureEUProvider } from "./providers/azure-eu";
import { isAIDisabled, createDisabledResponse } from "./featureGuard";

const providers: Record<string, LlmProvider> = {
  openai: new OpenAIProvider(),
  neuland: new NeulandProvider(),
  azure_eu: new AzureEUProvider(),
};

function getActiveProvider(): LlmProvider {
  const key = (process.env.ACTIVE_LLM_PROVIDER || "openai") as ProviderKey;
  // PHASE 2: Check DB-backed workspace settings before ENV fallback
  const provider = providers[key];
  if (!provider) {
    console.warn(`[LLM] Unknown provider "${key}", falling back to openai`);
    return providers.openai!;
  }
  if (!provider.isAvailable()) {
    console.warn(`[LLM] Provider "${key}" is not available, falling back to openai`);
    const fallback = providers.openai!;
    if (!fallback.isAvailable()) {
      throw new Error("No LLM provider is available. Check AI_INTEGRATIONS_OPENAI_API_KEY.");
    }
    return fallback;
  }
  return provider;
}

function logRequest(
  provider: string,
  featureName: string,
  taskName: string,
  route: string,
  durationMs: number,
  success: boolean,
  error?: string
) {
  const entry = {
    timestamp: new Date().toISOString(),
    provider,
    feature: featureName,
    task: taskName,
    route,
    durationMs,
    success,
    ...(error ? { error } : {}),
  };
  // PHASE 2: Write to ai_audit_log DB table instead of console
  if (success) {
    console.log(`[LLM] ✓ ${provider}/${featureName} (${taskName}) [${route}] ${durationMs}ms`);
  } else {
    console.error(`[LLM] ✗ ${provider}/${featureName} (${taskName}) [${route}] ${durationMs}ms — ${error}`);
  }
  return entry;
}

export async function generateLLMOutput<T = unknown>(
  params: GenerateLLMInput
): Promise<LlmOutput<T> | LlmDisabledOutput> {
  const { taskName, featureName, route = "unknown" } = params;

  if (isAIDisabled(featureName)) {
    console.log(`[LLM] BLOCKED: ${featureName} (${taskName}) [${route}] — AI disabled`);
    // PHASE 2: Log to audit table
    return createDisabledResponse(featureName);
  }

  const provider = getActiveProvider();
  const start = Date.now();

  try {
    let result: LlmOutput<T>;

    if (params.schema || params.options?.responseFormat === "json") {
      result = await provider.generateStructured<T>(params);
    } else {
      result = (await provider.chat(params)) as LlmOutput<T>;
    }

    logRequest(provider.key, featureName, taskName, route, Date.now() - start, true);
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    logRequest(provider.key, featureName, taskName, route, duration, false, errorMsg);
    throw err;
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  fileName: string,
  options?: { featureName?: string; route?: string; model?: string }
): Promise<string | LlmDisabledOutput> {
  const featureName = options?.featureName || "audio_transcription";
  const route = options?.route || "unknown";

  if (isAIDisabled(featureName)) {
    console.log(`[LLM] BLOCKED: ${featureName} (transcribe) [${route}] — AI disabled`);
    return createDisabledResponse(featureName);
  }

  const provider = getActiveProvider();
  if (provider.key !== "openai") {
    throw new Error("Audio transcription is only supported by the OpenAI provider.");
  }

  const start = Date.now();
  try {
    const openaiProvider = provider as import("./providers/openai").OpenAIProvider;
    const text = await openaiProvider.transcribeAudio(audioBuffer, fileName, options?.model);
    logRequest(provider.key, featureName, "transcribe", route, Date.now() - start, true);
    return text;
  } catch (err) {
    const duration = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    logRequest(provider.key, featureName, "transcribe", route, duration, false, errorMsg);
    throw err;
  }
}

export { isAIDisabled } from "./featureGuard";
export { create503Response } from "./featureGuard";
export type { GenerateLLMInput, LlmOutput, LlmDisabledOutput, ProviderKey } from "./types";
export { AI_FEATURES, PROVIDER_INFO } from "./types";
export type { AiFeatureKey } from "./types";
