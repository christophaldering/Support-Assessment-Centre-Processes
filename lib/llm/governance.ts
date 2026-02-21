import { prisma } from "@/lib/db";
import type { AiGovernanceSettings, ProviderKey, ComplianceMode } from "./types";

const DEFAULT_SETTINGS: AiGovernanceSettings = {
  activeLlmProvider: "openai",
  aiMasterDisabled: false,
  aiFeaturesDisabled: [],
  complianceMode: "innovation",
};

export async function getGovernanceSettings(workspaceId: string): Promise<AiGovernanceSettings> {
  const row = await prisma.aiSystemSettings.findUnique({ where: { workspaceId } });
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    activeLlmProvider: row.activeLlmProvider as ProviderKey,
    aiMasterDisabled: row.aiMasterDisabled,
    aiFeaturesDisabled: (row.aiFeaturesDisabled as string[]) ?? [],
    complianceMode: row.complianceMode as ComplianceMode,
  };
}

export async function updateGovernanceSettings(
  workspaceId: string,
  updates: Partial<AiGovernanceSettings>,
  actor?: string
): Promise<AiGovernanceSettings> {
  const current = await getGovernanceSettings(workspaceId);

  const merged = { ...current, ...updates };

  await prisma.aiSystemSettings.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      activeLlmProvider: merged.activeLlmProvider,
      aiMasterDisabled: merged.aiMasterDisabled,
      aiFeaturesDisabled: merged.aiFeaturesDisabled,
      complianceMode: merged.complianceMode,
    },
    update: {
      activeLlmProvider: merged.activeLlmProvider,
      aiMasterDisabled: merged.aiMasterDisabled,
      aiFeaturesDisabled: merged.aiFeaturesDisabled,
      complianceMode: merged.complianceMode,
    },
  });

  const changedFields: string[] = [];
  if (updates.activeLlmProvider && updates.activeLlmProvider !== current.activeLlmProvider) changedFields.push("activeLlmProvider");
  if (updates.aiMasterDisabled !== undefined && updates.aiMasterDisabled !== current.aiMasterDisabled) changedFields.push("aiMasterDisabled");
  if (updates.aiFeaturesDisabled) changedFields.push("aiFeaturesDisabled");
  if (updates.complianceMode && updates.complianceMode !== current.complianceMode) changedFields.push("complianceMode");

  if (changedFields.length > 0) {
    await prisma.aiAuditLog.create({
      data: {
        workspaceId,
        action: `settings_updated: ${changedFields.join(", ")}`,
        previousValue: current as unknown as Record<string, unknown>,
        newValue: merged as unknown as Record<string, unknown>,
        actor: actor ?? "system",
      },
    });
  }

  return merged;
}

export async function getAuditLog(workspaceId: string, limit = 50) {
  return prisma.aiAuditLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function resolveProvider(settings: AiGovernanceSettings, taskType?: "sensitive" | "creative"): ProviderKey {
  switch (settings.complianceMode) {
    case "eu_secure":
      return settings.activeLlmProvider === "openai" ? "neuland" : settings.activeLlmProvider;
    case "hybrid":
      if (taskType === "sensitive") return "neuland";
      return "openai";
    case "innovation":
    default:
      return settings.activeLlmProvider;
  }
}
